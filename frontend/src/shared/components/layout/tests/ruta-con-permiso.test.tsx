import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RutaConPermiso } from '../ruta-con-permiso'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Usuario } from '@/features/autenticacion/types/sesion'

// Mockear useUsuarioActual — RutaConPermiso ahora deriva permisos
// directamente de la query de TanStack Query, NO de Zustand.
vi.mock('@/features/autenticacion/hooks/use-usuario-actual', () => ({
  useUsuarioActual: vi.fn(),
  QUERY_KEY_USUARIO: ['usuario-actual'],
}))

import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'

const usuarioConPermisos = (permisos: string[]): Usuario => ({
  id: 1,
  name: 'Test',
  email: 'test@test.com',
  dni: null,
  nombres: 'Test',
  apellido_paterno: 'Usuario',
  apellido_materno: null,
  activo: true,
  roles: ['operador'],
  permisos,
})

const renderGuard = (permiso: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/usuarios']}>
        <Routes>
          <Route path="/sin-acceso" element={<div>Sin acceso</div>} />
          <Route element={<RutaConPermiso permiso={permiso} />}>
            <Route path="/usuarios" element={<div>Página Usuarios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RutaConPermiso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('redirige a /sin-acceso si no hay usuario (query sin data)', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
      isSuccess: false,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard('usuarios.ver')

    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Página Usuarios')).not.toBeInTheDocument()
  })

  test('redirige a /sin-acceso si el usuario NO tiene el permiso', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['mapa.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard('usuarios.ver')

    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Página Usuarios')).not.toBeInTheDocument()
  })

  test('renderiza Outlet si el usuario tiene el permiso', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver', 'roles.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard('usuarios.ver')

    expect(screen.getByText('Página Usuarios')).toBeInTheDocument()
    expect(screen.queryByText('Sin acceso')).not.toBeInTheDocument()
  })

  test('redirige a /sin-acceso si la query falla (error de red/401)', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
      isSuccess: false,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderGuard('usuarios.ver')

    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Página Usuarios')).not.toBeInTheDocument()
  })
})
