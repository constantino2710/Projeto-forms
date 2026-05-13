create or replace function public.app_sa_delete_user(
  p_token uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_target public.app_users%rowtype;
  v_project_count bigint;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode remover usuarios';
  end if;

  if p_user_id = v_user.id then
    raise exception 'Use outro fluxo para remover a propria conta';
  end if;

  select * into v_target from public.app_users where id = p_user_id;
  if not found then
    raise exception 'Usuario nao encontrado';
  end if;

  if v_target.role = 'superadmin' then
    raise exception 'Superadmin nao pode ser removido por este fluxo';
  end if;

  select count(*)
    into v_project_count
  from public.app_projects
  where owner_app_user_id = p_user_id;

  if v_project_count > 0 then
    raise exception 'Nao e possivel remover usuario com projetos vinculados. Desative a conta ou reatribua os projetos antes de remover.';
  end if;

  delete from public.app_users
  where id = p_user_id;

  return jsonb_build_object(
    'id', p_user_id,
    'removed', true
  );
end;
$$;

grant execute on function public.app_sa_delete_user(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
