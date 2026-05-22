import type { DisciplineImportRow } from './disciplines'

export type SpreadsheetParseResult = {
  rows: DisciplineImportRow[]
  skipped: number
  detectedHeaders: string[]
}

const COLUMN_ALIASES: Record<keyof DisciplineImportRow, string[]> = {
  periodo: [
    'per',
    'periodo',
    'período',
    'periodos',
    'períodos',
    'periodo de realizacao da disciplina',
    'período de realização da disciplina',
  ],
  docente: [
    'docente',
    'docentes',
    'professor',
    'professores',
    'nome do docente responsavel pela atividade extensionista',
    'nome do docente responsável pela atividade extensionista',
  ],
  curso: [
    'curso',
    'cursos',
    'curso em que a disciplina esta vinculada',
    'curso em que a disciplina está vinculada',
  ],
  disciplina: ['disciplina', 'disciplinas', 'nome da disciplina'],
  codigo: [
    'cod',
    'codigo',
    'código',
    'codigo extensao',
    'código extensão',
    'cod de extensao',
    'cod de extensão',
    'codigo de extensao',
    'código de extensão',
    'codigo extensao - automatico',
    'código extensão - automático',
  ],
  carga_horaria: [
    'carga horaria de extensao da disciplina',
    'carga horária de extensão da disciplina',
    'carga horaria',
    'carga horária',
  ],
  codigo_disciplina: ['codigo da disciplina', 'código da disciplina'],
  codigo_turma: ['codigo da turma', 'código da turma'],
  disciplina_gerencial: ['disciplina gerencial'],
  cursos_gerenciados: ['cursos gerenciados'],
}

const normalizeHeader = (value: string) =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const matchHeader = (header: string): keyof DisciplineImportRow | null => {
  const normalized = normalizeHeader(header)
  for (const key of Object.keys(COLUMN_ALIASES) as (keyof DisciplineImportRow)[]) {
    const aliases = COLUMN_ALIASES[key].map((alias) => normalizeHeader(alias))
    if (aliases.includes(normalized)) {
      return key
    }
  }
  return null
}

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number') {
    return String(value).trim()
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value).trim()
}

const cellToBoolean = (value: unknown): boolean | null => {
  const normalized = cellToString(value).toLowerCase()
  if (!normalized) {
    return null
  }
  if (['sim', 's', 'true', '1', 'yes'].includes(normalized)) {
    return true
  }
  if (['nao', 'não', 'n', 'false', '0', 'no'].includes(normalized)) {
    return false
  }
  return null
}

export const parseSpreadsheetFile = async (file: File): Promise<SpreadsheetParseResult> => {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('Arquivo nao contem nenhuma aba/planilha.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!raw.length) {
    throw new Error('Planilha vazia.')
  }

  const headerRow = raw[0] as unknown[]
  const headerStrings = headerRow.map((cell) => cellToString(cell))
  const columnMap = new Map<keyof DisciplineImportRow, number>()
  const detectedHeaders: string[] = []

  headerStrings.forEach((header, index) => {
    const matched = matchHeader(header)
    if (matched && !columnMap.has(matched)) {
      columnMap.set(matched, index)
      detectedHeaders.push(`${header} → ${matched}`)
    }
  })

  const missing: (keyof DisciplineImportRow)[] = []
  for (const key of Object.keys(COLUMN_ALIASES) as (keyof DisciplineImportRow)[]) {
    if (!columnMap.has(key)) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatorias nao encontradas: ${missing.join(', ')}. Esperado: Periodo, Codigo Extensao, Docente, Curso, Nome da Disciplina, Carga Horaria, Codigo da Disciplina, Codigo da Turma, Disciplina Gerencial e Cursos Gerenciados.`,
    )
  }

  const rows: DisciplineImportRow[] = []
  let skipped = 0
  const seenCodes = new Set<string>()

  for (let i = 1; i < raw.length; i++) {
    const dataRow = raw[i] as unknown[]
    const codigo = cellToString(dataRow[columnMap.get('codigo') as number])
    const disciplina = cellToString(dataRow[columnMap.get('disciplina') as number])
    const curso = cellToString(dataRow[columnMap.get('curso') as number])
    const docente = cellToString(dataRow[columnMap.get('docente') as number])
    const periodo = cellToString(dataRow[columnMap.get('periodo') as number])
    const carga_horaria = cellToString(dataRow[columnMap.get('carga_horaria') as number])
    const codigo_disciplina = cellToString(dataRow[columnMap.get('codigo_disciplina') as number])
    const codigo_turma = cellToString(dataRow[columnMap.get('codigo_turma') as number])
    const disciplina_gerencial = cellToBoolean(
      dataRow[columnMap.get('disciplina_gerencial') as number],
    )
    const cursos_gerenciados = cellToString(
      dataRow[columnMap.get('cursos_gerenciados') as number],
    )

    if (
      !codigo ||
      !disciplina ||
      !curso ||
      !docente ||
      !periodo ||
      !carga_horaria ||
      !codigo_disciplina ||
      !codigo_turma ||
      disciplina_gerencial === null
    ) {
      skipped += 1
      continue
    }

    if (seenCodes.has(codigo)) {
      skipped += 1
      continue
    }

    seenCodes.add(codigo)
    rows.push({
      codigo,
      disciplina,
      curso,
      docente,
      periodo,
      carga_horaria,
      codigo_disciplina,
      codigo_turma,
      disciplina_gerencial,
      cursos_gerenciados,
    })
  }

  if (rows.length === 0) {
    throw new Error('Nenhuma linha valida encontrada na planilha.')
  }

  return { rows, skipped, detectedHeaders }
}
