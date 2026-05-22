import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SuperBackupsPage } from './SuperBackupsPage'
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
} from '../../features/super/backups'

vi.mock('../../features/super/backups', () => ({
  getBackupSchedule: vi.fn(),
  listRestoreAudit: vi.fn(),
  listSnapshots: vi.fn(),
  restoreAll: vi.fn(),
  restoreTable: vi.fn(),
  triggerSnapshot: vi.fn(),
}))

const baseSchedule: BackupSchedule = {
  now_utc: '2026-05-21T12:00:00Z',
  next_internal_snapshot_utc: '2026-05-25T03:00:00Z',
  next_external_dump_utc: '2026-05-25T04:00:00Z',
  last_snapshot_at: '2026-05-21T10:00:00Z',
  total_runs: 1,
}

const baseSnapshot: SnapshotRun = {
  snapshot_run_id: 'run-1',
  snapshot_started_at: '2026-05-21T10:00:00Z',
  trigger_source: 'manual_ui',
  table_count: 2,
  total_rows: 25,
  tables: [
    { table_name: 'app_users', row_count: 10 },
    { table_name: 'app_projects', row_count: 15 },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <SuperBackupsPage />
    </MemoryRouter>,
  )

const mockedListSnapshots = vi.mocked(listSnapshots)
const mockedListAudit = vi.mocked(listRestoreAudit)
const mockedSchedule = vi.mocked(getBackupSchedule)
const mockedTrigger = vi.mocked(triggerSnapshot)
const mockedRestoreTable = vi.mocked(restoreTable)
const mockedRestoreAll = vi.mocked(restoreAll)

const setupHappy = (
  overrides: {
    snapshots?: SnapshotRun[]
    schedule?: BackupSchedule
    audit?: RestoreAuditEntry[]
  } = {},
) => {
  mockedListSnapshots.mockResolvedValue(overrides.snapshots ?? [baseSnapshot])
  mockedSchedule.mockResolvedValue(overrides.schedule ?? baseSchedule)
  mockedListAudit.mockResolvedValue(overrides.audit ?? [])
}

beforeEach(() => {
  mockedListSnapshots.mockReset()
  mockedListAudit.mockReset()
  mockedSchedule.mockReset()
  mockedTrigger.mockReset()
  mockedRestoreTable.mockReset()
  mockedRestoreAll.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SuperBackupsPage', () => {
  it('mostra loading inicial', () => {
    mockedListSnapshots.mockReturnValue(new Promise(() => {}))
    mockedSchedule.mockReturnValue(new Promise(() => {}))
    mockedListAudit.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('mostra erro quando carregamento falha', async () => {
    mockedListSnapshots.mockRejectedValue(new Error('falha de carga'))
    mockedSchedule.mockResolvedValue(baseSchedule)
    mockedListAudit.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('falha de carga')).toBeInTheDocument()
  })

  it('renderiza snapshots e contadores', async () => {
    setupHappy()
    renderPage()
    expect(await screen.findByText('21/05/2026, 07:00')).toBeInTheDocument()
    expect(screen.getByText(/2 tabelas - 25 linhas/)).toBeInTheDocument()
    expect(screen.getByText('Total de snapshots')).toBeInTheDocument()
  })

  it('mostra estado vazio quando nao ha snapshots', async () => {
    setupHappy({ snapshots: [] })
    renderPage()
    expect(
      await screen.findByText(/Nenhum snapshot disponivel ainda/),
    ).toBeInTheDocument()
  })

  it('expandir snapshot lista as tabelas individuais', async () => {
    setupHappy()
    renderPage()
    const toggle = await screen.findByRole('button', { name: /21\/05\/2026, 07:00/ })
    await userEvent.click(toggle)
    expect(screen.getByText(/app_users/)).toBeInTheDocument()
    expect(screen.getByText(/app_projects/)).toBeInTheDocument()
  })

  it('clicar em "Criar backup agora" chama triggerSnapshot e recarrega', async () => {
    setupHappy({ snapshots: [] })
    mockedTrigger.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText(/Nenhum snapshot disponivel ainda/)

    await userEvent.click(screen.getByRole('button', { name: /Criar backup agora/ }))

    await waitFor(() => {
      expect(mockedTrigger).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByText('Backup criado com sucesso.')).toBeInTheDocument()
    expect(mockedListSnapshots).toHaveBeenCalledTimes(2) // load inicial + reload
  })

  it('botao Confirmar do modal de restaurar tudo so habilita com texto correto', async () => {
    setupHappy()
    renderPage()
    await screen.findByText('21/05/2026, 07:00')

    await userEvent.click(screen.getByRole('button', { name: /Restaurar tudo/ }))

    const confirmButton = screen.getByRole('button', { name: /Confirmar/ })
    expect(confirmButton).toBeDisabled()

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'RESTAURAR TUDO 20260521-1000')
    expect(confirmButton).toBeEnabled()

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(mockedRestoreAll).toHaveBeenCalledWith('run-1')
    })
  })

  it('Cancelar do modal fecha sem chamar restoreAll', async () => {
    setupHappy()
    renderPage()
    await screen.findByText('21/05/2026, 07:00')

    await userEvent.click(screen.getByRole('button', { name: /Restaurar tudo/ }))
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(mockedRestoreAll).not.toHaveBeenCalled()
  })

  it('restore por tabela exige texto e chama restoreTable', async () => {
    setupHappy()
    mockedRestoreTable.mockResolvedValue(undefined)
    renderPage()
    const toggle = await screen.findByRole('button', { name: /21\/05\/2026, 07:00/ })
    await userEvent.click(toggle)

    const restoreButtons = screen.getAllByRole('button', { name: 'Restaurar' })
    await userEvent.click(restoreButtons[0])

    const confirmButton = screen.getByRole('button', { name: /Confirmar/ })
    expect(confirmButton).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), 'RESTAURAR app_users')
    expect(confirmButton).toBeEnabled()

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(mockedRestoreTable).toHaveBeenCalledWith('run-1', 'app_users')
    })
  })
})
