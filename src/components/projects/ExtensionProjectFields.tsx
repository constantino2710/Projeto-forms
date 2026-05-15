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
import {
  checkboxItemClass,
  projectFormLabelClass,
  selectInputClass,
} from '../../lib/formStyles'

type ExtensionProjectFieldsProps = {
  form: ExtensionPlanData
  onChange: (next: ExtensionPlanData) => void
  disabled?: boolean
}

const sectionClass =
  'flex flex-col gap-3.5 p-5 rounded-[1.25rem] bg-card shadow-[0_4px_18px_hsl(var(--foreground)/0.06)]'
const sectionHeadingClass = 'flex flex-col gap-1'
const grid2 = 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
const grid3 = 'grid grid-cols-1 md:grid-cols-3 gap-2.5'

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
    <div className="flex flex-col gap-[18px]">
      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Identificacao da Iniciativa Extensionista</h2>
          <p className="m-0 text-muted-foreground">Replica dos campos principais do plano de trabalho voluntario.</p>
        </div>

        <div className={grid2}>
          <label className={projectFormLabelClass}>
            Titulo da Iniciativa
            <Input
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
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

        <label className={projectFormLabelClass}>
          Programa Unicap
          <select
            className={selectInputClass}
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

        <div className={grid2}>
          <label className={projectFormLabelClass}>
            Data de realizacao - Inicio
            <Input
              type="date"
              value={form.periodStart}
              onChange={(event) => setField('periodStart', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
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

        <label className={projectFormLabelClass}>
          Curso ou Programa de Pos-Graduacao ao qual a disciplina esta vinculada
          <select
            className={selectInputClass}
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

        <div className={grid2}>
          <label className={projectFormLabelClass}>
            Curso
            <Input
              value={form.courseName}
              onChange={(event) => setField('courseName', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Docentes</h2>
          <p className="m-0 text-muted-foreground">Dados do coordenador e docentes colaboradores.</p>
        </div>

        <div className={grid2}>
          <label className={projectFormLabelClass}>
            Nome do docente coordenador
            <Input
              value={form.coordinatorName}
              onChange={(event) => setField('coordinatorName', event.target.value)}
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
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

        <div className={grid3}>
          <label className={projectFormLabelClass}>
            CPF do docente coordenador
            <Input
              value={form.coordinatorCpf}
              onChange={(event) =>
                setField('coordinatorCpf', event.target.value.replace(/\D/g, '').slice(0, 11))
              }
              inputMode="numeric"
              maxLength={11}
              placeholder="Apenas numeros"
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
            Telefone (WhatsApp)
            <Input
              value={form.coordinatorPhone}
              onChange={(event) =>
                setField('coordinatorPhone', event.target.value.replace(/\D/g, '').slice(0, 13))
              }
              inputMode="tel"
              maxLength={13}
              placeholder="Apenas numeros (DDD + numero)"
              required
              disabled={disabled}
            />
          </label>

          <label className={projectFormLabelClass}>
            Carga Horaria Semanal - Coordenador
            <select
              className={selectInputClass}
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

        <label className={projectFormLabelClass}>
          Forma de participacao do Coordenador
          <select
            className={selectInputClass}
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

        <label className={projectFormLabelClass}>
          Outros docentes colaboradores voluntarios na atividade
          <Textarea
            value={form.otherVolunteerTeachers}
            onChange={(event) => setField('otherVolunteerTeachers', event.target.value)}
            rows={4}
            disabled={disabled}
          />
        </label>
      </section>

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Estudantes voluntarios</h2>
        </div>

        <div className={grid2}>
          <label className={projectFormLabelClass}>
            Carga Horaria Semanal - Estudantes
            <select
              className={selectInputClass}
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

          <label className={projectFormLabelClass}>
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Eixo Aprendizagem</h2>
        </div>

        <div className={grid3}>
          {form.learningObjectives.map((objective, index) => (
            <label key={`objective-${index}`} className={projectFormLabelClass}>
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

        <div className={grid3}>
          {form.transversalCompetencies.map((competency, index) => (
            <label key={`competency-${index}`} className={projectFormLabelClass}>
              Competencia Transversal {index + 1}
              <select
                className={selectInputClass}
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Eixo Servico</h2>
        </div>

        <label className={projectFormLabelClass}>
          Servico a ser oferecido
          <Textarea
            value={form.serviceOffered}
            onChange={(event) => setField('serviceOffered', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <div className={grid3}>
          {form.activities.map((activity, index) => (
            <label key={`activity-${index}`} className={projectFormLabelClass}>
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

        <label className={projectFormLabelClass}>
          Local de realizacao
          <Textarea
            value={form.executionLocation}
            onChange={(event) => setField('executionLocation', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
          Publico que sera atendido
          <Textarea
            value={form.targetAudience}
            onChange={(event) => setField('targetAudience', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Eixo Impacto</h2>
        </div>

        <label className={projectFormLabelClass}>
          Problema ou Necessidade a ser respondido
          <Textarea
            value={form.problemStatement}
            onChange={(event) => setField('problemStatement', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
          Principal Objetivo de Desenvolvimento Sustentavel Impactado
          <select
            className={selectInputClass}
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

        <div className={grid3}>
          {form.goals.map((goal, index) => (
            <label key={`goal-${index}`} className={projectFormLabelClass}>
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

        <label className={projectFormLabelClass}>
          Estrategias de Divulgacao da Atividade
          <Textarea
            value={form.disseminationStrategies}
            onChange={(event) => setField('disseminationStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Eixo Reflexao e Avaliacao</h2>
        </div>

        <label className={projectFormLabelClass}>
          Estrategias de Reflexao
          <Textarea
            value={form.reflectionStrategies}
            onChange={(event) => setField('reflectionStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
          Estrategias de Avaliacao
          <Textarea
            value={form.evaluationStrategies}
            onChange={(event) => setField('evaluationStrategies', event.target.value)}
            rows={4}
            required
            disabled={disabled}
          />
        </label>

        <label className={projectFormLabelClass}>
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

      <section className={sectionClass}>
        <div className={sectionHeadingClass}>
          <h2 className="m-0 text-base text-foreground">Conclusao</h2>
        </div>

        <label className={projectFormLabelClass}>
          Informacoes Adicionais
          <Textarea
            value={form.additionalInformation}
            onChange={(event) => setField('additionalInformation', event.target.value)}
            rows={4}
            disabled={disabled}
          />
        </label>

        <div className="flex flex-col items-start gap-2.5">
          <p className="m-0 font-bold text-foreground">Compreendi que...</p>
          {ACKNOWLEDGEMENT_OPTIONS.map((item) => (
            <label key={item.id} className={checkboxItemClass}>
              <input
                type="checkbox"
                className="m-0 w-4 h-4 self-start justify-self-start mt-0.5"
                checked={form.acknowledgements.includes(item.id)}
                onChange={() => toggleAcknowledgement(item.id)}
                disabled={disabled}
              />
              <span className="block leading-[1.45]">{item.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
