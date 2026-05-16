import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
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

const summaryRows = (data: ReportData): string[][] => [
  ['Relatório de Projetos'],
  [`Gerado em: ${data.generatedAt.toLocaleString('pt-BR')}`],
  [`Período: ${data.rangeLabel}`],
  [],
  ['Indicador', 'Quantidade'],
  ['Total enviados', String(data.stats.enviados)],
  ['Submetidos (aguardando análise)', String(data.stats.submetidos)],
  ['Em análise', String(data.stats.emAnalise)],
  ['Aprovados', String(data.stats.aprovados)],
  ['Recusados', String(data.stats.recusados)],
]

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

const detailRows = (data: ReportData): (string | number)[][] =>
  data.projects.map((p) => [
    p.title,
    p.tipo === 'disciplina' ? 'Disciplina' : 'Extensão',
    p.course ?? '-',
    p.school ?? '-',
    projectStatusLabel[p.status],
    formatBr(p.period_start),
    formatBr(p.period_end),
    Number(p.budget).toFixed(2),
    p.created_at ? formatBr(p.created_at) : '-',
  ])

export const generateCsv = (data: ReportData): Blob => {
  const escape = (cell: string | number) => {
    const str = String(cell ?? '')
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const lines: string[] = []
  for (const row of summaryRows(data)) lines.push(row.map(escape).join(';'))
  lines.push('')
  lines.push('Detalhamento dos projetos')
  lines.push(detailHeader.map(escape).join(';'))
  for (const row of detailRows(data)) lines.push(row.map(escape).join(';'))
  const bom = '﻿'
  return new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

export const generateXlsx = (data: ReportData): Blob => {
  const wb = XLSX.utils.book_new()

  const summaryAoa = summaryRows(data)
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoa)
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 16 }]
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo')

  const detailAoa: (string | number)[][] = [detailHeader, ...detailRows(data)]
  const detailSheet = XLSX.utils.aoa_to_sheet(detailAoa)
  detailSheet['!cols'] = [
    { wch: 38 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
  ]
  detailSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: detailHeader.length - 1 } }) }
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Projetos')

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
