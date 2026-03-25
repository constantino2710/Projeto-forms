alter table public.app_projects
  add column if not exists submitted_at timestamptz,
  add column if not exists analysis_started_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

update public.app_projects
set
  submitted_at = coalesce(submitted_at, created_at)
where status in ('submetido', 'em_avaliacao', 'em_ajustes', 'aprovado', 'reprovado')
  and submitted_at is null;

update public.app_projects
set
  analysis_started_at = coalesce(analysis_started_at, reviewed_at, updated_at, submitted_at)
where status in ('em_avaliacao', 'em_ajustes', 'aprovado', 'reprovado')
  and analysis_started_at is null;

update public.app_projects
set
  approved_at = coalesce(approved_at, reviewed_at, updated_at)
where status = 'aprovado'
  and approved_at is null;

update public.app_projects
set
  rejected_at = coalesce(rejected_at, reviewed_at, updated_at)
where status = 'reprovado'
  and rejected_at is null;

create or replace function public.app_update_project_status(
  p_token uuid,
  p_project_id uuid,
  p_status public.project_status
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
    raise exception 'Apenas usuario pode alterar este status';
  end if;

  if p_status not in ('rascunho', 'submetido') then
    raise exception 'Status permitido somente: rascunho ou submetido';
  end if;

  update public.app_projects
  set
    status = p_status,
    submitted_at = case
      when p_status = 'submetido' then now()
      else submitted_at
    end,
    analysis_started_at = case
      when p_status in ('rascunho', 'submetido') then null
      else analysis_started_at
    end,
    reviewed_at = case
      when p_status in ('rascunho', 'submetido') then null
      else reviewed_at
    end,
    reviewed_by_app_user_id = case
      when p_status in ('rascunho', 'submetido') then null
      else reviewed_by_app_user_id
    end,
    approved_at = case
      when p_status in ('rascunho', 'submetido') then null
      else approved_at
    end,
    rejected_at = case
      when p_status in ('rascunho', 'submetido') then null
      else rejected_at
    end,
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and status in ('rascunho', 'submetido', 'em_ajustes')
    and deleted_at is null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado para este usuario';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
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
    analysis_started_at = now(),
    updated_at = now()
  where id = v_project_id
    and status = 'submetido'
    and deleted_at is null;

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
    and p.deleted_at is null
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

create or replace function public.app_admin_decide_project(
  p_token uuid,
  p_project_id uuid,
  p_decision public.project_status,
  p_admin_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_project public.app_projects%rowtype;
  v_clean_message text;
  v_owner_email text;
  v_owner_name text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode decidir projeto';
  end if;

  if p_decision not in ('aprovado', 'reprovado', 'em_ajustes') then
    raise exception 'Decisao invalida. Use aprovado, reprovado ou em_ajustes';
  end if;

  v_clean_message := nullif(trim(coalesce(p_admin_message, '')), '');

  update public.app_projects
  set
    status = p_decision,
    updated_at = now(),
    reviewed_by_app_user_id = v_user.id,
    reviewed_at = now(),
    approved_at = case
      when p_decision = 'aprovado' then now()
      else null
    end,
    rejected_at = case
      when p_decision = 'reprovado' then now()
      else null
    end,
    admin_message = v_clean_message,
    admin_message_updated_at = case
      when v_clean_message is not null then now()
      else null
    end
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
    and deleted_at is null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja finalizado';
  end if;

  select
    u.email,
    u.display_name
  into
    v_owner_email,
    v_owner_name
  from public.app_users u
  where u.id = v_project.owner_app_user_id
  limit 1;

  if v_owner_email is null then
    raise exception 'Professor sem e-mail cadastrado para notificacao';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at,
    'project_title', v_project.title,
    'professor_name', v_owner_name,
    'recipient_email', v_owner_email,
    'admin_message', v_clean_message
  );
end;
$$;

create or replace function public.app_get_project_timeline(
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
  v_project public.app_projects%rowtype;
begin
  v_user := public.app_session_user(p_token);

  begin
    v_project_id := p_project_id::uuid;
  exception
    when others then
      raise exception 'ID de projeto invalido';
  end;

  select *
  into v_project
  from public.app_projects p
  where p.id = v_project_id
    and p.deleted_at is null
    and (
      (v_user.role = 'admin')
      or (v_user.role = 'user' and p.owner_app_user_id = v_user.id)
    )
  limit 1;

  if not found then
    raise exception 'Projeto nao encontrado para este usuario';
  end if;

  return jsonb_build_object(
    'status', v_project.status,
    'created_at', v_project.created_at,
    'submitted_at', v_project.submitted_at,
    'analysis_started_at', v_project.analysis_started_at,
    'approved_at', v_project.approved_at,
    'rejected_at', v_project.rejected_at
  );
end;
$$;

grant execute on function public.app_get_project_timeline(uuid, text) to anon, authenticated;
