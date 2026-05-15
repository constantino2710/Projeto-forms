import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { FileSpreadsheet, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  type DisciplineImportRow,
  type SuperDisciplineRow,
  clearDisciplines,
  listAdminDisciplines,
  replaceDisciplines,
  upsertDisciplines,
} from '../../features/disciplines/disciplines'
import { parseSpreadsheetFile } from '../../features/disciplines/spreadsheet'
import { formLabelClass } from '../../lib/formStyles'
import {
  activeToggleButtonClass,
  confirmModalActionsClass,
  confirmModalBackdropClass,
  confirmModalClass,
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  projectsHeaderClass,
  successTextClass,
  viewToggleClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 10

type UploadMode = 'replace' | 'upsert'

const importModalClass =
  'w-[min(720px,100%)] max-h-[min(90vh,720px)] overflow-y-auto border border-border rounded-[var(--radius)] bg-card text-foreground shadow-[0_22px_64px_hsl(0_0%_0%/0.45)] p-5 flex flex-col gap-3'

const modalHeaderClass =
  'flex items-start justify-between gap-3 [&_h2]:m-0 [&_h2]:text-[1.1rem] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-muted-foreground [&_p]:text-[0.85rem]'

const previewTableClass =
  'mt-2 w-full border border-border rounded-[calc(var(--radius)-2px)] overflow-hidden text-[0.85rem] [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-bold [&_td]:px-2 [&_td]:py-1.5 [&_td]:border-t [&_td]:border-border'

const previewScrollClass = 'max-h-[260px] overflow-auto'

const dataTableWrapClass =
  'mt-3 border border-border rounded-[calc(var(--radius)-2px)] overflow-hidden bg-background'

const dataTableScrollClass = 'overflow-x-auto'

const dataTableClass = cn(
  'w-full border-collapse text-[0.88rem]',
  '[&_thead]:bg-muted',
  '[&_th]:sticky [&_th]:top-0 [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:text-[0.78rem] [&_th]:uppercase [&_th]:tracking-[0.04em] [&_th]:text-muted-foreground [&_th]:border-b [&_th]:border-border [&_th]:whitespace-nowrap',
  '[&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-border [&_td]:align-top',
  '[&_tbody_tr:nth-child(even)]:bg-muted/30',
  '[&_tbody_tr:hover]:bg-[hsl(var(--sidebar-link-hover-bg)/0.55)]',
  '[&_tbody_tr:last-child_td]:border-b-0',
)

const codeCellClass = 'font-bold text-foreground whitespace-nowrap'
const periodoCellClass = 'whitespace-nowrap text-muted-foreground font-semibold'
const emptyStateClass =
  'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-muted-foreground'

export function SuperDisciplinesPage() {
  const [rows, setRows] = useState<SuperDisciplineRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [mode, setMode] = useState<UploadMode>('replace')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<DisciplineImportRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([])
  const [parseError, setParseError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = async () => {
    setError('')
    setIsLoading(true)
    try {
      const { rows: data, total: totalCount } = await listAdminDisciplines({
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setRows(data)
      setTotal(totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar disciplinas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const resetUploadState = () => {
    setFile(null)
    setPreview([])
    setSkipped(0)
    setDetectedHeaders([])
    setParseError('')
  }

  const closeImportModal = () => {
    if (isSaving) return
    setIsImportOpen(false)
    resetUploadState()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setActionMessage('')
    setActionError('')
    setParseError('')
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setPreview([])
    setSkipped(0)
    setDetectedHeaders([])
    if (!selected) return

    try {
      const result = await parseSpreadsheetFile(selected)
      setPreview(result.rows)
      setSkipped(result.skipped)
      setDetectedHeaders(result.detectedHeaders)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Falha ao ler arquivo.')
    } finally {
      event.target.value = ''
    }
  }

  const handleApply = async () => {
    if (preview.length === 0) return
    setActionError('')
    setActionMessage('')
    setIsSaving(true)
    try {
      if (mode === 'replace') {
        const result = await replaceDisciplines(preview)
        setActionMessage(`Catalogo substituido. ${result.inserted} linha(s) importada(s).`)
      } else {
        const result = await upsertDisciplines(preview)
        setActionMessage(`Mesclagem aplicada. ${result.affected} linha(s) atualizada(s)/inserida(s).`)
      }
      resetUploadState()
      setIsImportOpen(false)
      setPage(0)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao salvar disciplinas.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearAll = async () => {
    setActionError('')
    setActionMessage('')
    setIsClearing(true)
    try {
      const result = await clearDisciplines()
      setActionMessage(`Catalogo limpo. ${result.deleted} linha(s) removida(s).`)
      setConfirmClear(false)
      setPage(0)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha ao limpar catalogo.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <article className={dashboardPanelClass}>
      <div className={projectsHeaderClass}>
        <div>
          <h1>Catalogo de Disciplinas</h1>
          <p>
            Importe uma planilha (CSV ou Excel) com as colunas <strong>PER</strong>,{' '}
            <strong>Docente</strong>, <strong>Cursos</strong>, <strong>Disciplina</strong> e{' '}
            <strong>COD de extensao</strong>. Esses dados ajudam os professores a preencher os
            formularios via dropdown e autofill.
          </p>
        </div>
        <div className={cn(viewToggleClass, 'max-md:w-full max-md:flex-col')}>
          <Button type="button" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload size={14} />
            <span>Importar planilha</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={total === 0 || isClearing}
          >
            <Trash2 size={14} />
            <span>Limpar tudo</span>
          </Button>
        </div>
      </div>

      {actionMessage && <p className={cn(successTextClass, 'mt-3')}>{actionMessage}</p>}
      {actionError && <p className={cn(errorTextClass, 'mt-3')}>{actionError}</p>}
      {error && <p className={cn(errorTextClass, 'mt-3')}>{error}</p>}

      <div className={cn(projectsHeaderClass, 'mt-6')}>
        <div>
          <h2 className="m-0 text-[1.05rem]">Disciplinas cadastradas</h2>
          <p className={dashboardNoteClass}>Total: {total}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={isLoading}
        >
          <RefreshCw size={14} />
          <span>Atualizar</span>
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-3 flex gap-2 max-md:flex-col">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por COD, disciplina, curso, docente ou periodo"
        />
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
      </form>

      <div className={dataTableWrapClass}>
        {isLoading ? (
          <div className={emptyStateClass}>
            <p className="m-0">Carregando...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className={emptyStateClass}>
            <FileSpreadsheet size={28} className="opacity-60" />
            <p className="m-0">Nenhuma disciplina cadastrada.</p>
            <p className="m-0 text-[0.82rem]">Use "Importar planilha" para preencher o catalogo.</p>
          </div>
        ) : (
          <div className={dataTableScrollClass}>
            <table className={dataTableClass}>
              <thead>
                <tr>
                  <th>COD</th>
                  <th>Disciplina</th>
                  <th>Curso</th>
                  <th>Docente</th>
                  <th>PER</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={codeCellClass}>{row.codigo}</td>
                    <td>{row.disciplina}</td>
                    <td>{row.curso}</td>
                    <td>{row.docente}</td>
                    <td className={periodoCellClass}>{row.periodo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className={cn(viewToggleClass, 'mt-4 items-center')}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className={cn(dashboardNoteClass, 'self-center mx-3 my-0')}>
            Pagina {page + 1} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}

      {isImportOpen && (
        <div className={confirmModalBackdropClass} onClick={closeImportModal}>
          <div
            className={importModalClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={modalHeaderClass}>
              <div>
                <h2 id="import-modal-title" className="flex items-center gap-2">
                  <FileSpreadsheet size={18} /> Importar planilha
                </h2>
                <p>Selecione um arquivo .csv, .xls ou .xlsx com as colunas obrigatorias.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-8 min-h-8 p-0 w-8"
                onClick={closeImportModal}
                disabled={isSaving}
                aria-label="Fechar"
              >
                <X size={14} />
              </Button>
            </div>

            <div className={viewToggleClass}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={mode === 'replace' ? activeToggleButtonClass : ''}
                onClick={() => setMode('replace')}
                disabled={isSaving}
              >
                Substituir tudo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={mode === 'upsert' ? activeToggleButtonClass : ''}
                onClick={() => setMode('upsert')}
                disabled={isSaving}
              >
                Mesclar (por COD)
              </Button>
            </div>
            <p className={dashboardNoteClass}>
              {mode === 'replace'
                ? 'Substituir: apaga TODO o catalogo atual e insere apenas as linhas validas da nova planilha.'
                : 'Mesclar: atualiza linhas existentes com o mesmo COD e adiciona novas. Linhas antigas nao listadas sao mantidas.'}
            </p>

            <label className={formLabelClass}>
              Arquivo (.xlsx, .xls ou .csv)
              <Input
                type="file"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFileChange}
                disabled={isSaving}
              />
            </label>

            {file && <p className={dashboardNoteClass}>Selecionado: {file.name}</p>}
            {parseError && <p className={errorTextClass}>{parseError}</p>}

            {detectedHeaders.length > 0 && (
              <p className={dashboardNoteClass}>
                Colunas detectadas: {detectedHeaders.join(', ')}
              </p>
            )}

            {preview.length > 0 && (
              <>
                <p className={dashboardNoteClass}>
                  {preview.length} linha(s) prontas para importar
                  {skipped > 0
                    ? ` • ${skipped} linha(s) ignoradas (campos vazios ou COD duplicado)`
                    : ''}
                </p>
                <div className={cn(previewScrollClass)}>
                  <table className={previewTableClass}>
                    <thead>
                      <tr>
                        <th>COD</th>
                        <th>Disciplina</th>
                        <th>Curso</th>
                        <th>Docente</th>
                        <th>PER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((row, index) => (
                        <tr key={`${row.codigo}-${index}`}>
                          <td>{row.codigo}</td>
                          <td>{row.disciplina}</td>
                          <td>{row.curso}</td>
                          <td>{row.docente}</td>
                          <td>{row.periodo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 50 && (
                    <p className={dashboardNoteClass}>... mostrando 50 de {preview.length}</p>
                  )}
                </div>
              </>
            )}

            <div className={cn(confirmModalActionsClass, 'mt-2')}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeImportModal}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={isSaving || preview.length === 0}
              >
                <Upload size={14} />
                <span>{isSaving ? 'Importando...' : 'Confirmar importacao'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmClear && (
        <div
          className={confirmModalBackdropClass}
          onClick={() => {
            if (!isClearing) setConfirmClear(false)
          }}
        >
          <div
            className={confirmModalClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="clear-modal-title" className="flex items-center gap-2">
              <Trash2 size={16} /> Confirmar limpeza
            </h2>
            <p>
              Esta acao remove TODAS as disciplinas cadastradas. Os professores nao terao autofill
              no formulario ate uma nova planilha ser importada.
            </p>
            <div className={confirmModalActionsClass}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmClear(false)}
                disabled={isClearing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={isClearing}
              >
                {isClearing ? 'Removendo...' : 'Confirmar limpeza'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
