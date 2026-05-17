import { z } from 'zod'
import { ACKNOWLEDGEMENT_OPTIONS, DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS } from './extensionPlan'

const required = (label: string) =>
  z.string().trim().min(1, `${label} e obrigatorio.`)

const requiredEmail = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} e obrigatorio.`)
    .email(`${label} invalido.`)

const requiredArray = (length: number, label: string) =>
  z
    .array(z.string().trim().min(1, `${label} e obrigatorio.`))
    .length(length)

const acknowledgementIds = ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id)
const disciplineAcknowledgementIds = DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id)

export const extensionAxesSchema = z.object({
  learningObjectives: requiredArray(3, 'Objetivo de aprendizagem'),
  transversalCompetencies: requiredArray(3, 'Competencia transversal'),
  serviceOffered: required('Servico oferecido'),
  activities: requiredArray(3, 'Atividade'),
  executionLocation: required('Local de realizacao'),
  targetAudience: required('Publico atendido'),
  methodologicalProcedures: required('Procedimentos metodologicos'),
  problemStatement: required('Problema ou necessidade'),
  sustainableDevelopmentGoal: required('ODS impactado'),
  goals: requiredArray(3, 'Meta'),
  disseminationStrategies: required('Estrategias de divulgacao'),
  projectSummary: required('Resumo do projeto'),
  reflectionStrategies: required('Estrategias de reflexao'),
  evaluationStrategies: required('Estrategias de avaliacao'),
  partnerFeedback: required('Feedback do parceiro'),
  additionalInformation: z.string().optional().default(''),
  acknowledgements: z
    .array(z.string())
    .refine((arr) => acknowledgementIds.every((id) => arr.includes(id)), {
      message: 'Marque todos os itens de confirmacao.',
    }),
})

export const disciplineExtensionAxesSchema = extensionAxesSchema.extend({
  acknowledgements: z
    .array(z.string())
    .refine((arr) => disciplineAcknowledgementIds.every((id) => arr.includes(id)), {
      message: 'Marque todos os itens de confirmacao.',
    }),
})

export const disciplineFormSchema = z
  .object({
    title: required('Titulo da iniciativa'),
    thematicArea: required('Programa Unicap'),
    codigoExtensao: required('Codigo Extensao'),
    disciplineName: required('Nome da disciplina'),
    codigoDisciplina: required('Codigo da disciplina'),
    codigoTurma: required('Codigo da turma'),
    disciplinaGerencial: z
      .string()
      .trim()
      .refine((value) => value === 'Sim' || value === 'Nao', {
        message: 'Disciplina gerencial e obrigatorio.',
      }),
    managedCourses: z.string().trim().optional().default(''),
    semestreLetivo: required('Periodo de realizacao da disciplina'),
    course: z.string().trim().optional().default(''),
    periodStart: required('Data de inicio'),
    periodEnd: required('Data final'),
    budget: z
      .string()
      .trim()
      .min(1, 'Carga horaria de extensao e obrigatoria.')
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: 'Informe uma carga horaria valida.',
      }),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: 'A data inicial nao pode ser maior que a data final.',
    path: ['periodEnd'],
  })

export type DisciplineFormSchema = z.infer<typeof disciplineFormSchema>

export const extensionFormSchema = z
  .object({
    title: required('Titulo da iniciativa'),
    totalWorkload: required('Carga horaria total'),
    unicapProgram: required('Programa Unicap'),
    periodStart: required('Data de inicio'),
    periodEnd: required('Data de termino'),
    linkedCourse: required('Curso vinculado'),
    courseName: required('Curso'),
    coordinationEmail: requiredEmail('E-mail da coordenacao'),
    coordinatorName: required('Nome do docente coordenador'),
    coordinatorEmail: requiredEmail('E-mail do docente coordenador'),
    coordinatorCpf: required('CPF do docente coordenador'),
    coordinatorPhone: required('Telefone do coordenador'),
    coordinatorWeeklyHours: required('Carga horaria semanal do coordenador'),
    coordinatorParticipation: required('Forma de participacao do coordenador'),
    otherVolunteerTeachers: z.string().optional().default(''),
    studentWeeklyHours: required('Carga horaria semanal dos estudantes'),
    studentParticipants: required('Estudantes participantes'),
  })
  .extend(extensionAxesSchema.shape)
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: 'A data inicial nao pode ser maior que a data final.',
    path: ['periodEnd'],
  })

export type ExtensionFormSchema = z.infer<typeof extensionFormSchema>

export const collectFormErrors = (issues: z.core.$ZodIssue[]): string[] => {
  const seen = new Set<string>()
  const messages: string[] = []
  for (const issue of issues) {
    const key = `${issue.path.join('.')}|${issue.message}`
    if (!seen.has(key)) {
      seen.add(key)
      messages.push(issue.message)
    }
  }
  return messages
}
