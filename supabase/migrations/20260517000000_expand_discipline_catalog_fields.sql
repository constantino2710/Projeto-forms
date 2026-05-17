alter table public.app_extension_disciplines
  add column if not exists carga_horaria text,
  add column if not exists codigo_disciplina text,
  add column if not exists codigo_turma text,
  add column if not exists disciplina_gerencial boolean not null default false,
  add column if not exists cursos_gerenciados text;

drop function if exists public.app_list_disciplines(uuid);
drop function if exists public.app_sa_list_disciplines(uuid, text, integer, integer);

update public.app_extension_disciplines
set
  carga_horaria = coalesce(nullif(trim(coalesce(carga_horaria, '')), ''), '60'),
  codigo_disciplina = coalesce(nullif(trim(coalesce(codigo_disciplina, '')), ''), codigo),
  codigo_turma = coalesce(nullif(trim(coalesce(codigo_turma, '')), ''), 'T01')
where
  carga_horaria is null
  or codigo_disciplina is null
  or codigo_turma is null;

alter table public.app_extension_disciplines
  alter column carga_horaria set not null,
  alter column codigo_disciplina set not null,
  alter column codigo_turma set not null;

create or replace function public.app_list_disciplines(p_token uuid)
returns table (
  id uuid,
  codigo text,
  disciplina text,
  curso text,
  docente text,
  periodo text,
  carga_horaria text,
  codigo_disciplina text,
  codigo_turma text,
  disciplina_gerencial boolean,
  cursos_gerenciados text
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
  select
    d.id,
    d.codigo,
    d.disciplina,
    d.curso,
    d.docente,
    d.periodo,
    d.carga_horaria,
    d.codigo_disciplina,
    d.codigo_turma,
    d.disciplina_gerencial,
    d.cursos_gerenciados
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
  carga_horaria text,
  codigo_disciplina text,
  codigo_turma text,
  disciplina_gerencial boolean,
  cursos_gerenciados text,
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
      or d.carga_horaria ilike ('%' || v_search || '%')
      or d.codigo_disciplina ilike ('%' || v_search || '%')
      or d.codigo_turma ilike ('%' || v_search || '%')
      or coalesce(d.cursos_gerenciados, '') ilike ('%' || v_search || '%')
  )
  select
    f.id,
    f.codigo,
    f.disciplina,
    f.curso,
    f.docente,
    f.periodo,
    f.carga_horaria,
    f.codigo_disciplina,
    f.codigo_turma,
    f.disciplina_gerencial,
    f.cursos_gerenciados,
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
  v_carga_horaria text;
  v_codigo_disciplina text;
  v_codigo_turma text;
  v_disciplina_gerencial boolean;
  v_cursos_gerenciados text;
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

  delete from public.app_extension_disciplines where id is not null;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_codigo := nullif(trim(coalesce(v_row ->> 'codigo', '')), '');
    v_disciplina := nullif(trim(coalesce(v_row ->> 'disciplina', '')), '');
    v_curso := nullif(trim(coalesce(v_row ->> 'curso', '')), '');
    v_docente := nullif(trim(coalesce(v_row ->> 'docente', '')), '');
    v_periodo := nullif(trim(coalesce(v_row ->> 'periodo', '')), '');
    v_carga_horaria := nullif(trim(coalesce(v_row ->> 'carga_horaria', '')), '');
    v_codigo_disciplina := nullif(trim(coalesce(v_row ->> 'codigo_disciplina', '')), '');
    v_codigo_turma := nullif(trim(coalesce(v_row ->> 'codigo_turma', '')), '');
    v_disciplina_gerencial := case
      when lower(trim(coalesce(v_row ->> 'disciplina_gerencial', ''))) in ('sim', 'true', '1') then true
      when lower(trim(coalesce(v_row ->> 'disciplina_gerencial', ''))) in ('nao', 'não', 'false', '0') then false
      else null
    end;
    v_cursos_gerenciados := nullif(trim(coalesce(v_row ->> 'cursos_gerenciados', '')), '');

    if v_codigo is null
       or v_disciplina is null
       or v_curso is null
       or v_docente is null
       or v_periodo is null
       or v_carga_horaria is null
       or v_codigo_disciplina is null
       or v_codigo_turma is null
       or v_disciplina_gerencial is null then
      continue;
    end if;

    if v_codigo = any(v_seen_codes) then
      continue;
    end if;
    v_seen_codes := array_append(v_seen_codes, v_codigo);

    insert into public.app_extension_disciplines (
      codigo,
      disciplina,
      curso,
      docente,
      periodo,
      carga_horaria,
      codigo_disciplina,
      codigo_turma,
      disciplina_gerencial,
      cursos_gerenciados
    )
    values (
      v_codigo,
      v_disciplina,
      v_curso,
      v_docente,
      v_periodo,
      v_carga_horaria,
      v_codigo_disciplina,
      v_codigo_turma,
      v_disciplina_gerencial,
      v_cursos_gerenciados
    );

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
  v_carga_horaria text;
  v_codigo_disciplina text;
  v_codigo_turma text;
  v_disciplina_gerencial boolean;
  v_cursos_gerenciados text;
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
    v_carga_horaria := nullif(trim(coalesce(v_row ->> 'carga_horaria', '')), '');
    v_codigo_disciplina := nullif(trim(coalesce(v_row ->> 'codigo_disciplina', '')), '');
    v_codigo_turma := nullif(trim(coalesce(v_row ->> 'codigo_turma', '')), '');
    v_disciplina_gerencial := case
      when lower(trim(coalesce(v_row ->> 'disciplina_gerencial', ''))) in ('sim', 'true', '1') then true
      when lower(trim(coalesce(v_row ->> 'disciplina_gerencial', ''))) in ('nao', 'não', 'false', '0') then false
      else null
    end;
    v_cursos_gerenciados := nullif(trim(coalesce(v_row ->> 'cursos_gerenciados', '')), '');

    if v_codigo is null
       or v_disciplina is null
       or v_curso is null
       or v_docente is null
       or v_periodo is null
       or v_carga_horaria is null
       or v_codigo_disciplina is null
       or v_codigo_turma is null
       or v_disciplina_gerencial is null then
      continue;
    end if;

    select id into v_existing_id
    from public.app_extension_disciplines
    where codigo = v_codigo
    limit 1;

    if v_existing_id is null then
      insert into public.app_extension_disciplines (
        codigo,
        disciplina,
        curso,
        docente,
        periodo,
        carga_horaria,
        codigo_disciplina,
        codigo_turma,
        disciplina_gerencial,
        cursos_gerenciados
      )
      values (
        v_codigo,
        v_disciplina,
        v_curso,
        v_docente,
        v_periodo,
        v_carga_horaria,
        v_codigo_disciplina,
        v_codigo_turma,
        v_disciplina_gerencial,
        v_cursos_gerenciados
      );
    else
      update public.app_extension_disciplines
      set disciplina = v_disciplina,
          curso = v_curso,
          docente = v_docente,
          periodo = v_periodo,
          carga_horaria = v_carga_horaria,
          codigo_disciplina = v_codigo_disciplina,
          codigo_turma = v_codigo_turma,
          disciplina_gerencial = v_disciplina_gerencial,
          cursos_gerenciados = v_cursos_gerenciados,
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

notify pgrst, 'reload schema';
