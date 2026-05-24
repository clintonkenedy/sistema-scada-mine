import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
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
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../lib/estado-colors'
import type { Camion } from '../types/camion'

interface Props {
  datos: Camion[]
  ordenActual: { columna: string; direccion: DireccionOrden } | null
  onOrdenar: (columna: string, direccion: DireccionOrden | null) => void
  alEditar: (camion: Camion) => void
  alEliminar: (camion: Camion) => void
  alToggleActivo: (camion: Camion) => void
  toggleActivoCargandoId: number | null
}

/** Devuelve clases tailwind para el indicador de frescura de telemetría. */
function colorFrescura(ultimaActualizacion: string | null): {
  clase: string
  etiqueta: string
} {
  if (ultimaActualizacion === null) {
    return { clase: 'bg-gray-300 dark:bg-gray-700', etiqueta: 'Sin datos' }
  }
  const ahora = Date.now()
  const ultima = new Date(ultimaActualizacion).getTime()
  if (Number.isNaN(ultima)) {
    return { clase: 'bg-gray-300 dark:bg-gray-700', etiqueta: 'Sin datos' }
  }
  const segundos = (ahora - ultima) / 1000
  if (segundos < 30) {
    return { clase: 'bg-green-500', etiqueta: 'En vivo (<30s)' }
  }
  if (segundos < 300) {
    return { clase: 'bg-yellow-500', etiqueta: `Hace ${Math.round(segundos / 60)} min` }
  }
  return { clase: 'bg-red-500', etiqueta: `Hace ${Math.round(segundos / 60)} min` }
}

export function TablaCamiones({
  datos,
  ordenActual,
  onOrdenar,
  alEditar,
  alEliminar,
  alToggleActivo,
  toggleActivoCargandoId,
}: Props) {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)
  const puedeEditar = tienePermiso('camiones.editar')
  const puedeEliminar = tienePermiso('camiones.eliminar')
  const puedeToggleActivo = tienePermiso('camiones.toggle_activo')

  if (datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No se encontraron camiones</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <HeaderOrdenable
              columna="codigo"
              label="Código"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <HeaderOrdenable
              columna="modelo"
              label="Modelo"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Patente
            </th>
            <HeaderOrdenable
              columna="capacidad_toneladas"
              label="Capacidad"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Estado
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Activo
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {datos.map((camion) => {
            const frescura = colorFrescura(camion.ultima_actualizacion)
            const togglePending = toggleActivoCargandoId === camion.id

            return (
              <tr
                key={camion.id}
                className="bg-card hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">
                  {camion.codigo}
                </td>
                <td className="px-4 py-3 text-foreground">{camion.modelo}</td>
                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                  {camion.patente ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {Number(camion.capacidad_toneladas).toLocaleString('es-PE', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  t
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      COLORES_ESTADO[camion.estado_actual],
                    )}
                  >
                    {ETIQUETAS_ESTADO[camion.estado_actual]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={camion.activo}
                      onCheckedChange={() => alToggleActivo(camion)}
                      disabled={!puedeToggleActivo || togglePending}
                      aria-label={`${camion.activo ? 'Desactivar' : 'Activar'} ${camion.codigo}`}
                    />
                    <span
                      className={cn('h-2 w-2 rounded-full', frescura.clase)}
                      title={frescura.etiqueta}
                      aria-label={frescura.etiqueta}
                    />
                    <span className="text-xs text-muted-foreground">
                      {frescura.etiqueta}
                    </span>
                  </div>
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
                            aria-label={`Acciones para ${camion.codigo}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {puedeEditar && (
                            <DropdownMenuItem onClick={() => alEditar(camion)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}

                          {puedeEliminar && (
                            <>
                              {puedeEditar && <DropdownMenuSeparator />}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => alEliminar(camion)}
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
          })}
        </tbody>
      </table>
    </div>
  )
}
