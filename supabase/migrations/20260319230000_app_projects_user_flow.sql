create table public.app_projects (
  id uuid primary key default gen_random_uuid(),
  owner_app_user_id uuid not null references public.app_users (id) on delete cascade,
  title text not null,
  thematic_area text not null,
  course text,
  period_start date not null,
  period_end date not null,
  target_audience text not null,
  budget numeric(14, 2) not null default 0,
  status public.project_status not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_projects_period_check check (period_end >= period_start),
  constraint app_projects_budget_check check (budget >= 0)
);

create index idx_app_projects_owner on public.app_projects (owner_app_user_id);
create index idx_app_projects_status on public.app_projects (status);
create index idx_app_projects_created_at on public.app_projects (created_at desc);

create trigger trg_app_projects_updated_at
before update on public.app_projects
for each row
execute function public.set_updated_at();

create or replace function public.app_session_user(p_token uuid)
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
begin
  select u.*
    into v_user
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token = p_token
    and s.expires_at > now()
    and u.is_active = true
  limit 1;

  if not found then
    raise exception 'Sessao invalida ou expirada';
  end if;

  update public.app_sessions
  set last_seen_at = now()
  where token = p_token;

  return v_user;
end;
$$;

create or replace function public.app_create_project(
  p_token uuid,
  p_title text,
  p_thematic_area text,
  p_course text,
  p_period_start date,
  p_period_end date,
  p_target_audience text,
  p_budget numeric
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
    raise exception 'Apenas usuario pode criar projeto';
  end if;

  insert into public.app_projects (
    owner_app_user_id,
    title,
    thematic_area,
    course,
    period_start,
    period_end,
    target_audience,
    budget
  )
  values (
    v_user.id,
    trim(p_title),
    trim(p_thematic_area),
    nullif(trim(coalesce(p_course, '')), ''),
    p_period_start,
    p_period_end,
    trim(p_target_audience),
    coalesce(p_budget, 0)
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

create or replace function public.app_list_my_projects(p_token uuid)
returns table (
  id uuid,
  title text,
  thematic_area text,
  course text,
  period_start date,
  period_end date,
  target_audience text,
  budget numeric,
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
    p.thematic_area,
    p.course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.status,
    p.created_at,
    p.updated_at
  from public.app_projects p
  where p.owner_app_user_id = v_user.id
  order by p.created_at desc;
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

grant execute on function public.app_session_user(uuid) to anon, authenticated;
grant execute on function public.app_create_project(
  uuid, text, text, text, date, date, text, numeric
) to anon, authenticated;
grant execute on function public.app_list_my_projects(uuid) to anon, authenticated;
grant execute on function public.app_update_project_status(
  uuid, uuid, public.project_status
) to anon, authenticated;
