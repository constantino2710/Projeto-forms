import { createEmptyExtensionPlan, type ExtensionPlanData } from '../projects/extensionPlan'

export type DisciplineManagerialOption = 'Sim' | 'Nao'

export type DisciplineProjectMetadata = {
  codigoExtensao: string
  codigoDisciplina: string
  codigoTurma: string
  disciplinaGerencial: DisciplineManagerialOption
  cursosGerenciados: string
}

const FIELD_PREFIXES = {
  codigoExtensao: 'Código da Extensão:',
  codigoDisciplina: 'Código da Disciplina:',
  codigoTurma: 'Código da Turma:',
  disciplinaGerencial: 'Disciplina Gerencial:',
  cursosGerenciados: 'Cursos Gerenciados:',
} as const

const normalizeManagerialValue = (value: string): DisciplineManagerialOption =>
  value.trim().toLowerCase() === 'sim' ? 'Sim' : 'Nao'

export const createEmptyDisciplineMetadata = (): DisciplineProjectMetadata => ({
  codigoExtensao: '',
  codigoDisciplina: '',
  codigoTurma: '',
  disciplinaGerencial: 'Nao',
  cursosGerenciados: '',
})

export const buildDisciplineMetadataDescription = (
  metadata: DisciplineProjectMetadata,
): string =>
  [
    `${FIELD_PREFIXES.codigoExtensao} ${metadata.codigoExtensao.trim()}`,
    `${FIELD_PREFIXES.codigoDisciplina} ${metadata.codigoDisciplina.trim()}`,
    `${FIELD_PREFIXES.codigoTurma} ${metadata.codigoTurma.trim()}`,
    `${FIELD_PREFIXES.disciplinaGerencial} ${metadata.disciplinaGerencial}`,
    `${FIELD_PREFIXES.cursosGerenciados} ${metadata.cursosGerenciados.trim() || '-'}`,
  ].join('\n')

export const parseDisciplineMetadataDescription = (
  value: string | null | undefined,
): DisciplineProjectMetadata => {
  const metadata = createEmptyDisciplineMetadata()
  const lines = (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (line.startsWith(FIELD_PREFIXES.codigoExtensao)) {
      metadata.codigoExtensao = line.slice(FIELD_PREFIXES.codigoExtensao.length).trim()
      continue
    }
    if (line.startsWith(FIELD_PREFIXES.codigoTurma)) {
      metadata.codigoTurma = line.slice(FIELD_PREFIXES.codigoTurma.length).trim()
      continue
    }
    if (line.startsWith(FIELD_PREFIXES.codigoDisciplina)) {
      metadata.codigoDisciplina = line.slice(FIELD_PREFIXES.codigoDisciplina.length).trim()
      continue
    }
    if (line.startsWith(FIELD_PREFIXES.disciplinaGerencial)) {
      metadata.disciplinaGerencial = normalizeManagerialValue(
        line.slice(FIELD_PREFIXES.disciplinaGerencial.length).trim(),
      )
      continue
    }
    if (line.startsWith(FIELD_PREFIXES.cursosGerenciados)) {
      const managedCourses = line.slice(FIELD_PREFIXES.cursosGerenciados.length).trim()
      metadata.cursosGerenciados = managedCourses === '-' ? '' : managedCourses
    }
  }

  return metadata
}

export const disciplineManagerialLabel = (value: boolean | DisciplineManagerialOption): string =>
  value === true || value === 'Sim' ? 'Sim' : 'Nao'

type DisciplineExtensionFormSource = {
  title: string
  thematicArea: string
  course: string
  disciplineName: string
  periodStart: string
  periodEnd: string
  budget: string
}

export const buildDisciplineExtensionForm = (
  source: DisciplineExtensionFormSource,
  form: ExtensionPlanData,
): ExtensionPlanData => {
  const base = createEmptyExtensionPlan()

  return {
    ...base,
    ...form,
    title: source.title.trim(),
    totalWorkload: source.budget.trim(),
    unicapProgram: source.thematicArea.trim(),
    periodStart: source.periodStart,
    periodEnd: source.periodEnd,
    linkedCourse: source.course.trim(),
    courseName: source.disciplineName.trim(),
  }
}
