import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidebarAdmin, ContenidoSidebar } from '../sidebar-admin'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Usuario } from '@/features/autenticacion/types/sesion'

vi.mock('@/features/autenticacion/hooks/use-usuario-actual', () => ({
  useUsuarioActual: vi.fn(),
  QUERY_KEY_USUARIO: ['usuario-actual'],
}))

vi.mock('@/features/autenticacion/hooks/use-logout', () => ({
  useLogout: vi.fn(),
}))

import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'
import { useLogout } from '@/features/autenticacion/hooks/use-logout'

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

const mockUseLogout = () => {
  vi.mocked(useLogout).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useLogout>)
}

const renderSidebar = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SidebarAdmin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const renderContenidoSidebar = (alNavegar?: () => void) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ContenidoSidebar alNavegar={alNavegar} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SidebarAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLogout()
  })

  test('nav tiene aria-label de Navegación principal', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()
    expect(
      screen.getByRole('navigation', { name: /navegación principal/i }),
    ).toBeInTheDocument()
  })

  test('T-F-09: usuario con todos los permisos RBAC ve los 4 items', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver', 'roles.ver', 'permisos.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Permisos')).toBeInTheDocument()
  })

  test('usuario solo con usuarios.ver ve Mapa + Usuarios', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.queryByText('Roles')).not.toBeInTheDocument()
    expect(screen.queryByText('Permisos')).not.toBeInTheDocument()
  })

  test('usuario sin ningún permiso RBAC solo ve Mapa', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['mapa.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Roles')).not.toBeInTheDocument()
    expect(screen.queryByText('Permisos')).not.toBeInTheDocument()
  })

  test('cada item tiene el href correcto', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver', 'roles.ver', 'permisos.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    const mapaLink = screen.getByText('Mapa').closest('a')
    expect(mapaLink).toHaveAttribute('href', '/mapa')

    const usuariosLink = screen.getByText('Usuarios').closest('a')
    expect(usuariosLink).toHaveAttribute('href', '/usuarios')

    const rolesLink = screen.getByText('Roles').closest('a')
    expect(rolesLink).toHaveAttribute('href', '/roles')

    const permisosLink = screen.getByText('Permisos').closest('a')
    expect(permisosLink).toHaveAttribute('href', '/permisos')
  })

  test('footer muestra el nombre del usuario logueado', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('test@test.com')).toBeInTheDocument()
  })

  test('footer muestra el botón Salir', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  test('footer muestra la versión v1.0.0', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderSidebar()

    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })
})

describe('ContenidoSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLogout()
  })

  test('renderiza el mismo contenido de navegación que SidebarAdmin', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver', 'roles.ver', 'permisos.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar()

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Permisos')).toBeInTheDocument()
  })

  test('llama alNavegar cuando se hace clic en un NavLink', () => {
    const alNavegar = vi.fn()
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar(alNavegar)

    const enlaceMapa = screen.getByText('Mapa').closest('a')!
    fireEvent.click(enlaceMapa)

    expect(alNavegar).toHaveBeenCalledTimes(1)
  })

  test('no requiere alNavegar — es opcional', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    // No debe lanzar error sin alNavegar
    expect(() => renderContenidoSidebar()).not.toThrow()
    const enlaceMapa = screen.getByText('Mapa').closest('a')!
    expect(() => fireEvent.click(enlaceMapa)).not.toThrow()
  })

  test('respeta los permisos igual que SidebarAdmin', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['roles.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar()

    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.queryByText('Permisos')).not.toBeInTheDocument()
  })

  test('footer muestra nombre y email del usuario logueado', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos(['usuarios.ver']),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar()

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('test@test.com')).toBeInTheDocument()
  })

  test('footer: clic en Salir llama a cerrarSesion', () => {
    const mutate = vi.fn()
    vi.mocked(useLogout).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>)

    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar()

    const botonSalir = screen.getByRole('button', { name: /cerrar sesión/i })
    fireEvent.click(botonSalir)

    expect(mutate).toHaveBeenCalledTimes(1)
  })

  test('footer muestra la versión v1.0.0', () => {
    vi.mocked(useUsuarioActual).mockReturnValue({
      isLoading: false,
      data: usuarioConPermisos([]),
      isError: false,
      isSuccess: true,
    } as unknown as UseQueryResult<Usuario, Error>)

    renderContenidoSidebar()

    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })
})
