-- Audit log passa a registrar apenas restauracoes (acoes destrutivas).
-- Criacao de snapshot deixa de ser logada aqui porque a info ja consta
-- na propria lista de snapshots, com source e timestamp.

-- 1. Limpar entradas antigas de "snapshot"
delete from backups.restore_audit_log where action = 'snapshot';

-- 2. Atualizar o check constraint pra so aceitar restore_*
alter table backups.restore_audit_log
  drop constraint if exists restore_audit_log_action_check;
alter table backups.restore_audit_log
  add constraint restore_audit_log_action_check
  check (action in ('restore_table', 'restore_all'));

-- 3. Recriar app_sa_trigger_snapshot sem o insert no audit
create or replace function public.app_sa_trigger_snapshot(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_result jsonb;
begin
  v_user := public.app_session_user(p_token);
  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode criar backups';
  end if;

  v_result := backups.create_weekly_snapshot('manual_ui');
  perform backups.cleanup_old_snapshots(4);

  return v_result;
end;
$$;

grant execute on function public.app_sa_trigger_snapshot(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
