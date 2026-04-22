export const UNICAP_PROGRAM_OPTIONS = [
  'UNICAP - TIC - Tecnologia, Inovacao e Comunicacao',
  'UNICAP - DHN - Direitos humanos e da natureza',
  'UNICAP - DISA - Desenvolvimento Integral Socioambiental',
  'UNICAP - VIDA - Saude, Qualidade de vida e Bem Viver',
  'UNICAP + Educacao inclusiva e transformadora',
] as const

export const LINKED_COURSE_OPTIONS = [
  'Administracao',
  'Arquitetura e Urbanismo',
  'Ciencia da Computacao',
  'Ciencia da Religiao - EaD',
  'Ciencia Politica',
  'Ciencias Biologicas - Bacharelado',
  'Ciencias Biologicas - Licenciatura',
  'Ciencias Contabeis',
  'Ciencias Economicas',
  'Direito',
  'Enfermagem',
  'Engenharia Ambiental',
  'Engenharia Civil',
  'Engenharia da Complexidade',
  'Engenharia de Producao',
  'Engenharia Quimica',
  'Farmacia',
  'Filosofia - Bacharelado',
  'Filosofia - Licenciatura',
  'Filosofia - Licenciatura - EaD',
  'Fisica - Licenciatura',
  'Fisioterapia',
  'Fonoaudiologia',
  'Fotografia',
  'Gestao de RH - EaD',
  'Historia - Licenciatura',
  'Historia - Licenciatura - EaD',
  'Jogos Digitais',
  'Jornalismo',
  'Letras - Licenciatura em Portugues',
  'Letras - Licenciatura Portugues e Espanhol',
  'Letras - Licenciatura Portugues e Ingles',
  'Letras - Portugues - EaD',
  'Logistica - EaD',
  'Matematica - Licenciatura',
  'Medicina',
  'Nutricao',
  'Pedagogia - Licenciatura',
  'Pedagogia - Licenciatura - EaD',
  'Psicologia - Bacharelado',
  'Publicidade e Propaganda',
  'Quimica - Licenciatura',
  'Servico Social',
  'Sistemas para Internet Tecnologico',
  'Teologia - Bacharelado',
  'Programa de Ciencias da Linguagem (PPGCL)',
  'Programa de Ciencias da Religiao (PPGCR)',
  'Programa de Desenvolvimento de Processos Ambientais (PPGDPA)',
  'Programa de Direito (PPGD)',
  'Programa de Direito e Inovacao (PPGDI)',
  'Programa de Filosofia (PPGFIL)',
  'Programa de Historia (PPGH)',
  'Programa de Industrias Criativas (PPGIC)',
  'Programa de Psicologia Clinica (PPGPSI)',
  'Programa de Teologia (PPGTEO)',
] as const

export const WEEKLY_HOURS_OPTIONS = Array.from({ length: 20 }, (_, index) => String(index + 1))

export const COORDINATOR_PARTICIPATION_OPTIONS = [
  'Voluntario - Nao recebera nenhuma remuneracao, tendo que assinar o Termo de Voluntariado.',
  'Remunerado - Recebera remuneracao extra (HPE) mediante autorizacao (CI).',
  'Previsto - Remuneracao ja esta inclusa dentro da carga-horaria do docente e nao incidira em pagamento extra.',
] as const

export const TRANSVERSAL_COMPETENCY_OPTIONS = [
  'Comunicacao',
  'Criatividade e Inovacao',
  'Iniciativa e Resolucao de Problemas',
  'Lideranca',
  'Planejamento e Organizacao',
  'Senso Critico',
  'Trabalho em equipe',
] as const

export const SDG_OPTIONS = [
  'ODS 1 - Erradicacao da Pobreza',
  'ODS 2 - Fome Zero e Agricultura Sustentavel',
  'ODS 3 - Saude e Bem-Estar',
  'ODS 4 - Educacao de Qualidade',
  'ODS 5 - Igualdade de Genero',
  'ODS 6 - Agua Potavel e Saneamento',
  'ODS 7 - Energia Limpa e Acessivel',
  'ODS 8 - Trabalho Decente e Crescimento Economico',
  'ODS 9 - Industria, Inovacao e Infraestrutura',
  'ODS 10 - Reducao das Desigualdades',
  'ODS 11 - Cidades e Comunidades Sustentaveis',
  'ODS 12 - Consumo e Producao Responsaveis',
  'ODS 13 - Acao Contra a Mudanca Global do Clima',
  'ODS 14 - Vida na Agua',
  'ODS 15 - Vida Terrestre',
  'ODS 16 - Paz, Justica e Instituicoes Eficazes',
  'ODS 17 - Parcerias e Meios de Implementacao',
] as const

export const ACKNOWLEDGEMENT_OPTIONS = [
  {
    id: 'approval_required',
    label:
      'Esse Plano de Trabalho somente tera validade apos a aprovacao da Assessoria de Extensao e da coordenacao do curso ao qual esta vinculado.',
  },
  {
    id: 'final_report_required',
    label:
      'Ao final da experiencia de extensao, devo enviar o Relatorio Final de Extensao conforme modelo vigente.',
  },
  {
    id: 'corrections_may_be_requested',
    label:
      'A Assessoria de Extensao ou a Coordenacao de curso podera solicitar alteracao ou correcao de algum item do plano.',
  },
  {
    id: 'volunteer_terms_required',
    label:
      'Apos a aprovacao, sou responsavel por orientar os estudantes e demais participantes a assinarem o Termo de Voluntariado, inclusive eu mesmo quando for voluntario no projeto.',
  },
] as const

