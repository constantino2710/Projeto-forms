drop function if exists public.app_create_project_v2(
  text,
  text,
  projeto_tipo,
  text,
  text,
  date,
  date,
  text,
  numeric,
  text,
  text,
  text
);

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
  p_semestre_letivo text default null
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

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'created_at', v_project.created_at
  );
end;
$$;

grant execute on function public.app_create_project_v2(
  uuid, text, projeto_tipo, text, text, date, date, text, numeric, text, text, text
) to anon, authenticated;
