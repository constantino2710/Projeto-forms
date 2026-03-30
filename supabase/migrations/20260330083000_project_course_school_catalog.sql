create table if not exists public.app_project_courses (
  name text primary key
);

create table if not exists public.app_project_schools (
  name text primary key
);

insert into public.app_project_courses (name)
values
  ('Ciencia da computacao'),
  ('Direito'),
  ('Medicina'),
  ('Arquitetura'),
  ('Jornalismo'),
  ('Engenharia da Complexidade')
on conflict (name) do nothing;

insert into public.app_project_schools (name)
values
  ('Ciencias juridicas e empresarias'),
  ('Educacao e humanidades'),
  ('Saude e ciencias da vida'),
  ('Tecnologia e comunicacao')
on conflict (name) do nothing;

alter table public.app_projects
  add column if not exists school text;

update public.app_projects p
set course = null
where p.course is not null
  and not exists (
    select 1
    from public.app_project_courses c
    where c.name = p.course
  );

update public.app_projects p
set school = null
where p.school is not null
  and not exists (
    select 1
    from public.app_project_schools s
    where s.name = p.school
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_projects_course_fkey'
      and conrelid = 'public.app_projects'::regclass
  ) then
    alter table public.app_projects
      add constraint app_projects_course_fkey
      foreign key (course) references public.app_project_courses (name);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_projects_school_fkey'
      and conrelid = 'public.app_projects'::regclass
  ) then
    alter table public.app_projects
      add constraint app_projects_school_fkey
      foreign key (school) references public.app_project_schools (name);
  end if;
end;
$$;

create index if not exists idx_app_projects_course on public.app_projects (course);
create index if not exists idx_app_projects_school on public.app_projects (school);

create or replace function public.app_list_project_catalog_options(
  p_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
begin
  v_user := public.app_session_user(p_token);

  return jsonb_build_object(
    'courses', (
      select coalesce(jsonb_agg(c.name order by c.name), '[]'::jsonb)
      from public.app_project_courses c
    ),
    'schools', (
      select coalesce(jsonb_agg(s.name order by s.name), '[]'::jsonb)
      from public.app_project_schools s
    )
  );
end;
$$;

drop function if exists public.app_create_project_v2(
  uuid,
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
  p_school text,
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
  v_course text;
  v_school text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'user' then
    raise exception 'Apenas usuario pode criar projeto';
  end if;

  v_course := nullif(trim(coalesce(p_course, '')), '');
  v_school := nullif(trim(coalesce(p_school, '')), '');

  if v_course is not null
     and not exists (select 1 from public.app_project_courses c where c.name = v_course) then
    raise exception 'Curso invalido';
  end if;

  if v_school is not null
     and not exists (select 1 from public.app_project_schools s where s.name = v_school) then
    raise exception 'Escola invalida';
  end if;

  insert into public.app_projects (
    owner_app_user_id,
    title,
    tipo,
    thematic_area,
    course,
    school,
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
    v_course,
    v_school,
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
  school text,
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
    p.school,
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
    p.school,
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
    'school', v_project.school,
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

drop function if exists public.app_update_project_v2(
  uuid,
  uuid,
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

create or replace function public.app_update_project_v2(
  p_token uuid,
  p_project_id uuid,
  p_title text,
  p_type projeto_tipo,
  p_thematic_area text,
  p_course text,
  p_school text,
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
  v_course text;
  v_school text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'user' then
    raise exception 'Apenas usuario pode editar projeto';
  end if;

  v_course := nullif(trim(coalesce(p_course, '')), '');
  v_school := nullif(trim(coalesce(p_school, '')), '');

  if v_course is not null
     and not exists (select 1 from public.app_project_courses c where c.name = v_course) then
    raise exception 'Curso invalido';
  end if;

  if v_school is not null
     and not exists (select 1 from public.app_project_schools s where s.name = v_school) then
    raise exception 'Escola invalida';
  end if;

  update public.app_projects
  set
    title = trim(p_title),
    tipo = p_type,
    thematic_area = trim(p_thematic_area),
    course = v_course,
    school = v_school,
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
    u.avatar_url as professor_avatar_url,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    coalesce(p.school, '-') as school,
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
    'professor_avatar_url', v_project.professor_avatar_url,
    'discipline', v_project.discipline,
    'course', v_project.course,
    'school', v_project.school,
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

drop function if exists public.app_list_admin_projects(uuid);

create or replace function public.app_list_admin_projects(p_token uuid)
returns table (
  id uuid,
  title text,
  tipo text,
  course text,
  school text,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  created_at timestamptz,
  professor text,
  professor_avatar_url text
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
    p.tipo::text as tipo,
    p.course,
    p.school,
    p.period_start,
    p.period_end,
    p.budget,
    p.status,
    p.created_at,
    u.display_name as professor,
    u.avatar_url as professor_avatar_url
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.status in ('submetido', 'em_avaliacao')
    and p.deleted_at is null
  order by p.created_at desc;
end;
$$;

drop function if exists public.app_list_admin_project_history(uuid);

create or replace function public.app_list_admin_project_history(
  p_token uuid
)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  course text,
  school text,
  period_start date,
  period_end date,
  budget numeric,
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
    p.tipo,
    p.course,
    p.school,
    p.period_start,
    p.period_end,
    p.budget,
    p.status,
    coalesce(p.reviewed_at, p.updated_at) as reviewed_at
  from public.app_projects p
  where p.status in ('aprovado', 'reprovado', 'em_ajustes')
    and (p.reviewed_by_app_user_id = v_user.id or p.reviewed_by_app_user_id is null)
    and p.deleted_at is null
  order by coalesce(p.reviewed_at, p.updated_at) desc;
end;
$$;

grant execute on function public.app_list_project_catalog_options(uuid) to anon, authenticated;
grant execute on function public.app_create_project_v2(
  uuid,
  text,
  projeto_tipo,
  text,
  text,
  text,
  date,
  date,
  text,
  numeric,
  text,
  text,
  text
) to anon, authenticated;
grant execute on function public.app_list_my_projects_v2(uuid) to anon, authenticated;
grant execute on function public.app_update_project_v2(
  uuid,
  uuid,
  text,
  projeto_tipo,
  text,
  text,
  text,
  date,
  date,
  text,
  numeric,
  text,
  text,
  text
) to anon, authenticated;
grant execute on function public.app_list_admin_projects(uuid) to anon, authenticated;
grant execute on function public.app_list_admin_project_history(uuid) to anon, authenticated;
