import { z } from 'zod'
import { ACKNOWLEDGEMENT_OPTIONS, DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS } from './extensionPlan'

const required = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`)

const requiredEmail = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .email(`${label} inválido.`)

const requiredArray = (length: number, label: string) =>
  z
    .array(z.string().trim().min(1, `${label} é obrigatório.`))
    .length(length)

const acknowledgementIds = ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id)
const disciplineAcknowledgementIds = DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id)

export const extensionAxesSchema = z.object({
  learningObjectives: requiredArray(3, 'Objetivo de aprendizagem'),
  transversalCompetencies: requiredArray(3, 'Competência transversal'),
  serviceOffered: required('Serviço oferecido'),
  activities: requiredArray(3, 'Atividade'),
  executionLocation: required('Local de realização'),
  targetAudience: required('Público atendido'),
  methodologicalProcedures: required('Procedimentos metodológicos'),
  problemStatement: required('Problema ou necessidade'),
  sustainableDevelopmentGoal: required('ODS impactado'),
  goals: requiredArray(3, 'Meta'),
  disseminationStrategies: required('Estratégias de divulgação'),
  projectSummary: required('Resumo do projeto'),
  reflectionStrategies: required('Estratégias de reflexão'),
  evaluationStrategies: required('Estratégias de avaliação'),
  partnerFeedback: required('Feedback do parceiro'),
  additionalInformation: z.string().optional().default(''),
  acknowledgements: z
    .array(z.string())
    .refine((arr) => acknowledgementIds.every((id) => arr.includes(id)), {
      message: 'Marque todos os itens de confirmação.',
    }),
})

export const disciplineExtensionAxesSchema = extensionAxesSchema.extend({
  acknowledgements: z
    .array(z.string())
    .refine((arr) => disciplineAcknowledgementIds.every((id) => arr.includes(id)), {
      message: 'Marque todos os itens de confirmação.',
    }),
})

export const disciplineFormSchema = z
  .object({
    title: required('Título da iniciativa'),
    thematicArea: required('Programa Unicap'),
    codigoExtensao: required('Código da extensão'),
    disciplineName: required('Nome da disciplina'),
    codigoDisciplina: required('Código da disciplina'),
    codigoTurma: required('Código da turma'),
    disciplinaGerencial: z
      .string()
      .trim()
      .refine((value) => value === 'Sim' || value === 'Nao', {
        message: 'Disciplina gerencial é obrigatória.',
      }),
    managedCourses: z.string().trim().optional().default(''),
    semestreLetivo: required('Período de realização da disciplina'),
    course: z.string().trim().optional().default(''),
    periodStart: required('Data de início'),
    periodEnd: required('Data final'),
    budget: z
      .string()
      .trim()
      .min(1, 'Carga horária de extensão é obrigatória.')
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: 'Informe uma carga horária válida.',
      }),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: 'A data inicial não pode ser maior que a data final.',
    path: ['periodEnd'],
  })

export type DisciplineFormSchema = z.infer<typeof disciplineFormSchema>

export const extensionFormSchema = z
  .object({
    title: required('Título da iniciativa'),
    totalWorkload: required('Carga horária total'),
    unicapProgram: required('Programa Unicap'),
    periodStart: required('Data de início'),
    periodEnd: required('Data de término'),
    linkedCourse: required('Curso vinculado'),
    courseName: required('Curso'),
    coordinationEmail: requiredEmail('E-mail da coordenação'),
    coordinatorName: required('Nome do docente coordenador'),
    coordinatorEmail: requiredEmail('E-mail do docente coordenador'),
    coordinatorCpf: required('CPF do docente coordenador'),
    coordinatorPhone: required('Telefone do coordenador'),
    coordinatorWeeklyHours: required('Carga horária semanal do coordenador'),
    coordinatorParticipation: required('Forma de participação do coordenador'),
    otherVolunteerTeachers: z.string().optional().default(''),
    studentWeeklyHours: required('Carga horária semanal dos estudantes'),
    studentParticipants: required('Estudantes participantes'),
  })
  .extend(extensionAxesSchema.shape)
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: 'A data inicial não pode ser maior que a data final.',
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
