create or replace function public.app_create_project_v2(
  p_token uuid,
  p_title text,
  p_type projeto_tipo,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric,
  p_description text,
  p_codigo_disciplina text default null,
  p_semestre_letivo text default null,
  p_extension_form jsonb default null
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

  if p_type in ('extensao', 'disciplina')
    and (p_extension_form is null or p_extension_form = '{}'::jsonb) then
    raise exception 'Plano detalhado obrigatorio';
  end if;

  insert into public.app_projects (
    owner_app_user_id,
    title,
    tipo,
    thematic_area,
    course,
    period_start,
    period_end,
    target_audience,
    budget,
    description,
    codigo_disciplina,
    semestre_letivo
  )
  values (
    v_user.id,
    trim(p_title),
    p_type,
    trim(p_thematic_area),
    nullif(trim(coalesce(p_course, '')), ''),
    p_period_start,
    p_period_end,
    trim(p_target_audience),
    coalesce(p_budget, 0),
    trim(coalesce(p_description, '')),
    nullif(trim(coalesce(p_codigo_disciplina, '')), ''),
    nullif(trim(coalesce(p_semestre_letivo, '')), '')
  )
  returning * into v_project;

  if p_type in ('extensao', 'disciplina') then
    perform public.app_upsert_extension_form(v_project.id, p_extension_form);
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'created_at', v_project.created_at
  );
end;
$$;

create or replace function public.app_update_project_v2(
  p_token uuid,
  p_project_id uuid,
  p_title text,
  p_type projeto_tipo,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric,
  p_description text,
  p_codigo_disciplina text default null,
  p_semestre_letivo text default null,
  p_extension_form jsonb default null
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

  if p_type in ('extensao', 'disciplina')
    and (p_extension_form is null or p_extension_form = '{}'::jsonb) then
    raise exception 'Plano detalhado obrigatorio';
  end if;

  update public.app_projects
  set
    title = trim(p_title),
    tipo = p_type,
    thematic_area = trim(p_thematic_area),
    course = nullif(trim(coalesce(p_course, '')), ''),
    period_start = p_period_start,
    period_end = p_period_end,
    target_audience = trim(p_target_audience),
    budget = coalesce(p_budget, 0),
    description = trim(coalesce(p_description, '')),
    codigo_disciplina = nullif(trim(coalesce(p_codigo_disciplina, '')), ''),
    semestre_letivo = nullif(trim(coalesce(p_semestre_letivo, '')), ''),
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and status in ('rascunho', 'em_ajustes')
    and deleted_at is null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou status nao permite edicao';
  end if;

  if p_type in ('extensao', 'disciplina') then
    perform public.app_upsert_extension_form(v_project.id, p_extension_form);
  else
    delete from public.app_project_extension_forms
    where project_id = v_project.id;
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;

notify pgrst, 'reload schema';
