alter table public.app_projects
add column if not exists description text not null default '';
create or replace function public.app_create_project_v2(
  p_token uuid,
  p_title text,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric,
  p_description text
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

  if v_user.role <> 'user' then
    raise exception 'Apenas usuario pode criar projeto';
  end if;

  insert into public.app_projects (
    owner_app_user_id,
    title,
    thematic_area,
    course,
    period_start,
    period_end,
    target_audience,
    budget,
    description
  )
  values (
    v_user.id,
    trim(p_title),
    trim(p_thematic_area),
    nullif(trim(coalesce(p_course, '')), ''),
    p_period_start,
    p_period_end,
    trim(p_target_audience),
    coalesce(p_budget, 0),
    trim(coalesce(p_description, ''))
  )
  returning * into v_project;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'created_at', v_project.created_at
  );
end;
$$;
create or replace function public.app_list_my_projects_v2(p_token uuid)
returns table (
  id uuid,
  title text,
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
create or replace function public.app_update_project_v2(
  p_token uuid,
  p_project_id uuid,
  p_title text,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric,
  p_description text
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

  if v_user.role <> 'user' then
    raise exception 'Apenas usuario pode editar projeto';
  end if;

  update public.app_projects
  set
    title = trim(p_title),
    thematic_area = trim(p_thematic_area),
    course = nullif(trim(coalesce(p_course, '')), ''),
    period_start = p_period_start,
    period_end = p_period_end,
    target_audience = trim(p_target_audience),
    budget = coalesce(p_budget, 0),
    description = trim(coalesce(p_description, '')),
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and status = 'rascunho'
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou status nao permite edicao';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;
create or replace function public.app_admin_get_project_detail_v2(
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

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode abrir projeto';
  end if;

  begin
    v_project_id := p_project_id::uuid;
  exception
    when others then
      raise exception 'ID de projeto invalido';
  end;

  update public.app_projects
  set
    status = 'em_avaliacao',
    updated_at = now()
  where id = v_project_id
    and status = 'submetido';

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
    p.description,
    p.status,
    p.created_at,
    p.updated_at
  into v_project
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.id = v_project_id
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'professor', v_project.professor,
    'discipline', v_project.discipline,
    'course', v_project.course,
    'period_start', v_project.period_start,
    'period_end', v_project.period_end,
    'target_audience', v_project.target_audience,
    'budget', v_project.budget,
    'description', v_project.description,
    'status', v_project.status,
    'created_at', v_project.created_at,
    'updated_at', v_project.updated_at
  );
end;
$$;
grant execute on function public.app_create_project_v2(
  uuid, text, text, text, date, date, text, numeric, text
) to anon, authenticated;
grant execute on function public.app_list_my_projects_v2(uuid) to anon, authenticated;
grant execute on function public.app_update_project_v2(
  uuid, uuid, text, text, text, date, date, text, numeric, text
) to anon, authenticated;
