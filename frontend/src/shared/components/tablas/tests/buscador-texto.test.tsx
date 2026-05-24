import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuscadorTexto } from '../buscador-texto'

describe('BuscadorTexto', () => {
  it('renderiza con placeholder', () => {
    render(<BuscadorTexto valor="" onCambio={vi.fn()} placeholder="Buscar..." />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  describe('con fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('no llama a onCambio inmediatamente al tipear', () => {
      const onCambio = vi.fn()
      render(<BuscadorTexto valor="" onCambio={onCambio} milisegundosDebounce={400} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'juan' } })

      // Sin avanzar los timers, onCambio no debe haber sido llamado
      expect(onCambio).not.toHaveBeenCalled()
    })

    it('llama a onCambio después del debounce', () => {
      const onCambio = vi.fn()
      render(<BuscadorTexto valor="" onCambio={onCambio} milisegundosDebounce={400} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'juan' } })

      act(() => {
        vi.advanceTimersByTime(400)
      })

      expect(onCambio).toHaveBeenCalledWith('juan')
    })

    it('cancela el debounce previo si el usuario sigue tipeando', () => {
      const onCambio = vi.fn()
      render(<BuscadorTexto valor="" onCambio={onCambio} milisegundosDebounce={400} />)

      const input = screen.getByRole('textbox')

      // Primera serie de cambios
      fireEvent.change(input, { target: { value: 'ju' } })

      act(() => {
        vi.advanceTimersByTime(200) // avanzar menos del debounce
      })

      // Segunda serie antes de que expire el timer
      fireEvent.change(input, { target: { value: 'juan' } })

      act(() => {
        vi.advanceTimersByTime(400) // ahora sí completa el debounce
      })

      // Solo debe haberse llamado una vez con el valor final
      expect(onCambio).toHaveBeenCalledTimes(1)
      expect(onCambio).toHaveBeenCalledWith('juan')
    })
  })

  it('se sincroniza con valor externo (reset)', () => {
    const { rerender } = render(<BuscadorTexto valor="inicial" onCambio={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('inicial')

    rerender(<BuscadorTexto valor="cambiado" onCambio={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('cambiado')
  })

  it('renderiza con placeholder por defecto', () => {
    render(<BuscadorTexto valor="" onCambio={vi.fn()} />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('dispara onCambio con userEvent sin fake timers (debounce real muy corto)', async () => {
    const onCambio = vi.fn()
    const user = userEvent.setup()
    render(<BuscadorTexto valor="" onCambio={onCambio} milisegundosDebounce={0} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'a')

    // Con debounce 0, debe llamarse en el siguiente tick
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(onCambio).toHaveBeenCalledWith('a')
  })
})
