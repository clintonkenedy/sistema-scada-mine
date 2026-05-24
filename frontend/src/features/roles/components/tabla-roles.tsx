import { KeyRound, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import type { Rol } from '../types/rol'

interface Props {
  roles: Rol[]
  puedeAsignarPermisos: boolean
  puedeEditar: boolean
  puedeEliminar: boolean
  alAsignarPermisos: (rol: Rol) => void
  alEditar: (rol: Rol) => void
  alEliminar: (rol: Rol) => void
}

export function TablaRoles({
  roles,
  puedeAsignarPermisos,
  puedeEditar,
  puedeEliminar,
  alAsignarPermisos,
  alEditar,
  alEliminar,
}: Props) {
  if (roles.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No hay roles para mostrar.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left">
            <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Usuarios</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Permisos</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {roles.map((rol) => (
            <FilaRol
              key={rol.id}
              rol={rol}
              puedeAsignarPermisos={puedeAsignarPermisos}
              puedeEditar={puedeEditar}
              puedeEliminar={puedeEliminar}
              alAsignarPermisos={alAsignarPermisos}
              alEditar={alEditar}
              alEliminar={alEliminar}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface FilaRolProps {
  rol: Rol
  puedeAsignarPermisos: boolean
  puedeEditar: boolean
  puedeEliminar: boolean
  alAsignarPermisos: (rol: Rol) => void
  alEditar: (rol: Rol) => void
  alEliminar: (rol: Rol) => void
}

function FilaRol({
  rol,
  puedeAsignarPermisos,
  puedeEditar,
  puedeEliminar,
  alAsignarPermisos,
  alEditar,
  alEliminar,
}: FilaRolProps) {
  const editarDeshabilitado = rol.es_inicial
  const eliminarDeshabilitado = rol.es_inicial || rol.cantidad_usuarios > 0

  const hayAcciones = puedeAsignarPermisos || puedeEditar || puedeEliminar

  return (
    <tr className="bg-background transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <span className="font-medium text-foreground">{rol.name}</span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{rol.cantidad_usuarios}</td>
      <td className="px-4 py-3 text-muted-foreground">{rol.permisos.length}</td>
      <td className="px-4 py-3">
        {rol.es_inicial ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Sistema
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Personalizado
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end">
          {hayAcciones && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label={`Acciones para ${rol.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Asignar permisos */}
                {puedeAsignarPermisos && (
                  <DropdownMenuItem onClick={() => alAsignarPermisos(rol)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Permisos
                  </DropdownMenuItem>
                )}

                {/* Editar */}
                {puedeEditar && (
                  <DropdownMenuItem
                    disabled={editarDeshabilitado}
                    onClick={() => !editarDeshabilitado && alEditar(rol)}
                    className={cn(editarDeshabilitado && 'cursor-not-allowed opacity-40')}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}

                {/* Eliminar */}
                {puedeEliminar && (
                  <>
                    {(puedeAsignarPermisos || puedeEditar) && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={eliminarDeshabilitado}
                      onClick={() => !eliminarDeshabilitado && alEliminar(rol)}
                      className={cn(eliminarDeshabilitado && 'cursor-not-allowed opacity-40')}
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
  )
}
