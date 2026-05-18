import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx-js-style'
import type {
  AdminProjectCard,
  AdminProjectHistoryCard,
} from '../projects/adminProjects'
import type { SuperHistoryRow } from '../super/superAdmin'
import { projectStatusLabel } from '../projects/userProjects'

export type ReportFormat = 'pdf' | 'xlsx' | 'csv'

export type ReportPeriodPreset = 'week' | 'month' | 'year' | 'all' | 'custom'

export type ReportPeriod =
  | { preset: Exclude<ReportPeriodPreset, 'custom'> }
  | { preset: 'custom'; from: string; to: string }

export type ReportProject = {
  id: string
  title: string
  tipo: 'extensao' | 'disciplina'
  course: string | null
  school: string | null
  status:
    | 'submetido'
    | 'em_avaliacao'
    | 'em_ajustes'
    | 'aprovado'
    | 'reprovado'
  period_start: string
  period_end: string
  budget: number
  created_at: string
}

export type ReportStats = {
  enviados: number
  submetidos: number
  emAnalise: number
  aprovados: number
  recusados: number
}

export type ReportData = {
  generatedAt: Date
  period: ReportPeriod
  rangeLabel: string
  projects: ReportProject[]
  stats: ReportStats
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

const formatBr = (iso: string | null | undefined): string => {
  if (!iso) return '-'
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export const periodPresetLabel: Record<ReportPeriodPreset, string> = {
  week: 'Última semana',
  month: 'Último mês',
  year: 'Último ano',
  all: 'Tempo todo',
  custom: 'Personalizado',
}

export const resolvePeriodRange = (
  period: ReportPeriod,
  now: Date = new Date(),
): { from: Date | null; to: Date } => {
  const to = new Date(now)
  if (period.preset === 'all') {
    return { from: null, to }
  }
  if (period.preset === 'custom') {
    const from = new Date(`${period.from}T00:00:00`)
    const customTo = new Date(`${period.to}T23:59:59`)
    return { from, to: customTo }
  }
  const from = new Date(now)
  if (period.preset === 'week') from.setDate(from.getDate() - 7)
  if (period.preset === 'month') from.setMonth(from.getMonth() - 1)
  if (period.preset === 'year') from.setFullYear(from.getFullYear() - 1)
  return { from, to }
}

export const buildRangeLabel = (period: ReportPeriod, now: Date = new Date()): string => {
  const { from, to } = resolvePeriodRange(period, now)
  if (!from) return 'Tempo todo'
  return `${formatBr(toIsoDate(from))} a ${formatBr(toIsoDate(to))}`
}

const inRange = (iso: string, from: Date | null, to: Date): boolean => {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return false
  if (from && at < from) return false
  return at <= to
}

export const filterProjectsByPeriod = (
  projects: ReportProject[],
  period: ReportPeriod,
  now: Date = new Date(),
): ReportProject[] => {
  const { from, to } = resolvePeriodRange(period, now)
  if (!from) return [...projects]
  return projects.filter((p) => inRange(p.created_at, from, to))
}

export const computeStats = (projects: ReportProject[]): ReportStats => {
  const stats: ReportStats = {
    enviados: 0,
    submetidos: 0,
    emAnalise: 0,
    aprovados: 0,
    recusados: 0,
  }
  for (const p of projects) {
    stats.enviados += 1
    if (p.status === 'submetido') stats.submetidos += 1
    if (p.status === 'em_avaliacao' || p.status === 'em_ajustes') stats.emAnalise += 1
    if (p.status === 'aprovado') stats.aprovados += 1
    if (p.status === 'reprovado') stats.recusados += 1
  }
  return stats
}

export const adminProjectsToReportRows = (
  pending: AdminProjectCard[],
  history: AdminProjectHistoryCard[],
): ReportProject[] => {
  const seen = new Set<string>()
  const result: ReportProject[] = []
  for (const p of pending) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    result.push({
      id: p.id,
      title: p.title,
      tipo: p.tipo,
      course: p.course,
      school: p.school,
      status: p.status === 'rascunho' ? 'submetido' : p.status,
      period_start: p.period_start,
      period_end: p.period_end,
      budget: Number(p.budget) || 0,
      created_at: p.created_at,
    })
  }
  for (const h of history) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    result.push({
      id: h.id,
      title: h.title,
      tipo: h.tipo,
      course: h.course,
      school: h.school,
      status: h.status,
      period_start: h.period_start,
      period_end: h.period_end,
      budget: Number(h.budget) || 0,
      created_at: h.reviewed_at ?? '',
    })
  }
  return result
}

