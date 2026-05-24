import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PaginaRoles } from '../components/pagina-roles'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import type { Usuario } from '@/features/autenticacion/types/sesion'
import type { Rol } from '../types/rol'

// Mock de hooks y servicios
vi.mock('../hooks/use-roles')
vi.mock('../hooks/use-mutaciones-rol')
vi.mock('../hooks/use-todos-los-permisos')

// Mock de componentes con dependencias externas problemáticas en jsdom
vi.mock('../components/formulario-rol', () => ({
  FormularioRol: ({
    abierto,
    alCerrar,
  }: {
    abierto: boolean
    alCerrar: () => void
    alSubmit: (d: unknown) => void
    rolEditando: Rol | null
    cargando?: boolean
    errorBackend?: string | null
  }) =>
    abierto ? (
      <div data-testid="formulario-rol">
        <span>Crear rol</span>
        <button type="button" onClick={alCerrar}>
          Cancelar formulario
        </button>
      </div>
    ) : null,
}))

vi.mock('../components/dialogo-permisos-rol', () => ({
  DialogoPermisosRol: ({
    rol,
    alCerrar,
  }: {
    rol: Rol | null
    alCerrar: () => void
    alGuardar: (p: string[]) => void
    cargando?: boolean
    errorBackend?: string | null
  }) =>
    rol ? (
      <div data-testid="dialogo-permisos">
        <span>Asignar permisos</span>
        <button type="button" onClick={alCerrar}>
          Cancelar permisos
        </button>
      </div>
    ) : null,
}))

vi.mock('../components/dialogo-eliminar-rol', () => ({
  DialogoEliminarRol: ({
    rol,
    alCerrar,
  }: {
    rol: Rol | null
    alCerrar: () => void
    alConfirmar: () => void
    cargando?: boolean
    errorBackend?: string | null
  }) =>
    rol ? (
      <div data-testid="dialogo-eliminar">
        <span>Eliminar rol</span>
        <button type="button" onClick={alCerrar}>
          Cancelar eliminar
        </button>
      </div>
    ) : null,
}))

import { useRoles } from '../hooks/use-roles'
import {
  useCrearRol,
  useActualizarRol,
  useSincronizarPermisos,
  useEliminarRol,
} from '../hooks/use-mutaciones-rol'
import { useTodosLosPermisos } from '../hooks/use-todos-los-permisos'

const useRolesMock = vi.mocked(useRoles)
const useCrearRolMock = vi.mocked(useCrearRol)
const useActualizarRolMock = vi.mocked(useActualizarRol)
const useSincronizarPermisosMock = vi.mocked(useSincronizarPermisos)
const useEliminarRolMock = vi.mocked(useEliminarRol)
const useTodosLosPermisosMock = vi.mocked(useTodosLosPermisos)

const mutacionVacia = {
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
  mutateAsync: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isIdle: true,
  isPaused: false,
  status: 'idle' as const,
  submittedAt: 0,
  variables: undefined,
}

