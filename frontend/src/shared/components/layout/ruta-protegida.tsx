import { Navigate, Outlet } from 'react-router-dom'
import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'

function PantallaCarga() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        role="status"
        aria-label="Cargando"
      />
    </div>
  )
}

export function RutaProtegida() {
  // useUsuarioActual inicia la query (hydration) y sincroniza Zustand
  const { isLoading, isSuccess, data } = useUsuarioActual()

  // INVARIANTE (Spec C-07): NUNCA renderizar <Outlet /> mientras isLoading es true
  // Esto evita el flash de contenido
  if (isLoading) return <PantallaCarga />

  // Derivar autenticación directamente de la query (sincrónico).
  // NO usar useSesionStore aquí — el useEffect que sincroniza Zustand corre
  // DESPUÉS del render, causando un frame donde estaAutenticado=false a pesar
  // de que la query ya completó. Ese frame redirige a /login, y PaginaLogin
  // redirige a /mapa → el usuario siempre termina en /mapa al recargar.
  const estaAutenticado = isSuccess && data != null
  if (!estaAutenticado) return <Navigate to="/login" replace />
  return <Outlet />
}
