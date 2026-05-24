import { useWebSocketCamiones } from '@/shared/hooks/use-websocket-camiones'
import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
} from '@/features/camiones/lib/estado-colors'
import { CardKpi } from './card-kpi'
import {
  Gauge,
  Thermometer,
  Activity,
  Satellite,
  Compass,
  Package,
  Clock,
  MapPin,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const ETIQUETAS_CALIDAD_GPS: Record<number, string> = {
  1: 'AUTO',
  2: 'DGPS',
  4: 'RTK fijo',
  5: 'RTK float',
}

type Props = {
  camionRealId: number
}

/**
 * Renderiza 8 cards en vivo con el último snapshot del camión REAL recibido por
 * WebSocket. Si todavía no llegó nada para ese id, muestra un placeholder.
 */
export function KpisEnVivo({ camionRealId }: Props) {
  const { camiones } = useWebSocketCamiones()
  const camion = camiones.get(camionRealId)

  if (!camion) {
    return (
      <div className="rounded-lg border-2 border-dashed bg-muted/40 p-8 text-center">
        <p className="text-muted-foreground">
          Esperando datos del camión REAL-01 vía WebSocket...
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Asegurate de que el modo "Real" esté activo y el ESP32 esté emitiendo.
        </p>
      </div>
    )
  }

  const tempAlta =
    camion.temperatura_motor != null && camion.temperatura_motor > 95
  const saludMala = camion.salud_via != null && camion.salud_via < 50
  const calidadBaja = camion.calidad_gps != null && camion.calidad_gps < 4

  const etiquetaCalidad =
    camion.calidad_gps != null
      ? (ETIQUETAS_CALIDAD_GPS[camion.calidad_gps] ?? `${camion.calidad_gps}`)
      : '—'

  const inclinacion =
    camion.roll_grados != null && camion.pitch_grados != null
      ? `R ${camion.roll_grados.toFixed(0)}° / P ${camion.pitch_grados.toFixed(0)}°`
      : '—'

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <CardKpi
        etiqueta="Velocidad"
        valor={camion.velocidad_kmh.toFixed(1)}
        unidad="km/h"
        icono={<Gauge className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Temperatura motor"
        valor={camion.temperatura_motor ?? '—'}
        unidad={camion.temperatura_motor != null ? '°C' : ''}
        icono={<Thermometer className="h-4 w-4" />}
        acento={tempAlta ? 'danger' : 'normal'}
        advertencia={tempAlta ? 'Temperatura elevada' : undefined}
      />
      <CardKpi
        etiqueta="Salud vía"
        valor={camion.salud_via ?? '—'}
        unidad={camion.salud_via != null ? '%' : ''}
        icono={<Activity className="h-4 w-4" />}
        acento={saludMala ? 'warning' : 'normal'}
        advertencia={saludMala ? 'Vía en mal estado' : undefined}
      />
      <CardKpi
        etiqueta="Calidad GPS"
        valor={etiquetaCalidad}
        unidad={camion.satelites != null ? `${camion.satelites} sat` : undefined}
        icono={<Satellite className="h-4 w-4" />}
        acento={calidadBaja ? 'warning' : 'success'}
        advertencia={calidadBaja ? 'Señal degradada' : undefined}
      />

      <CardKpi
        etiqueta="Estado"
        valor={
          <span
            className={cn(
              'rounded px-2 py-0.5 text-base',
              COLORES_ESTADO[camion.estado],
            )}
          >
            {ETIQUETAS_ESTADO[camion.estado]}
          </span>
        }
        icono={<Clock className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Tolva"
        valor={
          camion.tolva_cerrada == null
            ? '—'
            : camion.tolva_cerrada
              ? 'Cerrada'
              : 'Abierta'
        }
        icono={<Package className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Inclinación"
        valor={inclinacion}
        icono={<Compass className="h-4 w-4" />}
      />
      <CardKpi
        etiqueta="Última actualización"
        valor={new Date(camion.ultima_actualizacion).toLocaleTimeString('es-PE')}
        icono={<MapPin className="h-4 w-4" />}
      />
    </div>
  )
}
