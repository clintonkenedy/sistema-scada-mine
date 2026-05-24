import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaginaSinAcceso } from '../pagina-sin-acceso'

const renderPagina = () =>
  render(
    <MemoryRouter>
      <PaginaSinAcceso />
    </MemoryRouter>,
  )

describe('PaginaSinAcceso', () => {
  test('renderiza el título "Sin acceso"', () => {
    renderPagina()
    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
  })

  test('renderiza el mensaje de no permiso', () => {
    renderPagina()
    expect(
      screen.getByText(/No tenés permiso para acceder a esta sección/i),
    ).toBeInTheDocument()
  })

  test('renderiza el botón "Volver al mapa" con href /mapa', () => {
    renderPagina()
    const enlace = screen.getByRole('link', { name: /volver al mapa/i })
    expect(enlace).toBeInTheDocument()
    expect(enlace).toHaveAttribute('href', '/mapa')
  })
})
