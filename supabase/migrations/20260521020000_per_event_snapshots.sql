-- Reformula o sistema de snapshots pra criar UM evento por execucao,
-- em vez de UM snapshot por dia (que era sobrescrito).
--
-- Mudancas:
--   * snapshot_log agora indexa por snapshot_run_id (uuid) + timestamp.
--   * Cada chamada de create_weekly_snapshot() cria um novo run_id.
--   * Funcoes de restore agora aceitam run_id em vez de data.
--   * create_weekly_snapshot aceita parametro p_source (pg_cron / manual_ui / github_workflow).
--   * Snapshots antigos (do schema anterior) sao limpos.

-- 1. Limpar tabelas-snapshot orfas do schema antigo (sufixo ___YYYYMMDD)
do $$
declare
  v_t text;
begin
  for v_t in
    select tablename
    from pg_tables
    where schemaname = 'backups'
      and tablename ~ '__[0-9]{8}$'
  loop
    execute format('drop table if exists backups.%I', v_t);
  end loop;
end;
$$;

-- 2. Dropar funcoes que mudaram de assinatura
drop function if exists public.app_sa_list_snapshots(uuid);
drop function if exists public.app_sa_restore_table(uuid, text, date);
drop function if exists public.app_sa_restore_all(uuid, date);
drop function if exists public.app_sa_next_backup_schedule(uuid);
drop function if exists backups.restore_table(text, date);
drop function if exists backups.restore_all_from_date(date);
drop function if exists backups.list_snapshots();
drop function if exists backups.create_weekly_snapshot();
drop function if exists backups.cleanup_old_snapshots(integer);

-- 3. Recriar snapshot_log com schema novo
drop table if exists backups.snapshot_log;

create table backups.snapshot_log (
  id uuid primary key default gen_random_uuid(),
  snapshot_run_id uuid not null,
  snapshot_started_at timestamptz not null,
  trigger_source text not null check (
    trigger_source in ('pg_cron', 'manual_ui', 'github_workflow', 'manual_sql', 'unknown')
  ),
  table_name text not null,
  snapshot_table_name text not null,
  row_count bigint,
  created_at timestamptz not null default now(),
  unique (snapshot_run_id, table_name)
);

create index idx_snapshot_log_started_at
  on backups.snapshot_log (snapshot_started_at desc);
create index idx_snapshot_log_run_id
  on backups.snapshot_log (snapshot_run_id);

-- 4. Audit log: adicionar referencia ao run_id (mantem snapshot_date pra historico)
alter table backups.restore_audit_log
  add column if not exists snapshot_run_id uuid;

-- 5. create_weekly_snapshot com source + timestamp suffix
create or replace function backups.create_weekly_snapshot(p_source text default 'unknown')
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_run_id uuid := gen_random_uuid();
  v_started_at timestamptz := now();
  v_ts_suffix text := to_char(v_started_at at time zone 'UTC', 'YYYYMMDDHH24MISS');
  v_table record;
  v_snapshot_name text;
  v_row_count bigint;
  v_results jsonb := '[]'::jsonb;
  v_source text;
begin
  v_source := case
    when p_source in ('pg_cron', 'manual_ui', 'github_workflow', 'manual_sql') then p_source
    else 'unknown'
  end;

  for v_table in
    select t.table_name
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and t.table_name not in ('app_sessions')
    order by t.table_name
  loop
    v_snapshot_name := v_table.table_name || '__' || v_ts_suffix;

    execute format('drop table if exists backups.%I', v_snapshot_name);
    execute format(
      'create table backups.%I as select * from public.%I',
      v_snapshot_name,
      v_table.table_name
    );
    execute format('select count(*) from backups.%I', v_snapshot_name) into v_row_count;

    insert into backups.snapshot_log
      (snapshot_run_id, snapshot_started_at, trigger_source,
       table_name, snapshot_table_name, row_count)
    values
      (v_run_id, v_started_at, v_source,
       v_table.table_name, v_snapshot_name, v_row_count);

    v_results := v_results || jsonb_build_object(
      'table', v_table.table_name,
      'snapshot', v_snapshot_name,
      'rows', v_row_count
    );
  end loop;

  return jsonb_build_object(
    'snapshot_run_id', v_run_id,
    'started_at', v_started_at,
    'source', v_source,
    'tables_backed_up', jsonb_array_length(v_results),
    'details', v_results
  );
