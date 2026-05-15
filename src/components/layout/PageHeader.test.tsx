import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renderiza o titulo como h1', () => {
    render(<PageHeader title="Meus Projetos" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Meus Projetos' })).toBeInTheDocument()
  })

  it('renderiza o subtitulo quando fornecido', () => {
    render(<PageHeader title="X" subtitle="Detalhes da pagina" />)
    expect(screen.getByText('Detalhes da pagina')).toBeInTheDocument()
  })

  it('nao renderiza subtitulo quando ausente', () => {
    render(<PageHeader title="X" />)
    expect(screen.queryByText('Detalhes')).not.toBeInTheDocument()
  })

  it('renderiza actions quando fornecidos', () => {
    render(<PageHeader title="X" actions={<button>Acao</button>} />)
    expect(screen.getByRole('button', { name: 'Acao' })).toBeInTheDocument()
  })

  it('aceita className adicional', () => {
    render(<PageHeader title="X" className="meu-extra" />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('meu-extra')
  })
})
