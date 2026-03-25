alter table public.app_projects
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_app_user_id uuid references public.app_users (id);

create index if not exists idx_app_projects_owner_deleted
  on public.app_projects (owner_app_user_id, deleted_at, created_at desc);

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
    and p.deleted_at is null
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
    'status', v_project.status,
    'admin_message', v_project.admin_message,
    'created_at', v_project.created_at,
    'updated_at', v_project.updated_at
  );
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
    raise exception 'Apenas usuario pode editar projeto';
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

  return jsonb_build_object(
    'id', v_project.id,
    'title', v_project.title,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;

drop function if exists public.app_delete_project(uuid, uuid);
create or replace function public.app_delete_project(
  p_token uuid,
  p_project_id uuid
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
    raise exception 'Apenas usuario pode excluir projeto';
  end if;

  update public.app_projects
  set
    deleted_at = now(),
    deleted_by_app_user_id = v_user.id,
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and status = 'rascunho'
    and deleted_at is null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou status nao permite exclusao';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'deleted_at', v_project.deleted_at,
    'updated_at', v_project.updated_at
  );
end;
$$;

create or replace function public.app_restore_project(
  p_token uuid,
  p_project_id uuid
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
    raise exception 'Apenas usuario pode restaurar projeto';
  end if;

  update public.app_projects
  set
    deleted_at = null,
    deleted_by_app_user_id = null,
    updated_at = now()
  where id = p_project_id
    and owner_app_user_id = v_user.id
    and deleted_at is not null
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado para restauracao';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;

grant execute on function public.app_delete_project(uuid, uuid) to anon, authenticated;
grant execute on function public.app_restore_project(uuid, uuid) to anon, authenticated;
