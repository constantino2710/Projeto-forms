create or replace function public.app_list_admin_projects(p_token uuid)
returns table (
  id uuid,
  title text,
  professor text,
  discipline text,
  course text,
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
    u.display_name as professor,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.status,
    p.created_at
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.status in ('submetido', 'em_avaliacao')
  order by p.created_at desc;
end;
$$;

create or replace function public.app_admin_get_project_detail(
  p_token uuid,
  p_project_id uuid
)
returns table (
  id uuid,
  title text,
  professor text,
  discipline text,
  course text,
  period_start date,
  period_end date,
  target_audience text,
  budget numeric,
  status public.project_status,
  created_at timestamptz,
  updated_at timestamptz
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
    raise exception 'Apenas admin pode abrir projeto';
  end if;

  update public.app_projects
  set
    status = 'em_avaliacao',
    updated_at = now()
  where id = p_project_id
    and status = 'submetido';

  return query
  select
    p.id,
    p.title,
    u.display_name as professor,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.status,
    p.created_at,
    p.updated_at
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.id = p_project_id
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado';
  end if;
end;
$$;

create or replace function public.app_admin_decide_project(
  p_token uuid,
  p_project_id uuid,
  p_decision public.project_status
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

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode decidir projeto';
  end if;

  if p_decision not in ('aprovado', 'reprovado') then
    raise exception 'Decisao invalida. Use aprovado ou reprovado';
  end if;

  update public.app_projects
  set
    status = p_decision,
    updated_at = now()
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja finalizado';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;

grant execute on function public.app_list_admin_projects(uuid) to anon, authenticated;
grant execute on function public.app_admin_get_project_detail(uuid, uuid) to anon, authenticated;
grant execute on function public.app_admin_decide_project(
  uuid, uuid, public.project_status
) to anon, authenticated;
