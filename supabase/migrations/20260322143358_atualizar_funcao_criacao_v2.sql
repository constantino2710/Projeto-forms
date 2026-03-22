CREATE OR REPLACE FUNCTION public.app_create_project_v2(
  p_token text, p_title text, p_type projeto_tipo, p_thematic_area text,
  p_course text, p_period_start date, p_period_end date, p_target_audience text,
  p_budget numeric, p_description text, p_codigo_disciplina text DEFAULT NULL,
  p_semestre_letivo text DEFAULT NULL
) 
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_project_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM auth.sessions WHERE id = p_token::uuid LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado ou token inválido';
  END IF;

  INSERT INTO public.app_projects (
    owner_app_user_id, title, tipo, thematic_area, course,
    period_start, period_end, target_audience, budget,
    description, codigo_disciplina, semestre_letivo, status
  )
  VALUES (
    v_user_id, trim(p_title), p_type, trim(p_thematic_area),
    NULLIF(trim(COALESCE(p_course, '')), ''), p_period_start, p_period_end,
    trim(p_target_audience), COALESCE(p_budget, 0), trim(p_description),
    trim(p_codigo_disciplina), trim(p_semestre_letivo), 'rascunho'
  )
  RETURNING id INTO v_project_id;

  RETURN json_build_object(
    'id', v_project_id,
    'title', p_title,
    'status', 'rascunho'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;