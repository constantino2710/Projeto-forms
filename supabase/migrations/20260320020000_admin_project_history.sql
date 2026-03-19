alter table public.app_projects
add column if not exists reviewed_by_app_user_id uuid references public.app_users (id) on delete set null;

alter table public.app_projects
add column if not exists reviewed_at timestamptz;

create index if not exists idx_app_projects_reviewed_by on public.app_projects (reviewed_by_app_user_id);
create index if not exists idx_app_projects_reviewed_at on public.app_projects (reviewed_at desc);

create or replace function public.app_admin_decide_project(
  p_token uuid,
  p_project_id uuid,
  p_decision public.project_status
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

  if v_user.role <> 'admin' then
    raise exception 'Apenas admin pode decidir projeto';
  end if;

  if p_decision not in ('aprovado', 'reprovado') then
    raise exception 'Decisao invalida. Use aprovado ou reprovado';
  end if;

  update public.app_projects
  set
    status = p_decision,
    updated_at = now(),
    reviewed_by_app_user_id = v_user.id,
    reviewed_at = now()
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja finalizado';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at
  );
end;
$$;

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
    p.reviewed_at
  from public.app_projects p
  join public.app_users u on u.id = p.owner_app_user_id
  where p.reviewed_by_app_user_id = v_user.id
    and p.status in ('aprovado', 'reprovado')
  order by p.reviewed_at desc nulls last, p.updated_at desc;
end;
$$;

grant execute on function public.app_list_admin_project_history(uuid) to anon, authenticated;
