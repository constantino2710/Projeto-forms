import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExtensionProjectFields } from '../../components/projects/ExtensionProjectFields'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  createEmptyExtensionPlan,
  isExtensionPlanComplete,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'
import { panelClassName, successClassName } from '../../features/projects/projectUi'
import {
  createUserProject,
  listProjectCatalogOptions,
} from '../../features/projects/userProjects'
import { cn } from '../../lib/utils'

const MIN_PROJECT_DATE = '2000-01-01'
const MAX_PROJECT_DATE = '2100-12-31'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const selectClassName =
  'w-full min-h-11 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none'

const isIsoDate = (value: string) => ISO_DATE_PATTERN.test(value)

type DisciplineFormData = {
  title: string
  thematicArea: string
  codigoDisciplina: string
  semestreLetivo: string
  course: string
  school: string
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
  school: '',
  periodStart: '',
  periodEnd: '',
  targetAudience: '',
  budget: '',
  description: '',
})

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [projectType, setProjectType] = useState<'extensao' | 'disciplina'>('extensao')
  const [extensionForm, setExtensionForm] = useState<ExtensionPlanData>(() =>
    createEmptyExtensionPlan(),
  )
  const [disciplineForm, setDisciplineForm] = useState<DisciplineFormData>(() =>
    createEmptyDisciplineForm(),
  )
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadCatalog = async () => {
      setCatalogError('')
      setIsCatalogLoading(true)

      try {
        const options = await listProjectCatalogOptions()
        setCourseOptions(options.courses)
        setSchoolOptions(options.schools)
      } catch (err) {
        const nextError =
          err instanceof Error ? err.message : 'Falha ao carregar cursos e escolas.'
        setCatalogError(nextError)
      } finally {
        setIsCatalogLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const formatAttachmentSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const validateDates = (periodStart: string, periodEnd: string) => {
    if (!isIsoDate(periodStart) || !isIsoDate(periodEnd)) {
      return 'Preencha as datas em formato valido.'
    }

    if (periodStart < MIN_PROJECT_DATE || periodStart > MAX_PROJECT_DATE) {
      return 'A data inicial esta fora do intervalo permitido.'
    }

    if (periodEnd < MIN_PROJECT_DATE || periodEnd > MAX_PROJECT_DATE) {
      return 'A data final esta fora do intervalo permitido.'
    }

    if (periodStart > periodEnd) {
      return 'A data inicial nao pode ser maior que a data final.'
    }

    return ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    const activePeriodStart =
      projectType === 'extensao' ? extensionForm.periodStart : disciplineForm.periodStart
    const activePeriodEnd =
      projectType === 'extensao' ? extensionForm.periodEnd : disciplineForm.periodEnd
    const dateError = validateDates(activePeriodStart, activePeriodEnd)

    if (dateError) {
      setError(dateError)
      setIsSubmitting(false)
      return
    }

    if (projectType === 'extensao' && !isExtensionPlanComplete(extensionForm)) {
      setError('Marque todos os itens de confirmacao da conclusao para continuar.')
      setIsSubmitting(false)
      return
    }

    const parsedBudget = projectType === 'extensao' ? 0 : Number(disciplineForm.budget)
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      setError('Informe um orcamento valido.')
      setIsSubmitting(false)
      return
    }

    try {
      const project =
        projectType === 'extensao'
          ? await createUserProject({
              title: extensionForm.title,
              thematicArea: extensionForm.unicapProgram,
              course: null,
              school: null,
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
              school: disciplineForm.school,
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
    <article className={panelClassName}>
      <h1 className="m-0 text-[1.4rem]">Novo Projeto</h1>
      <p className="mt-2.5 text-[hsl(var(--muted-foreground))]">
        Escolha o tipo e preencha o formulario correspondente.
      </p>

      <div className="mt-4 inline-flex gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] p-1.5">
        <button
          type="button"
          onClick={() => setProjectType('extensao')}
          className={cn(
            'cursor-pointer rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-[0.9rem] py-[0.62rem] text-[0.86rem] leading-none font-bold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
            projectType === 'extensao' &&
              'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
          )}
        >
          Projeto de Extensao
        </button>
        <button
          type="button"
          onClick={() => setProjectType('disciplina')}
          className={cn(
            'cursor-pointer rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-[0.9rem] py-[0.62rem] text-[0.86rem] leading-none font-bold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]',
            projectType === 'disciplina' &&
              'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
          )}
        >
          Disciplina Extensionista
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {projectType === 'extensao' ? (
          <ExtensionProjectFields
            form={extensionForm}
            onChange={setExtensionForm}
            disabled={isSubmitting}
          />
        ) : (
          <>
            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Titulo
              <Input
                value={disciplineForm.title}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Area tematica
              <Input
                value={disciplineForm.thematicArea}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, thematicArea: event.target.value }))
                }
                required
              />
            </label>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                Codigo da Disciplina
                <Input
                  type="text"
                  placeholder="Ex: IF976"
                  value={disciplineForm.codigoDisciplina}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({
                      ...prev,
                      codigoDisciplina: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                Semestre Letivo
                <Input
                  type="text"
                  placeholder="Ex: 2026.1"
                  value={disciplineForm.semestreLetivo}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({
                      ...prev,
                      semestreLetivo: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Curso
              <select
                value={disciplineForm.course}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, course: event.target.value }))
                }
                className={selectClassName}
                required
                disabled={isCatalogLoading}
              >
                <option value="">Selecione um curso</option>
                {courseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Escola
              <select
                value={disciplineForm.school}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, school: event.target.value }))
                }
                className={selectClassName}
                required
                disabled={isCatalogLoading}
              >
                <option value="">Selecione uma escola</option>
                {schoolOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
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
              <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
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

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Publico-alvo
              <Input
                value={disciplineForm.targetAudience}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({
                    ...prev,
                    targetAudience: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Orcamento
              <Input
                type="number"
                min={0}
                step="0.01"
                value={disciplineForm.budget}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, budget: event.target.value }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
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

        {catalogError && (
          <p className="m-0 text-[0.88rem] text-[hsl(var(--destructive))]">{catalogError}</p>
        )}

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Anexos
          <Input type="file" multiple onChange={handleFilesSelected} disabled={isSubmitting} />
        </label>

        {pendingFiles.length > 0 && (
          <ul className="mt-0 mb-0 flex list-none flex-col gap-2 p-0">
            {pendingFiles.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between gap-2.5 rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] p-2.5 max-[900px]:flex-col max-[900px]:items-start"
              >
                <div>
                  <p className="m-0 font-semibold text-[hsl(var(--foreground))]">{file.name}</p>
                  <p className="mt-1 text-[0.8rem] text-[hsl(var(--muted-foreground))]">
                    {formatAttachmentSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePendingFile(index)}
                  disabled={isSubmitting}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="m-0 font-semibold text-[hsl(var(--destructive))]">{error}</p>}
        {message && <p className={successClassName}>{message}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Criar projeto'}
        </Button>
      </form>
    </article>
  )
}
