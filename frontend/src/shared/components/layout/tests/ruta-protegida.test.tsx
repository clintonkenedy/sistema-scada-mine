import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RutaProtegida } from '../ruta-protegida'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Usuario } from '@/features/autenticacion/types/sesion'

// Mockear useUsuarioActual para controlar isLoading
vi.mock('@/features/autenticacion/hooks/use-usuario-actual', () => ({
  useUsuarioActual: vi.fn(),
  QUERY_KEY_USUARIO: ['usuario-actual'],
}))

import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'

const renderGuard = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/mapa']}>
        <Routes>
          <Route path="/login" element={<div>Pantalla de login</div>} />
          <Route element={<RutaProtegida />}>
            <Route path="/mapa" element={<div>Contenido del mapa</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RutaProtegida', () => {
  beforeEach(() => {
    useSesionStore.setState({ usuario: null, estaAutenticado: false })
    vi.clearAllMocks()
  })

  test('T-F-05: sin sesión redirige a /login', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
      isSuccess: false,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard()

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido del mapa')).not.toBeInTheDocument()
  })

  test('T-F-06: cargando muestra spinner', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
      isSuccess: false,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard()

    expect(screen.getByRole('status', { name: /cargando/i })).toBeInTheDocument()
    expect(screen.queryByText('Contenido del mapa')).not.toBeInTheDocument()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
  })

  test('T-F-07: con sesión renderiza Outlet', () => {
    const usuarioMock: Usuario = {
      id: 1,
      name: 'Admin',
      email: 'admin@test.com',
      dni: null,
      nombres: 'Admin',
      apellido_paterno: 'Test',
      apellido_materno: null,
      activo: true,
      roles: ['administrador'],
      permisos: [],
    }
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioMock,
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)
    useSesionStore.setState({
      usuario: usuarioMock,
      estaAutenticado: true,
    })

    renderGuard()

    expect(screen.getByText('Contenido del mapa')).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
  })
})
