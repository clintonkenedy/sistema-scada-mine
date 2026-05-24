import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PaginaUsuarios } from '../components/pagina-usuarios'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import type { Usuario } from '@/features/autenticacion/types/sesion'
import type { RespuestaPaginada } from '@/shared/types/filtros-api'
import type { UsuarioGestion } from '../types/usuario'

// Mocks de los hooks
vi.mock('@/shared/hooks/use-filtros-api')
vi.mock('../hooks/use-todos-los-roles')
vi.mock('../hooks/use-mutaciones-usuario')

import { useFiltrosApi } from '@/shared/hooks/use-filtros-api'
import { useTodosLosRoles } from '../hooks/use-todos-los-roles'
import {
  useCrearUsuario,
  useActualizarUsuario,
  useEliminarUsuario,
  useAsignarRolUsuario,
  useToggleActivoUsuario,
} from '../hooks/use-mutaciones-usuario'

const usuarioConPermisos = (permisos: string[]): Usuario => ({
  id: 99,
  name: 'Admin Test',
  email: 'admin@test.com',
  dni: null,
  nombres: 'Admin',
  apellido_paterno: 'Test',
  apellido_materno: null,
  activo: true,
  roles: ['administrador'],
  permisos,
})

const respuestaPaginadaVacia: RespuestaPaginada<UsuarioGestion> = {
  data: [],
  meta: { current_page: 1, last_page: 1, total: 0, per_page: 15, from: null, to: null },
  links: { first: '', last: '', prev: null, next: null },
}

const respuestaPaginada: RespuestaPaginada<UsuarioGestion> = {
  data: [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'jperez@test.com',
      dni: '12345678',
      nombres: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: 'García',
      activo: true,
      roles: ['operador'],
      permisos: ['mapa.ver'],
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      name: 'María López',
      email: 'mlopez@test.com',
      dni: null,
      nombres: 'María',
      apellido_paterno: 'López',
      apellido_materno: null,
      activo: false,
      roles: [],
      permisos: [],
      created_at: '2024-02-20T14:30:00Z',
    },
  ],
  meta: { current_page: 1, last_page: 2, total: 20, per_page: 15, from: 1, to: 15 },
  links: { first: '', last: '', prev: null, next: '' },
}

const mutacionMock = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
}

