drop function if exists public.app_list_admin_projects(uuid);

create or replace function public.app_list_admin_projects(p_token uuid)
returns table (
  id uuid,
  title text,
  tipo text,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  created_at timestamptz,
  professor text,
  professor_avatar_url text
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
    raise exception 'Apenas admin pode listar projetos para avaliacao';
  end if;

  return query
  select
    p.id,
    p.title,
    p.tipo::text as tipo,
    p.period_start,
    p.period_end,
    p.budget,
    p.status,
    p.created_at,
    u.display_name as professor,
    u.avatar_url as professor_avatar_url
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.status in ('submetido', 'em_avaliacao')
    and p.deleted_at is null
  order by p.created_at desc;
end;
$$;

grant execute on function public.app_list_admin_projects(uuid) to anon, authenticated;
