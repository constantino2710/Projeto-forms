-- RPCs publicas para a tela de Backups do superadmin.
-- Envelopam as funcoes em backups.* com check de role + auditoria.

create table if not exists backups.restore_audit_log (
  id uuid primary key default gen_random_uuid(),
  performed_by uuid not null,
  performed_by_username text not null,
  action text not null check (action in ('snapshot', 'restore_table', 'restore_all')),
  table_name text,
  snapshot_date date,
  rows_before bigint,
  rows_after bigint,
  success boolean not null,
  error_message text,
  performed_at timestamptz not null default now()
);

create index if not exists idx_restore_audit_log_performed_at
  on backups.restore_audit_log (performed_at desc);

create or replace function public.app_sa_list_snapshots(p_token uuid)
returns table (
  snapshot_date date,
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
    sl.snapshot_date,
    count(*)::integer,
    coalesce(sum(sl.row_count), 0)::bigint,
    jsonb_agg(
      jsonb_build_object(
        'table_name', sl.table_name,
        'row_count', sl.row_count,
        'created_at', sl.created_at
      ) order by sl.table_name
    )
  from backups.snapshot_log sl
  group by sl.snapshot_date
  order by sl.snapshot_date desc;
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
    v_result := backups.create_weekly_snapshot();
    perform backups.cleanup_old_snapshots(4);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, snapshot_date, success)
    values (v_user.id, v_user.username, 'snapshot', current_date, true);

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
  p_table_name text,
  p_snapshot_date date
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
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode restaurar backups';
  end if;

  begin
    v_result := backups.restore_table(p_table_name, p_snapshot_date);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, table_name, snapshot_date,
       rows_before, rows_after, success)
    values (
      v_user.id, v_user.username, 'restore_table', p_table_name, p_snapshot_date,
      (v_result->>'rows_before')::bigint, (v_result->>'rows_after')::bigint, true
    );

    return v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, table_name, snapshot_date,
       success, error_message)
    values (v_user.id, v_user.username, 'restore_table', p_table_name, p_snapshot_date,
            false, v_error);
    raise;
  end;
end;
$$;

create or replace function public.app_sa_restore_all(
  p_token uuid,
  p_snapshot_date date
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
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode restaurar backups';
  end if;

  begin
    v_result := backups.restore_all_from_date(p_snapshot_date);

    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, snapshot_date, success)
    values (v_user.id, v_user.username, 'restore_all', p_snapshot_date, true);

    return v_result;
  exception when others then
    get stacked diagnostics v_error = message_text;
    insert into backups.restore_audit_log
      (performed_by, performed_by_username, action, snapshot_date,
       success, error_message)
    values (v_user.id, v_user.username, 'restore_all', p_snapshot_date,
            false, v_error);
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
  v_last_snapshot_date date;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode acessar backups';
  end if;

  -- Segunda-feira 00:00 UTC da semana atual
  v_this_week_start_utc := date_trunc('week', v_now at time zone 'UTC') at time zone 'UTC';

  v_next_internal := v_this_week_start_utc + interval '3 hours';
  if v_next_internal <= v_now then
    v_next_internal := v_next_internal + interval '7 days';
  end if;

  v_next_external := v_this_week_start_utc + interval '4 hours';
  if v_next_external <= v_now then
    v_next_external := v_next_external + interval '7 days';
  end if;

  select max(snapshot_date) into v_last_snapshot_date from backups.snapshot_log;

  return jsonb_build_object(
    'now_utc', v_now,
    'next_internal_snapshot_utc', v_next_internal,
    'next_external_dump_utc', v_next_external,
    'last_snapshot_date', v_last_snapshot_date
  );
end;
$$;

create or replace function public.app_sa_list_restore_audit(
  p_token uuid,
  p_limit integer default 20
)
returns table (
  id uuid,
  performed_by_username text,
  action text,
  table_name text,
  snapshot_date date,
  rows_before bigint,
  rows_after bigint,
  success boolean,
  error_message text,
  performed_at timestamptz
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
    ral.id, ral.performed_by_username, ral.action, ral.table_name,
    ral.snapshot_date, ral.rows_before, ral.rows_after, ral.success,
    ral.error_message, ral.performed_at
  from backups.restore_audit_log ral
  order by ral.performed_at desc
  limit greatest(coalesce(p_limit, 20), 1);
end;
$$;

grant execute on function public.app_sa_list_snapshots(uuid) to anon, authenticated;
grant execute on function public.app_sa_trigger_snapshot(uuid) to anon, authenticated;
grant execute on function public.app_sa_restore_table(uuid, text, date) to anon, authenticated;
grant execute on function public.app_sa_restore_all(uuid, date) to anon, authenticated;
grant execute on function public.app_sa_next_backup_schedule(uuid) to anon, authenticated;
grant execute on function public.app_sa_list_restore_audit(uuid, integer) to anon, authenticated;

notify pgrst, 'reload schema';
