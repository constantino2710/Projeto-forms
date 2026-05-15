-- Quando o filtro de status fica vazio no historico geral do superadmin,
-- nao retornar projetos em analise (em_avaliacao). Esses ainda aparecem
-- na fila do admin (app_list_admin_projects); o historico mostra apenas
-- estados ja decididos ou em outras etapas (submetido, em_ajustes,
-- aprovado, reprovado, rascunho).

drop function if exists public.app_sa_list_all_history(uuid, integer, integer, text, text, text, text, text, text);

create or replace function public.app_sa_list_all_history(
  p_token uuid,
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default null,
  p_status text default null,
  p_course text default null,
  p_school text default null,
  p_sort_key text default null,
  p_sort_dir text default null
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
  professor text,
  reviewer text,
  reviewed_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 20), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_status text := nullif(trim(coalesce(p_status, '')), '');
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
  v_sort_key text := lower(nullif(trim(coalesce(p_sort_key, '')), ''));
  v_sort_dir text := lower(nullif(trim(coalesce(p_sort_dir, '')), ''));
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode acessar historico geral';
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
      uo.display_name as professor,
      ur.display_name as reviewer,
      coalesce(p.reviewed_at, p.updated_at) as reviewed_at,
      p.created_at
    from public.app_projects p
    join public.app_users uo on uo.id = p.owner_app_user_id
    left join public.app_users ur on ur.id = p.reviewed_by_app_user_id
    where p.deleted_at is null
      and (
        case
          when v_status is null then p.status::text <> 'em_avaliacao'
          else p.status::text = v_status
        end
      )
      and (
        v_search is null
        or p.title ilike ('%' || v_search || '%')
        or uo.display_name ilike ('%' || v_search || '%')
        or coalesce(p.course, '') ilike ('%' || v_search || '%')
      )
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
    f.professor,
    f.reviewer,
    f.reviewed_at,
    f.created_at,
    count(*) over() as total_count
  from filtered f
  order by
    case when v_sort_key = 'budget' and v_sort_dir = 'asc'  then f.budget end asc nulls last,
    case when v_sort_key = 'budget' and v_sort_dir = 'desc' then f.budget end desc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'asc'  then f.period_start end asc nulls last,
    case when v_sort_key = 'time'   and v_sort_dir = 'desc' then f.period_start end desc nulls last,
    f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function public.app_sa_list_all_history(uuid, integer, integer, text, text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
