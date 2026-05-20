-- Permite que qualquer admin (não apenas superadmin) veja o histórico
-- completo de projetos decididos. Antes, admins comuns só viam projetos
-- revisados por eles mesmos, o que escondia decisões de outros admins.

create or replace function public.app_list_admin_project_history(
  p_token uuid,
  p_limit integer default 200,
  p_offset integer default 0,
  p_course text default null,
  p_school text default null,
  p_sort_key text default null,
  p_sort_dir text default null,
  p_query text default null,
  p_statuses text[] default null
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
  v_limit integer := greatest(coalesce(p_limit, 200), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
  v_sort_key text := lower(nullif(trim(coalesce(p_sort_key, '')), ''));
  v_sort_dir text := lower(nullif(trim(coalesce(p_sort_dir, '')), ''));
  v_query text := nullif(trim(coalesce(p_query, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin ou superadmin pode acessar historico';
  end if;

  if v_sort_key is not null and v_sort_key not in ('budget', 'time') then
    raise exception 'Ordenacao invalida';
  end if;

  if v_sort_dir is not null and v_sort_dir not in ('asc', 'desc') then
    raise exception 'Direcao de ordenacao invalida';
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
      and p.deleted_at is null
      and (v_course is null or p.course = v_course)
      and (v_school is null or p.school = v_school)
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
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.reviewed_at,
    count(*) over() as total_count
  from filtered f
  order by
    case when v_sort_key = 'budget' and v_sort_dir = 'asc'  then f.budget end asc nulls last,
    case when v_sort_key = 'budget' and v_sort_dir = 'desc' then f.budget end desc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'asc'  then f.period_start end asc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'desc' then f.period_start end desc nulls last,
    f.reviewed_at desc
  limit v_limit
  offset v_offset;
end;
$$;

notify pgrst, 'reload schema';
