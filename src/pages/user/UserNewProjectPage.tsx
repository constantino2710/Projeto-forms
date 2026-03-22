import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { createUserProject } from '../../features/projects/userProjects'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [thematicArea, setThematicArea] = useState('')
  const [projectType, setProjectType] = useState<"extensao" | "disciplina">( "extensao",);
  const [codigoDisciplina, setCodigoDisciplina] = useState("");
  const [semestreLetivo, setSemestreLetivo] = useState("");
  const [course, setCourse] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
    setIsSubmitting(true)

    try {
      const project = await createUserProject({
        title,
        thematicArea,
        course,
        periodStart,
        periodEnd,
        targetAudience,
        budget: Number(budget || 0),
        description,
        type: projectType,
        codigo_disciplina: codigoDisciplina,
        semestre_letivo: semestreLetivo,
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
          throw new Error(
            `Projeto criado, mas falhou o upload de: ${failedUploads.join(', ')}.`,
          )
        }
      }

      setMessage('Projeto criado com sucesso.')
      navigate('/usuario/meus-projetos')
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao criar projeto.'
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="dashboard-panel">
      <h1>Novo Projeto</h1>
      <p>Preencha os campos para criar um novo projeto.</p>

        <div className="mb-6">
  <div className="flex gap-2 p-1 bg-gray-900/50 border border-gray-800 rounded-lg w-fit">
    <button
      type="button"
      onClick={() => setProjectType('extensao')}
      className={`px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
        projectType === 'extensao' 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      Projeto de Extensão
    </button>
    
    <button
      type="button"
      onClick={() => setProjectType('disciplina')}
      className={`px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
        projectType === 'disciplina' 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      Disciplina Extensionista
    </button>
  </div>
</div>
      <form onSubmit={handleSubmit} className="project-form">
        <label>
          Titulo
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Area tematica
          <Input
            value={thematicArea}
            onChange={(event) => setThematicArea(event.target.value)}
            required
          />
        </label>

        <label>
          Curso
          <Input
            value={course}
            onChange={(event) => setCourse(event.target.value)}
          />
        </label>

{projectType === 'disciplina' && (
  <div className="flex gap-4 mb-4">
    <div className="flex-1">
      <label className="block text-white font-medium mb-1">Código da Disciplina</label>
      <input 
        type="text"
        placeholder="Ex: IF976" 
        value={codigoDisciplina} 
        onChange={(e) => setCodigoDisciplina(e.target.value)} 
        className="w-full p-2 bg-transparent border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
      />
    </div>
    
    <div className="flex-1">
      <label className="block text-white font-medium mb-1">Semestre Letivo</label>
      <input 
        type="text"
        placeholder="Ex: 2026.1" 
        value={semestreLetivo} 
        onChange={(e) => setSemestreLetivo(e.target.value)} 
        className="w-full p-2 bg-transparent border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
      />
    </div>
  </div>
)}
        <div className="project-grid-2">
          <label>
            Inicio
            <Input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              required
            />
          </label>
          <label>
            Fim
            <Input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Publico-alvo
          <Input
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            required
          />
        </label>

        <label>
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

        <label>
          Descricao
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o que sera feito no projeto"
            rows={5}
            required
          />
        </label>

        <label>
          Anexos
          <Input
            type="file"
            multiple
            onChange={handleFilesSelected}
            disabled={isSubmitting}
          />
        </label>

        {pendingFiles.length > 0 && (
          <ul className="attachments-list">
            {pendingFiles.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="attachment-item"
              >
                <div>
                  <p className="attachment-name">{file.name}</p>
                  <p className="attachment-meta">
                    {formatAttachmentSize(file.size)}
                  </p>
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

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <Button type="submit" className="full-width" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar projeto"}
        </Button>
      </form>
    </article>
  );
}
