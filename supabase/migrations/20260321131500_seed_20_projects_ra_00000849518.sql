do $$
declare
  v_owner_id uuid;
begin
  select id
    into v_owner_id
  from public.app_users
  where username = '00000849518'
  limit 1;

  if v_owner_id is null then
    raise exception 'Usuario com RA 00000849518 nao encontrado em public.app_users';
  end if;

  insert into public.app_projects (
    owner_app_user_id,
    title,
    thematic_area,
    course,
    period_start,
    period_end,
    target_audience,
    budget,
    status,
    created_at,
    updated_at,
    description,
    admin_message,
    admin_message_updated_at
  )
  select
    v_owner_id,
    p.title,
    p.thematic_area,
    p.course,
    p.period_start,
    p.period_end,
    p.target_audience,
    p.budget,
    p.status::public.project_status,
    p.created_at,
    p.updated_at,
    p.description,
    p.admin_message,
    case when p.admin_message is not null then p.updated_at else null end
  from (
    values
      ('Projeto Integrador de Extensao em Saude Comunitaria', 'Saude Coletiva', 'Enfermagem', date '2026-03-01', date '2026-06-30', 'Agentes comunitarios e estudantes', 2800.00, 'submetido', now() - interval '20 days', now() - interval '20 days', 'Acoes educativas de prevencao e monitoramento em bairros perifericos.', null),
      ('Laboratorio Itinerante de Robotica Educacional', 'Tecnologia e Educacao', 'Engenharia de Computacao', date '2026-04-01', date '2026-08-15', 'Alunos do ensino medio publico', 6200.00, 'submetido', now() - interval '19 days', now() - interval '19 days', 'Oficinas praticas com kits de robotica e programacao em blocos.', null),
      ('Mutirao de Orientacao Juridica Popular', 'Direitos Humanos', 'Direito', date '2026-05-10', date '2026-09-30', 'Familias em situacao de vulnerabilidade', 1900.00, 'submetido', now() - interval '18 days', now() - interval '18 days', 'Plantao de orientacao juridica e encaminhamentos para servicos publicos.', null),
      ('Programa de Reforco em Matematica Basica', 'Educacao Basica', 'Matematica', date '2026-03-15', date '2026-07-20', 'Estudantes do 9o ano', 1500.00, 'submetido', now() - interval '17 days', now() - interval '17 days', 'Aulas de reforco com metodologias ativas e monitoria estudantil.', null),
      ('Circuito de Empreendedorismo Feminino Local', 'Empreendedorismo', 'Administracao', date '2026-06-01', date '2026-10-31', 'Mulheres microempreendedoras', 3400.00, 'submetido', now() - interval '16 days', now() - interval '16 days', 'Capacitacao em gestao financeira, marketing e vendas digitais.', null),
      ('Oficina de Producao Audiovisual Comunitaria', 'Comunicacao Social', 'Publicidade e Propaganda', date '2026-04-20', date '2026-09-10', 'Coletivos culturais de bairro', 4100.00, 'submetido', now() - interval '15 days', now() - interval '15 days', 'Formacao em roteiro, captacao e edicao para narrativas locais.', null),
      ('Horta Urbana e Compostagem em Escolas', 'Sustentabilidade', 'Agronomia', date '2026-03-25', date '2026-08-05', 'Comunidade escolar', 2300.00, 'submetido', now() - interval '14 days', now() - interval '14 days', 'Implantacao de hortas e oficinas de compostagem com residuos organicos.', null),
      ('Clinica Escola de Orientacao Nutricional', 'Saude e Nutricao', 'Nutricao', date '2026-05-05', date '2026-11-30', 'Adultos com risco metabolico', 3600.00, 'submetido', now() - interval '13 days', now() - interval '13 days', 'Atendimentos supervisionados com plano alimentar e educacao nutricional.', null),
      ('Mapeamento de Trilhas de Turismo de Base Comunitaria', 'Turismo Sustentavel', 'Turismo', date '2026-07-01', date '2026-12-10', 'Guias locais e associacoes', 2800.00, 'em_avaliacao', now() - interval '12 days', now() - interval '11 days', 'Levantamento colaborativo de roteiros e materiais de divulgacao.', null),
      ('Capacitacao em Primeiros Socorros para Liderancas', 'Saude Preventiva', 'Educacao Fisica', date '2026-06-15', date '2026-09-15', 'Liderancas comunitarias', 1200.00, 'em_avaliacao', now() - interval '11 days', now() - interval '10 days', 'Treinamento pratico de atendimento inicial em acidentes comuns.', null),
      ('Alfabetizacao Digital para Pessoas Idosas', 'Inclusao Digital', 'Sistemas de Informacao', date '2026-08-01', date '2026-11-20', 'Pessoas idosas da comunidade', 2100.00, 'em_avaliacao', now() - interval '10 days', now() - interval '9 days', 'Curso introdutorio de smartphone, internet e seguranca digital.', null),
      ('Feira de Ciencias Aplicadas a Problemas Locais', 'Divulgacao Cientifica', 'Fisica', date '2026-09-01', date '2026-12-01', 'Escolas municipais', 2600.00, 'em_ajustes', now() - interval '9 days', now() - interval '8 days', 'Prototipos de baixo custo para desafios ambientais e urbanos.', 'Detalhar melhor os indicadores de impacto e o cronograma de execucao.'),
      ('Projeto de Leitura e Escrita Criativa em Biblioteca', 'Linguagens', 'Letras', date '2026-04-10', date '2026-08-30', 'Jovens de 12 a 17 anos', 1700.00, 'em_ajustes', now() - interval '8 days', now() - interval '7 days', 'Rodas de leitura, escrita criativa e sarau literario mensal.', 'Ajustar a metodologia de avaliacao e incluir plano de divulgacao.'),
      ('Observatorio de Indicadores Sociais do Territorio', 'Politicas Publicas', 'Servico Social', date '2026-02-20', date '2026-07-25', 'Conselhos locais', 3000.00, 'aprovado', now() - interval '7 days', now() - interval '6 days', 'Coleta e analise de dados socioeconomicos para apoio a decisoes locais.', 'Projeto aprovado. Parabens pelo escopo e viabilidade.'),
      ('Programa de Mentoria para Jovens Talentos STEM', 'Educacao e Inovacao', 'Quimica', date '2026-03-05', date '2026-10-15', 'Estudantes de escolas publicas', 3900.00, 'aprovado', now() - interval '6 days', now() - interval '5 days', 'Mentorias mensais e desafios praticos de ciencia e tecnologia.', 'Aprovado com recomendacao de registrar evidencias mensais.'),
      ('Capacitacao em Gestao de Residuos em Pequenos Comercios', 'Gestao Ambiental', 'Engenharia Ambiental', date '2026-05-12', date '2026-09-18', 'Comerciantes locais', 2200.00, 'reprovado', now() - interval '5 days', now() - interval '4 days', 'Diagnostico e treinamento para descarte adequado e logistica reversa.', 'Revisar viabilidade financeira e parcerias operacionais antes de novo envio.'),
      ('Podcast Universitario de Extensao e Cidadania', 'Midias Digitais', 'Jornalismo', date '2026-08-05', date '2026-12-05', 'Comunidade academica e externa', 1400.00, 'rascunho', now() - interval '4 days', now() - interval '4 days', 'Producoes quinzenais com entrevistas sobre impacto extensionista.', null),
      ('Acompanhamento Pedagogico para Evasao Escolar', 'Educacao Inclusiva', 'Pedagogia', date '2026-06-02', date '2026-11-28', 'Alunos em risco de evasao', 3100.00, 'rascunho', now() - interval '3 days', now() - interval '3 days', 'Plano de tutoria, visitas e monitoramento em conjunto com escolas.', null),
      ('Atelie de Economia Criativa e Artesanato', 'Economia Criativa', 'Design', date '2026-07-10', date '2026-12-20', 'Artesaos e coletivos locais', 2700.00, 'rascunho', now() - interval '2 days', now() - interval '2 days', 'Oficinas de design de produto, precificacao e comercializacao.', null),
      ('Plataforma Colaborativa de Oportunidades Comunitarias', 'Tecnologia Social', 'Ciencia da Computacao', date '2026-09-10', date '2027-02-20', 'ONGs e liderancas locais', 5200.00, 'rascunho', now() - interval '1 day', now() - interval '1 day', 'Portal para mapear vagas, cursos e servicos comunitarios em tempo real.', null)
  ) as p(
    title,
    thematic_area,
    course,
    period_start,
    period_end,
    target_audience,
    budget,
    status,
    created_at,
    updated_at,
    description,
    admin_message
  )
  where not exists (
    select 1
    from public.app_projects ap
    where ap.owner_app_user_id = v_owner_id
      and ap.title = p.title
  );
end;
$$;
