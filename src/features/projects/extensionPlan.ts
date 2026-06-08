export const UNICAP_PROGRAM_OPTIONS = [
  'UNICAP - TIC - Tecnologia, Inovação e Comunicação',
  'UNICAP - DHN - Direitos Humanos e da Natureza',
  'UNICAP - DISA - Desenvolvimento Integral Socioambiental',
  'UNICAP - VIDA - Saúde, Qualidade de Vida e Bem Viver',
  'UNICAP + Educação Inclusiva e Transformadora',
] as const

export const LINKED_COURSE_OPTIONS = [
  'Administracao',
  'Arquitetura e Urbanismo',
  'Ciência da Computação',
  'Ciência da Religião - EaD',
  'Ciência Política',
  'Ciências Biológicas - Bacharelado',
  'Ciências Biológicas - Licenciatura',
  'Ciências Contábeis',
  'Ciências Econômicas',
  'Direito',
  'Enfermagem',
  'Engenharia Ambiental',
  'Engenharia Civil',
  'Engenharia da Complexidade',
  'Engenharia de Produção',
  'Engenharia Química',
  'Farmácia',
  'Filosofia - Bacharelado',
  'Filosofia - Licenciatura',
  'Filosofia - Licenciatura - EaD',
  'Física - Licenciatura',
  'Fisioterapia',
  'Fonoaudiologia',
  'Fotografia',
  'Gestão de RH - EaD',
  'História - Licenciatura',
  'História - Licenciatura - EaD',
  'Jogos Digitais',
  'Jornalismo',
  'Letras - Licenciatura em Português',
  'Letras - Licenciatura Português e Espanhol',
  'Letras - Licenciatura Português e Inglês',
  'Letras - Português - EaD',
  'Logística - EaD',
  'Matemática - Licenciatura',
  'Medicina',
  'Nutrição',
  'Pedagogia - Licenciatura',
  'Pedagogia - Licenciatura - EaD',
  'Psicologia - Bacharelado',
  'Publicidade e Propaganda',
  'Química - Licenciatura',
  'Serviço Social',
  'Sistemas para Internet Tecnológico',
  'Teologia - Bacharelado',
  'Programa de Ciências da Linguagem (PPGCL)',
  'Programa de Ciências da Religião (PPGCR)',
  'Programa de Desenvolvimento de Processos Ambientais (PPGDPA)',
  'Programa de Direito (PPGD)',
  'Programa de Direito e Inovacao (PPGDI)',
  'Programa de Filosofia (PPGFIL)',
  'Programa de História (PPGH)',
  'Programa de Indústrias Criativas (PPGIC)',
  'Programa de Psicologia Clínica (PPGPSI)',
  'Programa de Teologia (PPGTEO)',
] as const

export const WEEKLY_HOURS_OPTIONS = Array.from({ length: 20 }, (_, index) => String(index + 1))

export const COORDINATOR_PARTICIPATION_OPTIONS = [
  'Voluntário - Não receberá nenhuma remuneração, tendo que assinar o Termo de Voluntariado.',
  'Remunerado - Receberá remuneração extra (HPE) mediante autorização (CI).',
  'Previsto - A remuneração já está incluída na carga horária do docente e não incidirá em pagamento extra.',
] as const

export const TRANSVERSAL_COMPETENCY_OPTIONS = [
  'Comunicação',
  'Criatividade e Inovação',
  'Iniciativa e Resolução de Problemas',
  'Liderança',
  'Planejamento e Organização',
  'Senso Crítico',
  'Trabalho em equipe',
] as const

export const SDG_OPTIONS = [
  'ODS 1 - Erradicação da Pobreza',
  'ODS 2 - Fome Zero e Agricultura Sustentável',
  'ODS 3 - Saúde e Bem-Estar',
  'ODS 4 - Educação de Qualidade',
  'ODS 5 - Igualdade de Gênero',
  'ODS 6 - Água Potável e Saneamento',
  'ODS 7 - Energia Limpa e Acessível',
  'ODS 8 - Trabalho Decente e Crescimento Econômico',
  'ODS 9 - Indústria, Inovação e Infraestrutura',
  'ODS 10 - Redução das Desigualdades',
  'ODS 11 - Cidades e Comunidades Sustentáveis',
  'ODS 12 - Consumo e Produção Responsáveis',
  'ODS 13 - Ação Contra a Mudança Global do Clima',
  'ODS 14 - Vida na Água',
  'ODS 15 - Vida Terrestre',
  'ODS 16 - Paz, Justiça e Instituições Eficazes',
  'ODS 17 - Parcerias e Meios de Implementação',
] as const

export const ACKNOWLEDGEMENT_OPTIONS = [
  {
    id: 'approval_required',
    label:
      'Esse Plano de Trabalho somente terá validade após a aprovação da Assessoria de Extensão e da coordenação do curso ao qual está vinculado.',
  },
  {
    id: 'final_report_required',
    label:
      'Ao final da experiência de extensão, devo enviar o Relatório Final de Extensão conforme o modelo vigente.',
  },
  {
    id: 'corrections_may_be_requested',
    label:
      'A Assessoria de Extensão ou a Coordenação de Curso poderá solicitar alteração ou correção de algum item do plano.',
  },
  {
    id: 'volunteer_terms_required',
    label:
      'Após a aprovação, sou responsável por orientar os estudantes e demais participantes a assinarem o Termo de Voluntariado, inclusive eu mesmo quando for voluntário no projeto.',
  },
] as const

export const DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS = [
  {
    id: 'approval_required',
    label:
      'Esse Plano de Trabalho somente terá validade após a aprovação da Assessoria de Extensão e da coordenação do curso ao qual está vinculado.',
  },
  {
    id: 'final_report_required',
    label:
      'Ao final da experiência de extensão, devo enviar o Relatório Final de Extensão conforme o modelo vigente.',
  },
  {
    id: 'corrections_may_be_requested',
    label:
      'Caso julguem necessário, a Assessoria de Extensão ou a Coordenação de Curso poderão solicitar alteração ou correção de algum item do plano.',
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

export const areAcknowledgementsComplete = (
  acknowledgements: string[],
  options: readonly { id: string }[] = ACKNOWLEDGEMENT_OPTIONS,
) => options.every((item) => acknowledgements.includes(item.id))

export const isExtensionPlanComplete = (form: ExtensionPlanData) =>
  areAcknowledgementsComplete(form.acknowledgements)
