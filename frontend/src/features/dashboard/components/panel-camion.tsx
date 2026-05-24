import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import type { CamionEnVivo } from '@/shared/hooks/use-websocket-camiones'
import {
  COLORES_ESTADO,
  ETIQUETAS_ESTADO,
} from '@/features/camiones/lib/estado-colors'
import { cn } from '@/shared/lib/utils'
import {
  Activity,
  AlertTriangle,
  Compass,
  Gauge,
  MapPin,
  Package,
  Satellite,
  Thermometer,
} from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  camion: CamionEnVivo | null
  abierto: boolean
  onClose: () => void
}

/** Etiqueta legible para el campo `calidad_gps` reportado por el ESP32. */
const ETIQUETAS_CALIDAD_GPS: Record<number, string> = {
  1: 'AUTO',
  2: 'DGPS',
  4: 'RTK fijo',
  5: 'RTK float',
}

/**
 * Panel lateral con el detalle en vivo de un camión, organizado en secciones:
 * GPS, Inclinómetro, Carga/Tolva, Motor y Vía. Las secciones del ESP32 sólo
 * se muestran cuando el snapshot viene del puente real (`es_real`).
 */
export function PanelCamion({ camion, abierto, onClose }: Props) {
  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
        tituloAccesible={camion ? `Camión ${camion.codigo}` : 'Detalle de camión'}
      >
        {camion ? <ContenidoCamion camion={camion} /> : <SinDatos />}
      </SheetContent>
    </Sheet>
  )
}

function SinDatos() {
  return <div className="p-6 text-muted-foreground">Sin datos del camión.</div>
}

function ContenidoCamion({ camion }: { camion: CamionEnVivo }) {
  const esReal = !!camion.es_real
  const tieneInclinometro =
    esReal &&
    (camion.roll_grados != null || camion.pitch_grados != null)
  const tieneTolva =
    esReal && camion.tolva_cerrada !== null && camion.tolva_cerrada !== undefined
  const tieneTempMotor = esReal && camion.temperatura_motor != null
  const tieneSaludVia = esReal && camion.salud_via != null
  const calidadBaja =
    esReal && camion.calidad_gps != null && camion.calidad_gps < 4

  return (
    <>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="text-2xl">Camión {camion.codigo}</SheetTitle>
          {esReal && (
            <span className="text-[10px] font-bold tracking-wider bg-amber-400 text-amber-900 px-2 py-0.5 rounded">
              REAL
            </span>
          )}
        </div>
        <SheetDescription asChild>
          <span
            className={cn(
              'inline-block px-2 py-1 rounded text-sm font-medium w-fit',
              COLORES_ESTADO[camion.estado],
            )}
          >
            {ETIQUETAS_ESTADO[camion.estado]}
          </span>
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6 px-4">
        {/* GPS */}
        <Seccion icono={<MapPin className="h-4 w-4" />} titulo="GPS">
          <Fila
            etiqueta="Velocidad"
            valor={`${camion.velocidad_kmh.toFixed(1)} km/h`}
          />
          <Fila
            etiqueta="Rumbo"
            valor={`${camion.rumbo_grados.toFixed(0)}°`}
          />
          <Fila
            etiqueta="Posición"
            valor={`${camion.lat.toFixed(5)}, ${camion.lng.toFixed(5)}`}
          />
          {esReal && (
            <>
              <Fila
                etiqueta="Calidad GPS"
                icono={<Satellite className="h-3 w-3" />}
                valor={
                  camion.calidad_gps != null
                    ? `${ETIQUETAS_CALIDAD_GPS[camion.calidad_gps] ?? 'Desconocido'} (${camion.calidad_gps})`
                    : '—'
                }
                advertencia={calidadBaja ? 'Señal degradada' : undefined}
              />
              <Fila
                etiqueta="Satélites"
                valor={
                  camion.satelites != null ? String(camion.satelites) : '—'
                }
              />
            </>
          )}
        </Seccion>

        {/* Inclinómetro — solo real con datos */}
        {tieneInclinometro && (
          <Seccion
            icono={<Compass className="h-4 w-4" />}
            titulo="Inclinómetro"
          >
            <Fila
              etiqueta="Roll"
              valor={
                camion.roll_grados != null
                  ? `${camion.roll_grados.toFixed(1)}°`
                  : '—'
              }
            />
            <Fila
              etiqueta="Pitch"
              valor={
                camion.pitch_grados != null
                  ? `${camion.pitch_grados.toFixed(1)}°`
                  : '—'
              }
            />
          </Seccion>
        )}

        {/* Carga (simulado) / Tolva (real) */}
        <Seccion
          icono={<Package className="h-4 w-4" />}
          titulo={esReal ? 'Tolva' : 'Carga'}
        >
          {esReal ? (
            <Fila
              etiqueta="Estado tolva"
              valor={
                tieneTolva
                  ? camion.tolva_cerrada
                    ? 'Cerrada'
                    : 'Abierta'
                  : '—'
              }
            />
          ) : (
            <>
              <Fila
                etiqueta="Carga actual"
                valor={
                  camion.carga_actual_toneladas != null
                    ? `${camion.carga_actual_toneladas.toFixed(1)} t`
                    : '—'
                }
              />
              <Fila
                etiqueta="Combustible"
                valor={
                  camion.combustible_porcentaje != null
                    ? `${camion.combustible_porcentaje.toFixed(1)} %`
                    : '—'
                }
              />
            </>
          )}
        </Seccion>

        {/* Motor — solo real */}
        {tieneTempMotor && (
          <Seccion icono={<Thermometer className="h-4 w-4" />} titulo="Motor">
            <Fila
              etiqueta="Temperatura"
              valor={`${camion.temperatura_motor}°C`}
              advertencia={
                camion.temperatura_motor != null &&
                camion.temperatura_motor > 95
                  ? 'Temperatura elevada'
                  : undefined
              }
            />
          </Seccion>
        )}

        {/* Vía — solo real */}
        {tieneSaludVia && (
          <Seccion icono={<Activity className="h-4 w-4" />} titulo="Vía">
            <Fila
              etiqueta="Salud (vibración)"
              valor={`${camion.salud_via}%`}
              advertencia={
                camion.salud_via != null && camion.salud_via < 50
                  ? 'Vía en mal estado'
                  : undefined
              }
            />
          </Seccion>
        )}

        {/* General */}
        <Seccion icono={<Gauge className="h-4 w-4" />} titulo="General">
          <Fila etiqueta="Ruta actual" valor={camion.ruta_actual ?? '—'} />
          <Fila
            etiqueta="Última actualización"
            valor={new Date(camion.ultima_actualizacion).toLocaleTimeString(
              'es-PE',
            )}
          />
        </Seccion>
      </div>
    </>
  )
}

function Seccion({
  icono,
  titulo,
  children,
}: {
  icono: ReactNode
  titulo: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icono}
        <span>{titulo}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Fila({
  etiqueta,
  valor,
  advertencia,
  icono,
}: {
  etiqueta: string
  valor: string
  advertencia?: string
  icono?: ReactNode
}) {
  return (
    <div className="flex justify-between items-start border-b pb-2 gap-3">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icono}
        {etiqueta}
      </span>
      <div className="text-right">
        <div className="font-medium">{valor}</div>
        {advertencia && (
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>{advertencia}</span>
          </div>
        )}
      </div>
    </div>
  )
}
