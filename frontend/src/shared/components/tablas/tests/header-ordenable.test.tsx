import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderOrdenable } from '../header-ordenable'

// Wrapper necesario: <th> debe estar dentro de <table><thead><tr>
function renderHeader(props: Parameters<typeof HeaderOrdenable>[0]) {
  return render(
    <table>
      <thead>
        <tr>
          <HeaderOrdenable {...props} />
        </tr>
      </thead>
    </table>,
  )
}

describe('HeaderOrdenable', () => {
  it('muestra el label', () => {
    renderHeader({
      columna: 'name',
      label: 'Nombre',
      ordenActual: null,
      onOrdenar: vi.fn(),
    })
    expect(screen.getByText('Nombre')).toBeInTheDocument()
  })

  it('al clickear columna no activa, llama onOrdenar con asc', async () => {
    const onOrdenar = vi.fn()
    const user = userEvent.setup()
    renderHeader({
      columna: 'name',
      label: 'Nombre',
      ordenActual: null,
      onOrdenar,
    })

    await user.click(screen.getByRole('columnheader'))
    expect(onOrdenar).toHaveBeenCalledWith('name', 'asc')
  })

  it('al clickear columna activa en asc, llama onOrdenar con desc', async () => {
    const onOrdenar = vi.fn()
    const user = userEvent.setup()
    renderHeader({
      columna: 'name',
      label: 'Nombre',
      ordenActual: { columna: 'name', direccion: 'asc' },
      onOrdenar,
    })

    await user.click(screen.getByRole('columnheader'))
    expect(onOrdenar).toHaveBeenCalledWith('name', 'desc')
  })

  it('al clickear columna activa en desc, llama onOrdenar con null (quitar orden)', async () => {
    const onOrdenar = vi.fn()
    const user = userEvent.setup()
    renderHeader({
      columna: 'name',
      label: 'Nombre',
      ordenActual: { columna: 'name', direccion: 'desc' },
      onOrdenar,
    })

    await user.click(screen.getByRole('columnheader'))
    expect(onOrdenar).toHaveBeenCalledWith('name', null)
  })

  it('aplica aria-sort="none" cuando no hay orden activo', () => {
    renderHeader({
      columna: 'name',
      label: 'Nombre',
      ordenActual: null,
      onOrdenar: vi.fn(),
    })
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'none')
  })
})
