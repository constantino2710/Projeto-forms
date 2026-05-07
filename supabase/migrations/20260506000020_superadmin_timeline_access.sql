create or replace function public.app_get_project_timeline(
  p_token uuid,
  p_project_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_project_id uuid;
  v_project public.app_projects%rowtype;
begin
  v_user := public.app_session_user(p_token);

  begin
    v_project_id := p_project_id::uuid;
  exception
    when others then
      raise exception 'ID de projeto invalido';
  end;

  select *
  into v_project
  from public.app_projects p
  where p.id = v_project_id
    and p.deleted_at is null
    and (
      v_user.role in ('admin', 'superadmin')
      or (v_user.role = 'user' and p.owner_app_user_id = v_user.id)
    )
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado para este usuario';
  end if;

  return jsonb_build_object(
    'status', v_project.status,
    'created_at', v_project.created_at,
    'submitted_at', v_project.submitted_at,
    'analysis_started_at', v_project.analysis_started_at,
    'approved_at', v_project.approved_at,
    'rejected_at', v_project.rejected_at
  );
end;
$$;

grant execute on function public.app_get_project_timeline(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
