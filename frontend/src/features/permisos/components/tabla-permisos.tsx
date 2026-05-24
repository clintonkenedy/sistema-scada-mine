import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { cn } from '@/shared/lib/utils'
import type { Permiso } from '../types/permiso'

interface Props {
  permisos: Permiso[]
  alEditar: (permiso: Permiso) => void
  alEliminar: (permiso: Permiso) => void
}

function agruparPorModulo(permisos: Permiso[]): Record<string, Permiso[]> {
  return permisos.reduce<Record<string, Permiso[]>>((grupos, permiso) => {
    const modulo = permiso.modulo
    if (!grupos[modulo]) {
      grupos[modulo] = []
    }
    grupos[modulo].push(permiso)
    return grupos
  }, {})
}

export function TablaPermisos({ permisos, alEditar, alEliminar }: Props) {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)
  const puedeEditar = tienePermiso('permisos.editar')
  const puedeEliminar = tienePermiso('permisos.eliminar')

  const grupos = agruparPorModulo(permisos)
  const modulos = Object.keys(grupos).sort()

  if (permisos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No se encontraron permisos
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      {modulos.map((modulo, indice) => (
        <div key={modulo}>
          {indice > 0 && <Separator className="mb-4" />}

          {/* Encabezado del módulo */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {modulo}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {grupos[modulo].length}
            </span>
          </div>

          {/* Filas de permisos del módulo */}
          <div className="space-y-1">
            {grupos[modulo].map((permiso) => (
              <div
                key={permiso.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{permiso.name}</span>
                  <span className="text-muted-foreground">{permiso.accion}</span>
                  {permiso.es_canonico && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        'bg-primary/10 text-primary',
                      )}
                    >
                      canónico
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Botón Editar */}
                  {puedeEditar && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      disabled={permiso.es_canonico}
                      onClick={() => alEditar(permiso)}
                      aria-label={`Editar ${permiso.name}`}
                      title={
                        permiso.es_canonico
                          ? 'Los permisos canónicos no se pueden modificar'
                          : 'Editar permiso'
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Botón Eliminar */}
                  {puedeEliminar && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive"
                      disabled={permiso.es_canonico}
                      onClick={() => alEliminar(permiso)}
                      aria-label={`Eliminar ${permiso.name}`}
                      title={
                        permiso.es_canonico
                          ? 'Los permisos canónicos no se pueden eliminar'
                          : 'Eliminar permiso'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
