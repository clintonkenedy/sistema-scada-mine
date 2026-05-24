import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/autenticacion-service'
import { useSesionStore } from '../stores/sesion-store'

export function useLogout() {
  const queryClient = useQueryClient()
  const cerrarSesion = useSesionStore((s) => s.cerrarSesion)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      cerrarSesion()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}
