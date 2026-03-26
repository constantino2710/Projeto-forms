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
    'email', v_user.email,
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

  if v_user.password_hash is null or extensions.crypt(p_password, v_user.password_hash) <> v_user.password_hash then
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
    'email', v_user.email,
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
    u.email,
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
    'email', v_session.email,
    'avatar_url', v_session.avatar_url,
    'role', v_session.role
  );
end;
$$;

create or replace function public.app_update_my_profile(
  p_token uuid,
  p_display_name text,
  p_email text,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_display_name text;
  v_email text;
  v_avatar_url text;
begin
  v_user := public.app_session_user(p_token);
  v_display_name := nullif(trim(coalesce(p_display_name, '')), '');
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
  v_avatar_url := nullif(trim(coalesce(p_avatar_url, '')), '');

  if v_display_name is null then
    raise exception 'Nome nao pode ficar vazio';
  end if;

  if v_email is null then
    raise exception 'Email nao pode ficar vazio';
  end if;

  if v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Email invalido';
  end if;

  if exists (
    select 1
    from public.app_users u
    where u.id <> v_user.id
      and lower(u.email) = v_email
  ) then
    raise exception 'Email ja esta em uso';
  end if;

  update public.app_users
  set
    display_name = v_display_name,
    email = v_email,
    avatar_url = v_avatar_url
  where id = v_user.id;

  return jsonb_build_object(
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_display_name,
    'email', v_email,
    'avatar_url', v_avatar_url,
    'role', v_user.role
  );
end;
$$;

grant execute on function public.app_update_my_profile(uuid, text, text, text) to anon, authenticated;
