alter table public.app_projects
  add column if not exists admin_message text;
alter table public.app_projects
  add column if not exists admin_message_updated_at timestamptz;
drop function if exists public.app_admin_decide_project(uuid, uuid, public.project_status);
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
    admin_message = v_clean_message,
    admin_message_updated_at = case
      when v_clean_message is not null then now()
      else null
    end
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
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
grant execute on function public.app_admin_decide_project(
  uuid, uuid, public.project_status, text
) to anon, authenticated;
create or replace function public.app_list_admin_project_history(
  p_token uuid
)
returns table (
  id uuid,
  title text,
  professor text,
  discipline text,
  course text,
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
    u.display_name as professor,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.status,
    coalesce(p.reviewed_at, p.updated_at) as reviewed_at
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.status in ('aprovado', 'reprovado', 'em_ajustes')
    and (p.reviewed_by_app_user_id = v_user.id or p.reviewed_by_app_user_id is null)
  order by coalesce(p.reviewed_at, p.updated_at) desc;
end;
$$;
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
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and status in ('rascunho', 'submetido', 'em_ajustes')
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
    and status in ('rascunho', 'em_ajustes')
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
