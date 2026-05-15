import * as XLSX from 'xlsx'
import type { DisciplineImportRow } from './disciplines'

export type SpreadsheetParseResult = {
  rows: DisciplineImportRow[]
  skipped: number
  detectedHeaders: string[]
}

const COLUMN_ALIASES: Record<keyof DisciplineImportRow, string[]> = {
  periodo: ['per', 'periodo', 'período', 'periodos', 'períodos'],
  docente: ['docente', 'docentes', 'professor', 'professores'],
  curso: ['curso', 'cursos'],
  disciplina: ['disciplina', 'disciplinas', 'nome da disciplina'],
  codigo: [
    'cod',
    'codigo',
    'código',
    'cod de extensao',
    'cod de extensão',
    'codigo de extensao',
    'código de extensão',
    'codigo da disciplina',
    'código da disciplina',
  ],
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

export const parseSpreadsheetFile = async (file: File): Promise<SpreadsheetParseResult> => {
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
      `Colunas obrigatorias nao encontradas: ${missing.join(', ')}. Esperado: PER, Docente, Cursos, Disciplina, COD de extensao.`,
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

    if (!codigo || !disciplina || !curso || !docente || !periodo) {
      skipped += 1
      continue
    }

    if (seenCodes.has(codigo)) {
      skipped += 1
      continue
    }

    seenCodes.add(codigo)
    rows.push({ codigo, disciplina, curso, docente, periodo })
  }

  if (rows.length === 0) {
    throw new Error('Nenhuma linha valida encontrada na planilha.')
  }

  return { rows, skipped, detectedHeaders }
}