end;
$$;

-- 6. Cleanup por idade (retencao em semanas)
create or replace function backups.cleanup_old_snapshots(p_keep_weeks integer default 4)
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_cutoff timestamptz := now() - (p_keep_weeks * interval '7 days');
  v_dropped int := 0;
  v_log record;
begin
  for v_log in
    select snapshot_table_name
    from backups.snapshot_log
    where snapshot_started_at < v_cutoff
  loop
    execute format('drop table if exists backups.%I', v_log.snapshot_table_name);
    v_dropped := v_dropped + 1;
  end loop;

  delete from backups.snapshot_log where snapshot_started_at < v_cutoff;

  return jsonb_build_object(
    'cutoff', v_cutoff,
    'tables_dropped', v_dropped
  );
end;
$$;

-- 7. Restore por run_id
create or replace function backups.restore_table_by_run(p_run_id uuid, p_table_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_snapshot_name text;
  v_old_rows bigint;
  v_new_rows bigint;
begin
  select snapshot_table_name
    into v_snapshot_name
  from backups.snapshot_log
  where snapshot_run_id = p_run_id
    and table_name = p_table_name;

  if v_snapshot_name is null then
    raise exception 'Snapshot nao encontrado para run % tabela %', p_run_id, p_table_name;
  end if;

  execute format('select count(*) from public.%I', p_table_name) into v_old_rows;

  set local session_replication_role = 'replica';
  execute format('truncate table public.%I', p_table_name);
  execute format('insert into public.%I select * from backups.%I',
                 p_table_name, v_snapshot_name);
  set local session_replication_role = 'origin';

  execute format('select count(*) from public.%I', p_table_name) into v_new_rows;

  return jsonb_build_object(
    'table', p_table_name,
    'snapshot_run_id', p_run_id,
    'rows_before', v_old_rows,
    'rows_after', v_new_rows,
    'snapshot_used', v_snapshot_name
  );
end;
$$;

create or replace function backups.restore_all_by_run(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_log record;
  v_results jsonb := '[]'::jsonb;
begin
  if not exists (select 1 from backups.snapshot_log where snapshot_run_id = p_run_id) then
    raise exception 'Nenhum snapshot encontrado para o run %', p_run_id;
  end if;

  set local session_replication_role = 'replica';

  for v_log in
    select table_name, snapshot_table_name
    from backups.snapshot_log
    where snapshot_run_id = p_run_id
  loop
    execute format('truncate table public.%I', v_log.table_name);
    execute format(
      'insert into public.%I select * from backups.%I',
      v_log.table_name,
      v_log.snapshot_table_name
    );
    v_results := v_results || jsonb_build_object('table', v_log.table_name, 'restored', true);
  end loop;

  set local session_replication_role = 'origin';

  return jsonb_build_object(
    'snapshot_run_id', p_run_id,
    'tables_restored', jsonb_array_length(v_results),
    'details', v_results
  );
end;
$$;

-- 8. RPCs publicas
create or replace function public.app_sa_list_snapshots(p_token uuid)
returns table (
  snapshot_run_id uuid,
  snapshot_started_at timestamptz,
  trigger_source text,
  table_count integer,
  total_rows bigint,
  tables jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode acessar backups';
  end if;

  return query
  select
    sl.snapshot_run_id,
    min(sl.snapshot_started_at) as snapshot_started_at,
    min(sl.trigger_source) as trigger_source,
    count(*)::integer as table_count,
    coalesce(sum(sl.row_count), 0)::bigint as total_rows,
    jsonb_agg(
      jsonb_build_object(
        'table_name', sl.table_name,
        'row_count', sl.row_count
      ) order by sl.table_name
    ) as tables
  from backups.snapshot_log sl
  group by sl.snapshot_run_id
  order by min(sl.snapshot_started_at) desc;
end;
$$;

create or replace function public.app_sa_trigger_snapshot(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_result jsonb;
  v_error text;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode criar backups';
  end if;

  begin
    v_result := backups.create_weekly_snapshot('manual_ui');
    perform backups.cleanup_old_snapshots(4);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, snapshot_run_id, snapshot_date, success)
    values (
      v_user.id, v_user.username, 'snapshot',
      (v_result->>'snapshot_run_id')::uuid, current_date, true
    );

    return v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, snapshot_date, success, error_message)
    values (v_user.id, v_user.username, 'snapshot', current_date, false, v_error);
    raise;
  end;
end;
$$;

create or replace function public.app_sa_restore_table(
  p_token uuid,
  p_run_id uuid,
  p_table_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_result jsonb;
  v_error text;
  v_snapshot_date date;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode restaurar backups';
  end if;

  select (min(snapshot_started_at) at time zone 'UTC')::date
    into v_snapshot_date
  from backups.snapshot_log
  where snapshot_run_id = p_run_id;

  begin
    v_result := backups.restore_table_by_run(p_run_id, p_table_name);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, table_name,
       snapshot_run_id, snapshot_date, rows_before, rows_after, success)
    values (
      v_user.id, v_user.username, 'restore_table', p_table_name,
      p_run_id, v_snapshot_date,
      (v_result->>'rows_before')::bigint, (v_result->>'rows_after')::bigint, true
    );

    return v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, table_name,
       snapshot_run_id, snapshot_date, success, error_message)
    values (v_user.id, v_user.username, 'restore_table', p_table_name,
            p_run_id, v_snapshot_date, false, v_error);
    raise;
  end;
end;
$$;

create or replace function public.app_sa_restore_all(p_token uuid, p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_result jsonb;
  v_error text;
  v_snapshot_date date;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode restaurar backups';
  end if;

  select (min(snapshot_started_at) at time zone 'UTC')::date
    into v_snapshot_date
  from backups.snapshot_log
  where snapshot_run_id = p_run_id;

  begin
    v_result := backups.restore_all_by_run(p_run_id);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action,
       snapshot_run_id, snapshot_date, success)
    values (v_user.id, v_user.username, 'restore_all',
            p_run_id, v_snapshot_date, true);

    return v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action,
       snapshot_run_id, snapshot_date, success, error_message)
    values (v_user.id, v_user.username, 'restore_all',
            p_run_id, v_snapshot_date, false, v_error);
    raise;
  end;
