create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role public.user_role not null,
  password_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint app_users_username_format check (username ~ '^[A-Za-z0-9_]{5,20}$'),
  constraint app_users_password_admin_check check (
    (role = 'admin' and password_hash is not null)
    or (role = 'user' and password_hash is null)
  )
);
create table public.app_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '12 hours'
);
create index idx_app_sessions_user_id on public.app_sessions (user_id);
create index idx_app_sessions_expires_at on public.app_sessions (expires_at);
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
    raise exception 'Usuario nao encontrado ou inativo';
  end if;

  insert into public.app_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  return jsonb_build_object(
    'token', v_token,
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
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
    raise exception 'Admin nao encontrado ou inativo';
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
    s.token,
    u.id as user_id,
    u.username,
    u.display_name,
    u.role,
    u.is_active,
    s.expires_at
  into v_session
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token = p_token
  limit 1;

  if not found or v_session.is_active = false or v_session.expires_at <= now() then
    delete from public.app_sessions where token = p_token;
    return null;
  end if;

  update public.app_sessions
  set last_seen_at = now()
  where token = p_token;

  return jsonb_build_object(
    'token', v_session.token,
    'user_id', v_session.user_id,
    'username', v_session.username,
    'display_name', v_session.display_name,
    'role', v_session.role
  );
end;
$$;
create or replace function public.app_logout(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_sessions where token = p_token;
end;
$$;
grant execute on function public.app_login_user(text) to anon, authenticated;
grant execute on function public.app_login_admin(text, text) to anon, authenticated;
grant execute on function public.app_validate_session(uuid) to anon, authenticated;
grant execute on function public.app_logout(uuid) to anon, authenticated;
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
insert into public.app_users (username, display_name, role)
values
  ('00000128457', 'Professor RA 00000128457', 'user'),
  ('00000963104', 'Professor RA 00000963104', 'user'),
  ('00000541782', 'Professor RA 00000541782', 'user'),
  ('00000790531', 'Professor RA 00000790531', 'user'),
  ('00000234619', 'Professor RA 00000234619', 'user'),
  ('00000815460', 'Professor RA 00000815460', 'user'),
  ('00000379028', 'Professor RA 00000379028', 'user'),
  ('00000650273', 'Professor RA 00000650273', 'user'),
  ('00000486135', 'Professor RA 00000486135', 'user'),
  ('00000197546', 'Professor RA 00000197546', 'user')
on conflict (username) do nothing;
insert into public.app_users (username, display_name, role, password_hash)
values (
  'admin',
  'Administrador do Sistema',
  'admin',
  extensions.crypt('Admin@123', extensions.gen_salt('bf'))
)
on conflict (username) do update
set
  display_name = excluded.display_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = true;