const rolesIniciales: Rol[] = [
  {
    id: 1,
    name: 'administrador',
    guard_name: 'web',
    es_inicial: true,
    permisos: [{ id: 1, name: 'roles.ver' }],
    cantidad_usuarios: 3,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'operador',
    guard_name: 'web',
    es_inicial: true,
    permisos: [],
    cantidad_usuarios: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'supervisor',
    guard_name: 'web',
    es_inicial: false,
    permisos: [],
    cantidad_usuarios: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
]

const usuarioAdmin: Usuario = {
  id: 1,
  name: 'Admin Test',
  email: 'admin@test.com',
  dni: null,
  nombres: null,
  apellido_paterno: null,
  apellido_materno: null,
  activo: true,
  roles: ['administrador'],
  permisos: ['roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar'],
}

const usuarioSoloLectura: Usuario = {
  ...usuarioAdmin,
  permisos: ['roles.ver'],
}

function crearWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

function configurarMocksBase(
  opciones: {
    cargando?: boolean
    error?: boolean
    roles?: Rol[]
  } = {},
) {
  const { cargando = false, error = false, roles = rolesIniciales } = opciones

  useRolesMock.mockReturnValue({
    data: error
      ? undefined
      : {
          data: roles,
          meta: { current_page: 1, last_page: 1, total: roles.length, per_page: 15 },
          links: { first: '', last: '', prev: null, next: null },
        },
    isLoading: cargando,
    isError: error,
    isPending: cargando,
    isSuccess: !cargando && !error,
    error: error ? new Error('Error al cargar') : null,
    status: cargando ? 'pending' : error ? 'error' : 'success',
    fetchStatus: 'idle',
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: cargando,
    refetch: vi.fn(),
    promise: Promise.resolve(undefined),
  } as unknown as ReturnType<typeof useRoles>)

  useCrearRolMock.mockReturnValue(mutacionVacia as ReturnType<typeof useCrearRol>)
  useActualizarRolMock.mockReturnValue(mutacionVacia as ReturnType<typeof useActualizarRol>)
  useSincronizarPermisosMock.mockReturnValue(
    mutacionVacia as ReturnType<typeof useSincronizarPermisos>,
  )
  useEliminarRolMock.mockReturnValue(mutacionVacia as ReturnType<typeof useEliminarRol>)

  useTodosLosPermisosMock.mockReturnValue({
    data: [
      { id: 1, name: 'roles.ver', guard_name: 'web' },
      { id: 2, name: 'roles.crear', guard_name: 'web' },
    ],
    isLoading: false,
    isError: false,
    isPending: false,
    isSuccess: true,
    error: null,
    status: 'success',
    fetchStatus: 'idle',
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: false,
    refetch: vi.fn(),
    promise: Promise.resolve(undefined),
  } as unknown as ReturnType<typeof useTodosLosPermisos>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useSesionStore.setState({ usuario: null, estaAutenticado: false })
})

describe('PaginaRoles', () => {
  it('muestra estado de carga correctamente', () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase({ cargando: true })

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    expect(screen.getByText('Cargando roles...')).toBeInTheDocument()
  })

  it('muestra error cuando la carga falla', () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase({ error: true })

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    expect(screen.getByText(/Error al cargar los roles/)).toBeInTheDocument()
  })

  it('renderiza la tabla con roles cuando la carga es exitosa', () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    expect(screen.getByText('administrador')).toBeInTheDocument()
    expect(screen.getByText('operador')).toBeInTheDocument()
    expect(screen.getByText('supervisor')).toBeInTheDocument()
  })

  it('roles iniciales muestran badge "Sistema"', () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    // administrador y operador son iniciales → dos badges "Sistema"
    const badgesSistema = screen.getAllByText('Sistema')
    expect(badgesSistema).toHaveLength(2)
  })

  it('roles iniciales tienen items Editar y Eliminar deshabilitados en el DropdownMenu', async () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    const user = userEvent.setup()
    render(<PaginaRoles />, { wrapper: crearWrapper() })

    // Abrir el DropdownMenu del primer rol (administrador — es_inicial)
    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await user.click(triggerAcciones[0])

    await waitFor(() => {
      // Los ítems Editar y Eliminar deben estar en el DOM
      const itemEditar = screen.getByText('Editar').closest('[data-slot="dropdown-menu-item"]')
      const itemEliminar = screen.getByText('Eliminar').closest('[data-slot="dropdown-menu-item"]')
      expect(itemEditar).toBeInTheDocument()
      expect(itemEliminar).toBeInTheDocument()
      // Los ítems deben tener aria-disabled=true (Radix usa data-disabled)
      expect(itemEditar).toHaveAttribute('data-disabled')
      expect(itemEliminar).toHaveAttribute('data-disabled')
    })
  })

  it('botón "Crear rol" visible solo con permiso roles.crear', () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    expect(screen.getByRole('button', { name: /Crear rol/i })).toBeInTheDocument()
  })

  it('botón "Crear rol" NO visible sin permiso roles.crear', () => {
    useSesionStore.setState({ usuario: usuarioSoloLectura, estaAutenticado: true })
    configurarMocksBase()

    render(<PaginaRoles />, { wrapper: crearWrapper() })

    expect(screen.queryByRole('button', { name: /Crear rol/i })).not.toBeInTheDocument()
  })

  it('click en "Crear rol" abre el formulario', async () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    const user = userEvent.setup()
    render(<PaginaRoles />, { wrapper: crearWrapper() })

    await user.click(screen.getByRole('button', { name: /Crear rol/i }))

    await waitFor(() => {
      expect(screen.getByTestId('formulario-rol')).toBeInTheDocument()
    })
  })

  it('click en "Permisos" abre el modal de permisos', async () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    const user = userEvent.setup()
    render(<PaginaRoles />, { wrapper: crearWrapper() })

    // Abrir el DropdownMenu del primer rol y hacer click en el ítem "Permisos"
    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await user.click(triggerAcciones[0])

    // El ítem del menú tiene role="menuitem" — distinguimos del <th>Permisos</th>
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /permisos/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('menuitem', { name: /permisos/i }))

    await waitFor(() => {
      expect(screen.getByTestId('dialogo-permisos')).toBeInTheDocument()
    })
  })

  it('filtra roles por el campo de búsqueda', async () => {
    useSesionStore.setState({ usuario: usuarioAdmin, estaAutenticado: true })
    configurarMocksBase()

    const user = userEvent.setup()
    render(<PaginaRoles />, { wrapper: crearWrapper() })

    const inputBusqueda = screen.getByPlaceholderText('Buscar por nombre...')
    await user.type(inputBusqueda, 'admin')

    expect(screen.getByText('administrador')).toBeInTheDocument()
    expect(screen.queryByText('operador')).not.toBeInTheDocument()
    expect(screen.queryByText('supervisor')).not.toBeInTheDocument()
  })
})