end;
$$;

create or replace function public.app_sa_next_backup_schedule(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_now timestamptz := now();
  v_this_week_start_utc timestamptz;
  v_next_internal timestamptz;
  v_next_external timestamptz;
  v_last_started_at timestamptz;
  v_total_runs integer;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode acessar backups';
  end if;

  v_this_week_start_utc := date_trunc('week', v_now at time zone 'UTC') at time zone 'UTC';

  v_next_internal := v_this_week_start_utc + interval '3 hours';
  if v_next_internal <= v_now then
    v_next_internal := v_next_internal + interval '7 days';
  end if;

  v_next_external := v_this_week_start_utc + interval '4 hours';
  if v_next_external <= v_now then
    v_next_external := v_next_external + interval '7 days';
  end if;

  select max(snapshot_started_at), count(distinct snapshot_run_id)
    into v_last_started_at, v_total_runs
  from backups.snapshot_log;

  return jsonb_build_object(
    'now_utc', v_now,
    'next_internal_snapshot_utc', v_next_internal,
    'next_external_dump_utc', v_next_external,
    'last_snapshot_at', v_last_started_at,
    'total_runs', coalesce(v_total_runs, 0)
  );
end;
$$;

grant execute on function public.app_sa_list_snapshots(uuid) to anon, authenticated;
grant execute on function public.app_sa_trigger_snapshot(uuid) to anon, authenticated;
grant execute on function public.app_sa_restore_table(uuid, uuid, text) to anon, authenticated;
grant execute on function public.app_sa_restore_all(uuid, uuid) to anon, authenticated;
grant execute on function public.app_sa_next_backup_schedule(uuid) to anon, authenticated;

-- 9. Reagendar pg_cron com nova assinatura
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'weekly_backup_snapshot') then
      perform cron.unschedule('weekly_backup_snapshot');
    end if;

    perform cron.schedule(
      'weekly_backup_snapshot',
      '0 3 * * 1',
      $job$
        select backups.create_weekly_snapshot('pg_cron');
        select backups.cleanup_old_snapshots(4);
      $job$
    );
  end if;
end;
$$;

notify pgrst, 'reload schema';
