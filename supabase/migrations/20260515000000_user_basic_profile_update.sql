create or replace function public.app_update_my_basic_profile(
  p_token uuid,
  p_display_name text,
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
  v_avatar_url text;
begin
  v_user := public.app_session_user(p_token);
  v_display_name := nullif(trim(coalesce(p_display_name, '')), '');
  v_avatar_url := nullif(trim(coalesce(p_avatar_url, '')), '');

  if v_display_name is null then
    raise exception 'Nome nao pode ficar vazio';
  end if;

  if char_length(v_display_name) > 120 then
    raise exception 'Nome muito longo (max 120 caracteres)';
  end if;

  update public.app_users
  set
    display_name = v_display_name,
    avatar_url = v_avatar_url
  where id = v_user.id;

  return jsonb_build_object(
    'user_id', v_user.id,
    'username', v_user.username,
    'display_name', v_display_name,
    'avatar_url', v_avatar_url,
    'role', v_user.role
  );
end;
$$;

grant execute on function public.app_update_my_basic_profile(uuid, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
