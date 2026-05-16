import { Calendar, Download, FileSpreadsheet, FileText, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'
import { cn } from '../../lib/utils'
import type {
  ReportFormat,
  ReportPeriod,
  ReportPeriodPreset,
} from '../../features/reports/projectReports'

type ReportButtonProps = {
  onGenerate: (format: ReportFormat, period: ReportPeriod) => Promise<void>
}

const activeChipClass =
  'border border-primary bg-primary text-primary-foreground'
const idleChipClass =
  'border border-border bg-card text-foreground hover:border-primary/40'

const chipBase =
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.78rem] font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

const sectionLabelClass =
  'text-[0.72rem] font-bold uppercase tracking-[0.04em] text-muted-foreground'

const formatOptions: { value: ReportFormat; label: string; icon: typeof FileText }[] = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: Table2 },
]

const periodOptions: { value: ReportPeriodPreset; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
  { value: 'all', label: 'Tudo' },
  { value: 'custom', label: 'Personalizado' },
]

const todayIso = () => new Date().toISOString().slice(0, 10)
const daysAgoIso = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function ReportButton({ onGenerate }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [preset, setPreset] = useState<ReportPeriodPreset>('month')
  const [customFrom, setCustomFrom] = useState(daysAgoIso(30))
  const [customTo, setCustomTo] = useState(todayIso())
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isGenerating) setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isGenerating])

  useEffect(() => {
    if (!isOpen) setError('')
  }, [isOpen])

  const handleSubmit = async () => {
    setError('')
    if (preset === 'custom') {
      if (!customFrom || !customTo) {
        setError('Informe a data inicial e final.')
        return
      }
      if (customFrom > customTo) {
        setError('A data inicial não pode ser maior que a final.')
        return
      }
    }
    const period: ReportPeriod =
      preset === 'custom'
        ? { preset: 'custom', from: customFrom, to: customTo }
        : { preset }
    setIsGenerating(true)
    try {
      await onGenerate(format, period)
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar relatório.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        size="sm"
        onClick={() => setIsOpen((state) => !state)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Download size={14} />
        <span>Gerar relatório</span>
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Configurar relatório"
          className="absolute right-0 max-md:right-auto max-md:left-0 top-[calc(100%+8px)] min-w-[300px] max-w-[340px] rounded-[1.25rem] bg-card p-4 flex flex-col gap-3 z-40 shadow-[0_18px_48px_hsl(var(--foreground)/0.14)] origin-top animate-slide-down-fade"
        >
          <div className="flex flex-col gap-1.5">
            <span className={sectionLabelClass}>Formato</span>
            <div className="flex flex-wrap gap-1.5">
              {formatOptions.map((opt) => {
                const Icon = opt.icon
                const active = format === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(chipBase, active ? activeChipClass : idleChipClass)}
                    onClick={() => setFormat(opt.value)}
                    disabled={isGenerating}
                  >
                    <Icon size={12} />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={sectionLabelClass}>Período</span>
            <div className="flex flex-wrap gap-1.5">
              {periodOptions.map((opt) => {
                const active = preset === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(chipBase, active ? activeChipClass : idleChipClass)}
                    onClick={() => setPreset(opt.value)}
                    disabled={isGenerating}
                  >
                    {opt.value === 'custom' && <Calendar size={12} />}
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[0.72rem] font-semibold text-muted-foreground">
                <span>De</span>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo || todayIso()}
                  disabled={isGenerating}
                />
              </label>
              <label className="flex flex-col gap-1 text-[0.72rem] font-semibold text-muted-foreground">
                <span>Até</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom || undefined}
                  max={todayIso()}
                  disabled={isGenerating}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="m-0 text-[0.78rem] text-destructive font-semibold">{error}</p>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="self-end"
          >
            {isGenerating ? <Spinner size="sm" /> : <Download size={14} />}
            <span>{isGenerating ? 'Gerando...' : 'Gerar e baixar'}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
