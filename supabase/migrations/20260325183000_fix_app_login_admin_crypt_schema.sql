create extension if not exists pgcrypto with schema extensions;

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
    'avatar_url', v_user.avatar_url,
    'role', v_user.role
  );
end;
$$;

grant execute on function public.app_login_admin(text, text) to anon, authenticated;
