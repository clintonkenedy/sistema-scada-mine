import { Edit, MoreHorizontal, Shield, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { cn } from '@/shared/lib/utils'
import { HeaderOrdenable } from '@/shared/components/tablas/header-ordenable'
import type { DireccionOrden } from '@/shared/types/filtros-api'
import type { UsuarioGestion } from '../types/usuario'

interface Props {
  datos: UsuarioGestion[]
  ordenActual: { columna: string; direccion: DireccionOrden } | null
  onOrdenar: (columna: string, direccion: DireccionOrden | null) => void
  alEditar: (usuario: UsuarioGestion) => void
  alAsignarRol: (usuario: UsuarioGestion) => void
  alToggleActivo: (usuario: UsuarioGestion) => void
  alEliminar: (usuario: UsuarioGestion) => void
}

function nombreCompleto(usuario: UsuarioGestion): string {
  const partes = [
    usuario.apellido_paterno,
    usuario.apellido_materno,
    usuario.nombres,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' ') : usuario.name
}

export function TablaUsuarios({
  datos,
  ordenActual,
  onOrdenar,
  alEditar,
  alAsignarRol,
  alToggleActivo,
  alEliminar,
}: Props) {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)
  const puedeEditar = tienePermiso('usuarios.editar')
  const puedeEliminar = tienePermiso('usuarios.eliminar')

  if (datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No se encontraron usuarios</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <HeaderOrdenable
              columna="dni"
              label="DNI"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <HeaderOrdenable
              columna="name"
              label="Nombre completo"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <HeaderOrdenable
              columna="email"
              label="Email"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            <HeaderOrdenable
              columna="created_at"
              label="Creado"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {datos.map((usuario) => (
            <tr key={usuario.id} className="bg-card hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                {usuario.dni ?? '—'}
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-foreground">{nombreCompleto(usuario)}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{usuario.email}</td>
              <td className="px-4 py-3">
                {usuario.roles.length > 0 ? (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      'bg-primary/10 text-primary',
                    )}
                  >
                    {usuario.roles[0]}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin rol</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    usuario.activo
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
                  )}
                >
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(usuario.created_at).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  {(puedeEditar || puedeEliminar) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          aria-label={`Acciones para ${usuario.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Editar */}
                        {puedeEditar && (
                          <DropdownMenuItem onClick={() => alEditar(usuario)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}

                        {/* Asignar rol */}
                        {puedeEditar && (
                          <DropdownMenuItem onClick={() => alAsignarRol(usuario)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Asignar rol
                          </DropdownMenuItem>
                        )}

                        {/* Toggle activo/inactivo */}
                        {puedeEditar && (
                          <DropdownMenuItem onClick={() => alToggleActivo(usuario)}>
                            {usuario.activo ? (
                              <ToggleRight className={cn('mr-2 h-4 w-4', 'text-green-600')} />
                            ) : (
                              <ToggleLeft className={cn('mr-2 h-4 w-4', 'text-gray-400')} />
                            )}
                            {usuario.activo ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                        )}

                        {/* Eliminar */}
                        {puedeEliminar && (
                          <>
                            {puedeEditar && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => alEliminar(usuario)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Paginación eliminada — ahora vive en PaginaUsuarios via PaginadorTabla */}
    </div>
  )
}
