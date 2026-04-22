create table if not exists public.app_project_extension_forms (
  project_id uuid primary key references public.app_projects (id) on delete cascade,
  initiative_title text not null,
  total_workload integer,
  unicap_program text not null,
  linked_course text not null,
  course_name text not null,
  coordination_email text not null,
  coordinator_name text not null,
  coordinator_email text not null,
  coordinator_cpf text not null,
  coordinator_phone text not null,
  coordinator_weekly_hours integer,
  coordinator_participation text not null,
  other_volunteer_teachers text,
  student_weekly_hours integer,
  student_participants text not null,
  learning_objective_1 text not null,
  learning_objective_2 text not null,
  learning_objective_3 text not null,
  transversal_competency_1 text not null,
  transversal_competency_2 text not null,
  transversal_competency_3 text not null,
  service_offered text not null,
  activity_1 text not null,
  activity_2 text not null,
  activity_3 text not null,
  execution_location text not null,
  target_audience_detail text not null,
  methodological_procedures text not null,
  problem_statement text not null,
  sustainable_development_goal text not null,
  goal_1 text not null,
  goal_2 text not null,
  goal_3 text not null,
  dissemination_strategies text not null,
  project_summary text not null,
  reflection_strategies text not null,
  evaluation_strategies text not null,
  partner_feedback text not null,
  additional_information text,
  acknowledgement_approval_required boolean not null default false,
  acknowledgement_final_report_required boolean not null default false,
  acknowledgement_corrections_may_be_requested boolean not null default false,
  acknowledgement_volunteer_terms_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) and not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_app_project_extension_forms_updated_at'
  ) then
    execute '
      create trigger trg_app_project_extension_forms_updated_at
      before update on public.app_project_extension_forms
      for each row
      execute function public.set_updated_at()
    ';
  end if;
end;
$$;

