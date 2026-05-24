import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { HeaderOrdenable } from '@/shared/components/tablas/header-ordenable'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import type { DireccionOrden } from '@/shared/types/filtros-api'
import type { Alerta } from '../types/alerta'
import { etiquetaTipo } from '../lib/severidad-helpers'
import { BadgeSeveridad } from './badge-severidad'

interface PropiedadesTablaAlertas {
  datos: Alerta[]
  ordenActual: { columna: string; direccion: DireccionOrden } | null
  onOrdenar: (columna: string, direccion: DireccionOrden | null) => void
  alMarcarLeida: (alerta: Alerta) => void
  marcandoId: number | null
}

function formatearTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export function TablaAlertas({
  datos,
  ordenActual,
  onOrdenar,
  alMarcarLeida,
  marcandoId,
}: PropiedadesTablaAlertas) {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)
  const puedeMarcarLeida = tienePermiso('alertas.marcar_leida')

  if (datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No se encontraron alertas con los filtros aplicados</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <HeaderOrdenable
              columna="severidad"
              label="Severidad"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Camión</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Título</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Zona</th>
            <HeaderOrdenable
              columna="timestamp"
              label="Timestamp"
              ordenActual={ordenActual}
              onOrdenar={onOrdenar}
            />
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {datos.map((alerta) => (
            <tr
              key={alerta.id}
              className={cn(
                'bg-card transition-colors hover:bg-muted/30',
                !alerta.leida && 'bg-muted/10',
              )}
            >
              <td className="px-4 py-3">
                <BadgeSeveridad severidad={alerta.severidad} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{etiquetaTipo(alerta.tipo)}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {alerta.camion.codigo ?? `#${alerta.camion.id}`}
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-foreground">{alerta.titulo}</span>
                {alerta.mensaje && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{alerta.mensaje}</p>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{alerta.zona_nombre ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatearTimestamp(alerta.timestamp)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    alerta.leida
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
                  )}
                >
                  {alerta.leida ? 'Leída' : 'No leída'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  {puedeMarcarLeida && !alerta.leida && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={marcandoId === alerta.id}
                      onClick={() => alMarcarLeida(alerta)}
                      aria-label={`Marcar alerta ${alerta.id} como leída`}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Marcar leída
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
