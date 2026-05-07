alter table public.app_users drop constraint if exists app_users_password_admin_check;
alter table public.app_users drop constraint if exists app_users_password_required;

update public.app_users
set password_hash = extensions.crypt('acesso123', extensions.gen_salt('bf'))
where password_hash is null;

alter table public.app_users
  add constraint app_users_password_required check (password_hash is not null);

create or replace function public.app_login(p_username text, p_password text)
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
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Usuario nao encontrado';
  end if;

  if v_user.password_hash is null
     or extensions.crypt(p_password, v_user.password_hash) <> v_user.password_hash then
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

create or replace function public.app_sa_create_user(
  p_token uuid,
  p_username text,
  p_display_name text,
  p_email text,
  p_role text,
  p_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_username text;
  v_display_name text;
  v_email text;
  v_role public.user_role;
  v_password text;
  v_password_hash text;
  v_new_id uuid;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode criar usuarios';
  end if;

  v_username := nullif(trim(coalesce(p_username, '')), '');
  v_display_name := nullif(trim(coalesce(p_display_name, '')), '');
  v_email := nullif(trim(coalesce(p_email, '')), '');

  if v_username is null then
    raise exception 'Nome de usuario obrigatorio';
  end if;

  if v_display_name is null then
    raise exception 'Nome para exibicao obrigatorio';
  end if;

  if p_role not in ('user', 'admin') then
    raise exception 'Role invalido. Use user ou admin';
  end if;

  v_role := p_role::public.user_role;

  v_password := nullif(trim(coalesce(p_password, '')), '');
  if v_password is null then
    v_password := 'acesso123';
  end if;

  if length(v_password) < 6 then
    raise exception 'Senha deve ter pelo menos 6 caracteres';
  end if;

  v_password_hash := extensions.crypt(v_password, extensions.gen_salt('bf'));

  if exists (select 1 from public.app_users where username = v_username) then
    raise exception 'Nome de usuario ja cadastrado';
  end if;

  if v_email is not null
     and exists (select 1 from public.app_users where lower(email) = lower(v_email)) then
    raise exception 'E-mail ja cadastrado';
  end if;

  insert into public.app_users (
    username,
    display_name,
    email,
    role,
    password_hash,
    is_active
  )
  values (
    v_username,
    v_display_name,
    v_email,
    v_role,
    v_password_hash,
    true
  )
  returning id into v_new_id;

  return jsonb_build_object(
    'id', v_new_id,
    'username', v_username,
    'display_name', v_display_name,
    'email', v_email,
    'role', v_role,
    'is_active', true
  );
end;
$$;

create or replace function public.app_sa_reset_password(
  p_token uuid,
  p_user_id uuid,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_target public.app_users%rowtype;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode redefinir senha';
  end if;

  select * into v_target from public.app_users where id = p_user_id;
  if not found then
    raise exception 'Usuario nao encontrado';
  end if;

  if p_new_password is null or length(trim(p_new_password)) < 6 then
    raise exception 'Senha deve ter pelo menos 6 caracteres';
  end if;

  update public.app_users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  where id = p_user_id;

  delete from public.app_sessions where user_id = p_user_id;

  return jsonb_build_object('id', p_user_id, 'reset', true);
end;
$$;

grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_sa_create_user(uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.app_sa_reset_password(uuid, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
