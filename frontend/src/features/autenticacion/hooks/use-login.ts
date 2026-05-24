import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { UseFormReturn } from 'react-hook-form'
import type { DatosLogin } from '../schemas/login-schema'
import type { Usuario } from '../types/sesion'
import { login } from '../services/autenticacion-service'
import { useSesionStore } from '../stores/sesion-store'
import type { ErroresLaravel422 } from '@/shared/types/errores'
import { QUERY_KEY_USUARIO } from './use-usuario-actual'

interface OpcionesUseLogin {
  form: UseFormReturn<DatosLogin>
}

// NOTA TanStack Query v5: onSuccess y onError de useMutation SÍ están disponibles.
// Solo fueron removidos de useQuery. Este hook usa useMutation correctamente.
export function useLogin({ form }: OpcionesUseLogin) {
  const queryClient = useQueryClient()
  const iniciarSesion = useSesionStore((s) => s.iniciarSesion)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login, // retorna Promise<Usuario>
    onSuccess: (usuario: Usuario) => {
      // PASO 1 — Poblar el cache de TQ directo (evita segundo request a /api/usuario)
      queryClient.setQueryData(QUERY_KEY_USUARIO, usuario)
      // PASO 2 — Sincronizar Zustand EXPLÍCITAMENTE
      // (setQueryData NO dispara el useEffect de useUsuarioActual automáticamente,
      // por eso hay que llamar a iniciarSesion aquí a mano)
      iniciarSesion(usuario)
      // PASO 3 — Navegar
      navigate('/dashboard', { replace: true })
    },
    onError: (error: unknown) => {
      if (!isAxiosError(error)) return
      const status = error.response?.status

      // 422 — errores de validación de Laravel
      if (status === 422) {
        const errores = error.response?.data?.errors as ErroresLaravel422 | undefined
        const mensajeEmail = errores?.email?.[0] ?? ''

        // Si el error en email menciona "credenciales" → banner genérico de credenciales
        // Laravel retorna "These credentials do not match our records." en errors.email
        if (
          mensajeEmail.toLowerCase().includes('credencial') ||
          mensajeEmail.toLowerCase().includes('credential') ||
          mensajeEmail.toLowerCase().includes('these credentials')
        ) {
          form.setError('root', { message: 'Email o contraseña incorrectos' })
          return
        }

        // Mapear errores campo por campo (para casos donde el 422 no es credenciales)
        if (errores?.email) {
          form.setError('email', { message: errores.email[0] })
        }
        if (errores?.password) {
          form.setError('password', { message: errores.password[0] })
        }
        return
      }

      // 429 — rate limit
      if (status === 429) {
        form.setError('root', {
          message: 'Demasiados intentos. Esperá un momento antes de intentar de nuevo.',
        })
        return
      }

      // 500+ — error del servidor
      if (status && status >= 500) {
        form.setError('root', {
          message: 'Error del servidor. Intentá de nuevo más tarde.',
        })
      }
    },
  })
}
