import { Routes, Route, Navigate } from 'react-router-dom'
import { PaginaLogin } from '@/features/autenticacion'
import { PaginaDashboard } from '@/features/dashboard'
import { RutaProtegida } from '@/shared/components/layout/ruta-protegida'
import { RutaConPermiso } from '@/shared/components/layout/ruta-con-permiso'
import { LayoutAdmin } from '@/shared/components/layout/layout-admin'
import { PaginaSinAcceso } from '@/shared/components/layout/pagina-sin-acceso'
import { PaginaUsuarios } from '@/features/usuarios/components/pagina-usuarios'
import { PaginaRoles } from '@/features/roles/components/pagina-roles'
import { PaginaPermisos } from '@/features/permisos/components/pagina-permisos'
import { PaginaCamiones } from '@/features/camiones'
import { PaginaConfiguracion } from '@/features/configuracion'
import { PaginaKpisReal } from '@/features/kpis-real'
import { PaginaAlertas } from '@/features/alertas'

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<PaginaLogin />} />

      {/* Rutas protegidas — guard verifica sesión */}
      <Route element={<RutaProtegida />}>
        {/* Layout admin — shell con header + sidebar */}
        <Route element={<LayoutAdmin />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PaginaDashboard />} />
          <Route path="/sin-acceso" element={<PaginaSinAcceso />} />

          {/* RBAC — protegidas por permiso */}
          <Route element={<RutaConPermiso permiso="usuarios.ver" />}>
            <Route path="/usuarios" element={<PaginaUsuarios />} />
          </Route>
          <Route element={<RutaConPermiso permiso="roles.ver" />}>
            <Route path="/roles" element={<PaginaRoles />} />
          </Route>
          <Route element={<RutaConPermiso permiso="permisos.ver" />}>
            <Route path="/permisos" element={<PaginaPermisos />} />
          </Route>
          <Route element={<RutaConPermiso permiso="camiones.ver" />}>
            <Route path="/camiones" element={<PaginaCamiones />} />
          </Route>
          <Route element={<RutaConPermiso permiso="camiones.ver_historico" />}>
            <Route path="/kpis-real" element={<PaginaKpisReal />} />
          </Route>
          <Route element={<RutaConPermiso permiso="configuracion.ver" />}>
            <Route path="/configuracion" element={<PaginaConfiguracion />} />
          </Route>
          <Route element={<RutaConPermiso permiso="alertas.ver" />}>
            <Route path="/alertas" element={<PaginaAlertas />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<PaginaNoEncontrada />} />
    </Routes>
  )
}

function PaginaNoEncontrada() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Página no encontrada</p>
      </div>
    </div>
  )
}

export default App
