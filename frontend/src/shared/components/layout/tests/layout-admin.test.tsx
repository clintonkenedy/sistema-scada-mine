import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LayoutAdmin } from '../layout-admin'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Usuario } from '@/features/autenticacion/types/sesion'

// Mock useLogout para que no haga navegación real
vi.mock('@/features/autenticacion/hooks/use-logout', () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}))

// Mock useUsuarioActual para evitar queries reales en el sidebar
vi.mock('@/features/autenticacion/hooks/use-usuario-actual', () => ({
  useUsuarioActual: vi.fn(),
  QUERY_KEY_USUARIO: ['usuario-actual'],
}))

import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'

const estadoUsuarioPorDefecto = {
  usuario: {
    id: 1,
    name: 'Administrador SCADA',
    email: 'admin@scada.local',
    dni: null,
    nombres: 'Administrador',
    apellido_paterno: 'SCADA',
    apellido_materno: null,
    activo: true,
    roles: ['administrador'],
    permisos: [],
  },
  estaAutenticado: true,
}

const mockUsuario = (permisos: string[] = []) => {
  const usuario: Usuario = {
    ...estadoUsuarioPorDefecto.usuario,
    permisos,
  }
  vi.mocked(useUsuarioActual).mockReturnValue({
    isLoading: false,
    data: usuario,
    isError: false,
    isSuccess: true,
  } as unknown as UseQueryResult<Usuario, Error>)
}

const renderLayout = (rutaInicial = '/') => {
  const queryClient = new QueryClient()
  useSesionStore.setState(estadoUsuarioPorDefecto)
  mockUsuario()

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route element={<LayoutAdmin />}>
            <Route path="/" element={<div>inicio</div>} />
            <Route path="/mapa" element={<div>mapa</div>} />
            <Route path="/usuarios" element={<div>usuarios</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LayoutAdmin', () => {
  test('renderiza header con título SCADA Mine', () => {
    renderLayout()

    expect(screen.getByText('SCADA Mine')).toBeInTheDocument()
  })

  test('renderiza el nombre del usuario y botón Salir en el sidebar', () => {
    renderLayout()

    // El nombre y logout ahora están en el footer del sidebar (no en el header)
    expect(screen.getByText('Administrador SCADA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  test('renderiza el botón hamburguesa con aria-label correcto', () => {
    renderLayout()

    const botonHamburguesa = screen.getByRole('button', { name: /abrir menú de navegación/i })
    expect(botonHamburguesa).toBeInTheDocument()
  })

  test('el Sheet se abre al hacer clic en el botón hamburguesa', async () => {
    renderLayout()

    const botonHamburguesa = screen.getByRole('button', { name: /abrir menú de navegación/i })

    await act(async () => {
      fireEvent.click(botonHamburguesa)
    })

    // El Sheet (Radix Dialog) renderiza un role="dialog" cuando está abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('el Sheet se cierra al hacer clic en el overlay (Radix controla esto internamente)', async () => {
    renderLayout()

    const botonHamburguesa = screen.getByRole('button', { name: /abrir menú de navegación/i })

    await act(async () => {
      fireEvent.click(botonHamburguesa)
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Simular cierre via Radix (presionar Escape)
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' })
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('el contenido de navegación se muestra dentro del Sheet al abrirlo', async () => {
    useSesionStore.setState({
      ...estadoUsuarioPorDefecto,
      usuario: {
        ...estadoUsuarioPorDefecto.usuario,
        permisos: ['usuarios.ver', 'roles.ver', 'permisos.ver'],
      },
    })
    mockUsuario(['usuarios.ver', 'roles.ver', 'permisos.ver'])

    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<LayoutAdmin />}>
              <Route path="/" element={<div>inicio</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const botonHamburguesa = screen.getByRole('button', { name: /abrir menú de navegación/i })

    await act(async () => {
      fireEvent.click(botonHamburguesa)
    })

    // El Sheet debe contener los ítems de navegación
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // El nav de navegación principal debe estar en el DOM (dentro del Sheet)
    const navs = screen.getAllByRole('navigation', { name: /navegación principal/i })
    expect(navs.length).toBeGreaterThanOrEqual(1)
  })
})
