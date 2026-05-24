import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FormularioUsuario } from '../components/formulario-usuario'
import type { EsquemaEditarUsuario } from '../schemas/usuario-schema'
import type { UsuarioGestion } from '../types/usuario'

// Mock del hook de roles
vi.mock('../hooks/use-todos-los-roles')
import { useTodosLosRoles } from '../hooks/use-todos-los-roles'

const rolesDisponibles = [
  {
    id: 1,
    name: 'operador',
    guard_name: 'web',
    es_inicial: true,
    permisos: [],
    cantidad_usuarios: 0,
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    name: 'consulta',
    guard_name: 'web',
    es_inicial: true,
    permisos: [],
    cantidad_usuarios: 0,
    created_at: '',
    updated_at: '',
  },
]

const usuarioExistente: UsuarioGestion = {
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
}

function crearQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

describe('FormularioUsuario — modo crear', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodosLosRoles).mockReturnValue({
      data: rolesDisponibles,
      isLoading: false,
    } as unknown as ReturnType<typeof useTodosLosRoles>)
  })

  test('renderiza los campos principales en modo crear', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn()}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByPlaceholderText('Juan Carlos')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Pérez')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('jperez@scada.local')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repetí la contraseña')).toBeInTheDocument()
  })

  test('muestra error cuando el email es inválido', async () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn()}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    const inputEmail = screen.getByPlaceholderText('jperez@scada.local')
    fireEvent.change(inputEmail, { target: { value: 'no-es-un-email' } })

    const botonGuardar = screen.getByText('Guardar')
    fireEvent.click(botonGuardar)

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })
  })

  test('muestra error cuando el password tiene menos de 8 caracteres', async () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn()}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    const inputPassword = screen.getByPlaceholderText('Mínimo 8 caracteres')
    fireEvent.change(inputPassword, { target: { value: 'corto' } })

    const botonGuardar = screen.getByText('Guardar')
    fireEvent.click(botonGuardar)

    await waitFor(() => {
      expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    })
  })

  test('muestra error cuando los passwords no coinciden', async () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn()}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    const inputPassword = screen.getByPlaceholderText('Mínimo 8 caracteres')
    const inputConfirm = screen.getByPlaceholderText('Repetí la contraseña')

    fireEvent.change(inputPassword, { target: { value: 'password123' } })
    fireEvent.change(inputConfirm, { target: { value: 'diferente123' } })

    const botonGuardar = screen.getByText('Guardar')
    fireEvent.click(botonGuardar)

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    })
  })

  test('llama a alSubmit con datos válidos', async () => {
    const alSubmitCrear = vi.fn()

    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={alSubmitCrear}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('Juan Carlos'), {
      target: { value: 'Juan' },
    })
    fireEvent.change(screen.getByPlaceholderText('Pérez'), {
      target: { value: 'Pérez' },
    })
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Juan Pérez' },
    })
    fireEvent.change(screen.getByPlaceholderText('jperez@scada.local'), {
      target: { value: 'jperez@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Repetí la contraseña'), {
      target: { value: 'password123' },
    })

    const botonGuardar = screen.getByText('Guardar')
    fireEvent.click(botonGuardar)

    await waitFor(() => {
      expect(alSubmitCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          nombres: 'Juan',
          apellido_paterno: 'Pérez',
          name: 'Juan Pérez',
          email: 'jperez@test.com',
          password: 'password123',
          password_confirmation: 'password123',
        }),
      )
    })
  })

  test('muestra estado de loading durante el submit', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="crear"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn()}
          estaCargando={true}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Guardando...')).toBeInTheDocument()
  })
})

describe('FormularioUsuario — modo editar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodosLosRoles).mockReturnValue({
      data: rolesDisponibles,
      isLoading: false,
    } as unknown as ReturnType<typeof useTodosLosRoles>)
  })

  test('modo edición muestra campos de password y password_confirmation', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="editar"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn() as (datos: EsquemaEditarUsuario) => void}
          usuarioEditando={usuarioExistente}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByPlaceholderText('Dejar vacío para no cambiar')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repetí la contraseña')).toBeInTheDocument()
  })

  test('modo edición muestra selector de estado y rol', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="editar"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn() as (datos: EsquemaEditarUsuario) => void}
          usuarioEditando={usuarioExistente}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Rol')).toBeInTheDocument()
  })

  test('modo edición prellena los campos con datos del usuario', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="editar"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn() as (datos: EsquemaEditarUsuario) => void}
          usuarioEditando={usuarioExistente}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByPlaceholderText('jperez@scada.local')).toHaveValue('jperez@test.com')
  })

  test('modo edición muestra título "Editar usuario"', () => {
    render(
      <QueryClientProvider client={crearQueryClient()}>
        <FormularioUsuario
          modo="editar"
          abierto={true}
          alCerrar={vi.fn()}
          alSubmit={vi.fn() as (datos: EsquemaEditarUsuario) => void}
          usuarioEditando={usuarioExistente}
          estaCargando={false}
        />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Editar usuario')).toBeInTheDocument()
  })
})
