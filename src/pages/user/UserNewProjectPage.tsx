import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'
import {
  panelClassName,
  successClassName,
} from '../../features/projects/projectUi'
import { createUserProject, listProjectCatalogOptions } from '../../features/projects/userProjects'

const MIN_PROJECT_DATE = '2000-01-01'
const MAX_PROJECT_DATE = '2100-12-31'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const selectClassName =
  'w-full min-h-11 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none'

const isIsoDate = (value: string) => ISO_DATE_PATTERN.test(value)

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [thematicArea, setThematicArea] = useState('')
  const [projectType, setProjectType] = useState<'extensao' | 'disciplina'>('extensao')
  const [codigoDisciplina, setCodigoDisciplina] = useState('')
  const [semestreLetivo, setSemestreLetivo] = useState('')
  const [course, setCourse] = useState('')
  const [school, setSchool] = useState('')
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        const nextError = err instanceof Error ? err.message : 'Falha ao carregar cursos e escolas.'
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    if (!isIsoDate(periodStart) || !isIsoDate(periodEnd)) {
      setIsSubmitting(false)
      return
    }

    if (periodStart < MIN_PROJECT_DATE || periodStart > MAX_PROJECT_DATE) {
      setIsSubmitting(false)
      return
    }

    if (periodEnd < MIN_PROJECT_DATE || periodEnd > MAX_PROJECT_DATE) {
      setIsSubmitting(false)
      return
    }

    if (periodStart > periodEnd) {
      setIsSubmitting(false)
      return
    }

    const parsedBudget = Number(budget)
    if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
      setIsSubmitting(false)
      return
    }

    try {
      const project = await createUserProject({
        title,
        thematicArea,
        course,
        school,
        periodStart,
        periodEnd,
        targetAudience,
        budget: parsedBudget,
        description,
        type: projectType,
        codigo_disciplina: projectType === 'disciplina' ? codigoDisciplina : null,
        semestre_letivo: projectType === 'disciplina' ? semestreLetivo : null,
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
    } catch {
      // erro exibido no console pelos clients
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className={panelClassName}>
      <h1 className="m-0 text-[1.4rem]">Novo Projeto</h1>
      <p className="mt-2.5 text-[hsl(var(--muted-foreground))]">Preencha os campos para criar um novo projeto.</p>

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
        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Titulo
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Area tematica
          <Input value={thematicArea} onChange={(event) => setThematicArea(event.target.value)} required />
        </label>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Curso
          <select
            value={course}
            onChange={(event) => setCourse(event.target.value)}
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
            value={school}
            onChange={(event) => setSchool(event.target.value)}
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

        {catalogError && <p className="m-0 text-[0.88rem] text-[hsl(var(--destructive))]">{catalogError}</p>}

        {projectType === 'disciplina' && (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Codigo da Disciplina
              <Input
                type="text"
                placeholder="Ex: IF976"
                value={codigoDisciplina}
                onChange={(event) => setCodigoDisciplina(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
              Semestre Letivo
              <Input
                type="text"
                placeholder="Ex: 2026.1"
                value={semestreLetivo}
                onChange={(event) => setSemestreLetivo(event.target.value)}
                required
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
            Inicio
            <Input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              min={MIN_PROJECT_DATE}
              max={periodEnd || MAX_PROJECT_DATE}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
            Fim
            <Input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              min={periodStart || MIN_PROJECT_DATE}
              max={MAX_PROJECT_DATE}
              required
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Publico-alvo
          <Input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} required />
        </label>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Orcamento
          <Input
            type="number"
            min={0}
            step="0.01"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Descricao
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o que sera feito no projeto"
            rows={5}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
          Anexos
          <Input type="file" multiple onChange={handleFilesSelected} disabled={isSubmitting} />
        </label>

        {pendingFiles.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {pendingFiles.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between gap-2.5 rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] p-2.5 max-[900px]:flex-col max-[900px]:items-start"
              >
                <div>
                  <p className="m-0 font-semibold text-[hsl(var(--foreground))]">{file.name}</p>
                  <p className="mt-1 text-[0.8rem] text-[hsl(var(--muted-foreground))]">{formatAttachmentSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2 max-[900px]:w-full max-[900px]:justify-between">
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

        {message && <p className={successClassName}>{message}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Criar projeto'}
        </Button>
      </form>
    </article>
  )
}
