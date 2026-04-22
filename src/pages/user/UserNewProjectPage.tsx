import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExtensionProjectFields } from '../../components/projects/ExtensionProjectFields'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'
import {
  createEmptyExtensionPlan,
  isExtensionPlanComplete,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import { createUserProject } from '../../features/projects/userProjects'

const MIN_PROJECT_DATE = '2000-01-01'
const MAX_PROJECT_DATE = '2100-12-31'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isIsoDate = (value: string) => ISO_DATE_PATTERN.test(value)

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
  const [message, setMessage] = useState('')

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

    const activePeriodStart = projectType === 'extensao' ? extensionForm.periodStart : disciplineForm.periodStart
    const activePeriodEnd = projectType === 'extensao' ? extensionForm.periodEnd : disciplineForm.periodEnd
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
    <article className="dashboard-panel">
      <h1>Novo Projeto</h1>
      <p>Escolha o tipo e preencha o formulario correspondente.</p>

      <div className="project-type-toggle">
        <button
          type="button"
          onClick={() => setProjectType('extensao')}
          className={`project-type-option ${projectType === 'extensao' ? 'active' : ''}`}
        >
          Projeto de Extensao
        </button>
        <button
          type="button"
          onClick={() => setProjectType('disciplina')}
          className={`project-type-option ${projectType === 'disciplina' ? 'active' : ''}`}
        >
          Disciplina Extensionista
        </button>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {projectType === 'extensao' ? (
          <ExtensionProjectFields form={extensionForm} onChange={setExtensionForm} disabled={isSubmitting} />
        ) : (
          <>
            <label>
              Titulo
              <Input
                value={disciplineForm.title}
                onChange={(event) => setDisciplineForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>

            <label>
              Area tematica
              <Input
                value={disciplineForm.thematicArea}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, thematicArea: event.target.value }))
                }
                required
              />
            </label>

            <div className="project-grid-2">
              <label>
                Codigo da Disciplina
                <Input
                  type="text"
                  placeholder="Ex: IF976"
                  value={disciplineForm.codigoDisciplina}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({ ...prev, codigoDisciplina: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Semestre Letivo
                <Input
                  type="text"
                  placeholder="Ex: 2026.1"
                  value={disciplineForm.semestreLetivo}
                  onChange={(event) =>
                    setDisciplineForm((prev) => ({ ...prev, semestreLetivo: event.target.value }))
                  }
                  required
                />
              </label>
            </div>

            <label>
              Curso
              <Input
                value={disciplineForm.course}
                onChange={(event) => setDisciplineForm((prev) => ({ ...prev, course: event.target.value }))}
              />
            </label>

            <div className="project-grid-2">
              <label>
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
              <label>
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

            <label>
              Publico-alvo
              <Input
                value={disciplineForm.targetAudience}
                onChange={(event) =>
                  setDisciplineForm((prev) => ({ ...prev, targetAudience: event.target.value }))
                }
                required
              />
            </label>

            <label>
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

            <label>
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

        <label>
          Anexos
          <Input type="file" multiple onChange={handleFilesSelected} disabled={isSubmitting} />
        </label>

        {pendingFiles.length > 0 && (
          <ul className="attachments-list">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="attachment-item">
                <div>
                  <p className="attachment-name">{file.name}</p>
                  <p className="attachment-meta">{formatAttachmentSize(file.size)}</p>
                </div>
                <div className="attachment-actions">
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

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <Button type="submit" className="full-width" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Criar projeto'}
        </Button>
      </form>
    </article>
  )
}
