import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import {
  ACKNOWLEDGEMENT_OPTIONS,
  COORDINATOR_PARTICIPATION_OPTIONS,
  LINKED_COURSE_OPTIONS,
  SDG_OPTIONS,
  TRANSVERSAL_COMPETENCY_OPTIONS,
  UNICAP_PROGRAM_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'

type ExtensionProjectFieldsProps = {
  form: ExtensionPlanData
  onChange: (next: ExtensionPlanData) => void
  disabled?: boolean
}

const updateArrayValue = (values: string[], index: number, value: string) =>
  values.map((item, currentIndex) => (currentIndex === index ? value : item))

export function ExtensionProjectFields({
  form,
  onChange,
  disabled = false,
}: ExtensionProjectFieldsProps) {
  const setField = <K extends keyof ExtensionPlanData>(field: K, value: ExtensionPlanData[K]) => {
    onChange({
      ...form,
      [field]: value,
    })
  }

  const toggleAcknowledgement = (id: string) => {
    const nextValues = form.acknowledgements.includes(id)
      ? form.acknowledgements.filter((item) => item !== id)
      : [...form.acknowledgements, id]

    setField('acknowledgements', nextValues)
  }

  return (
    <div className="extension-form-layout">
      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Identificacao da Iniciativa Extensionista</h2>
          <p>Replica dos campos principais do plano de trabalho voluntario.</p>
        </div>

        <div className="project-grid-2">
          <label>
            Titulo da Iniciativa
            <Input
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            Carga horaria total da iniciativa
            <Input
              type="number"
              min={1}
              value={form.totalWorkload}
              onChange={(event) => setField('totalWorkload', event.target.value)}
              required
              disabled={disabled}
            />
          </label>
        </div>

        <label>
          Programa Unicap
          <select
            className="ui-input ui-select"
            value={form.unicapProgram}
            onChange={(event) => setField('unicapProgram', event.target.value)}
            required
            disabled={disabled}
          >
            <option value="">Selecione uma opcao</option>
            {UNICAP_PROGRAM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="project-grid-2">
          <label>
            Data de realizacao - Inicio
            <Input
              type="date"
              value={form.periodStart}
              onChange={(event) => setField('periodStart', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            Data de realizacao - Termino
            <Input
              type="date"
              value={form.periodEnd}
              onChange={(event) => setField('periodEnd', event.target.value)}
              required
              disabled={disabled}
            />
          </label>
        </div>

        <label>
          Curso ou Programa de Pos-Graduacao ao qual a disciplina esta vinculada
          <select
            className="ui-input ui-select"
            value={form.linkedCourse}
            onChange={(event) => setField('linkedCourse', event.target.value)}
            required
            disabled={disabled}
          >
            <option value="">Favor selecionar</option>
            {LINKED_COURSE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="project-grid-2">
          <label>
            Curso
            <Input
              value={form.courseName}
              onChange={(event) => setField('courseName', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            E-mail da Coordenacao
            <Input
              type="email"
              value={form.coordinationEmail}
              onChange={(event) => setField('coordinationEmail', event.target.value)}
              required
              disabled={disabled}
            />
          </label>
        </div>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Docentes</h2>
          <p>Dados do coordenador e docentes colaboradores.</p>
        </div>

        <div className="project-grid-2">
          <label>
            Nome do docente coordenador
            <Input
              value={form.coordinatorName}
              onChange={(event) => setField('coordinatorName', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            E-mail do docente coordenador
            <Input
              type="email"
              value={form.coordinatorEmail}
              onChange={(event) => setField('coordinatorEmail', event.target.value)}
              required
              disabled={disabled}
            />
          </label>
        </div>

        <div className="project-grid-3">
          <label>
            CPF do docente coordenador
            <Input
              value={form.coordinatorCpf}
              onChange={(event) => setField('coordinatorCpf', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            Telefone (WhatsApp)
            <Input
              value={form.coordinatorPhone}
              onChange={(event) => setField('coordinatorPhone', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label>
            Carga Horaria Semanal - Coordenador
            <select
              className="ui-input ui-select"
              value={form.coordinatorWeeklyHours}
              onChange={(event) => setField('coordinatorWeeklyHours', event.target.value)}
              required
              disabled={disabled}
            >
              <option value="">Favor selecionar</option>
              {WEEKLY_HOURS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Forma de participacao do Coordenador
          <select
            className="ui-input ui-select"
            value={form.coordinatorParticipation}
            onChange={(event) => setField('coordinatorParticipation', event.target.value)}
            required
            disabled={disabled}
          >
            <option value="">Favor selecionar</option>
            {COORDINATOR_PARTICIPATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Outros docentes colaboradores voluntarios na atividade
          <Textarea
            value={form.otherVolunteerTeachers}
            onChange={(event) => setField('otherVolunteerTeachers', event.target.value)}
            rows={4}
            disabled={disabled}
          />
        </label>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Estudantes voluntarios</h2>
        </div>

        <div className="project-grid-2">
          <label>
            Carga Horaria Semanal - Estudantes
            <select
              className="ui-input ui-select"
              value={form.studentWeeklyHours}
              onChange={(event) => setField('studentWeeklyHours', event.target.value)}
              required
              disabled={disabled}
            >
              <option value="">Favor selecionar</option>
              {WEEKLY_HOURS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estudantes participantes
            <Textarea
              value={form.studentParticipants}
              onChange={(event) => setField('studentParticipants', event.target.value)}
              rows={4}
              required
              disabled={disabled}
            />
          </label>
        </div>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Eixo Aprendizagem</h2>
        </div>

        <div className="project-grid-3">
          {form.learningObjectives.map((objective, index) => (
            <label key={`objective-${index}`}>
              Objetivo de Aprendizagem {index + 1}
              <Textarea
                value={objective}
                onChange={(event) =>
                  setField(
                    'learningObjectives',
                    updateArrayValue(form.learningObjectives, index, event.target.value),
                  )
                }
                rows={3}
                required
                disabled={disabled}
              />
            </label>
          ))}
        </div>

        <div className="project-grid-3">
          {form.transversalCompetencies.map((competency, index) => (
            <label key={`competency-${index}`}>
              Competencia Transversal {index + 1}
              <select
                className="ui-input ui-select"
                value={competency}
                onChange={(event) =>
                  setField(
                    'transversalCompetencies',
                    updateArrayValue(form.transversalCompetencies, index, event.target.value),
                  )
                }
                required
                disabled={disabled}
              >
                <option value="">Selecione</option>
                {TRANSVERSAL_COMPETENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Eixo Servico</h2>
        </div>

        <label>
          Servico a ser oferecido
          <Textarea
            value={form.serviceOffered}
            onChange={(event) => setField('serviceOffered', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <div className="project-grid-3">
          {form.activities.map((activity, index) => (
            <label key={`activity-${index}`}>
              Atividade {index + 1}
              <Textarea
                value={activity}
                onChange={(event) =>
                  setField('activities', updateArrayValue(form.activities, index, event.target.value))
                }
                rows={3}
                required
                disabled={disabled}
              />
            </label>
          ))}
        </div>

        <label>
          Local de realizacao
          <Textarea
            value={form.executionLocation}
            onChange={(event) => setField('executionLocation', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Publico que sera atendido
          <Textarea
            value={form.targetAudience}
            onChange={(event) => setField('targetAudience', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Procedimentos Metodologicos
          <Textarea
            value={form.methodologicalProcedures}
            onChange={(event) => setField('methodologicalProcedures', event.target.value)}
            rows={5}
            required
            disabled={disabled}
          />
        </label>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Eixo Impacto</h2>
        </div>

        <label>
          Problema ou Necessidade a ser respondido
          <Textarea
            value={form.problemStatement}
            onChange={(event) => setField('problemStatement', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Principal Objetivo de Desenvolvimento Sustentavel Impactado
          <select
            className="ui-input ui-select"
            value={form.sustainableDevelopmentGoal}
            onChange={(event) => setField('sustainableDevelopmentGoal', event.target.value)}
            required
            disabled={disabled}
          >
            <option value="">Selecione uma opcao</option>
            {SDG_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="project-grid-3">
          {form.goals.map((goal, index) => (
            <label key={`goal-${index}`}>
              Meta {index + 1}
              <Textarea
                value={goal}
                onChange={(event) => setField('goals', updateArrayValue(form.goals, index, event.target.value))}
                rows={3}
                required
                disabled={disabled}
              />
            </label>
          ))}
        </div>

        <label>
          Estrategias de Divulgacao da Atividade
          <Textarea
            value={form.disseminationStrategies}
            onChange={(event) => setField('disseminationStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Texto breve com uma apresentacao/resumo do projeto
          <Textarea
            value={form.projectSummary}
            onChange={(event) => setField('projectSummary', event.target.value)}
            rows={5}
            required
            disabled={disabled}
          />
        </label>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Eixo Reflexao e Avaliacao</h2>
        </div>

        <label>
          Estrategias de Reflexao
          <Textarea
            value={form.reflectionStrategies}
            onChange={(event) => setField('reflectionStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Estrategias de Avaliacao
          <Textarea
            value={form.evaluationStrategies}
            onChange={(event) => setField('evaluationStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label>
          Feedback do Publico Parceiro
          <Textarea
            value={form.partnerFeedback}
            onChange={(event) => setField('partnerFeedback', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>
      </section>

      <section className="project-form-section">
        <div className="project-form-section-heading">
          <h2>Conclusao</h2>
        </div>

        <label>
          Informacoes Adicionais
          <Textarea
            value={form.additionalInformation}
            onChange={(event) => setField('additionalInformation', event.target.value)}
            rows={4}
            disabled={disabled}
          />
        </label>

        <div className="project-checkbox-group">
          <p className="project-checkbox-title">Compreendi que...</p>
          {ACKNOWLEDGEMENT_OPTIONS.map((item) => (
            <label key={item.id} className="project-checkbox-item">
              <input
                type="checkbox"
                checked={form.acknowledgements.includes(item.id)}
                onChange={() => toggleAcknowledgement(item.id)}
                disabled={disabled}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