export type ExtensionPlanData = {
  title: string
  totalWorkload: string
  unicapProgram: string
  periodStart: string
  periodEnd: string
  linkedCourse: string
  courseName: string
  coordinationEmail: string
  coordinatorName: string
  coordinatorEmail: string
  coordinatorCpf: string
  coordinatorPhone: string
  coordinatorWeeklyHours: string
  coordinatorParticipation: string
  otherVolunteerTeachers: string
  studentWeeklyHours: string
  studentParticipants: string
  learningObjectives: string[]
  transversalCompetencies: string[]
  serviceOffered: string
  activities: string[]
  executionLocation: string
  targetAudience: string
  methodologicalProcedures: string
  problemStatement: string
  sustainableDevelopmentGoal: string
  goals: string[]
  disseminationStrategies: string
  projectSummary: string
  reflectionStrategies: string
  evaluationStrategies: string
  partnerFeedback: string
  additionalInformation: string
  acknowledgements: string[]
}

export const createEmptyExtensionPlan = (): ExtensionPlanData => ({
  title: '',
  totalWorkload: '',
  unicapProgram: '',
  periodStart: '',
  periodEnd: '',
  linkedCourse: '',
  courseName: '',
  coordinationEmail: '',
  coordinatorName: '',
  coordinatorEmail: '',
  coordinatorCpf: '',
  coordinatorPhone: '',
  coordinatorWeeklyHours: '',
  coordinatorParticipation: '',
  otherVolunteerTeachers: '',
  studentWeeklyHours: '',
  studentParticipants: '',
  learningObjectives: ['', '', ''],
  transversalCompetencies: ['', '', ''],
  serviceOffered: '',
  activities: ['', '', ''],
  executionLocation: '',
  targetAudience: '',
  methodologicalProcedures: '',
  problemStatement: '',
  sustainableDevelopmentGoal: '',
  goals: ['', '', ''],
  disseminationStrategies: '',
  projectSummary: '',
  reflectionStrategies: '',
  evaluationStrategies: '',
  partnerFeedback: '',
  additionalInformation: '',
  acknowledgements: [],
})

const asString = (value: unknown) => (typeof value === 'string' ? value : '')

const asStringArray = (value: unknown, fallbackLength = 0) => {
  const values = Array.isArray(value) ? value.map((item) => asString(item)) : []
  if (fallbackLength > 0) {
    return Array.from({ length: fallbackLength }, (_, index) => values[index] ?? '')
  }
  return values
}

export const normalizeExtensionPlan = (value: unknown): ExtensionPlanData => {
  const data = (value as Partial<ExtensionPlanData> | null) ?? {}

  return {
    title: asString(data.title),
    totalWorkload: asString(data.totalWorkload),
    unicapProgram: asString(data.unicapProgram),
    periodStart: asString(data.periodStart),
    periodEnd: asString(data.periodEnd),
    linkedCourse: asString(data.linkedCourse),
    courseName: asString(data.courseName),
    coordinationEmail: asString(data.coordinationEmail),
    coordinatorName: asString(data.coordinatorName),
    coordinatorEmail: asString(data.coordinatorEmail),
    coordinatorCpf: asString(data.coordinatorCpf),
    coordinatorPhone: asString(data.coordinatorPhone),
    coordinatorWeeklyHours: asString(data.coordinatorWeeklyHours),
    coordinatorParticipation: asString(data.coordinatorParticipation),
    otherVolunteerTeachers: asString(data.otherVolunteerTeachers),
    studentWeeklyHours: asString(data.studentWeeklyHours),
    studentParticipants: asString(data.studentParticipants),
    learningObjectives: asStringArray(data.learningObjectives, 3),
    transversalCompetencies: asStringArray(data.transversalCompetencies, 3),
    serviceOffered: asString(data.serviceOffered),
    activities: asStringArray(data.activities, 3),
    executionLocation: asString(data.executionLocation),
    targetAudience: asString(data.targetAudience),
    methodologicalProcedures: asString(data.methodologicalProcedures),
    problemStatement: asString(data.problemStatement),
    sustainableDevelopmentGoal: asString(data.sustainableDevelopmentGoal),
    goals: asStringArray(data.goals, 3),
    disseminationStrategies: asString(data.disseminationStrategies),
    projectSummary: asString(data.projectSummary),
    reflectionStrategies: asString(data.reflectionStrategies),
    evaluationStrategies: asString(data.evaluationStrategies),
    partnerFeedback: asString(data.partnerFeedback),
    additionalInformation: asString(data.additionalInformation),
    acknowledgements: asStringArray(data.acknowledgements),
  }
}

export const createExtensionPlanFromProject = (project: {
  title?: string
  thematic_area?: string
  course?: string | null
  period_start?: string
  period_end?: string
  target_audience?: string
  description?: string
  extension_form?: unknown
}) => {
  const normalized = normalizeExtensionPlan(project.extension_form)

  return {
    ...normalized,
    title: normalized.title || asString(project.title),
    unicapProgram: normalized.unicapProgram || asString(project.thematic_area),
    periodStart: normalized.periodStart || asString(project.period_start),
    periodEnd: normalized.periodEnd || asString(project.period_end),
    courseName: normalized.courseName || asString(project.course),
    targetAudience: normalized.targetAudience || asString(project.target_audience),
    projectSummary: normalized.projectSummary || asString(project.description),
  }
}

export const isExtensionPlanComplete = (form: ExtensionPlanData) =>
  ACKNOWLEDGEMENT_OPTIONS.every((item) => form.acknowledgements.includes(item.id))
