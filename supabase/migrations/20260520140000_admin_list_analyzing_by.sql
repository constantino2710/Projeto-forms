-- Inclui o nome de quem está analisando o projeto no retorno da listagem
-- usada por admins/superadmins, para que o card da página de Projetos possa
-- exibir "Em analise por X" sem precisar abrir o detalhe.

-- Postgres não permite alterar colunas de RETURNS TABLE via CREATE OR REPLACE,
-- então dropamos antes de recriar com a nova coluna analyzing_by_name.
drop function if exists public.app_list_admin_projects(
  uuid, integer, integer, text, text, text, text, text, text[]
);

create or replace function public.app_list_admin_projects(
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
  analyzing_by_name text,
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
    raise exception 'Apenas admin ou superadmin pode listar projetos para avaliacao';
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
      p.tipo::text as tipo,
      p.course,
      p.school,
      p.period_start,
      p.period_end,
      p.budget,
      p.status,
      p.created_at,
      u.display_name as professor,
      u.avatar_url as professor_avatar_url,
      a.display_name as analyzing_by_name
    from public.app_projects p
    join public.app_users u on u.id = p.owner_app_user_id
    left join public.app_users a on a.id = p.analyzing_by_app_user_id
    where p.status in ('submetido', 'em_avaliacao')
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
    f.created_at,
    f.professor,
    f.professor_avatar_url,
    f.analyzing_by_name,
    count(*) over() as total_count
  from filtered f
  order by
    case f.status
      when 'em_avaliacao' then 0
      when 'submetido'    then 1
      else 2
    end,
    case when v_sort_key = 'budget' and v_sort_dir = 'asc'  then f.budget end asc nulls last,
    case when v_sort_key = 'budget' and v_sort_dir = 'desc' then f.budget end desc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'asc'  then f.period_start end asc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'desc' then f.period_start end desc nulls last,
    f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function public.app_list_admin_projects(
  uuid, integer, integer, text, text, text, text, text, text[]
) to anon, authenticated;

notify pgrst, 'reload schema';
