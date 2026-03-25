alter table public.app_users
  add column if not exists avatar_url text;

create or replace function public.app_login_user(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_token uuid;
begin
  select *
    into v_user
  from public.app_users
  where username = p_username
    and role = 'user'
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Usuario nao encontrado';
  end if;

  insert into public.app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return jsonb_build_object(
    'token', v_token,
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'avatar_url', v_user.avatar_url,
    'role', v_user.role
  );
end;
$$;

create or replace function public.app_login_admin(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_token uuid;
begin
  select *
    into v_user
  from public.app_users
  where username = p_username
    and role = 'admin'
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Admin nao encontrado';
  end if;

  if v_user.password_hash is null or crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    raise exception 'Senha invalida';
  end if;

  insert into public.app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return jsonb_build_object(
    'token', v_token,
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'avatar_url', v_user.avatar_url,
    'role', v_user.role
  );
end;
$$;

create or replace function public.app_validate_session(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select
    s.user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.role
  into v_session
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token = p_token
    and s.expires_at > now()
    and u.is_active = true
  limit 1;

  if not found then
    return null;
  end if;

  update public.app_sessions
  set last_seen_at = now()
  where token = p_token;

  return jsonb_build_object(
    'token', p_token,
    'user_id', v_session.user_id,
    'username', v_session.username,
    'display_name', v_session.display_name,
    'avatar_url', v_session.avatar_url,
    'role', v_session.role
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

create or replace function public.app_update_my_avatar(
  p_token uuid,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_avatar_url text;
begin
  v_user := public.app_session_user(p_token);
  v_avatar_url := nullif(trim(coalesce(p_avatar_url, '')), '');

  update public.app_users
  set avatar_url = v_avatar_url
  where id = v_user.id;

  return jsonb_build_object(
    'user_id', v_user.id,
    'avatar_url', v_avatar_url
  );
end;
$$;

grant execute on function public.app_update_my_avatar(uuid, text) to anon, authenticated;
