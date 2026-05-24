import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaginaPermisos } from '../components/pagina-permisos'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import * as hookPermisos from '../hooks/use-permisos'
import * as hookMutaciones from '../hooks/use-mutaciones-permiso'
import type { Permiso } from '../types/permiso'
import type { UseQueryResult } from '@tanstack/react-query'
import type { RespuestaPermisosPaginada } from '../services/permisos-service'

// Mock de los hooks de permisos
vi.mock('../hooks/use-permisos', () => ({
  usePermisos: vi.fn(),
  QUERY_KEYS_PERMISOS: {
    todos: ['permisos'],
    lista: (params?: unknown) => ['permisos', params],
  },
}))

vi.mock('../hooks/use-mutaciones-permiso', () => ({
  useCrearPermiso: vi.fn(),
  useActualizarPermiso: vi.fn(),
  useEliminarPermiso: vi.fn(),
}))

const permisosEjemplo: Permiso[] = [
  {
    id: 1,
    name: 'usuarios.ver',
    guard_name: 'web',
    modulo: 'usuarios',
    accion: 'ver',
    es_canonico: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'usuarios.crear',
    guard_name: 'web',
    modulo: 'usuarios',
    accion: 'crear',
    es_canonico: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'conexiones.ver',
    guard_name: 'web',
    modulo: 'conexiones',
    accion: 'ver',
    es_canonico: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'custom.permiso',
    guard_name: 'web',
    modulo: 'custom',
    accion: 'permiso',
    es_canonico: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

// Mock base para mutaciones
const mutacionMockBase = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
  status: 'idle',
  variables: undefined,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isIdle: true,
  isPaused: false,
  submittedAt: 0,
}

// Mock base para queries
function crearQueryMock(
  overrides: Partial<UseQueryResult<RespuestaPermisosPaginada, Error>> = {},
): UseQueryResult<RespuestaPermisosPaginada, Error> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isPending: false,
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
    isFetching: false,
    isRefetching: false,
    isStale: false,
    isPlaceholderData: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    refetch: vi.fn(),
    isLoadingError: false,
    isRefetchError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: false,
    promise: Promise.resolve(undefined as unknown as RespuestaPermisosPaginada),
    ...overrides,
  } as unknown as UseQueryResult<RespuestaPermisosPaginada, Error>
}

function crearWrapper() {
  const clienteQuery = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={clienteQuery}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

function configurarMocksDefecto() {
  vi.mocked(hookPermisos.usePermisos).mockReturnValue(crearQueryMock())

  vi.mocked(hookMutaciones.useCrearPermiso).mockReturnValue(
    mutacionMockBase as unknown as ReturnType<typeof hookMutaciones.useCrearPermiso>,
  )
  vi.mocked(hookMutaciones.useActualizarPermiso).mockReturnValue(
    mutacionMockBase as unknown as ReturnType<typeof hookMutaciones.useActualizarPermiso>,
  )
  vi.mocked(hookMutaciones.useEliminarPermiso).mockReturnValue(
    mutacionMockBase as unknown as ReturnType<typeof hookMutaciones.useEliminarPermiso>,
  )
}

describe('PaginaPermisos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({
      usuario: {
        id: 1,
        name: 'Administrador',
        email: 'admin@test.com',
        dni: null,
        nombres: 'Admin',
        apellido_paterno: 'Test',
        apellido_materno: null,
        activo: true,
        roles: ['administrador'],
        permisos: [
          'permisos.ver',
          'permisos.crear',
          'permisos.editar',
          'permisos.eliminar',
        ],
      },
      estaAutenticado: true,
    })
    configurarMocksDefecto()
  })

  test('renderiza el estado de carga con skeletons', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({ isLoading: true, data: undefined, isSuccess: false }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  test('renderiza el estado de error cuando falla la carga', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({ isLoading: false, isError: true, data: undefined, isSuccess: false }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    expect(
      screen.getByText(/Error al cargar los permisos/i),
    ).toBeInTheDocument()
  })

  test('renderiza la tabla agrupada por módulo cuando hay datos', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({
        isLoading: false,
        isError: false,
        data: {
          data: permisosEjemplo,
          meta: { current_page: 1, last_page: 1, total: 4, per_page: 100 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    // Verifica que se muestran los módulos
    expect(screen.getByText('usuarios')).toBeInTheDocument()
    expect(screen.getByText('conexiones')).toBeInTheDocument()
    expect(screen.getByText('custom')).toBeInTheDocument()

    // Verifica que se muestran los permisos
    expect(screen.getByText('usuarios.ver')).toBeInTheDocument()
    expect(screen.getByText('custom.permiso')).toBeInTheDocument()
  })

  test('renderiza el estado vacío cuando no hay permisos', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({
        isLoading: false,
        isError: false,
        data: {
          data: [],
          meta: { current_page: 1, last_page: 1, total: 0, per_page: 100 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    expect(screen.getByText(/No se encontraron permisos/i)).toBeInTheDocument()
  })

  test('muestra el botón "Crear permiso" solo si el usuario tiene permisos.crear', () => {
    useSesionStore.setState({
      usuario: {
        id: 1,
        name: 'Operador',
        email: 'operador@test.com',
        dni: null,
        nombres: null,
        apellido_paterno: null,
        apellido_materno: null,
        activo: true,
        roles: ['operador'],
        permisos: ['permisos.ver'],
      },
      estaAutenticado: true,
    })

    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({
        isLoading: false,
        isError: false,
        data: {
          data: [],
          meta: { current_page: 1, last_page: 1, total: 0, per_page: 100 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    expect(screen.queryByRole('button', { name: /Crear permiso/i })).not.toBeInTheDocument()
  })

  test('botones de editar/eliminar deshabilitados para permisos canónicos', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({
        isLoading: false,
        isError: false,
        data: {
          data: permisosEjemplo,
          meta: { current_page: 1, last_page: 1, total: 4, per_page: 100 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    // Los botones de editar/eliminar para permisos canónicos están disabled
    const botonesEditar = screen.getAllByLabelText(/Editar usuarios/i)
    expect(botonesEditar[0]).toBeDisabled()

    const botonesEliminar = screen.getAllByLabelText(/Eliminar usuarios/i)
    expect(botonesEliminar[0]).toBeDisabled()
  })

  test('click en "Crear permiso" abre el modal', () => {
    vi.mocked(hookPermisos.usePermisos).mockReturnValue(
      crearQueryMock({
        isLoading: false,
        isError: false,
        data: {
          data: [],
          meta: { current_page: 1, last_page: 1, total: 0, per_page: 100 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    const Wrapper = crearWrapper()
    render(<PaginaPermisos />, { wrapper: Wrapper })

    const botonCrear = screen.getByRole('button', { name: /Crear permiso/i })
    fireEvent.click(botonCrear)

    // El modal se abre — hay input del formulario visible
    expect(screen.getByPlaceholderText(/modulo\.accion/i)).toBeInTheDocument()
  })
})
