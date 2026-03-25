drop function if exists public.app_list_my_projects_v2(uuid);
create or replace function public.app_list_my_projects_v2(p_token uuid)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  codigo_disciplina text,
  semestre_letivo text,
  thematic_area text,
  course text,
  period_start date,
  period_end date,
  target_audience text,
  budget numeric,
  description text,
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

  return query
  select
    p.id,
    p.title,
    p.tipo,
    p.codigo_disciplina,
    p.semestre_letivo,
    p.thematic_area,
    p.course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.description,
    p.status,
    p.created_at,
    p.updated_at
  from public.app_projects p
  where p.owner_app_user_id = v_user.id
  order by p.created_at desc;
end;
$$;
create or replace function public.app_get_my_project_detail_v2(
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
  v_project record;
begin
  v_user := public.app_session_user(p_token);

  begin
    v_project_id := p_project_id::uuid;
  exception
    when others then
      raise exception 'ID de projeto invalido';
  end;

  select
    p.id,
    p.title,
    p.tipo,
    p.codigo_disciplina,
    p.semestre_letivo,
    p.thematic_area,
    p.course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.description,
    p.status,
    p.admin_message,
    p.created_at,
    p.updated_at
  into v_project
  from public.app_projects p
  where p.id = v_project_id
    and p.owner_app_user_id = v_user.id
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado para este usuario';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'tipo', v_project.tipo,
    'codigo_disciplina', v_project.codigo_disciplina,
    'semestre_letivo', v_project.semestre_letivo,
    'thematic_area', v_project.thematic_area,
    'course', v_project.course,
    'period_start', v_project.period_start,
    'period_end', v_project.period_end,
    'target_audience', v_project.target_audience,
    'budget', v_project.budget,
    'description', v_project.description,
    'status', v_project.status,
    'admin_message', v_project.admin_message,
    'created_at', v_project.created_at,
    'updated_at', v_project.updated_at
  );
end;
$$;
