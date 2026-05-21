-- Sistema de backup semanal interno (Metodo 1 - Rollback rapido via SQL)
-- Cria um schema `backups` com snapshots semanais das tabelas do schema public,
-- limpeza automatica (retencao de 4 semanas) e funcao de restore por tabela/data.
--
-- PRE-REQUISITO: a extensao pg_cron precisa estar habilitada no Supabase
-- (Dashboard -> Database -> Extensions -> pg_cron). Sem isso, o cron.schedule
-- na ultima parte falhara. As funcoes podem ser usadas manualmente mesmo assim.

create schema if not exists backups;

-- Log de snapshots criados (auditoria + indice para restore/cleanup)
create table if not exists backups.snapshot_log (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  table_name text not null,
  snapshot_table_name text not null,
  row_count bigint,
  created_at timestamptz not null default now(),
  unique (snapshot_date, table_name)
);

create index if not exists idx_snapshot_log_date
  on backups.snapshot_log (snapshot_date desc);

-- Cria snapshot de todas as tabelas do schema public (exceto efemeras como app_sessions).
-- Idempotente: se rodar duas vezes no mesmo dia, sobrescreve o snapshot do dia.
create or replace function backups.create_weekly_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_table record;
  v_snapshot_date date := current_date;
  v_date_suffix text := to_char(current_date, 'YYYYMMDD');
  v_snapshot_name text;
  v_row_count bigint;
  v_results jsonb := '[]'::jsonb;
begin
  for v_table in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name not in ('app_sessions')
    order by table_name
  loop
    v_snapshot_name := v_table.table_name || '__' || v_date_suffix;

    execute format('drop table if exists backups.%I', v_snapshot_name);
    execute format(
      'create table backups.%I as select * from public.%I',
      v_snapshot_name,
      v_table.table_name
    );
    execute format('select count(*) from backups.%I', v_snapshot_name) into v_row_count;

    insert into backups.snapshot_log (snapshot_date, table_name, snapshot_table_name, row_count)
    values (v_snapshot_date, v_table.table_name, v_snapshot_name, v_row_count)
    on conflict (snapshot_date, table_name) do update
      set snapshot_table_name = excluded.snapshot_table_name,
          row_count = excluded.row_count,
          created_at = now();

    v_results := v_results || jsonb_build_object(
      'table', v_table.table_name,
      'snapshot', v_snapshot_name,
      'rows', v_row_count
    );
  end loop;

  return jsonb_build_object(
    'snapshot_date', v_snapshot_date,
    'tables_backed_up', jsonb_array_length(v_results),
    'details', v_results
  );
end;
$$;

-- Dropa snapshots com mais de N semanas (padrao: 4 = 1 mes)
create or replace function backups.cleanup_old_snapshots(p_keep_weeks integer default 4)
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_cutoff date := current_date - (p_keep_weeks * 7);
  v_dropped int := 0;
  v_log record;
begin
  for v_log in
    select snapshot_table_name
    from backups.snapshot_log
    where snapshot_date < v_cutoff
  loop
    execute format('drop table if exists backups.%I', v_log.snapshot_table_name);
    v_dropped := v_dropped + 1;
  end loop;

  delete from backups.snapshot_log where snapshot_date < v_cutoff;

  return jsonb_build_object(
    'cutoff_date', v_cutoff,
    'tables_dropped', v_dropped
  );
end;
$$;

-- Lista snapshots disponiveis (use no SQL Editor do Supabase para ver o historico)
create or replace function backups.list_snapshots()
returns table (
  snapshot_date date,
  table_name text,
  snapshot_table_name text,
  row_count bigint,
  created_at timestamptz
)
language sql
security definer
set search_path = public, backups, pg_temp
as $$
  select snapshot_date, table_name, snapshot_table_name, row_count, created_at
  from backups.snapshot_log
  order by snapshot_date desc, table_name;
$$;

-- Restaura UMA tabela de UM snapshot especifico.
-- ATENCAO: substitui TODOS os dados atuais da tabela. Use com cuidado.
-- O session_replication_role = replica desabilita FKs/triggers temporariamente
-- pra evitar conflitos de ordem entre tabelas relacionadas durante o restore.
create or replace function backups.restore_table(p_table_name text, p_snapshot_date date)
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
  select snapshot_table_name into v_snapshot_name
  from backups.snapshot_log
  where table_name = p_table_name
    and snapshot_date = p_snapshot_date;

  if v_snapshot_name is null then
    raise exception 'Snapshot nao encontrado para tabela % na data %', p_table_name, p_snapshot_date;
  end if;

  execute format('select count(*) from public.%I', p_table_name) into v_old_rows;

  set local session_replication_role = 'replica';
  execute format('truncate table public.%I', p_table_name);
  execute format('insert into public.%I select * from backups.%I', p_table_name, v_snapshot_name);
  set local session_replication_role = 'origin';

  execute format('select count(*) from public.%I', p_table_name) into v_new_rows;

  return jsonb_build_object(
    'table', p_table_name,
    'snapshot_date', p_snapshot_date,
    'rows_before', v_old_rows,
    'rows_after', v_new_rows,
    'snapshot_used', v_snapshot_name
  );
end;
$$;

-- Restaura TODAS as tabelas de uma data especifica (rollback completo do banco).
-- Use apenas em emergencia: substitui todos os dados de todas as tabelas com FKs
-- temporariamente desabilitadas dentro da transacao.
create or replace function backups.restore_all_from_date(p_snapshot_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, backups, pg_temp
as $$
declare
  v_log record;
  v_results jsonb := '[]'::jsonb;
  v_one jsonb;
begin
  if not exists (select 1 from backups.snapshot_log where snapshot_date = p_snapshot_date) then
    raise exception 'Nenhum snapshot encontrado para a data %', p_snapshot_date;
  end if;

  set local session_replication_role = 'replica';

  for v_log in
    select table_name, snapshot_table_name
    from backups.snapshot_log
    where snapshot_date = p_snapshot_date
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
    'snapshot_date', p_snapshot_date,
    'tables_restored', jsonb_array_length(v_results),
    'details', v_results
  );
end;
$$;

-- Agendamento: toda segunda-feira as 03:00 UTC.
-- Roda snapshot + cleanup na mesma chamada.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'weekly_backup_snapshot') then
      perform cron.unschedule('weekly_backup_snapshot');
    end if;

    perform cron.schedule(
      'weekly_backup_snapshot',
      '0 3 * * 1',
      $job$ select backups.create_weekly_snapshot(); select backups.cleanup_old_snapshots(4); $job$
    );
  else
    raise notice 'pg_cron nao esta habilitado. Habilite no Dashboard -> Database -> Extensions -> pg_cron e rode novamente o bloco do agendamento.';
  end if;
end;
$$;
