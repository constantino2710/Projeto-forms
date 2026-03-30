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
  where token = p_token
    and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');

  return v_user;
end;
$$;

grant execute on function public.app_session_user(uuid) to anon, authenticated;