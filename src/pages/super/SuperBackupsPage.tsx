import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  History,
  PlayCircle,
  RotateCcw,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import {
  getBackupSchedule,
  listRestoreAudit,
  listSnapshots,
  restoreAll,
  restoreTable,
  triggerSnapshot,
  type BackupSchedule,
  type RestoreAuditEntry,
  type SnapshotRun,
  type TriggerSource,
} from '../../features/super/backups'
import {
  confirmModalActionsClass,
  confirmModalBackdropClass,
  confirmModalClass,
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  successTextClass,
} from '../../lib/projectStyles'

type ConfirmState =
  | {
      kind: 'restore_table'
      runId: string
      runLabel: string
      table: string
      row_count: number
    }
  | {
      kind: 'restore_all'
      runId: string
      runLabel: string
      runConfirmCode: string
      table_count: number
      total_rows: number
    }
  | null

const formatBrDateTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const formatBrDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-')
  return `${d}/${m}/${y}`
}

const formatNumber = (n: number) => n.toLocaleString('pt-BR')

const formatCountdown = (targetIso: string, nowMs: number): string => {
  const diff = Math.max(0, new Date(targetIso).getTime() - nowMs)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

// Código compacto para o modal de confirmação (YYYYMMDD-HHMM)
const runConfirmCode = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    '-' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes())
  )
}

type SourceMeta = {
  label: string
  Icon: typeof Bot
  className: string
}

const sourceMetaMap: Record<TriggerSource, SourceMeta> = {
  pg_cron: {
    label: 'Automático',
    Icon: Bot,
    className: 'bg-status-submitted-bg text-status-submitted-fg',
  },
  github_workflow: {
    label: 'Automático',
    Icon: Bot,
    className: 'bg-status-submitted-bg text-status-submitted-fg',
  },
  manual_ui: {
    label: 'Manual',
    Icon: UserRound,
    className: 'bg-status-approved-bg text-status-approved-fg',
  },
  manual_sql: {
    label: 'Manual',
    Icon: UserRound,
    className: 'bg-status-approved-bg text-status-approved-fg',
  },
  unknown: {
    label: '?',
    Icon: Bot,
    className: 'bg-muted text-muted-foreground',
  },
}

const statusCellClass =
  'rounded-[1rem] border border-border bg-muted/40 px-3.5 py-2.5 flex flex-col gap-0.5 min-w-0'
const statusLabelClass =
  'm-0 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground'
const statusValueClass = 'mt-0.5 m-0 text-[1.05rem] font-bold leading-tight'
const statusSubClass = 'm-0 text-[0.78rem] text-muted-foreground'

const snapshotCardClass =
  'rounded-[0.85rem] border border-border bg-card shadow-[0_2px_8px_hsl(var(--foreground)/0.05)] transition-shadow hover:shadow-[0_6px_18px_hsl(var(--foreground)/0.08)]'
const snapshotHeaderClass = 'flex items-center gap-2 px-3.5 py-2.5 max-md:flex-wrap'
const snapshotToggleButtonClass =
  'inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-foreground hover:text-primary transition-colors p-0 text-[0.9rem] font-semibold min-w-0'
const snapshotTablesListClass =
  'px-3.5 pb-3 pt-2 border-t border-border flex flex-col'
const tableRowClass =
  'flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-b-0'

const sourceBadgeClass =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.03em] whitespace-nowrap'

const auditRowClass =
  'rounded-[0.6rem] border border-border bg-card px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[0.85rem]'

const sectionClass =
  'mt-5 flex flex-col gap-2.5 [&_h2]:m-0 [&_h2]:text-[0.95rem] [&_h2]:font-semibold [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2'

