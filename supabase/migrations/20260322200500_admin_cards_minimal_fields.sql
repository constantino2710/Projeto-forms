drop function if exists public.app_list_admin_projects(uuid);
create or replace function public.app_list_admin_projects(p_token uuid)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  created_at timestamptz
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
    p.tipo,
    p.period_start,
    p.period_end,
    p.budget,
    p.status,
    p.created_at
  from public.app_projects p
  where p.status in ('submetido', 'em_avaliacao')
  order by p.created_at desc;
end;
$$;
drop function if exists public.app_list_admin_project_history(uuid);
create or replace function public.app_list_admin_project_history(
  p_token uuid
)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  period_start date,
  period_end date,
  budget numeric,
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
    p.tipo,
    p.period_start,
    p.period_end,
    p.budget,
    p.status,
    coalesce(p.reviewed_at, p.updated_at) as reviewed_at
  from public.app_projects p
  where p.status in ('aprovado', 'reprovado', 'em_ajustes')
    and (p.reviewed_by_app_user_id = v_user.id or p.reviewed_by_app_user_id is null)
  order by coalesce(p.reviewed_at, p.updated_at) desc;
end;
$$;
grant execute on function public.app_list_admin_projects(uuid) to anon, authenticated;
grant execute on function public.app_list_admin_project_history(uuid) to anon, authenticated;
