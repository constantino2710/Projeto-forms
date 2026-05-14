import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtensionProjectFields } from './ExtensionProjectFields'
import {
  ACKNOWLEDGEMENT_OPTIONS,
  createEmptyExtensionPlan,
} from '../../features/projects/extensionPlan'

describe('ExtensionProjectFields', () => {
  it('renderiza todas as secoes do plano de extensao', () => {
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={vi.fn()} />,
    )

    expect(
      screen.getByRole('heading', { name: 'Identificacao da Iniciativa Extensionista' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Docentes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estudantes voluntarios' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eixo Aprendizagem' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eixo Servico' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eixo Impacto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eixo Reflexao e Avaliacao' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Conclusao' })).toBeInTheDocument()
  })

  it('digitar no titulo chama onChange com o novo valor', async () => {
    const onChange = vi.fn()
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={onChange} />,
    )
    const titleInput = screen.getByLabelText('Titulo da Iniciativa')
    await userEvent.type(titleInput, 'A')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'A' }),
    )
  })

  it('selecionar Programa Unicap propaga via onChange', async () => {
    const onChange = vi.fn()
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={onChange} />,
    )
    const select = screen.getByLabelText('Programa Unicap')
    await userEvent.selectOptions(
      select,
      'UNICAP - TIC - Tecnologia, Inovacao e Comunicacao',
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        unicapProgram: 'UNICAP - TIC - Tecnologia, Inovacao e Comunicacao',
      }),
    )
  })

  it('marcar acknowledgement adiciona ao array', async () => {
    const onChange = vi.fn()
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={onChange} />,
    )
    const firstAck = ACKNOWLEDGEMENT_OPTIONS[0]
    const checkbox = screen.getByLabelText(firstAck.label)
    await userEvent.click(checkbox)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ acknowledgements: [firstAck.id] }),
    )
  })

  it('desmarcar acknowledgement remove do array', async () => {
    const form = createEmptyExtensionPlan()
    const ackId = ACKNOWLEDGEMENT_OPTIONS[0].id
    form.acknowledgements = [ackId]
    const onChange = vi.fn()
    render(<ExtensionProjectFields form={form} onChange={onChange} />)
    const checkbox = screen.getByLabelText(ACKNOWLEDGEMENT_OPTIONS[0].label)
    await userEvent.click(checkbox)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ acknowledgements: [] }),
    )
  })

  it('CPF aceita apenas digitos e limita a 11', async () => {
    const onChange = vi.fn()
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={onChange} />,
    )
    const cpf = screen.getByLabelText('CPF do docente coordenador')
    await userEvent.type(cpf, 'a1b2c3')
    const ultimaChamada = onChange.mock.calls.at(-1)?.[0]
    expect(ultimaChamada.coordinatorCpf).toMatch(/^\d*$/)
    expect(ultimaChamada.coordinatorCpf.length).toBeLessThanOrEqual(11)
  })

  it('Telefone aceita apenas digitos e limita a 13', async () => {
    const onChange = vi.fn()
    render(
      <ExtensionProjectFields form={createEmptyExtensionPlan()} onChange={onChange} />,
    )
    const phone = screen.getByLabelText('Telefone (WhatsApp)')
    await userEvent.type(phone, '81abc')
    const ultimaChamada = onChange.mock.calls.at(-1)?.[0]
    expect(ultimaChamada.coordinatorPhone).toMatch(/^\d*$/)
    expect(ultimaChamada.coordinatorPhone.length).toBeLessThanOrEqual(13)
  })

  it('quando disabled=true, inputs principais ficam disabled', () => {
    render(
      <ExtensionProjectFields
        form={createEmptyExtensionPlan()}
        onChange={vi.fn()}
        disabled
      />,
    )
    expect(screen.getByLabelText('Titulo da Iniciativa')).toBeDisabled()
    expect(screen.getByLabelText('Programa Unicap')).toBeDisabled()
    expect(screen.getByLabelText(ACKNOWLEDGEMENT_OPTIONS[0].label)).toBeDisabled()
  })
})