// Helper: mock del retorno de useFiltrosApi con shape completo
function mockResultadoFiltros(
  overrides: Partial<ReturnType<typeof useFiltrosApi>> = {},
): ReturnType<typeof useFiltrosApi> {
  return {
    data: respuestaPaginada,
    isLoading: false,
    isError: false,
    isPlaceholderData: false,
    error: null,
    estado: {
      filtros: {},
      orden: null,
      pagina: 1,
      porPagina: 15,
    },
    setFiltro: vi.fn(),
    quitarFiltro: vi.fn(),
    setOrden: vi.fn(),
    quitarOrden: vi.fn(),
    setPagina: vi.fn(),
    setPorPagina: vi.fn(),
    resetear: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useFiltrosApi>
}

function configurarMocks() {
  vi.mocked(useFiltrosApi).mockReturnValue(mockResultadoFiltros())

  // useTodosLosRoles retorna data: Rol[] directamente
  vi.mocked(useTodosLosRoles).mockReturnValue({
    data: [
      {
        id: 1,
        name: 'operador',
        guard_name: 'web',
        es_inicial: true,
        permisos: [],
        cantidad_usuarios: 5,
        created_at: '',
        updated_at: '',
      },
    ],
    isLoading: false,
  } as unknown as ReturnType<typeof useTodosLosRoles>)

  vi.mocked(useCrearUsuario).mockReturnValue(
    mutacionMock as unknown as ReturnType<typeof useCrearUsuario>,
  )
  vi.mocked(useActualizarUsuario).mockReturnValue(
    mutacionMock as unknown as ReturnType<typeof useActualizarUsuario>,
  )
  vi.mocked(useEliminarUsuario).mockReturnValue(
    mutacionMock as unknown as ReturnType<typeof useEliminarUsuario>,
  )
  vi.mocked(useAsignarRolUsuario).mockReturnValue(
    mutacionMock as unknown as ReturnType<typeof useAsignarRolUsuario>,
  )
  vi.mocked(useToggleActivoUsuario).mockReturnValue(
    mutacionMock as unknown as ReturnType<typeof useToggleActivoUsuario>,
  )
}

function renderPagina() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PaginaUsuarios />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({
      usuario: usuarioConPermisos([
        'usuarios.ver',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.eliminar',
      ]),
      estaAutenticado: true,
    })
    configurarMocks()
  })

  // ── Tests que no dependen del cambio de hook ────────────────────────────────

  test('renderiza el encabezado de la página', () => {
    renderPagina()
    expect(screen.getByText('Usuarios del sistema')).toBeInTheDocument()
  })

  test('muestra skeleton mientras carga', () => {
    vi.mocked(useFiltrosApi).mockReturnValue(
      mockResultadoFiltros({ data: undefined, isLoading: true }),
    )
    renderPagina()
    expect(screen.getByLabelText('Cargando usuarios')).toBeInTheDocument()
  })

  test('muestra error cuando falla la query', () => {
    vi.mocked(useFiltrosApi).mockReturnValue(
      mockResultadoFiltros({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Error de red'),
      }),
    )
    renderPagina()
    expect(screen.getByText(/Error al cargar usuarios/i)).toBeInTheDocument()
  })

  test('renderiza tabla con usuarios cuando hay datos', () => {
    renderPagina()

    // nombre completo: apellido_paterno apellido_materno nombres (formato peruano)
    expect(screen.getByText('Pérez García Juan')).toBeInTheDocument()
    expect(screen.getByText('jperez@test.com')).toBeInTheDocument()
    // María no tiene apellido_materno
    expect(screen.getByText('López María')).toBeInTheDocument()
  })

  test('muestra estado vacío cuando no hay usuarios', () => {
    vi.mocked(useFiltrosApi).mockReturnValue(
      mockResultadoFiltros({ data: respuestaPaginadaVacia }),
    )
    renderPagina()
    expect(screen.getByText('No se encontraron usuarios')).toBeInTheDocument()
  })

  test('botón Crear usuario visible con permiso usuarios.crear', () => {
    renderPagina()
    expect(screen.getByText('Crear usuario')).toBeInTheDocument()
  })

  test('botón Crear usuario NO visible sin permiso usuarios.crear', () => {
    useSesionStore.setState({
      usuario: usuarioConPermisos(['usuarios.ver']),
      estaAutenticado: true,
    })

    renderPagina()
    expect(screen.queryByText('Crear usuario')).not.toBeInTheDocument()
  })

  test('click en Crear usuario abre el modal', async () => {
    renderPagina()

    const botonCrear = screen.getByText('Crear usuario')
    fireEvent.click(botonCrear)

    await waitFor(() => {
      expect(
        screen.getByText('Crear usuario', { selector: '[data-slot="dialog-title"], h2' }),
      ).toBeInTheDocument()
    })
  })

  // ── Tests actualizados para el nuevo contrato con useFiltrosApi ────────────

  test('filtro de búsqueda actualiza el input', () => {
    renderPagina()

    const inputBuscar = screen.getByPlaceholderText('Buscar por nombre o email...')
    fireEvent.change(inputBuscar, { target: { value: 'Juan' } })

    // BuscadorTexto mantiene estado local; verificamos que el input muestra el valor
    expect(inputBuscar).toHaveValue('Juan')
    // setFiltro se llama después del debounce — testeado en buscador-texto.test.tsx
  })

  test('filtro activo renderiza el trigger de shadcn Select con aria-label correcto', () => {
    const setFiltro = vi.fn()
    vi.mocked(useFiltrosApi).mockReturnValue(mockResultadoFiltros({ setFiltro }))
    renderPagina()

    // Radix SelectTrigger expone role="combobox" con el aria-label pasado al trigger
    const selectEstado = screen.getByRole('combobox', { name: 'Filtrar por estado' })
    expect(selectEstado).toBeInTheDocument()

    // Verificar que el trigger de rol también está presente
    const selectRol = screen.getByRole('combobox', { name: 'Filtrar por rol' })
    expect(selectRol).toBeInTheDocument()
  })

  test('paginación: click en Siguiente llama setPagina(2)', () => {
    const setPagina = vi.fn()
    vi.mocked(useFiltrosApi).mockReturnValue(mockResultadoFiltros({ setPagina }))
    renderPagina()

    // PaginadorTabla renderiza Siguiente porque last_page=2 y pagina=1
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }))
    expect(setPagina).toHaveBeenCalledWith(2)
  })

  // ── Tests de modales (preservados del original) ─────────────────────────────

  test('click en editar abre modal de edición', async () => {
    const usuario = userEvent.setup()
    renderPagina()

    // El trigger del DropdownMenu usa aria-label dinámico por usuario
    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    // Dentro del menú, hacer click en "Editar"
    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })
    await usuario.click(screen.getByText('Editar'))

    await waitFor(() => {
      expect(screen.getByText('Editar usuario')).toBeInTheDocument()
    })
  })

  test('click en asignar rol abre modal correcto', async () => {
    const usuario = userEvent.setup()
    renderPagina()

    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    await waitFor(() => {
      expect(screen.getByText('Asignar rol')).toBeInTheDocument()
    })
    await usuario.click(screen.getByText('Asignar rol'))

    await waitFor(() => {
      expect(screen.getByText('Asignar rol', { selector: '[data-slot="dialog-title"], h2' })).toBeInTheDocument()
    })
  })

  test('click en eliminar abre modal de confirmación', async () => {
    const usuario = userEvent.setup()
    renderPagina()

    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    await waitFor(() => {
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })
    await usuario.click(screen.getByText('Eliminar'))

    await waitFor(() => {
      expect(screen.getByText('Eliminar usuario')).toBeInTheDocument()
    })
  })

  // ── Tests del DropdownMenu de acciones (T-17) ───────────────────────────────

  test('DropdownMenu muestra todas las acciones con permisos editar + eliminar', async () => {
    const usuario = userEvent.setup()
    renderPagina()

    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument()
      expect(screen.getByText('Asignar rol')).toBeInTheDocument()
      // usuario[0] activo → debe mostrar "Desactivar"
      expect(screen.getByText('Desactivar')).toBeInTheDocument()
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })
  })

  test('DropdownMenu solo muestra eliminar cuando no hay permiso editar', async () => {
    const usuario = userEvent.setup()
    useSesionStore.setState({
      usuario: usuarioConPermisos(['usuarios.ver', 'usuarios.eliminar']),
      estaAutenticado: true,
    })
    renderPagina()

    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    await waitFor(() => {
      expect(screen.queryByText('Editar')).not.toBeInTheDocument()
      expect(screen.queryByText('Asignar rol')).not.toBeInTheDocument()
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })
  })

  test('trigger de acciones no se muestra cuando no hay ningun permiso de acciones', () => {
    useSesionStore.setState({
      usuario: usuarioConPermisos(['usuarios.ver']),
      estaAutenticado: true,
    })
    renderPagina()

    // Sin permisos editar ni eliminar, el trigger no debe existir
    expect(screen.queryAllByRole('button', { name: /acciones para/i })).toHaveLength(0)
  })

  test('el item eliminar tiene estilo destructivo (variant="destructive")', async () => {
    const usuario = userEvent.setup()
    renderPagina()

    const triggerAcciones = screen.getAllByRole('button', { name: /acciones para/i })
    await usuario.click(triggerAcciones[0])

    await waitFor(() => {
      const itemEliminar = screen.getByText('Eliminar').closest('[data-slot="dropdown-menu-item"]')
      expect(itemEliminar).toHaveAttribute('data-variant', 'destructive')
    })
  })
})
