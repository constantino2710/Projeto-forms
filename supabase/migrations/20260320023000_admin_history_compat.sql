create or replace function public.app_list_admin_project_history(
  p_token uuid
)
returns table (
  id uuid,
  title text,
  professor text,
  discipline text,
  course text,
  status public.project_status,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode acessar historico';
  end if;

  return query
  select
    p.id,
    p.title,
    u.display_name as professor,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.status,
    coalesce(p.reviewed_at, p.updated_at) as reviewed_at
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.status in ('aprovado', 'reprovado')
    and (p.reviewed_by_app_user_id = v_user.id or p.reviewed_by_app_user_id is null)
  order by coalesce(p.reviewed_at, p.updated_at) desc;
end;
$$;
