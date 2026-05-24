import { Navigate, Outlet } from 'react-router-dom'
import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'

interface Props {
  permiso: string
  redirigirA?: string
}

export function RutaConPermiso({ permiso, redirigirA = '/sin-acceso' }: Props) {
  // Derivar permisos directamente de la query de TanStack Query (sincrónico).
  // NO usar useSesionStore aquí — el useEffect que sincroniza Zustand corre
  // DESPUÉS del render, causando un frame donde usuario=null a pesar de que
  // la query ya completó. Ese frame hace que tienePermiso() retorne false
  // y redirige a /sin-acceso en cada F5 (recarga de página).
  // Misma estrategia que RutaProtegida (ver comentario en ese componente).
  const { data: usuario } = useUsuarioActual()

  const tieneElPermiso = usuario?.permisos?.includes(permiso) ?? false

  if (!tieneElPermiso) {
    return <Navigate to={redirigirA} replace />
  }

  return <Outlet />
}
