-- Permite que o primeiro admin/superadmin que abrir um projeto já em
-- 'em_avaliacao' (e sem analista registrado) seja gravado como analista.
-- Antes, app_admin_get_project_detail_v2 só preenchia analyzing_by_app_user_id
-- na transição 'submetido' → 'em_avaliacao'; projetos que já estavam em
-- 'em_avaliacao' antes da migration 20260520130000 ficavam para sempre sem
-- nome de analista (e portanto sem o destaque "Em analise por X" na UI).

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

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin ou superadmin pode abrir projeto';
  end if;

  begin
    v_project_id := p_project_id::uuid;
  exception
    when others then
      raise exception 'ID de projeto invalido';
  end;

  -- Transição submetido → em_avaliacao reivindica a análise.
  update public.app_projects
  set
    status = 'em_avaliacao',
    analysis_started_at = now(),
    analyzing_by_app_user_id = v_user.id,
    updated_at = now()
  where id = v_project_id
    and status = 'submetido'
    and deleted_at is null;

  -- Projeto já em 'em_avaliacao' sem analista: o primeiro a abrir reivindica.
  update public.app_projects
  set
    analyzing_by_app_user_id = v_user.id,
    analysis_started_at = coalesce(analysis_started_at, now()),
    updated_at = now()
  where id = v_project_id
    and status = 'em_avaliacao'
    and analyzing_by_app_user_id is null
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
    p.updated_at,
    a.display_name as analyzing_by_name,
    r.display_name as reviewed_by_name
  into v_project
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  left join public.app_users a on a.id = p.analyzing_by_app_user_id
  left join public.app_users r on r.id = p.reviewed_by_app_user_id
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
    'updated_at', v_project.updated_at,
    'analyzing_by_name', v_project.analyzing_by_name,
    'reviewed_by_name', v_project.reviewed_by_name
  );
end;
$$;

grant execute on function public.app_admin_get_project_detail_v2(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
