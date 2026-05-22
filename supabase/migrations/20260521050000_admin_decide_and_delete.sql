-- 1. Decisao do admin nao bloqueia mais quando o professor nao tem email.
--    Antes: raise exception 'Professor sem e-mail cadastrado para notificacao'
--           (revertia o update do status, projeto ficava preso).
--    Agora: retorna recipient_email = null e deixa o frontend decidir o que fazer.

create or replace function public.app_admin_decide_project(
  p_token uuid,
  p_project_id uuid,
  p_decision public.project_status,
  p_admin_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_project public.app_projects%rowtype;
  v_clean_message text;
  v_owner_email text;
  v_owner_name text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin pode decidir projeto';
  end if;

  if p_decision not in ('aprovado', 'reprovado', 'em_ajustes') then
    raise exception 'Decisao invalida. Use aprovado, reprovado ou em_ajustes';
  end if;

  v_clean_message := nullif(trim(coalesce(p_admin_message, '')), '');

  update public.app_projects
  set
    status = p_decision,
    updated_at = now(),
    reviewed_by_app_user_id = v_user.id,
    reviewed_at = now(),
    admin_message = v_clean_message,
    admin_message_updated_at = case
      when v_clean_message is not null then now()
      else null
    end
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja finalizado';
  end if;

  select
    u.email,
    u.display_name
  into
    v_owner_email,
    v_owner_name
  from public.app_users u
  where u.id = v_project.owner_app_user_id
  limit 1;

  -- Nao raise se nao tiver email: frontend trata recipient_email null como
  -- "decidido, mas nao foi notificado".
  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at,
    'project_title', v_project.title,
    'professor_name', v_owner_name,
    'recipient_email', v_owner_email,
    'admin_message', v_clean_message
  );
end;
$$;

-- 2. Admin/superadmin pode soft-delete qualquer projeto.
--    Usado pra liberar projetos travados ou criados por engano.
create or replace function public.app_admin_delete_project(
  p_token uuid,
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_project public.app_projects%rowtype;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin ou superadmin pode excluir projeto';
  end if;

  update public.app_projects
  set
    deleted_at = now(),
    deleted_by_app_user_id = v_user.id,
    updated_at = now()
  where id = p_project_id
    and deleted_at is null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja excluido';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'deleted_at', v_project.deleted_at
  );
end;
$$;

grant execute on function public.app_admin_decide_project(uuid, uuid, public.project_status, text) to anon, authenticated;
grant execute on function public.app_admin_delete_project(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
