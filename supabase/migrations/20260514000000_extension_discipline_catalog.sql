create table if not exists public.app_extension_disciplines (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  disciplina text not null,
  curso text not null,
  docente text not null,
  periodo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_extension_disciplines_codigo_key unique (codigo)
);

create index if not exists app_extension_disciplines_disciplina_idx
  on public.app_extension_disciplines (lower(disciplina));

create index if not exists app_extension_disciplines_curso_idx
  on public.app_extension_disciplines (lower(curso));

create or replace function public.app_list_disciplines(p_token uuid)
returns table (
  id uuid,
  codigo text,
  disciplina text,
  curso text,
  docente text,
  periodo text
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
  select d.id, d.codigo, d.disciplina, d.curso, d.docente, d.periodo
  from public.app_extension_disciplines d
  order by d.disciplina asc, d.codigo asc;
end;
$$;

create or replace function public.app_sa_list_disciplines(
  p_token uuid,
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  codigo text,
  disciplina text,
  curso text,
  docente text,
  periodo text,
  created_at timestamptz,
  updated_at timestamptz,
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
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode listar o catalogo de disciplinas';
  end if;

  return query
  with filtered as (
    select d.*
    from public.app_extension_disciplines d
    where v_search is null
      or d.codigo ilike ('%' || v_search || '%')
      or d.disciplina ilike ('%' || v_search || '%')
      or d.curso ilike ('%' || v_search || '%')
      or d.docente ilike ('%' || v_search || '%')
      or d.periodo ilike ('%' || v_search || '%')
  )
  select
    f.id,
    f.codigo,
    f.disciplina,
    f.curso,
    f.docente,
    f.periodo,
    f.created_at,
    f.updated_at,
    count(*) over() as total_count
  from filtered f
  order by f.disciplina asc, f.codigo asc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function public.app_sa_replace_disciplines(
  p_token uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_row jsonb;
  v_codigo text;
  v_disciplina text;
  v_curso text;
  v_docente text;
  v_periodo text;
  v_inserted bigint := 0;
  v_seen_codes text[] := '{}';
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode atualizar o catalogo';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Formato invalido: rows deve ser um array';
  end if;

  delete from public.app_extension_disciplines;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_codigo := nullif(trim(coalesce(v_row ->> 'codigo', '')), '');
    v_disciplina := nullif(trim(coalesce(v_row ->> 'disciplina', '')), '');
    v_curso := nullif(trim(coalesce(v_row ->> 'curso', '')), '');
    v_docente := nullif(trim(coalesce(v_row ->> 'docente', '')), '');
    v_periodo := nullif(trim(coalesce(v_row ->> 'periodo', '')), '');

    if v_codigo is null or v_disciplina is null or v_curso is null or v_docente is null or v_periodo is null then
      continue;
    end if;

    if v_codigo = any(v_seen_codes) then
      continue;
    end if;
    v_seen_codes := array_append(v_seen_codes, v_codigo);

    insert into public.app_extension_disciplines (codigo, disciplina, curso, docente, periodo)
    values (v_codigo, v_disciplina, v_curso, v_docente, v_periodo);

    v_inserted := v_inserted + 1;
  end loop;

  return jsonb_build_object(
    'inserted', v_inserted,
    'mode', 'replace'
  );
end;
$$;

create or replace function public.app_sa_upsert_disciplines(
  p_token uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_row jsonb;
  v_codigo text;
  v_disciplina text;
  v_curso text;
  v_docente text;
  v_periodo text;
  v_affected bigint := 0;
  v_existing_id uuid;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode atualizar o catalogo';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Formato invalido: rows deve ser um array';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_codigo := nullif(trim(coalesce(v_row ->> 'codigo', '')), '');
    v_disciplina := nullif(trim(coalesce(v_row ->> 'disciplina', '')), '');
    v_curso := nullif(trim(coalesce(v_row ->> 'curso', '')), '');
    v_docente := nullif(trim(coalesce(v_row ->> 'docente', '')), '');
    v_periodo := nullif(trim(coalesce(v_row ->> 'periodo', '')), '');

    if v_codigo is null or v_disciplina is null or v_curso is null or v_docente is null or v_periodo is null then
      continue;
    end if;

    select id into v_existing_id
    from public.app_extension_disciplines
    where codigo = v_codigo
    limit 1;

    if v_existing_id is null then
      insert into public.app_extension_disciplines (codigo, disciplina, curso, docente, periodo)
      values (v_codigo, v_disciplina, v_curso, v_docente, v_periodo);
    else
      update public.app_extension_disciplines
      set disciplina = v_disciplina,
          curso = v_curso,
          docente = v_docente,
          periodo = v_periodo,
          updated_at = now()
      where id = v_existing_id;
    end if;

    v_affected := v_affected + 1;
  end loop;

  return jsonb_build_object(
    'affected', v_affected,
    'mode', 'upsert'
  );
end;
$$;

create or replace function public.app_sa_clear_disciplines(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_deleted bigint;
begin
  v_user := public.app_session_user(p_token);

  if v_user.role <> 'superadmin' then
    raise exception 'Apenas superadmin pode limpar o catalogo';
  end if;

  with removed as (
    delete from public.app_extension_disciplines
    returning 1
  )
  select count(*) into v_deleted from removed;

  return jsonb_build_object('deleted', v_deleted);
end;
$$;

grant execute on function public.app_list_disciplines(uuid) to anon, authenticated;
grant execute on function public.app_sa_list_disciplines(uuid, text, integer, integer) to anon, authenticated;
grant execute on function public.app_sa_replace_disciplines(uuid, jsonb) to anon, authenticated;
grant execute on function public.app_sa_upsert_disciplines(uuid, jsonb) to anon, authenticated;
grant execute on function public.app_sa_clear_disciplines(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
