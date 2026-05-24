import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { HeaderAdmin } from './header-admin'
import { SidebarAdmin, ContenidoSidebar } from './sidebar-admin'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'

export function LayoutAdmin() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const ubicacion = useLocation()

  // Cerrar el Sheet automáticamente al cambiar de ruta.
  // El setState dentro del efecto es intencional: sincronizamos el estado del
  // drawer con el router (sistema externo desde la perspectiva del componente).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSidebarAbierto(false)
  }, [ubicacion.pathname])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sheet sidebar — solo en mobile/tablet (<lg) */}
      <Sheet open={sidebarAbierto} onOpenChange={setSidebarAbierto}>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar" showCloseButton={false} tituloAccesible="Menú de navegación">
          <ContenidoSidebar alNavegar={() => setSidebarAbierto(false)} />
        </SheetContent>
      </Sheet>

      {/* Sidebar fijo — solo en desktop (lg+) */}
      <div className="hidden lg:block">
        <SidebarAdmin />
      </div>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderAdmin alAbrirSidebar={() => setSidebarAbierto(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