export function SuperBackupsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotRun[]>([])
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null)
  const [audit, setAudit] = useState<RestoreAuditEntry[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [confirmText, setConfirmText] = useState('')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const reload = async () => {
    setError('')
    try {
      const [snaps, sched, log] = await Promise.all([
        listSnapshots(),
        getBackupSchedule(),
        listRestoreAudit(20),
      ])
      setSnapshots(snaps)
      setSchedule(sched)
      setAudit(log)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar backups.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const handleTriggerSnapshot = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await triggerSnapshot()
      setSuccess('Backup criado com sucesso.')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar backup.')
    } finally {
      setActionLoading(false)
    }
  }

  const closeConfirm = () => {
    setConfirm(null)
    setConfirmText('')
  }

  const expectedConfirmText = (() => {
    if (!confirm) return ''
    if (confirm.kind === 'restore_table') return `RESTAURAR ${confirm.table}`
    if (confirm.kind === 'restore_all') return `RESTAURAR TUDO ${confirm.runConfirmCode}`
    return ''
  })()

  const executeConfirm = async () => {
    if (!confirm) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      if (confirm.kind === 'restore_table') {
        await restoreTable(confirm.runId, confirm.table)
        setSuccess(`Tabela ${confirm.table} restaurada do snapshot ${confirm.runLabel}.`)
      } else if (confirm.kind === 'restore_all') {
        await restoreAll(confirm.runId)
        setSuccess(`Banco restaurado completamente do snapshot ${confirm.runLabel}.`)
      }
      closeConfirm()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao restaurar.')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Backups do banco" subtitle="Snapshots e restauração." />
        <article className={dashboardPanelClass}>
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        </article>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Backups do banco"
        subtitle="Snapshots por evento, criação sob demanda e restauração."
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => void handleTriggerSnapshot()}
            disabled={actionLoading}
          >
            {actionLoading ? <Spinner size="sm" /> : <PlayCircle size={14} />}
            <span>Criar backup agora</span>
          </Button>
        }
      />

      <article className={dashboardPanelClass}>
        {error && <p className={errorTextClass}>{error}</p>}
        {success && <p className={successTextClass}>{success}</p>}

        <section className={sectionClass}>
          <h2>
            <Clock size={15} /> Próximo backup automático
          </h2>
          {schedule && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className={statusCellClass}>
                <p className={statusLabelClass}>Snapshot interno</p>
                <p className={statusValueClass}>
                  {formatCountdown(schedule.next_internal_snapshot_utc, now)}
                </p>
                <p className={statusSubClass}>
                  {formatBrDateTime(schedule.next_internal_snapshot_utc)}
                </p>
              </div>
              <div className={statusCellClass}>
                <p className={statusLabelClass}>Dump externo (GitHub)</p>
                <p className={statusValueClass}>
                  {formatCountdown(schedule.next_external_dump_utc, now)}
                </p>
                <p className={statusSubClass}>
                  {formatBrDateTime(schedule.next_external_dump_utc)}
                </p>
              </div>
              <div className={statusCellClass}>
                <p className={statusLabelClass}>Total de snapshots</p>
                <p className={statusValueClass}>{schedule.total_runs}</p>
                <p className={statusSubClass}>
                  {schedule.last_snapshot_at
                    ? `Último: ${formatBrDateTime(schedule.last_snapshot_at)}`
                    : 'Nenhum criado ainda'}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={sectionClass}>
          <h2>
            <Database size={15} /> Snapshots disponiveis
          </h2>
          {snapshots.length === 0 ? (
            <p className={dashboardNoteClass}>
              Nenhum snapshot disponível ainda. Clique em "Criar backup agora" para gerar um na hora,
              ou aguarde o automático de segunda-feira.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {snapshots.map((snap) => {
                const isExpanded = expandedRunId === snap.snapshot_run_id
                const sourceMeta = sourceMetaMap[snap.trigger_source] ?? sourceMetaMap.unknown
                const SourceIcon = sourceMeta.Icon
                const runLabel = formatBrDateTime(snap.snapshot_started_at)
                const confirmCode = runConfirmCode(snap.snapshot_started_at)

                return (
                  <li key={snap.snapshot_run_id} className={snapshotCardClass}>
                    <header className={snapshotHeaderClass}>
                      <button
                        type="button"
                        className={snapshotToggleButtonClass}
                        onClick={() =>
                          setExpandedRunId(isExpanded ? null : snap.snapshot_run_id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className="shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="shrink-0" />
                        )}
                        <Calendar size={13} className="text-muted-foreground shrink-0" />
                        <span>{runLabel}</span>
                      </button>

                      <span className={`${sourceBadgeClass} ${sourceMeta.className}`}>
                        <SourceIcon size={11} />
                        {sourceMeta.label}
                      </span>

                      <span className="text-muted-foreground text-[0.82rem] flex-1 min-w-0 truncate">
                        {snap.table_count} tabelas - {formatNumber(snap.total_rows)} linhas
                      </span>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setConfirm({
                            kind: 'restore_all',
                            runId: snap.snapshot_run_id,
                            runLabel,
                            runConfirmCode: confirmCode,
                            table_count: snap.table_count,
                            total_rows: snap.total_rows,
                          })
                        }
                        disabled={actionLoading}
                      >
                        <RotateCcw size={13} />
                        <span>Restaurar tudo</span>
                      </Button>
                    </header>

                    {isExpanded && (
                      <ul className={snapshotTablesListClass}>
                        {snap.tables.map((t) => (
                          <li
                            key={`${snap.snapshot_run_id}-${t.table_name}`}
                            className={tableRowClass}
                          >
                            <span className="font-mono text-[0.82rem] break-all">
                              {t.table_name}
                              <span className="ml-2 text-muted-foreground">
                                ({formatNumber(t.row_count)} linhas)
                              </span>
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setConfirm({
                                  kind: 'restore_table',
                                  runId: snap.snapshot_run_id,
                                  runLabel,
                                  table: t.table_name,
                                  row_count: t.row_count,
                                })
                              }
                              disabled={actionLoading}
                            >
                              Restaurar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={sectionClass}>
          <h2>
            <History size={15} /> Histórico de ações
          </h2>
          {audit.length === 0 ? (
            <p className={dashboardNoteClass}>Nenhuma ação registrada ainda.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {audit.map((entry) => (
                <li key={entry.id} className={auditRowClass}>
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {entry.success ? (
                      <CheckCircle2
                        size={13}
                        className="text-success-foreground shrink-0"
                      />
                    ) : (
                      <AlertCircle size={13} className="text-destructive shrink-0" />
                    )}
                    <span className="font-semibold">{entry.performed_by_username}</span>
                    <span className="text-muted-foreground">
                      {entry.action === 'snapshot'
                        ? 'criou um snapshot'
                        : entry.action === 'restore_table'
                          ? `restaurou ${entry.table_name}`
                          : 'restaurou tudo'}
                      {entry.snapshot_date && ` (${formatBrDate(entry.snapshot_date)})`}
                    </span>
                    {!entry.success && entry.error_message && (
                      <span className="text-destructive text-[0.78rem] break-all">
                        - {entry.error_message}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[0.78rem]">
                    {formatBrDateTime(entry.performed_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      {confirm && (
        <div
          className={confirmModalBackdropClass}
          onClick={() => {
            if (!actionLoading) closeConfirm()
          }}
        >
          <div className={confirmModalClass} onClick={(e) => e.stopPropagation()}>
            {confirm.kind === 'restore_table' && (
              <>
                <h2>
                  Restaurar tabela <code>{confirm.table}</code>?
                </h2>
                <p>
                  Vai APAGAR todos os dados atuais de <code>{confirm.table}</code> e substituir
                  pelos dados do snapshot de {confirm.runLabel} ({formatNumber(confirm.row_count)}{' '}
                  linhas). Esta ação é irreversível.
                </p>
              </>
            )}
            {confirm.kind === 'restore_all' && (
              <>
                <h2>Restaurar TUDO do snapshot de {confirm.runLabel}?</h2>
                <p>
                  Vai APAGAR e substituir o conteudo de TODAS as tabelas ({confirm.table_count}{' '}
                  tabelas, {formatNumber(confirm.total_rows)} linhas). Dados criados depois desse
                  snapshot serão perdidos. Sua sessão pode expirar se seu usuário não existia
                  naquele momento.
                </p>
              </>
            )}

            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-[0.85rem] text-muted-foreground">
                Para confirmar, digite:{' '}
                <code className="font-bold">{expectedConfirmText}</code>
              </span>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={actionLoading}
                autoFocus
              />
            </label>

            <div className={confirmModalActionsClass}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeConfirm}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void executeConfirm()}
                disabled={actionLoading || confirmText !== expectedConfirmText}
              >
                {actionLoading && <Spinner size="sm" />}
                <span>Confirmar</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
