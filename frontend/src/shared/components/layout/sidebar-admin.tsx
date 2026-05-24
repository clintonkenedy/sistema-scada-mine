import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  AlertTriangle,
  Truck,
  TruckElectric,
  BarChart3,
  Route,
  FileText,
  Users,
  Shield,
  Key,
  Settings,
  LogOut,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useUsuarioActual } from '@/features/autenticacion/hooks/use-usuario-actual'
import { useLogout } from '@/features/autenticacion/hooks/use-logout'
import { useContadoresAlertas } from '@/features/alertas/hooks/use-contadores-alertas'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'

interface ItemNav {
  etiqueta: string
  icono: React.ComponentType<{ className?: string }>
  ruta: string
  permiso: string | null
}

const itemsNav: ItemNav[] = [
  { etiqueta: 'Dashboard', icono: LayoutDashboard, ruta: '/dashboard', permiso: 'dashboard.ver' },
  { etiqueta: 'Sensores', icono: Activity, ruta: '/sensores', permiso: 'sensores.ver' },
  { etiqueta: 'Mediciones', icono: TrendingUp, ruta: '/mediciones', permiso: 'mediciones.ver' },
  { etiqueta: 'Alertas', icono: AlertTriangle, ruta: '/alertas', permiso: 'alertas.ver' },
  { etiqueta: 'Equipos', icono: Truck, ruta: '/equipos', permiso: 'equipos.ver' },
  { etiqueta: 'Camiones', icono: TruckElectric, ruta: '/camiones', permiso: 'camiones.ver' },
  { etiqueta: 'KPIs Real', icono: BarChart3, ruta: '/kpis-real', permiso: 'camiones.ver_historico' },
  { etiqueta: 'Rutas GPS', icono: Route, ruta: '/rutas', permiso: 'rutas.ver' },
  { etiqueta: 'Reportes', icono: FileText, ruta: '/reportes', permiso: 'reportes.ver' },
  { etiqueta: 'Usuarios', icono: Users, ruta: '/usuarios', permiso: 'usuarios.ver' },
  { etiqueta: 'Roles', icono: Shield, ruta: '/roles', permiso: 'roles.ver' },
  { etiqueta: 'Permisos', icono: Key, ruta: '/permisos', permiso: 'permisos.ver' },
  { etiqueta: 'Configuración', icono: Settings, ruta: '/configuracion', permiso: 'configuracion.ver' },
]

const claseBase =
  'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors min-h-[44px]'

interface PropiedadesContenidoSidebar {
  alNavegar?: () => void
}

export function ContenidoSidebar({ alNavegar }: PropiedadesContenidoSidebar) {
  const { data: usuario } = useUsuarioActual()
  const { mutate: cerrarSesion, isPending } = useLogout()

  const tienePermiso = (permiso: string) => usuario?.permisos?.includes(permiso) ?? false

  const itemsVisibles = itemsNav.filter(
    (item) => item.permiso === null || tienePermiso(item.permiso),
  )

  // Polling de contadores de alertas — solo si el usuario tiene permiso
  const puedeVerAlertas = tienePermiso('alertas.ver')
  const { data: contadoresAlertas } = useContadoresAlertas({ enabled: puedeVerAlertas })
  const noLeidas = contadoresAlertas?.no_leidas ?? 0

  // Obtener inicial del usuario para el avatar
  const inicialUsuario = usuario?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex h-full flex-col">
      {/* Items de navegación */}
      <nav className="flex flex-col gap-1 p-3 pt-4" aria-label="Navegación principal">
        {itemsVisibles.map((item) => {
          const esAlertas = item.ruta === '/alertas'
          const mostrarBadge = esAlertas && noLeidas > 0
          return (
            <NavLink
              key={item.etiqueta}
              to={item.ruta}
              onClick={alNavegar}
              className={({ isActive }) =>
                cn(
                  claseBase,
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                )
              }
            >
              <item.icono className="h-4 w-4" />
              <span className="flex-1">{item.etiqueta}</span>
              {mostrarBadge && (
                <span
                  className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                  aria-label={`${noLeidas} alertas sin leer`}
                >
                  {noLeidas > 99 ? '99+' : noLeidas}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer con info del usuario y logout */}
      <div className="mt-auto flex flex-col border-t">
        {/* Bloque de usuario */}
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {inicialUsuario}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {usuario?.name ?? 'Cargando...'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {usuario?.email ?? ''}
            </span>
          </div>
        </div>

        <Separator />

        {/* Botón logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cerrarSesion()}
          disabled={isPending}
          className="mx-3 my-2 justify-start gap-2"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </Button>

        {/* Versión — centrada, texto pequeño */}
        <div className="pb-3 text-center">
          <span className="text-xs text-muted-foreground">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export function SidebarAdmin() {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      <ContenidoSidebar />
    </aside>
  )
}
