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

  delete from public.app_extension_disciplines where id is not null;

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
    where id is not null
    returning 1
  )
  select count(*) into v_deleted from removed;

  return jsonb_build_object('deleted', v_deleted);
end;
$$;

notify pgrst, 'reload schema';
