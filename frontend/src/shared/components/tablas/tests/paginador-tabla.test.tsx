import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginadorTabla } from '../paginador-tabla'

describe('PaginadorTabla', () => {
  it('retorna null si solo hay 1 página', () => {
    const { container } = render(
      <PaginadorTabla pagina={1} ultimaPagina={1} onCambio={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('retorna null si ultimaPagina es 0', () => {
    const { container } = render(
      <PaginadorTabla pagina={1} ultimaPagina={0} onCambio={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('deshabilita Anterior en página 1', () => {
    render(<PaginadorTabla pagina={1} ultimaPagina={5} onCambio={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled()
  })

  it('deshabilita Siguiente en última página', () => {
    render(<PaginadorTabla pagina={5} ultimaPagina={5} onCambio={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled()
  })

  it('llama onCambio con pagina-1 al clickear Anterior', async () => {
    const onCambio = vi.fn()
    const user = userEvent.setup()
    render(<PaginadorTabla pagina={3} ultimaPagina={5} onCambio={onCambio} />)

    await user.click(screen.getByRole('button', { name: /Anterior/i }))
    expect(onCambio).toHaveBeenCalledWith(2)
  })

  it('llama onCambio con pagina+1 al clickear Siguiente', async () => {
    const onCambio = vi.fn()
    const user = userEvent.setup()
    render(<PaginadorTabla pagina={3} ultimaPagina={5} onCambio={onCambio} />)

    await user.click(screen.getByRole('button', { name: /Siguiente/i }))
    expect(onCambio).toHaveBeenCalledWith(4)
  })

  it('muestra "Página X de Y"', () => {
    render(<PaginadorTabla pagina={3} ultimaPagina={7} onCambio={vi.fn()} />)
    expect(screen.getByText('Página 3 de 7')).toBeInTheDocument()
  })
})
