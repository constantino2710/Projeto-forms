alter table public.app_users drop constraint if exists app_users_password_admin_check;
alter table public.app_users
  add constraint app_users_password_admin_check check (
    (role in ('admin', 'superadmin') and password_hash is not null)
    or (role = 'user' and password_hash is null)
  );

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
    and role in ('admin', 'superadmin')
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Admin nao encontrado';
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

drop function if exists public.app_list_admin_projects(uuid, integer, integer, text, text);
drop function if exists public.app_list_admin_projects(uuid);

create or replace function public.app_list_admin_projects(
  p_token uuid,
  p_limit integer default 6,
  p_offset integer default 0,
  p_course text default null,
  p_school text default null
)
returns table (
  id uuid,
  title text,
  tipo text,
  course text,
  school text,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  created_at timestamptz,
  professor text,
  professor_avatar_url text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 6), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin pode listar projetos para avaliacao';
  end if;

  return query
  with filtered as (
    select
      p.id,
      p.title,
      p.tipo::text as tipo,
      p.course,
      p.school,
      p.period_start,
      p.period_end,
      p.budget,
      p.status,
      p.created_at,
      u.display_name as professor,
      u.avatar_url as professor_avatar_url
    from public.app_projects p
    join public.app_users u on u.id = p.owner_app_user_id
    where p.status in ('submetido', 'em_avaliacao')
      and p.deleted_at is null
      and (v_course is null or p.course = v_course)
      and (v_school is null or p.school = v_school)
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.created_at,
    f.professor,
    f.professor_avatar_url,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

drop function if exists public.app_list_admin_project_history(uuid, integer, integer, text, text);
drop function if exists public.app_list_admin_project_history(uuid);

create or replace function public.app_list_admin_project_history(
  p_token uuid,
  p_limit integer default 6,
  p_offset integer default 0,
  p_course text default null,
  p_school text default null
)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  course text,
  school text,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  reviewed_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 6), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_course text := nullif(trim(coalesce(p_course, '')), '');
  v_school text := nullif(trim(coalesce(p_school, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin pode acessar historico';
  end if;

  return query
  with filtered as (
    select
      p.id,
      p.title,
      p.tipo,
      p.course,
      p.school,
      p.period_start,
      p.period_end,
      p.budget,
      p.status,
      coalesce(p.reviewed_at, p.updated_at) as reviewed_at
    from public.app_projects p
    where p.status in ('aprovado', 'reprovado', 'em_ajustes')
      and (
        v_user.role = 'superadmin'
        or p.reviewed_by_app_user_id = v_user.id
        or p.reviewed_by_app_user_id is null
      )
      and p.deleted_at is null
      and (v_course is null or p.course = v_course)
      and (v_school is null or p.school = v_school)
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.reviewed_at,
    count(*) over() as total_count
  from filtered f
  order by f.reviewed_at desc
  limit v_limit
  offset v_offset;
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

  if v_user.role not in ('admin', 'superadmin') then
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
    p.tipo,
    u.display_name as professor,
    u.avatar_url as professor_avatar_url,
    p.thematic_area as discipline,
    coalesce(p.course, '-') as course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.description,
    public.app_extension_form_json(p.id) as extension_form,
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
    'tipo', v_project.tipo,
    'professor', v_project.professor,
    'professor_avatar_url', v_project.professor_avatar_url,
    'discipline', v_project.discipline,
    'course', v_project.course,
    'period_start', v_project.period_start,
    'period_end', v_project.period_end,
    'target_audience', v_project.target_audience,
    'budget', v_project.budget,
    'description', v_project.description,
    'extension_form', v_project.extension_form,
    'status', v_project.status,
    'created_at', v_project.created_at,
    'updated_at', v_project.updated_at
  );
end;
$$;

create or replace function public.app_admin_decide_project(
  p_token uuid,
  p_project_id uuid,
  p_decision public.project_status,
  p_admin_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_project public.app_projects%rowtype;
  v_clean_message text;
  v_owner_email text;
  v_owner_name text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role not in ('admin', 'superadmin') then
    raise exception 'Apenas admin pode decidir projeto';
  end if;

  if p_decision not in ('aprovado', 'reprovado', 'em_ajustes') then
    raise exception 'Decisao invalida. Use aprovado, reprovado ou em_ajustes';
  end if;

  v_clean_message := nullif(trim(coalesce(p_admin_message, '')), '');

  update public.app_projects
  set
    status = p_decision,
    updated_at = now(),
    reviewed_by_app_user_id = v_user.id,
    reviewed_at = now(),
    admin_message = v_clean_message,
    admin_message_updated_at = case
      when v_clean_message is not null then now()
      else null
    end
  where id = p_project_id
    and status in ('submetido', 'em_avaliacao')
  returning * into v_project;

  if not found then
    raise exception 'Projeto nao encontrado ou ja finalizado';
  end if;

  select
    u.email,
    u.display_name
  into
    v_owner_email,
    v_owner_name
  from public.app_users u
  where u.id = v_project.owner_app_user_id
  limit 1;

  if v_owner_email is null then
    raise exception 'Professor sem e-mail cadastrado para notificacao';
  end if;

  return jsonb_build_object(
    'id', v_project.id,
    'status', v_project.status,
    'updated_at', v_project.updated_at,
    'project_title', v_project.title,
    'professor_name', v_owner_name,
    'recipient_email', v_owner_email,
    'admin_message', v_clean_message
  );
end;
$$;

create or replace function public.app_sa_list_users(
  p_token uuid,
  p_role_filter text default null,
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  username text,
  display_name text,
  email text,
  role public.user_role,
  is_active boolean,
  avatar_url text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 20), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_role text := nullif(trim(coalesce(p_role_filter, '')), '');
  v_search text := nullif(trim(coalesce(p_search, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode listar usuarios';
  end if;

  if v_role is not null and v_role not in ('user', 'admin', 'superadmin') then
    raise exception 'Filtro de role invalido';
  end if;

  return query
  with filtered as (
    select
      u.id,
      u.username,
      u.display_name,
      u.email,
      u.role,
      u.is_active,
      u.avatar_url,
      u.created_at
    from public.app_users u
    where (v_role is null or u.role::text = v_role)
      and (
        v_search is null
        or u.username ilike ('%' || v_search || '%')
        or u.display_name ilike ('%' || v_search || '%')
        or coalesce(u.email, '') ilike ('%' || v_search || '%')
      )
  )
  select
    f.id,
    f.username,
    f.display_name,
    f.email,
    f.role,
    f.is_active,
    f.avatar_url,
    f.created_at,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit v_limit
  offset v_offset;
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

  if v_role = 'admin' then
    if p_password is null or length(trim(p_password)) < 6 then
      raise exception 'Senha do admin deve ter pelo menos 6 caracteres';
    end if;
    v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));
  else
    v_password_hash := null;
  end if;

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

create or replace function public.app_sa_update_user(
  p_token uuid,
  p_user_id uuid,
  p_display_name text,
  p_email text,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_target public.app_users%rowtype;
  v_display_name text;
  v_email text;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode editar usuarios';
  end if;

  if p_user_id = v_user.id then
    raise exception 'Use outro fluxo para editar a propria conta';
  end if;

  select * into v_target from public.app_users where id = p_user_id;
  if not found then
    raise exception 'Usuario nao encontrado';
  end if;

  v_display_name := nullif(trim(coalesce(p_display_name, '')), '');
  v_email := nullif(trim(coalesce(p_email, '')), '');

  if v_display_name is null then
    raise exception 'Nome para exibicao obrigatorio';
  end if;

  if v_email is not null
     and exists (
       select 1 from public.app_users
       where lower(email) = lower(v_email) and id <> p_user_id
     ) then
    raise exception 'E-mail ja cadastrado para outro usuario';
  end if;

  update public.app_users
  set
    display_name = v_display_name,
    email = v_email,
    is_active = coalesce(p_is_active, is_active)
  where id = p_user_id
  returning * into v_target;

  return jsonb_build_object(
    'id', v_target.id,
    'username', v_target.username,
    'display_name', v_target.display_name,
    'email', v_target.email,
    'role', v_target.role,
    'is_active', v_target.is_active
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

  if v_target.role = 'user' then
    raise exception 'Professor nao possui senha';
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

create or replace function public.app_sa_list_all_history(
  p_token uuid,
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default null,
  p_status text default null
)
returns table (
  id uuid,
  title text,
  tipo public.projeto_tipo,
  course text,
  school text,
  period_start date,
  period_end date,
  budget numeric,
  status public.project_status,
  professor text,
  reviewer text,
  reviewed_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_limit integer := greatest(coalesce(p_limit, 20), 1);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_status text := nullif(trim(coalesce(p_status, '')), '');
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode acessar historico geral';
  end if;

  return query
  with filtered as (
    select
      p.id,
      p.title,
      p.tipo,
      p.course,
      p.school,
      p.period_start,
      p.period_end,
      p.budget,
      p.status,
      uo.display_name as professor,
      ur.display_name as reviewer,
      coalesce(p.reviewed_at, p.updated_at) as reviewed_at,
      p.created_at
    from public.app_projects p
    join public.app_users uo on uo.id = p.owner_app_user_id
    left join public.app_users ur on ur.id = p.reviewed_by_app_user_id
    where p.deleted_at is null
      and (
        v_status is null
        or p.status::text = v_status
      )
      and (
        v_search is null
        or p.title ilike ('%' || v_search || '%')
        or uo.display_name ilike ('%' || v_search || '%')
        or coalesce(p.course, '') ilike ('%' || v_search || '%')
      )
  )
  select
    f.id,
    f.title,
    f.tipo,
    f.course,
    f.school,
    f.period_start,
    f.period_end,
    f.budget,
    f.status,
    f.professor,
    f.reviewer,
    f.reviewed_at,
    f.created_at,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

insert into public.app_users (username, display_name, email, role, password_hash, is_active)
values (
  'superadmin',
  'Super Administrador',
  null,
  'superadmin',
  extensions.crypt('SuperAdmin@123', extensions.gen_salt('bf')),
  true
)
on conflict (username) do update
set
  display_name = excluded.display_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  is_active = true;

grant execute on function public.app_login_admin(text, text) to anon, authenticated;
grant execute on function public.app_list_admin_projects(uuid, integer, integer, text, text) to anon, authenticated;
grant execute on function public.app_list_admin_project_history(uuid, integer, integer, text, text) to anon, authenticated;
grant execute on function public.app_admin_get_project_detail_v2(uuid, text) to anon, authenticated;
grant execute on function public.app_admin_decide_project(uuid, uuid, public.project_status, text) to anon, authenticated;
grant execute on function public.app_sa_list_users(uuid, text, text, integer, integer) to anon, authenticated;
grant execute on function public.app_sa_create_user(uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.app_sa_update_user(uuid, uuid, text, text, boolean) to anon, authenticated;
grant execute on function public.app_sa_reset_password(uuid, uuid, text) to anon, authenticated;
grant execute on function public.app_sa_list_all_history(uuid, integer, integer, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
