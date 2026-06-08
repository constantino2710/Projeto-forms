-- Funcoes do fluxo de pre-decisao (depende da migration 20260528000000 que
-- adiciona os enums pre_aprovado / pre_reprovado).

-- app_admin_decide_project: admin so pode pre_aprovar/pre_reprovar/em_ajustes.
-- Superadmin pode acoes finais (aprovado/reprovado) ou tambem em_ajustes.
-- Aceita atuar em projetos submetidos, em_avaliacao, pre_aprovado, pre_reprovado.
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

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin ou superadmin pode decidir projeto';
  end if;

  if v_user.role = 'admin' and p_decision not in ('pre_aprovado', 'pre_reprovado', 'em_ajustes') then
    raise exception 'Admin so pode pre-aprovar, pre-reprovar ou pedir ajustes';
  end if;

  if v_user.role = 'superadmin' and p_decision not in ('aprovado', 'reprovado', 'em_ajustes', 'pre_aprovado', 'pre_reprovado') then
    raise exception 'Decisao invalida para superadmin';
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
    and status in ('submetido', 'em_avaliacao', 'pre_aprovado', 'pre_reprovado')
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

grant execute on function public.app_admin_decide_project(uuid, uuid, public.project_status, text) to anon, authenticated;

-- app_list_admin_projects: admin ve apenas submetido/em_avaliacao;
-- superadmin tambem ve projetos pre-decididos aguardando decisao final.
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
  v_allowed_statuses text[];
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin pode listar projetos para avaliacao';
  end if;

  if v_sort_key is not null and v_sort_key not in ('budget', 'time') then
    raise exception 'Ordenacao invalida';
  end if;

  if v_sort_dir is not null and v_sort_dir not in ('asc', 'desc') then
    raise exception 'Direcao de ordenacao invalida';
  end if;

  v_allowed_statuses := case
    when v_user.role = 'superadmin'
      then array['submetido', 'em_avaliacao', 'pre_aprovado', 'pre_reprovado']
    else array['submetido', 'em_avaliacao']
  end;

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
    where p.status::text = any(v_allowed_statuses)
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
      when 'pre_aprovado'  then 0
      when 'pre_reprovado' then 0
      when 'em_avaliacao'  then 1
      when 'submetido'     then 2
      else 3
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

grant execute on function public.app_list_admin_projects(uuid, integer, integer, text, text, text, text, text, text[]) to anon, authenticated;

-- app_list_admin_project_history: inclui pre_aprovado/pre_reprovado para que o
-- admin veja as proprias pre-decisoes no historico (super continua vendo as
-- finais; o item pre tambem aparece pois eventualmente o super finalizara).
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
  v_allowed_statuses text[];
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

  v_allowed_statuses := case
    when v_user.role = 'admin'
      then array['aprovado', 'reprovado', 'em_ajustes', 'pre_aprovado', 'pre_reprovado']
    else array['aprovado', 'reprovado', 'em_ajustes']
  end;

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
    where p.status::text = any(v_allowed_statuses)
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

grant execute on function public.app_list_admin_project_history(uuid, integer, integer, text, text, text, text, text, text[]) to anon, authenticated;

-- app_get_project_timeline: passa a expor reviewed_at para que a UI consiga
-- mostrar a data da pre-decisao quando o status atual e pre_aprovado/pre_reprovado.
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
      (v_user.role in ('admin', 'superadmin'))
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
    'rejected_at', v_project.rejected_at,
    'reviewed_at', v_project.reviewed_at
  );
end;
$$;

grant execute on function public.app_get_project_timeline(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
