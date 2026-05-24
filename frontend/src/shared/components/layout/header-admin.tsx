import { Building2, Menu } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface PropiedadesHeaderAdmin {
  alAbrirSidebar?: () => void
}

export function HeaderAdmin({ alAbrirSidebar }: PropiedadesHeaderAdmin) {
  return (
    <header className="flex h-16 items-center border-b px-4">
      {/* Botón hamburguesa — solo visible en mobile (<lg) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-11 w-11 mr-2"
        onClick={alAbrirSidebar}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">SCADA Mine</span>
      </div>
    </header>
  )
}
