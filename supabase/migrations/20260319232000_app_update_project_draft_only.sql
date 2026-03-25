create or replace function public.app_update_project(
  p_token uuid,
  p_project_id uuid,
  p_title text,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric
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
grant execute on function public.app_update_project(
  uuid, uuid, text, text, text, date, date, text, numeric
) to anon, authenticated;
