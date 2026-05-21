import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  History,
  PlayCircle,
  RotateCcw,
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
  type SnapshotGroup,
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

const sectionClass =
  'mt-5 p-5 flex flex-col gap-3 rounded-[1.25rem] bg-card shadow-[0_4px_18px_hsl(var(--foreground)/0.06)]'

type ConfirmState =
  | { kind: 'restore_table'; date: string; table: string; row_count: number }
  | { kind: 'restore_all'; date: string; table_count: number; total_rows: number }
  | null

const formatBrDateTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const formatBrDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-')
  return `${d}/${m}/${y}`
}

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

export function SuperBackupsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotGroup[]>([])
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null)
  const [audit, setAudit] = useState<RestoreAuditEntry[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [confirmText, setConfirmText] = useState('')

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
    if (confirm.kind === 'restore_all') return `RESTAURAR TUDO ${confirm.date}`
    return ''
  })()

  const executeConfirm = async () => {
    if (!confirm) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      if (confirm.kind === 'restore_table') {
        await restoreTable(confirm.table, confirm.date)
        setSuccess(
          `Tabela ${confirm.table} restaurada do snapshot ${formatBrDate(confirm.date)}.`,
        )
      } else if (confirm.kind === 'restore_all') {
        await restoreAll(confirm.date)
        setSuccess(`Banco restaurado completamente do snapshot ${formatBrDate(confirm.date)}.`)
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
      <article className={dashboardPanelClass}>
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      </article>
    )
  }

  return (
    <article className={dashboardPanelClass}>
      <PageHeader
        title="Backups do banco"
        subtitle="Snapshots semanais e restauracao de dados."
      />

      {error && <p className={errorTextClass}>{error}</p>}
      {success && <p className={successTextClass}>{success}</p>}

      <section className={sectionClass}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-base flex items-center gap-2">
            <Clock size={16} /> Proximo backup automatico
          </h2>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleTriggerSnapshot()}
            disabled={actionLoading}
          >
            {actionLoading ? <Spinner size="sm" /> : <PlayCircle size={14} />}
            <span>Criar backup agora</span>
          </Button>
        </header>

        {schedule && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-[1rem] bg-muted/40 p-3">
              <p className="m-0 text-[0.72rem] text-muted-foreground uppercase tracking-[0.04em]">
                Snapshot interno
              </p>
              <p className="mt-1 m-0 text-[1.1rem] font-bold">
                {formatCountdown(schedule.next_internal_snapshot_utc, now)}
              </p>
              <p className={dashboardNoteClass}>
                {formatBrDateTime(schedule.next_internal_snapshot_utc)}
              </p>
            </div>
            <div className="rounded-[1rem] bg-muted/40 p-3">
              <p className="m-0 text-[0.72rem] text-muted-foreground uppercase tracking-[0.04em]">
                Dump externo (GitHub)
              </p>
              <p className="mt-1 m-0 text-[1.1rem] font-bold">
                {formatCountdown(schedule.next_external_dump_utc, now)}
              </p>
              <p className={dashboardNoteClass}>
                {formatBrDateTime(schedule.next_external_dump_utc)}
              </p>
            </div>
          </div>
        )}
        {schedule?.last_snapshot_date && (
          <p className={dashboardNoteClass}>
            Ultimo snapshot registrado: {formatBrDate(schedule.last_snapshot_date)}.
          </p>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className="m-0 text-base flex items-center gap-2">
          <Database size={16} /> Snapshots disponiveis
        </h2>
        {snapshots.length === 0 ? (
          <p className={dashboardNoteClass}>
            Nenhum snapshot disponivel ainda. O proximo sera gerado automaticamente na segunda-feira.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {snapshots.map((snap) => (
              <li
                key={snap.snapshot_date}
                className="rounded-[1rem] bg-muted/30 p-4 flex flex-col gap-2"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 font-semibold flex items-center gap-2">
                      <Calendar size={14} />
                      {formatBrDate(snap.snapshot_date)}
                    </p>
                    <p className={dashboardNoteClass}>
                      {snap.table_count} tabelas - {snap.total_rows} linhas
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setConfirm({
                        kind: 'restore_all',
                        date: snap.snapshot_date,
                        table_count: snap.table_count,
                        total_rows: snap.total_rows,
                      })
                    }
                    disabled={actionLoading}
                  >
                    <RotateCcw size={14} />
                    <span>Restaurar TUDO desta data</span>
                  </Button>
                </header>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[0.85rem] text-muted-foreground">
                    Ver tabelas individualmente
                  </summary>
                  <ul className="mt-2 m-0 p-0 list-none flex flex-col gap-1">
                    {snap.tables.map((t) => (
                      <li
                        key={`${snap.snapshot_date}-${t.table_name}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1"
                      >
                        <span className="font-mono text-[0.85rem] break-all">
                          {t.table_name}{' '}
                          <span className="text-muted-foreground">({t.row_count} linhas)</span>
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirm({
                              kind: 'restore_table',
                              date: snap.snapshot_date,
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
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className="m-0 text-base flex items-center gap-2">
          <History size={16} /> Historico de acoes
        </h2>
        {audit.length === 0 ? (
          <p className={dashboardNoteClass}>Nenhuma acao registrada ainda.</p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {audit.map((entry) => (
              <li
                key={entry.id}
                className="rounded-[0.75rem] bg-muted/30 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[0.85rem]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  {entry.success ? (
                    <CheckCircle2 size={14} className="text-success-foreground shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-destructive shrink-0" />
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
                  pelos dados do snapshot de {formatBrDate(confirm.date)} ({confirm.row_count}{' '}
                  linhas). Esta acao e irreversivel.
                </p>
              </>
            )}
            {confirm.kind === 'restore_all' && (
              <>
                <h2>Restaurar TUDO de {formatBrDate(confirm.date)}?</h2>
                <p>
                  Vai APAGAR e substituir o conteudo de TODAS as tabelas ({confirm.table_count}{' '}
                  tabelas, {confirm.total_rows} linhas). Dados criados depois de{' '}
                  {formatBrDate(confirm.date)} serao perdidos. Sua sessao pode expirar se seu
                  usuario nao existia naquela data.
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
    </article>
  )
}
