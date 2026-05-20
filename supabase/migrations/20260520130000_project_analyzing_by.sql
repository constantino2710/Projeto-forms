-- Adiciona rastreio do admin/superadmin que iniciou a análise do projeto
-- (`analyzing_by_app_user_id`) e atualiza as RPCs envolvidas para registrar e
-- expor esse dado junto com quem decidiu (`reviewed_by_app_user_id`).
--
-- Motivação: a página de detalhe do projeto precisa exibir quem está/esteve
-- analisando e quem aprovou, recusou ou solicitou ajustes, distinguindo o
-- caso em que duas pessoas diferentes participaram do fluxo.

alter table public.app_projects
  add column if not exists analyzing_by_app_user_id uuid references public.app_users(id);

-- Backfill: para projetos já decididos sem registro de quem analisou,
-- consideramos que o decisor também foi o analisador.
update public.app_projects
set analyzing_by_app_user_id = reviewed_by_app_user_id
where analyzing_by_app_user_id is null
  and reviewed_by_app_user_id is not null;

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

  update public.app_projects
  set
    status = 'em_avaliacao',
    analysis_started_at = now(),
    analyzing_by_app_user_id = v_user.id,
    updated_at = now()
  where id = v_project_id
    and status = 'submetido'
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

-- Quando o usuário volta o projeto para rascunho/submetido (por exemplo após
-- ajustes solicitados), limpamos também o analyzing_by_app_user_id para
-- refletir que ninguém está analisando ainda.
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
    analyzing_by_app_user_id = case
      when p_status in ('rascunho', 'submetido') then null
      else analyzing_by_app_user_id
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

grant execute on function public.app_admin_get_project_detail_v2(uuid, text) to anon, authenticated;
grant execute on function public.app_update_project_status(uuid, uuid, public.project_status) to anon, authenticated;

notify pgrst, 'reload schema';
