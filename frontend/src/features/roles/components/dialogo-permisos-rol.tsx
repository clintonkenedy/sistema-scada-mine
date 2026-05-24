import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useTodosLosPermisos } from '../hooks/use-todos-los-permisos'
import type { Rol } from '../types/rol'

interface Props {
  rol: Rol | null
  alCerrar: () => void
  alGuardar: (permisos: string[]) => void
  cargando?: boolean
  errorBackend?: string | null
}

function agruparPermisosPorModulo(
  permisos: Array<{ id: number; name: string; guard_name: string }>,
): Record<string, Array<{ id: number; name: string }>> {
  const grupos: Record<string, Array<{ id: number; name: string }>> = {}
  for (const permiso of permisos) {
    const modulo = permiso.name.split('.')[0]
    if (!grupos[modulo]) {
      grupos[modulo] = []
    }
    grupos[modulo].push({ id: permiso.id, name: permiso.name })
  }
  return grupos
}

/**
 * Componente interno que recibe `rol` garantizadamente no-null.
 * Se monta con una key única por rol, lo que reinicializa el estado
 * al cambiar de rol sin necesidad de useEffect + setState.
 */
function ContenidoPermisosRol({
  rol,
  alCerrar,
  alGuardar,
  cargando,
  errorBackend,
}: {
  rol: Rol
  alCerrar: () => void
  alGuardar: (permisos: string[]) => void
  cargando: boolean
  errorBackend: string | null
}) {
  const { data: todosLosPermisos, isLoading: cargandoPermisos } = useTodosLosPermisos()

  const [permisosSeleccionados, setPermisosSeleccionados] = useState<Set<string>>(
    () => new Set(rol.permisos.map((p) => p.name)),
  )

  function togglePermiso(nombrePermiso: string) {
    setPermisosSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(nombrePermiso)) {
        siguiente.delete(nombrePermiso)
      } else {
        siguiente.add(nombrePermiso)
      }
      return siguiente
    })
  }

  function seleccionarTodosDelModulo(permisosDel: Array<{ name: string }>) {
    setPermisosSeleccionados((prev) => {
      const siguiente = new Set(prev)
      for (const p of permisosDel) {
        siguiente.add(p.name)
      }
      return siguiente
    })
  }

  function quitarTodosDelModulo(permisosDel: Array<{ name: string }>) {
    setPermisosSeleccionados((prev) => {
      const siguiente = new Set(prev)
      for (const p of permisosDel) {
        siguiente.delete(p.name)
      }
      return siguiente
    })
  }

  function manejarGuardar() {
    alGuardar(Array.from(permisosSeleccionados))
  }

  const grupos = todosLosPermisos ? agruparPermisosPorModulo(todosLosPermisos) : {}

  return (
    <>
      <DialogHeader className="flex-shrink-0 border-b p-6 pb-4">
        <DialogTitle>Asignar permisos</DialogTitle>
        <DialogDescription>
          Rol: <span className="font-medium text-foreground">{rol.name}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-6">
        {cargandoPermisos ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Cargando permisos...
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grupos).map(([modulo, permisosDelModulo]) => {
              const todosSeleccionados = permisosDelModulo.every((p) =>
                permisosSeleccionados.has(p.name),
              )

              return (
                <div key={modulo}>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold capitalize text-foreground">
                      {modulo}
                    </h4>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        if (todosSeleccionados) {
                          quitarTodosDelModulo(permisosDelModulo)
                        } else {
                          seleccionarTodosDelModulo(permisosDelModulo)
                        }
                      }}
                    >
                      {todosSeleccionados ? 'Quitar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {permisosDelModulo.map((permiso) => {
                      const seleccionado = permisosSeleccionados.has(permiso.name)
                      const accion = permiso.name.split('.')[1]
                      return (
                        <label
                          key={permiso.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors',
                            seleccionado
                              ? 'border-primary/30 bg-primary/5 text-primary'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-primary"
                            checked={seleccionado}
                            onChange={() => togglePermiso(permiso.name)}
                          />
                          {accion}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!cargandoPermisos && Object.keys(grupos).length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay permisos disponibles.
          </div>
        )}
      </div>

      {errorBackend && (
        <div className="mx-6 mb-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorBackend}
        </div>
      )}

      <DialogFooter className="flex-shrink-0 flex-row items-center justify-between border-t p-6 pt-4">
        <span className="text-xs text-muted-foreground">
          {permisosSeleccionados.size} permiso{permisosSeleccionados.size !== 1 ? 's' : ''}{' '}
          seleccionado{permisosSeleccionados.size !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={alCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button onClick={manejarGuardar} disabled={cargando || cargandoPermisos}>
            {cargando ? 'Guardando...' : 'Guardar permisos'}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

export function DialogoPermisosRol({
  rol,
  alCerrar,
  alGuardar,
  cargando = false,
  errorBackend = null,
}: Props) {
  const abierto = rol !== null

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) alCerrar()
      }}
    >
      <DialogContent
        className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden p-0"
        hideCloseButton
      >
        {rol && (
          <ContenidoPermisosRol
            key={rol.id}
            rol={rol}
            alCerrar={alCerrar}
            alGuardar={alGuardar}
            cargando={cargando}
            errorBackend={errorBackend}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