export const superHistoryToReportRows = (rows: SuperHistoryRow[]): ReportProject[] => {
  const result: ReportProject[] = []
  for (const r of rows) {
    if (r.status === 'rascunho') continue
    result.push({
      id: r.id,
      title: r.title,
      tipo: r.tipo,
      course: r.course,
      school: r.school,
      status: r.status,
      period_start: r.period_start,
      period_end: r.period_end,
      budget: Number(r.budget) || 0,
      created_at: r.created_at,
    })
  }
  return result
}

export const buildReportData = (
  projects: ReportProject[],
  period: ReportPeriod,
  now: Date = new Date(),
): ReportData => {
  const filtered = filterProjectsByPeriod(projects, period, now)
  return {
    generatedAt: now,
    period,
    rangeLabel: buildRangeLabel(period, now),
    projects: filtered,
    stats: computeStats(filtered),
  }
}

const detailHeader = [
  'Título',
  'Tipo',
  'Curso',
  'Escola',
  'Status',
  'Início',
  'Fim',
  'Orçamento (R$)',
  'Criado em',
]

type StatusKey = ReportProject['status']

const statusPalette: Record<StatusKey, { fill: string; text: string }> = {
  submetido: { fill: 'DBEAFE', text: '1E3A8A' },
  em_avaliacao: { fill: 'FEF3C7', text: '92400E' },
  em_ajustes: { fill: 'FFEDD5', text: '9A3412' },
  aprovado: { fill: 'DCFCE7', text: '166534' },
  reprovado: { fill: 'FEE2E2', text: '991B1B' },
}

const indicatorPalette: Array<{ label: string; key: keyof ReportStats; fill: string; text: string }> = [
  { label: 'Total enviados', key: 'enviados', fill: '6366F1', text: 'FFFFFF' },
  { label: 'Submetidos (aguardando análise)', key: 'submetidos', fill: '0EA5E9', text: 'FFFFFF' },
  { label: 'Em análise', key: 'emAnalise', fill: 'F59E0B', text: 'FFFFFF' },
  { label: 'Aprovados', key: 'aprovados', fill: '22C55E', text: 'FFFFFF' },
  { label: 'Recusados', key: 'recusados', fill: 'EF4444', text: 'FFFFFF' },
]

const formatCurrencyBr = (value: number): string =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const detailRows = (data: ReportData): (string | number)[][] =>
  data.projects.map((p) => [
    p.title,
    p.tipo === 'disciplina' ? 'Disciplina' : 'Extensão',
    p.course ?? '-',
    p.school ?? '-',
    projectStatusLabel[p.status],
    formatBr(p.period_start),
    formatBr(p.period_end),
    Number(p.budget),
    p.created_at ? formatBr(p.created_at) : '-',
  ])

