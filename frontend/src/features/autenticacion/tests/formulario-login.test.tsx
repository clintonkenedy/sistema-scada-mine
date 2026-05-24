import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { FormularioLogin } from '../components/formulario-login'
import { useSesionStore } from '../stores/sesion-store'
import api from '@/shared/services/api'

// Mockear axios (api) para controlar las respuestas
vi.mock('@/shared/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

const renderFormulario = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <FormularioLogin />
      </QueryClientProvider>
    </BrowserRouter>,
  )
}

describe('FormularioLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSesionStore.setState({ usuario: null, estaAutenticado: false })
  })

  test('T-F-01: email inválido no llega al backend', async () => {
    const user = userEvent.setup()
    renderFormulario()

    await user.type(screen.getByLabelText(/email/i), 'noesEmail')
    await user.type(screen.getByLabelText(/contraseña/i), 'validpassword123')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      // El mensaje del schema Zod 4 para email inválido
      expect(screen.getByText(/ingresá un email válido/i)).toBeInTheDocument()
    })
    expect(vi.mocked(api.post)).not.toHaveBeenCalled()
  })

  test('T-F-02: password corta no llega al backend', async () => {
    const user = userEvent.setup()
    renderFormulario()

    await user.type(screen.getByLabelText(/email/i), 'valido@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'abc')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      // El mensaje del schema Zod 4 para password corta
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    })
    expect(vi.mocked(api.post)).not.toHaveBeenCalled()
  })

  test('T-F-03: banner de error con credenciales inválidas (422)', async () => {
    const user = userEvent.setup()

    // Mock 422 de Laravel con mensaje de credentials
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: 'These credentials do not match our records.',
          errors: {
            email: ['These credentials do not match our records.'],
          },
        },
      },
    })

    renderFormulario()

    await user.type(screen.getByLabelText(/email/i), 'admin@scada.local')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      const banner = screen.getByRole('alert')
      expect(banner).toHaveTextContent('Email o contraseña incorrectos')
    })
  })

  test('T-F-04: login exitoso - 1 sola request (setQueryData, NO invalidate)', async () => {
    const user = userEvent.setup()

    // Mock de POST /login exitoso con UsuarioResource (campos RBAC incluidos)
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          name: 'Administrador SCADA',
          email: 'admin@scada.local',
          dni: null,
          nombres: 'Administrador',
          apellido_paterno: 'SCADA',
          apellido_materno: null,
          activo: true,
          roles: ['administrador'],
          permisos: ['usuarios.ver'],
        },
      },
    })

    renderFormulario()

    await user.type(screen.getByLabelText(/email/i), 'admin@scada.local')
    await user.type(screen.getByLabelText(/contraseña/i), 'admin1234')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      // Verificar que POST /login fue llamado EXACTAMENTE 1 vez
      expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(api.post)).toHaveBeenCalledWith('/login', {
        email: 'admin@scada.local',
        password: 'admin1234',
      })
      // Verificar que GET /api/usuario NO fue llamado (contrato unificado Opción B)
      expect(vi.mocked(api.get)).not.toHaveBeenCalled()
      // Verificar que Zustand está sincronizado
      expect(useSesionStore.getState().estaAutenticado).toBe(true)
      expect(useSesionStore.getState().usuario?.email).toBe(
        'admin@scada.local',
      )
    })
  })
})
