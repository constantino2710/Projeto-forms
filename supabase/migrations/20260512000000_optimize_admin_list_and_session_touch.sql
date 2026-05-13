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
    s.last_seen_at,
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

  if v_session.last_seen_at is null
     or v_session.last_seen_at < now() - interval '5 minutes' then
    update public.app_sessions
    set last_seen_at = now()
    where token = p_token;
  end if;

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

grant execute on function public.app_validate_session(uuid) to anon, authenticated;

create index if not exists idx_app_projects_admin_queue
  on public.app_projects (status, created_at desc)
  where deleted_at is null;

create index if not exists idx_app_sessions_token_expires
  on public.app_sessions (token, expires_at);

analyze public.app_projects;
analyze public.app_sessions;

notify pgrst, 'reload schema';
