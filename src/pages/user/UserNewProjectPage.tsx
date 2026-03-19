import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { createUserProject } from '../../features/projects/userProjects'

export function UserNewProjectPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [thematicArea, setThematicArea] = useState('')
  const [course, setCourse] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      await createUserProject({
        title,
        thematicArea,
        course,
        periodStart,
        periodEnd,
        targetAudience,
        budget: Number(budget || 0),
        description,
      })

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

      <form onSubmit={handleSubmit} className="project-form">
        <label>
          Titulo
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
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
          <Input value={course} onChange={(event) => setCourse(event.target.value)} />
        </label>

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

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <Button type="submit" className="full-width" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Criar projeto'}
        </Button>
      </form>
    </article>
  )
}
