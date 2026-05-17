import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExtensionProjectFields } from '../../components/projects/ExtensionProjectFields'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import {
  type DisciplineRow,
  listDisciplines,
} from '../../features/disciplines/disciplines'
import {
  buildDisciplineExtensionForm,
  buildDisciplineMetadataDescription,
  type DisciplineManagerialOption,
} from '../../features/disciplines/disciplineProjectMetadata'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'
import {
  createEmptyExtensionPlan,
  DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS,
  UNICAP_PROGRAM_OPTIONS,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import {
  collectFormErrors,
  disciplineExtensionAxesSchema,
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
  codigoExtensao: string
  disciplineName: string
  codigoDisciplina: string
  codigoTurma: string
  disciplinaGerencial: DisciplineManagerialOption
  managedCourses: string
  semestreLetivo: string
  course: string
  periodStart: string
  periodEnd: string
  budget: string
}

const createEmptyDisciplineForm = (): DisciplineFormData => ({
  title: '',
  thematicArea: '',
  codigoExtensao: '',
  disciplineName: '',
  codigoDisciplina: '',
  codigoTurma: '',
  disciplinaGerencial: 'Nao',
  managedCourses: '',
  semestreLetivo: '',
  course: '',
  periodStart: '',
  periodEnd: '',
  budget: '',
})

const DISCIPLINE_MANAGERIAL_OPTIONS: DisciplineManagerialOption[] = ['Sim', 'Nao']

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [projectType, setProjectType] = useState<'extensao' | 'disciplina'>('extensao')
  const [extensionForm, setExtensionForm] = useState<ExtensionPlanData>(() => createEmptyExtensionPlan())
  const [disciplineExtensionForm, setDisciplineExtensionForm] = useState<ExtensionPlanData>(() =>
    createEmptyExtensionPlan(),
  )
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
    const codigosExtensao = new Set<string>()
    const disciplinas = new Set<string>()
    const cursos = new Set<string>()
    const periodos = new Set<string>()
    const cargasHorarias = new Set<string>()
    const codigosDisciplina = new Set<string>()
    const codigosTurma = new Set<string>()
    for (const row of catalog) {
      codigosExtensao.add(row.codigo)
      disciplinas.add(row.disciplina)
      cursos.add(row.curso)
      periodos.add(row.periodo)
      cargasHorarias.add(row.carga_horaria)
      codigosDisciplina.add(row.codigo_disciplina)
      codigosTurma.add(row.codigo_turma)
    }
    const sorted = (set: Set<string>) => Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      codigosExtensao: sorted(codigosExtensao),
      disciplinas: sorted(disciplinas),
      cursos: sorted(cursos),
      periodos: sorted(periodos),
      cargasHorarias: sorted(cargasHorarias),
      codigosDisciplina: sorted(codigosDisciplina),
      codigosTurma: sorted(codigosTurma),
    }
  }, [catalog])

  const applyCatalogAutofill = (
    field:
      | 'codigo'
      | 'disciplina'
      | 'curso'
      | 'periodo'
      | 'codigo_disciplina'
      | 'codigo_turma',
    value: string,
  ) => {
    setDisciplineForm((prev) => {
      const fieldMap = {
        codigo: 'codigoExtensao',
        disciplina: 'disciplineName',
        curso: 'course',
        periodo: 'semestreLetivo',
        codigo_disciplina: 'codigoDisciplina',
        codigo_turma: 'codigoTurma',
      } as const
      const next: DisciplineFormData = { ...prev, [fieldMap[field]]: value }

      if (!value) {
        return next
      }

      const matches = catalog.filter((row) => row[field] === value)
      if (matches.length === 1) {
        const row = matches[0]
        next.codigoExtensao = row.codigo
        next.disciplineName = row.disciplina
        next.course = row.curso
        next.semestreLetivo = row.periodo
        next.budget = row.carga_horaria
        next.codigoDisciplina = row.codigo_disciplina
        next.codigoTurma = row.codigo_turma
        next.disciplinaGerencial = row.disciplina_gerencial ? 'Sim' : 'Nao'
        next.managedCourses = row.cursos_gerenciados ?? ''
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

    const parseResults =
      projectType === 'extensao'
        ? [extensionFormSchema.safeParse(extensionForm)]
        : [
            disciplineFormSchema.safeParse(disciplineForm),
            disciplineExtensionAxesSchema.safeParse(disciplineExtensionForm),
          ]

    const failedResults = parseResults.filter((result) => !result.success)

    if (failedResults.length > 0) {
      setValidationErrors(
        collectFormErrors(failedResults.flatMap((result) => (!result.success ? result.error.issues : []))),
      )
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
              course: null,
              periodStart: disciplineForm.periodStart,
              periodEnd: disciplineForm.periodEnd,
              targetAudience: disciplineForm.disciplineName,
              budget: parsedBudget,
              description: buildDisciplineMetadataDescription({
                codigoExtensao: disciplineForm.codigoExtensao,
                codigoDisciplina: disciplineForm.codigoDisciplina,
                codigoTurma: disciplineForm.codigoTurma,
                disciplinaGerencial: disciplineForm.disciplinaGerencial,
                cursosGerenciados: disciplineForm.managedCourses,
              }),
              type: 'disciplina',
              codigo_disciplina: disciplineForm.codigoDisciplina,
              semestre_letivo: disciplineForm.semestreLetivo,
              extensionForm: buildDisciplineExtensionForm(disciplineForm, disciplineExtensionForm),
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

            <label className={projectFormLabelClass}>
              Titulo da Iniciativa
              <Input
                value={disciplineForm.title}
                onChange={(event) => setDisciplineForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>

            <label className={projectFormLabelClass}>
              Programa Unicap
              <select
                className={selectInputClass}
                value={disciplineForm.thematicArea}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, thematicArea: event.target.value }))
                }
                required
              >
                <option value="">Selecione</option>
                {UNICAP_PROGRAM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Nome da Disciplina
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.disciplineName}
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
                    value={disciplineForm.disciplineName}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, disciplineName: event.target.value }))
                    }
                    required
                  />
                )}
              </label>

              <label className={projectFormLabelClass}>
                Codigo Extensao
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.codigoExtensao}
                    onChange={(event) => applyCatalogAutofill('codigo', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.codigosExtensao.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Ex: 2025.2001"
                    value={disciplineForm.codigoExtensao}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, codigoExtensao: event.target.value }))
                    }
                    required
                  />
                )}
              </label>
            </div>

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Curso em que a disciplina esta vinculada
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
                Periodo de realizacao da disciplina
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
                    placeholder="Ex: 2025.2"
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
                Carga horaria de Extensao da Disciplina
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.budget}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, budget: event.target.value }))
                    }
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.cargasHorarias.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={disciplineForm.budget}
                    onChange={(event) => setDisciplineForm((prev) => ({ ...prev, budget: event.target.value }))}
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
                    onChange={(event) => applyCatalogAutofill('codigo_disciplina', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.codigosDisciplina.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    placeholder="Ex: CCO401"
                    value={disciplineForm.codigoDisciplina}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, codigoDisciplina: event.target.value }))
                    }
                    required
                  />
                )}
              </label>
            </div>

            <div className={projectGrid2Class}>
              <label className={projectFormLabelClass}>
                Codigo da Turma
                {catalog.length > 0 ? (
                  <select
                    className={selectInputClass}
                    value={disciplineForm.codigoTurma}
                    onChange={(event) => applyCatalogAutofill('codigo_turma', event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {uniqueOptions.codigosTurma.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={disciplineForm.codigoTurma}
                    onChange={(event) =>
                      setDisciplineForm((prev) => ({ ...prev, codigoTurma: event.target.value }))
                    }
                    required
                  />
                )}
              </label>

              <label className={projectFormLabelClass}>
                Disciplina Gerencial
                <select
                  className={selectInputClass}
                  value={disciplineForm.disciplinaGerencial}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({
                      ...prev,
                      disciplinaGerencial: event.target.value as DisciplineManagerialOption,
                    }))
                  }
                  required
                >
                  {DISCIPLINE_MANAGERIAL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={projectFormLabelClass}>
              Cursos Gerenciados
              <Input
                value={disciplineForm.managedCourses}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, managedCourses: event.target.value }))
                }
                placeholder="Preencha quando a disciplina for gerencial"
              />
            </label>

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

            <ExtensionProjectFields
              form={disciplineExtensionForm}
              onChange={setDisciplineExtensionForm}
              disabled={isSubmitting}
              mode="axes-only"
              acknowledgementOptions={DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS}
            />
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