create or replace function public.app_extension_form_json(p_project_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select
    case
      when f.project_id is null then null
      else jsonb_build_object(
        'title', f.initiative_title,
        'totalWorkload', coalesce(f.total_workload::text, ''),
        'unicapProgram', f.unicap_program,
        'periodStart', p.period_start::text,
        'periodEnd', p.period_end::text,
        'linkedCourse', f.linked_course,
        'courseName', f.course_name,
        'coordinationEmail', f.coordination_email,
        'coordinatorName', f.coordinator_name,
        'coordinatorEmail', f.coordinator_email,
        'coordinatorCpf', f.coordinator_cpf,
        'coordinatorPhone', f.coordinator_phone,
        'coordinatorWeeklyHours', coalesce(f.coordinator_weekly_hours::text, ''),
        'coordinatorParticipation', f.coordinator_participation,
        'otherVolunteerTeachers', coalesce(f.other_volunteer_teachers, ''),
        'studentWeeklyHours', coalesce(f.student_weekly_hours::text, ''),
        'studentParticipants', f.student_participants,
        'learningObjectives', jsonb_build_array(
          f.learning_objective_1,
          f.learning_objective_2,
          f.learning_objective_3
        ),
        'transversalCompetencies', jsonb_build_array(
          f.transversal_competency_1,
          f.transversal_competency_2,
          f.transversal_competency_3
        ),
        'serviceOffered', f.service_offered,
        'activities', jsonb_build_array(
          f.activity_1,
          f.activity_2,
          f.activity_3
        ),
        'executionLocation', f.execution_location,
        'targetAudience', f.target_audience_detail,
        'methodologicalProcedures', f.methodological_procedures,
        'problemStatement', f.problem_statement,
        'sustainableDevelopmentGoal', f.sustainable_development_goal,
        'goals', jsonb_build_array(f.goal_1, f.goal_2, f.goal_3),
        'disseminationStrategies', f.dissemination_strategies,
        'projectSummary', f.project_summary,
        'reflectionStrategies', f.reflection_strategies,
        'evaluationStrategies', f.evaluation_strategies,
        'partnerFeedback', f.partner_feedback,
        'additionalInformation', coalesce(f.additional_information, ''),
        'acknowledgements', to_jsonb(array_remove(array[
          case when f.acknowledgement_approval_required then 'approval_required' end,
          case when f.acknowledgement_final_report_required then 'final_report_required' end,
          case when f.acknowledgement_corrections_may_be_requested then 'corrections_may_be_requested' end,
          case when f.acknowledgement_volunteer_terms_required then 'volunteer_terms_required' end
        ], null))
      )
    end
  from public.app_projects p
  left join public.app_project_extension_forms f on f.project_id = p.id
  where p.id = p_project_id
$$;

create or replace function public.app_upsert_extension_form(
  p_project_id uuid,
  p_extension_form jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_learning_objectives jsonb := coalesce(p_extension_form -> 'learningObjectives', '[]'::jsonb);
  v_competencies jsonb := coalesce(p_extension_form -> 'transversalCompetencies', '[]'::jsonb);
  v_activities jsonb := coalesce(p_extension_form -> 'activities', '[]'::jsonb);
  v_goals jsonb := coalesce(p_extension_form -> 'goals', '[]'::jsonb);
  v_acknowledgements jsonb := coalesce(p_extension_form -> 'acknowledgements', '[]'::jsonb);
begin
  if p_extension_form is null or p_extension_form = '{}'::jsonb then
    delete from public.app_project_extension_forms where project_id = p_project_id;
    return;
  end if;

  insert into public.app_project_extension_forms (
    project_id,
    initiative_title,
    total_workload,
    unicap_program,
    linked_course,
    course_name,
    coordination_email,
    coordinator_name,
    coordinator_email,
    coordinator_cpf,
    coordinator_phone,
    coordinator_weekly_hours,
    coordinator_participation,
    other_volunteer_teachers,
    student_weekly_hours,
    student_participants,
    learning_objective_1,
    learning_objective_2,
    learning_objective_3,
    transversal_competency_1,
    transversal_competency_2,
    transversal_competency_3,
    service_offered,
    activity_1,
    activity_2,
    activity_3,
    execution_location,
    target_audience_detail,
    methodological_procedures,
    problem_statement,
    sustainable_development_goal,
    goal_1,
    goal_2,
    goal_3,
    dissemination_strategies,
    project_summary,
    reflection_strategies,
    evaluation_strategies,
    partner_feedback,
    additional_information,
    acknowledgement_approval_required,
    acknowledgement_final_report_required,
    acknowledgement_corrections_may_be_requested,
    acknowledgement_volunteer_terms_required
  )
  values (
    p_project_id,
    trim(coalesce(p_extension_form ->> 'title', '')),
    nullif(trim(coalesce(p_extension_form ->> 'totalWorkload', '')), '')::integer,
    trim(coalesce(p_extension_form ->> 'unicapProgram', '')),
    trim(coalesce(p_extension_form ->> 'linkedCourse', '')),
    trim(coalesce(p_extension_form ->> 'courseName', '')),
    trim(coalesce(p_extension_form ->> 'coordinationEmail', '')),
    trim(coalesce(p_extension_form ->> 'coordinatorName', '')),
    trim(coalesce(p_extension_form ->> 'coordinatorEmail', '')),
    trim(coalesce(p_extension_form ->> 'coordinatorCpf', '')),
    trim(coalesce(p_extension_form ->> 'coordinatorPhone', '')),
    nullif(trim(coalesce(p_extension_form ->> 'coordinatorWeeklyHours', '')), '')::integer,
    trim(coalesce(p_extension_form ->> 'coordinatorParticipation', '')),
    nullif(trim(coalesce(p_extension_form ->> 'otherVolunteerTeachers', '')), ''),
    nullif(trim(coalesce(p_extension_form ->> 'studentWeeklyHours', '')), '')::integer,
    trim(coalesce(p_extension_form ->> 'studentParticipants', '')),
    trim(coalesce(v_learning_objectives ->> 0, '')),
    trim(coalesce(v_learning_objectives ->> 1, '')),
    trim(coalesce(v_learning_objectives ->> 2, '')),
    trim(coalesce(v_competencies ->> 0, '')),
    trim(coalesce(v_competencies ->> 1, '')),
    trim(coalesce(v_competencies ->> 2, '')),
    trim(coalesce(p_extension_form ->> 'serviceOffered', '')),
    trim(coalesce(v_activities ->> 0, '')),
    trim(coalesce(v_activities ->> 1, '')),
    trim(coalesce(v_activities ->> 2, '')),
    trim(coalesce(p_extension_form ->> 'executionLocation', '')),
    trim(coalesce(p_extension_form ->> 'targetAudience', '')),
    trim(coalesce(p_extension_form ->> 'methodologicalProcedures', '')),
    trim(coalesce(p_extension_form ->> 'problemStatement', '')),
    trim(coalesce(p_extension_form ->> 'sustainableDevelopmentGoal', '')),
    trim(coalesce(v_goals ->> 0, '')),
    trim(coalesce(v_goals ->> 1, '')),
    trim(coalesce(v_goals ->> 2, '')),
    trim(coalesce(p_extension_form ->> 'disseminationStrategies', '')),
    trim(coalesce(p_extension_form ->> 'projectSummary', '')),
    trim(coalesce(p_extension_form ->> 'reflectionStrategies', '')),
    trim(coalesce(p_extension_form ->> 'evaluationStrategies', '')),
    trim(coalesce(p_extension_form ->> 'partnerFeedback', '')),
    nullif(trim(coalesce(p_extension_form ->> 'additionalInformation', '')), ''),
    v_acknowledgements ? 'approval_required',
    v_acknowledgements ? 'final_report_required',
    v_acknowledgements ? 'corrections_may_be_requested',
    v_acknowledgements ? 'volunteer_terms_required'
  )
  on conflict (project_id) do update
  set
    initiative_title = excluded.initiative_title,
    total_workload = excluded.total_workload,
    unicap_program = excluded.unicap_program,
    linked_course = excluded.linked_course,
    course_name = excluded.course_name,
    coordination_email = excluded.coordination_email,
    coordinator_name = excluded.coordinator_name,
    coordinator_email = excluded.coordinator_email,
    coordinator_cpf = excluded.coordinator_cpf,
    coordinator_phone = excluded.coordinator_phone,
    coordinator_weekly_hours = excluded.coordinator_weekly_hours,
    coordinator_participation = excluded.coordinator_participation,
    other_volunteer_teachers = excluded.other_volunteer_teachers,
    student_weekly_hours = excluded.student_weekly_hours,
    student_participants = excluded.student_participants,
    learning_objective_1 = excluded.learning_objective_1,
    learning_objective_2 = excluded.learning_objective_2,
    learning_objective_3 = excluded.learning_objective_3,
    transversal_competency_1 = excluded.transversal_competency_1,
    transversal_competency_2 = excluded.transversal_competency_2,
    transversal_competency_3 = excluded.transversal_competency_3,
    service_offered = excluded.service_offered,
    activity_1 = excluded.activity_1,
    activity_2 = excluded.activity_2,
    activity_3 = excluded.activity_3,
    execution_location = excluded.execution_location,
    target_audience_detail = excluded.target_audience_detail,
    methodological_procedures = excluded.methodological_procedures,
    problem_statement = excluded.problem_statement,
    sustainable_development_goal = excluded.sustainable_development_goal,
    goal_1 = excluded.goal_1,
    goal_2 = excluded.goal_2,
    goal_3 = excluded.goal_3,
    dissemination_strategies = excluded.dissemination_strategies,
    project_summary = excluded.project_summary,
    reflection_strategies = excluded.reflection_strategies,
    evaluation_strategies = excluded.evaluation_strategies,
    partner_feedback = excluded.partner_feedback,
    additional_information = excluded.additional_information,
    acknowledgement_approval_required = excluded.acknowledgement_approval_required,
    acknowledgement_final_report_required = excluded.acknowledgement_final_report_required,
    acknowledgement_corrections_may_be_requested = excluded.acknowledgement_corrections_may_be_requested,
    acknowledgement_volunteer_terms_required = excluded.acknowledgement_volunteer_terms_required,
    updated_at = now();
end;
$$;

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

  if p_type = 'extensao' and (p_extension_form is null or p_extension_form = '{}'::jsonb) then
    raise exception 'Formulario de extensao obrigatorio';
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

  if p_type = 'extensao' then
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

  if p_type = 'extensao' and (p_extension_form is null or p_extension_form = '{}'::jsonb) then
    raise exception 'Formulario de extensao obrigatorio';
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

  if p_type = 'extensao' then
    perform public.app_upsert_extension_form(v_project.id, p_extension_form);
  else
    delete from public.app_project_extension_forms where project_id = v_project.id;
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
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
    public.app_extension_form_json(p.id) as extension_form,
    p.status,
    p.admin_message,
    p.created_at,
    p.updated_at
  into v_project
  from public.app_projects p
  where p.id = v_project_id
    and p.owner_app_user_id = v_user.id
    and p.deleted_at is null
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
    'extension_form', v_project.extension_form,
    'status', v_project.status,
    'admin_message', v_project.admin_message,
    'created_at', v_project.created_at,
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
    analysis_started_at = now(),
    updated_at = now()
  where id = v_project_id
    and status = 'submetido'
    and deleted_at is null;

  select
    p.id,
    p.title,
    p.tipo,
    u.display_name as professor,
    u.avatar_url as professor_avatar_url,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.description,
    public.app_extension_form_json(p.id) as extension_form,
    p.status,
    p.created_at,
    p.updated_at
  into v_project
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.id = v_project_id
    and p.deleted_at is null
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'tipo', v_project.tipo,
    'professor', v_project.professor,
    'professor_avatar_url', v_project.professor_avatar_url,
    'discipline', v_project.discipline,
    'course', v_project.course,
    'period_start', v_project.period_start,
    'period_end', v_project.period_end,
    'target_audience', v_project.target_audience,
    'budget', v_project.budget,
    'description', v_project.description,
    'extension_form', v_project.extension_form,
    'status', v_project.status,
    'created_at', v_project.created_at,
    'updated_at', v_project.updated_at
  );
end;
$$;

grant select, insert, update, delete on public.app_project_extension_forms to postgres, service_role;
grant execute on function public.app_create_project_v2(
  uuid, text, projeto_tipo, text, text, date, date, text, numeric, text, text, text, jsonb
) to anon, authenticated;
grant execute on function public.app_update_project_v2(
  uuid, uuid, text, projeto_tipo, text, text, date, date, text, numeric, text, text, text, jsonb
) to anon, authenticated;
grant execute on function public.app_get_my_project_detail_v2(uuid, text) to anon, authenticated;
grant execute on function public.app_admin_get_project_detail_v2(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