export const generateCsv = (data: ReportData): Blob => {
  const escape = (cell: string | number) => {
    const str = String(cell ?? '')
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }

  const totalOrcamento = data.projects.reduce((acc, p) => acc + Number(p.budget || 0), 0)
  const sep = ';'
  const divider = '='.repeat(80)
  const subDivider = '-'.repeat(80)

  const lines: string[] = []
  lines.push(divider)
  lines.push('RELATÓRIO DE PROJETOS')
  lines.push(divider)
  lines.push(`Gerado em${sep}${data.generatedAt.toLocaleString('pt-BR')}`)
  lines.push(`Período${sep}${data.rangeLabel}`)
  lines.push('')

  lines.push(subDivider)
  lines.push('RESUMO')
  lines.push(subDivider)
  lines.push(['Indicador', 'Quantidade'].map(escape).join(sep))
  for (const ind of indicatorPalette) {
    lines.push([ind.label, String(data.stats[ind.key])].map(escape).join(sep))
  }
  lines.push(['Orçamento total', formatCurrencyBr(totalOrcamento)].map(escape).join(sep))
  lines.push('')

  lines.push(subDivider)
  lines.push(`DETALHAMENTO DOS PROJETOS (${data.projects.length})`)
  lines.push(subDivider)
  lines.push(detailHeader.map(escape).join(sep))
  for (const row of detailRows(data)) {
    const formatted = row.map((cell, idx) =>
      idx === 7 ? formatCurrencyBr(Number(cell)) : String(cell),
    )
    lines.push(formatted.map(escape).join(sep))
  }

  const bom = '﻿'
  return new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

type CellStyle = {
  font?: { name?: string; sz?: number; bold?: boolean; color?: { rgb: string } }
  fill?: { fgColor: { rgb: string } }
  alignment?: { horizontal?: 'left' | 'center' | 'right'; vertical?: 'top' | 'center' | 'bottom'; wrapText?: boolean }
  border?: {
    top?: { style: 'thin' | 'medium'; color?: { rgb: string } }
    bottom?: { style: 'thin' | 'medium'; color?: { rgb: string } }
    left?: { style: 'thin' | 'medium'; color?: { rgb: string } }
    right?: { style: 'thin' | 'medium'; color?: { rgb: string } }
  }
  numFmt?: string
}

const setCell = (
  sheet: XLSX.WorkSheet,
  row: number,
  col: number,
  value: string | number | null,
  style?: CellStyle,
  type?: 'n' | 's',
): void => {
  const ref = XLSX.utils.encode_cell({ r: row, c: col })
  const cellType = type ?? (typeof value === 'number' ? 'n' : 's')
  const cell: XLSX.CellObject = { t: cellType, v: value as XLSX.CellObject['v'] }
  if (style) (cell as XLSX.CellObject & { s?: CellStyle }).s = style
  sheet[ref] = cell
}

const thinBorder = (color = 'E5E7EB'): CellStyle['border'] => ({
  top: { style: 'thin', color: { rgb: color } },
  bottom: { style: 'thin', color: { rgb: color } },
  left: { style: 'thin', color: { rgb: color } },
  right: { style: 'thin', color: { rgb: color } },
})

const buildSummarySheet = (data: ReportData): XLSX.WorkSheet => {
  const sheet: XLSX.WorkSheet = {}
  const colCount = 4
  let row = 0

  setCell(sheet, row, 0, 'RELATÓRIO DE PROJETOS', {
    font: { name: 'Calibri', sz: 20, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  })
  for (let c = 1; c < colCount; c += 1) {
    setCell(sheet, row, c, '', { fill: { fgColor: { rgb: '1E293B' } } })
  }
  row += 1

  setCell(sheet, row, 0, `Gerado em ${data.generatedAt.toLocaleString('pt-BR')}  •  Período: ${data.rangeLabel}`, {
    font: { name: 'Calibri', sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '334155' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  })
  for (let c = 1; c < colCount; c += 1) {
    setCell(sheet, row, c, '', { fill: { fgColor: { rgb: '334155' } } })
  }
  row += 2

  setCell(sheet, row, 0, 'INDICADORES', {
    font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  })
  row += 1

  const headerStyle: CellStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder('0F172A'),
  }
  setCell(sheet, row, 0, 'Indicador', { ...headerStyle, alignment: { horizontal: 'left', vertical: 'center' } })
  setCell(sheet, row, 1, 'Quantidade', headerStyle)
  setCell(sheet, row, 2, '', headerStyle)
  setCell(sheet, row, 3, '', headerStyle)
  row += 1

  for (const ind of indicatorPalette) {
    setCell(sheet, row, 0, ind.label, {
      font: { name: 'Calibri', sz: 11, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder(),
    })
    setCell(sheet, row, 1, data.stats[ind.key], {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: ind.text } },
      fill: { fgColor: { rgb: ind.fill } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder(ind.fill),
      numFmt: '0',
    })
    setCell(sheet, row, 2, '', { border: thinBorder() })
    setCell(sheet, row, 3, '', { border: thinBorder() })
    row += 1
  }

  row += 1
  const totalOrcamento = data.projects.reduce((acc, p) => acc + Number(p.budget || 0), 0)
  setCell(sheet, row, 0, 'ORÇAMENTO TOTAL', {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '7C3AED' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: thinBorder('7C3AED'),
  })
  setCell(sheet, row, 1, totalOrcamento, {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '7C3AED' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: thinBorder('7C3AED'),
    numFmt: '"R$ "#,##0.00',
  })
  setCell(sheet, row, 2, '', { fill: { fgColor: { rgb: '7C3AED' } } })
  setCell(sheet, row, 3, '', { fill: { fgColor: { rgb: '7C3AED' } } })

  sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: row, c: colCount - 1 } })
  sheet['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 2 }, { wch: 2 }]
  sheet['!rows'] = [{ hpt: 32 }, { hpt: 22 }]
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
  ]
  return sheet
}

