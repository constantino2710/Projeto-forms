import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExtensionProjectFields } from '../../components/projects/ExtensionProjectFields'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { Textarea } from '../../components/ui/textarea'
import {
  type DisciplineRow,
  listDisciplines,
} from '../../features/disciplines/disciplines'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'
import {
  createEmptyExtensionPlan,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import {
  collectFormErrors,
  disciplineFormSchema,
  extensionFormSchema,
} from '../../features/projects/projectSchemas'
import { createUserProject } from '../../features/projects/userProjects'
import { projectFormLabelClass, selectInputClass } from '../../lib/formStyles'
import {
  attachmentActionsClass,
  attachmentItemClass,
  attachmentMetaClass,
  attachmentNameClass,
  attachmentsListClass,
  dashboardPanelClass,
  errorTextClass,
  formValidationSummaryClass,
  formValidationTitleClass,
  projectFormClass,
  projectGrid2Class,
  successTextClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

const MIN_PROJECT_DATE = '2000-01-01'
const MAX_PROJECT_DATE = '2100-12-31'

const projectTypeToggleClass =
  'mt-4 inline-flex gap-2 p-1.5 rounded-full bg-muted/60'

const projectTypeOptionLayoutClass =
  'border border-transparent rounded-full text-[0.86rem] font-semibold leading-none px-4 py-2.5 cursor-pointer transition-[background-color,border-color,color] duration-150 ease-in-out'

const projectTypeOptionInactiveClass =
  'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground'

const projectTypeOptionActiveClass =
  'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'

type DisciplineFormData = {
  title: string
  thematicArea: string
  codigoDisciplina: string
  semestreLetivo: string
  course: string
  periodStart: string
  periodEnd: string
  targetAudience: string
  budget: string
  description: string
}

const createEmptyDisciplineForm = (): DisciplineFormData => ({
  title: '',
  thematicArea: '',
  codigoDisciplina: '',
  semestreLetivo: '',
  course: '',
  periodStart: '',
  periodEnd: '',
  targetAudience: '',
  budget: '',
  description: '',
})

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [projectType, setProjectType] = useState<'extensao' | 'disciplina'>('extensao')
  const [extensionForm, setExtensionForm] = useState<ExtensionPlanData>(() => createEmptyExtensionPlan())
  const [disciplineForm, setDisciplineForm] = useState<DisciplineFormData>(() => createEmptyDisciplineForm())
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [catalog, setCatalog] = useState<DisciplineRow[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsCatalogLoading(true)
      setCatalogError('')
      try {
        const data = await listDisciplines()
        setCatalog(data)
      } catch (err) {
        setCatalogError(err instanceof Error ? err.message : 'Falha ao carregar catalogo.')
      } finally {
        setIsCatalogLoading(false)
      }
    }
    load()
  }, [])

  const uniqueOptions = useMemo(() => {
    const codigos = new Set<string>()
    const disciplinas = new Set<string>()
    const cursos = new Set<string>()
    const periodos = new Set<string>()
    for (const row of catalog) {
      codigos.add(row.codigo)
      disciplinas.add(row.disciplina)
      cursos.add(row.curso)
      periodos.add(row.periodo)
    }
    const sorted = (set: Set<string>) => Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      codigos: sorted(codigos),
      disciplinas: sorted(disciplinas),
      cursos: sorted(cursos),
      periodos: sorted(periodos),
    }
  }, [catalog])

  const applyCatalogAutofill = (
    field: 'codigo' | 'disciplina' | 'curso' | 'periodo',
    value: string,
  ) => {
    setDisciplineForm((prev) => {
      const fieldMap = {
        codigo: 'codigoDisciplina',
        disciplina: 'title',
        curso: 'course',
        periodo: 'semestreLetivo',
      } as const
      const next: DisciplineFormData = { ...prev, [fieldMap[field]]: value }

      if (!value) {
        return next
      }

      const matches = catalog.filter((row) => row[field] === value)
      if (matches.length === 1) {
        const row = matches[0]
        next.codigoDisciplina = row.codigo
        next.title = row.disciplina
        next.course = row.curso
        next.semestreLetivo = row.periodo
      }
      return next
    })
  }

  const formatAttachmentSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      return
    }

    setPendingFiles((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setValidationErrors([])

    const parseResult =
      projectType === 'extensao'
        ? extensionFormSchema.safeParse(extensionForm)
        : disciplineFormSchema.safeParse(disciplineForm)

    if (!parseResult.success) {
      setValidationErrors(collectFormErrors(parseResult.error.issues))
      return
    }

    setIsSubmitting(true)

    const parsedBudget = projectType === 'extensao' ? 0 : Number(disciplineForm.budget)

    try {
      const project =
        projectType === 'extensao'
          ? await createUserProject({
              title: extensionForm.title,
              thematicArea: extensionForm.unicapProgram,
              course: null,
              periodStart: extensionForm.periodStart,
              periodEnd: extensionForm.periodEnd,
              targetAudience: extensionForm.targetAudience,
              budget: 0,
              description: extensionForm.projectSummary,
              type: 'extensao',
              extensionForm,
            })
          : await createUserProject({
              title: disciplineForm.title,
              thematicArea: disciplineForm.thematicArea,
              course: disciplineForm.course,
              periodStart: disciplineForm.periodStart,
              periodEnd: disciplineForm.periodEnd,
              targetAudience: disciplineForm.targetAudience,
              budget: parsedBudget,
              description: disciplineForm.description,
              type: 'disciplina',
              codigo_disciplina: disciplineForm.codigoDisciplina,
              semestre_letivo: disciplineForm.semestreLetivo,
            })

      if (pendingFiles.length > 0) {
        const failedUploads: string[] = []

        for (const file of pendingFiles) {
          try {
            await uploadProjectAttachment(project.id, file)
          } catch {
            failedUploads.push(file.name)
          }
        }

        if (failedUploads.length > 0) {
          throw new Error(`Projeto criado, mas falhou o upload de: ${failedUploads.join(', ')}.`)
        }
      }

      setMessage('Projeto criado com sucesso.')
      navigate('/usuario/meus-projetos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar projeto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className={dashboardPanelClass}>
      <h1>Novo Projeto</h1>
      <p>Escolha o tipo e preencha o formulario correspondente.</p>

      <div className={projectTypeToggleClass}>
        <button
          type="button"
          onClick={() => setProjectType('extensao')}
          className={cn(
            projectTypeOptionLayoutClass,
            projectType === 'extensao' ? projectTypeOptionActiveClass : projectTypeOptionInactiveClass,
          )}
        >
          Projeto de Extensao
        </button>
        <button
          type="button"
          onClick={() => setProjectType('disciplina')}
          className={cn(
            projectTypeOptionLayoutClass,
            projectType === 'disciplina' ? projectTypeOptionActiveClass : projectTypeOptionInactiveClass,
          )}
        >
          Disciplina Extensionista
        </button>
      </div>

      <form onSubmit={handleSubmit} className={projectFormClass}>
        {projectType === 'extensao' ? (
          <ExtensionProjectFields form={extensionForm} onChange={setExtensionForm} disabled={isSubmitting} />
        ) : (
          <>
            {!isCatalogLoading && catalog.length === 0 && !catalogError && (
              <p className="m-0 text-[0.88rem] text-muted-foreground rounded-xl bg-muted/50 p-3">
                Catalogo de disciplinas vazio. Peca ao superadmin para importar a planilha para
                habilitar autofill e dropdowns.
              </p>
            )}
            {catalogError && (
              <p className="m-0 text-destructive font-semibold">{catalogError}</p>
            )}

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Disciplina
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.title}
                    onChange={(event) => applyCatalogAutofill('disciplina', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.disciplinas.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={disciplineForm.title}
                    onChange={(event) => setDisciplineForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                )}
              </label>

              <label className={projectFormLabelClass}>
                Codigo da Disciplina
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.codigoDisciplina}
                    onChange={(event) => applyCatalogAutofill('codigo', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.codigos.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Ex: IF976"
                    value={disciplineForm.codigoDisciplina}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, codigoDisciplina: event.target.value }))
                    }
                    required
                  />
                )}
              </label>
            </div>

            <label className={projectFormLabelClass}>
              Area tematica
              <Input
                value={disciplineForm.thematicArea}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, thematicArea: event.target.value }))
                }
                required
              />
            </label>

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Curso
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.course}
                    onChange={(event) => applyCatalogAutofill('curso', event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.cursos.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={disciplineForm.course}
                    onChange={(event) => setDisciplineForm((prev) => ({ ...prev, course: event.target.value }))}
                  />
                )}
              </label>

              <label className={projectFormLabelClass}>
                Semestre Letivo
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.semestreLetivo}
                    onChange={(event) => applyCatalogAutofill('periodo', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.periodos.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Ex: 2026.1"
                    value={disciplineForm.semestreLetivo}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, semestreLetivo: event.target.value }))
                    }
                    required
                  />
                )}
              </label>
            </div>

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Inicio
                <Input
                  type="date"
                  value={disciplineForm.periodStart}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({ ...prev, periodStart: event.target.value }))
                  }
                  min={MIN_PROJECT_DATE}
                  max={disciplineForm.periodEnd || MAX_PROJECT_DATE}
                  required
                />
              </label>
              <label className={projectFormLabelClass}>
                Fim
                <Input
                  type="date"
                  value={disciplineForm.periodEnd}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({ ...prev, periodEnd: event.target.value }))
                  }
                  min={disciplineForm.periodStart || MIN_PROJECT_DATE}
                  max={MAX_PROJECT_DATE}
                  required
                />
              </label>
            </div>

            <label className={projectFormLabelClass}>
              Publico-alvo
              <Input
                value={disciplineForm.targetAudience}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, targetAudience: event.target.value }))
                }
                required
              />
            </label>

            <label className={projectFormLabelClass}>
              Orcamento
              <Input
                type="number"
                min={0}
                step="0.01"
                value={disciplineForm.budget}
                onChange={(event) => setDisciplineForm((prev) => ({ ...prev, budget: event.target.value }))}
                required
              />
            </label>

            <label className={projectFormLabelClass}>
              Descricao
              <Textarea
                value={disciplineForm.description}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Descreva o que sera feito no projeto"
                rows={5}
                required
              />
            </label>
          </>
        )}

        <label className={projectFormLabelClass}>
          Anexos
          <Input type="file" multiple onChange={handleFilesSelected} disabled={isSubmitting} />
        </label>

        {pendingFiles.length > 0 && (
          <ul className={attachmentsListClass}>
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className={attachmentItemClass}>
                <div>
                  <p className={attachmentNameClass}>{file.name}</p>
                  <p className={attachmentMetaClass}>{formatAttachmentSize(file.size)}</p>
                </div>
                <div className={attachmentActionsClass}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePendingFile(index)}
                    disabled={isSubmitting}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {validationErrors.length > 0 && (
          <div className={formValidationSummaryClass}>
            <p className={formValidationTitleClass}>Corrija os campos abaixo:</p>
            <ul>
              {validationErrors.map((msg, index) => (
                <li key={`${msg}-${index}`}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className={errorTextClass}>{error}</p>}
        {message && <p className={successTextClass}>{message}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner size="sm" />}
          <span>Criar projeto</span>
        </Button>
      </form>
    </article>
  )
}
