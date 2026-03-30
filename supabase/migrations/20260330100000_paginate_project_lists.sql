drop function if exists public.app_list_my_projects_v2(uuid);

create or replace function public.app_list_my_projects_v2(
  p_token uuid,
  p_limit integer default 6,
  p_offset integer default 0,
  p_query text default null,
  p_statuses text[] default null
)
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
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 6), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_query text := nullif(trim(coalesce(p_query, '')), '');
begin
  v_user := public.app_session_user(p_token);

  return query
  with filtered as (
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
      and (v_query is null or p.title ilike ('%' || v_query || '%'))
      and (
        coalesce(array_length(p_statuses, 1), 0) = 0
        or p.status::text = any(p_statuses)
      )
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.codigo_disciplina,
    f.semestre_letivo,
    f.thematic_area,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.target_audience,
    f.budget,
    f.description,
    f.status,
    f.created_at,
    f.updated_at,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

drop function if exists public.app_list_admin_projects(uuid);

create or replace function public.app_list_admin_projects(
  p_token uuid,
  p_limit integer default 6,
  p_offset integer default 0,
  p_course text default null,
  p_school text default null
)
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
  professor_avatar_url text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 6), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode listar projetos para avaliacao';
  end if;

  return query
  with filtered as (
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
      and (v_course is null or p.course = v_course)
      and (v_school is null or p.school = v_school)
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.created_at,
    f.professor,
    f.professor_avatar_url,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

drop function if exists public.app_list_admin_project_history(uuid);

create or replace function public.app_list_admin_project_history(
  p_token uuid,
  p_limit integer default 6,
  p_offset integer default 0,
  p_course text default null,
  p_school text default null
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
  reviewed_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 6), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode acessar historico';
  end if;

  return query
  with filtered as (
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
      and (v_course is null or p.course = v_course)
      and (v_school is null or p.school = v_school)
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.reviewed_at,
    count(*) over() as total_count
  from filtered f
  order by f.reviewed_at desc
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function public.app_list_my_projects_v2(uuid, integer, integer, text, text[]) to anon, authenticated;
grant execute on function public.app_list_admin_projects(uuid, integer, integer, text, text) to anon, authenticated;
grant execute on function public.app_list_admin_project_history(uuid, integer, integer, text, text) to anon, authenticated;