const buildDetailSheet = (data: ReportData): XLSX.WorkSheet => {
  const sheet: XLSX.WorkSheet = {}
  const rows = detailRows(data)
  const colCount = detailHeader.length

  const titleStyle: CellStyle = {
    font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }
  setCell(sheet, 0, 0, `PROJETOS (${rows.length})`, titleStyle)
  for (let c = 1; c < colCount; c += 1) {
    setCell(sheet, 0, c, '', { fill: { fgColor: { rgb: '1E293B' } } })
  }

  const headerRowIdx = 1
  const headerStyle: CellStyle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder('0F172A'),
  }
  detailHeader.forEach((h, idx) => {
    setCell(sheet, headerRowIdx, idx, h, headerStyle)
  })

  const numFmtCurrency = '"R$ "#,##0.00'
  rows.forEach((rowVals, rIdx) => {
    const r = headerRowIdx + 1 + rIdx
    const zebra = rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF'
    const statusKey = data.projects[rIdx]?.status as StatusKey | undefined
    const statusPal = statusKey ? statusPalette[statusKey] : undefined

    rowVals.forEach((val, cIdx) => {
      const isNumber = cIdx === 7
      const isStatus = cIdx === 4
      const isCenter = cIdx === 1 || cIdx === 5 || cIdx === 6 || cIdx === 8

      const baseStyle: CellStyle = {
        font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: zebra } },
        alignment: {
          horizontal: isNumber ? 'right' : isCenter || isStatus ? 'center' : 'left',
          vertical: 'center',
          wrapText: cIdx === 0,
        },
        border: thinBorder(),
      }

      if (isStatus && statusPal) {
        baseStyle.fill = { fgColor: { rgb: statusPal.fill } }
        baseStyle.font = { name: 'Calibri', sz: 10, bold: true, color: { rgb: statusPal.text } }
      }
      if (isNumber) {
        baseStyle.numFmt = numFmtCurrency
      }

      setCell(sheet, r, cIdx, val, baseStyle, isNumber ? 'n' : 's')
    })
  })

  const lastRow = headerRowIdx + rows.length
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(lastRow, headerRowIdx), c: colCount - 1 },
  })
  sheet['!cols'] = [
    { wch: 42 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
  ]
  sheet['!rows'] = [{ hpt: 28 }, { hpt: 24 }]
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }]
  sheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIdx, c: 0 },
      e: { r: Math.max(lastRow, headerRowIdx), c: colCount - 1 },
    }),
  }
  ;(sheet as XLSX.WorkSheet & { '!freeze'?: unknown })['!freeze'] = { xSplit: 0, ySplit: headerRowIdx + 1 }

  return sheet
}

export const generateXlsx = (data: ReportData): Blob => {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(data), 'Resumo')
  XLSX.utils.book_append_sheet(wb, buildDetailSheet(data), 'Projetos')
  const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export const generatePdf = (data: ReportData): Blob => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Relatório de Projetos', marginX, 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(`Gerado em ${data.generatedAt.toLocaleString('pt-BR')}`, marginX, 68)
  doc.text(`Período: ${data.rangeLabel}`, marginX, 82)
  doc.setTextColor(20)

  const cardGap = 8
  const cardCount = 5
  const cardWidth = (pageWidth - marginX * 2 - cardGap * (cardCount - 1)) / cardCount
  const cardHeight = 60
  const cardY = 100
  const cards: { label: string; value: number; color: [number, number, number] }[] = [
    { label: 'Enviados', value: data.stats.enviados, color: [99, 102, 241] },
    { label: 'Submetidos', value: data.stats.submetidos, color: [14, 165, 233] },
    { label: 'Em análise', value: data.stats.emAnalise, color: [234, 179, 8] },
    { label: 'Aprovados', value: data.stats.aprovados, color: [34, 197, 94] },
    { label: 'Recusados', value: data.stats.recusados, color: [239, 68, 68] },
  ]
  cards.forEach((card, idx) => {
    const x = marginX + idx * (cardWidth + cardGap)
    doc.setFillColor(...card.color)
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'F')
    doc.setTextColor(255)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(card.label, x + 14, cardY + 22)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(String(card.value), x + 14, cardY + 48)
  })
  doc.setTextColor(20)

  autoTable(doc, {
    startY: cardY + cardHeight + 24,
    head: [detailHeader],
    body: detailRows(data).map((row) => row.map((c) => String(c))),
    styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 160 },
      7: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      const page = doc.getCurrentPageInfo().pageNumber
      const total = doc.getNumberOfPages()
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text(
        `Página ${page} de ${total}`,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 16,
        { align: 'right' },
      )
      doc.setTextColor(20)
    },
  })

  return doc.output('blob')
}

export const buildReportFilename = (
  format: ReportFormat,
  period: ReportPeriod,
  now: Date = new Date(),
): string => {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const slug =
    period.preset === 'custom'
      ? `${period.from}_a_${period.to}`
      : period.preset
  const ext = format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'csv'
  return `relatorio-projetos_${slug}_${stamp}.${ext}`
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const generateReport = (data: ReportData, format: ReportFormat): Blob => {
  if (format === 'pdf') return generatePdf(data)
  if (format === 'xlsx') return generateXlsx(data)
  return generateCsv(data)
}
