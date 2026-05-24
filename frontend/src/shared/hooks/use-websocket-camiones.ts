import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { EstadoCamion } from '@/features/camiones/types/camion'

/** Snapshot en vivo de un camión emitido por el simulador Python por WebSocket. */
export type CamionEnVivo = {
  id: number
  codigo: string
  lat: number
  lng: number
  velocidad_kmh: number
  rumbo_grados: number
  /** Null en modo real: el ESP32 no reporta carga (sólo tolva). */
  carga_actual_toneladas: number | null
  /** Null en modo real: el ESP32 no reporta combustible. */
  combustible_porcentaje: number | null
  estado: EstadoCamion
  ruta_actual: string | null
  ultima_actualizacion: string
  /** True cuando el snapshot viene del puente WS real (ESP32), no del simulador. */
  es_real?: boolean
  // Campos avanzados del ESP32 — sólo presentes en el camión REAL.
  /** Calidad del fix GPS (1=AUTO, 2=DGPS, 4=RTK fijo, 5=RTK float). */
  calidad_gps?: number | null
  /** Cantidad de satélites usados en el fix (0-32). */
  satelites?: number | null
  /** Inclinación lateral en grados (positivo = derecha). */
  roll_grados?: number | null
  /** Inclinación longitudinal en grados (positivo = nariz arriba). */
  pitch_grados?: number | null
  /** True si la tolva del camión está cerrada. */
  tolva_cerrada?: boolean | null
  /** Salud de la vía estimada por vibración (0-100%). */
  salud_via?: number | null
  /** Temperatura del motor en °C. */
  temperatura_motor?: number | null
}

export type ModoOperacion = 'simulacion' | 'real'

export type EstadoProxyConectividad =
  | 'conectando'
  | 'conectado'
  | 'error'
  | 'desconectado'

export type EstadoProxyReal = {
  estado: EstadoProxyConectividad
  url: string
  tipo_error: string | null
  mensaje: string | null
  timestamp: string
} | null

type MensajeActualizacion = {
  tipo: 'actualizacion'
  timestamp: string
  camion: Omit<CamionEnVivo, 'ultima_actualizacion'>
}

type MensajeCambioEstado = {
  tipo: 'cambio_estado'
  timestamp: string
  camion_id: number
  codigo: string
  estado_anterior: EstadoCamion
  estado_nuevo: EstadoCamion
}

type MensajeModoCambiado = {
  tipo: 'modo_cambiado'
  timestamp: string
  modo: ModoOperacion
}

type MensajeEstadoProxyReal = {
  tipo: 'estado_proxy_real'
  timestamp: string
  estado: EstadoProxyConectividad
  url: string
  tipo_error?: string
  mensaje?: string
}

type SeveridadAlertaWs = 'info' | 'warning' | 'danger'

type MensajeAlerta = {
  tipo: 'alerta'
  alerta: {
    camion_id: number
    codigo: string
    tipo: string
    severidad: SeveridadAlertaWs
    titulo: string
    mensaje: string | null
    lat: number | null
    lng: number | null
    zona_nombre: string | null
    estado_anterior: string | null
    estado_nuevo: string | null
    contexto: Record<string, unknown> | null
    timestamp: string
  }
}

type MensajeServidor =
  | MensajeActualizacion
  | MensajeCambioEstado
  | MensajeModoCambiado
  | MensajeEstadoProxyReal
  | MensajeAlerta

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765'

/**
 * Hook que mantiene en memoria el último snapshot de cada camión recibido del
 * simulador Python por WebSocket. Reconecta con backoff exponencial si la
 * conexión cae. Expone `cambiarVelocidad` para acelerar la simulación.
 *
 * También trackea el modo de operación actual (`simulacion` / `real`) y el
 * estado del puente WebSocket real (ESP32) cuando el backend Python notifica
 * cambios de configuración.
 */
export function useWebSocketCamiones() {
  const [camiones, setCamiones] = useState<Map<number, CamionEnVivo>>(new Map())
  const [conectado, setConectado] = useState(false)
  const [modoActual, setModoActual] = useState<ModoOperacion>('simulacion')
  const [estadoProxyReal, setEstadoProxyReal] = useState<EstadoProxyReal>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intentosReconexionRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let activo = true

    function conectar() {
      if (!activo) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConectado(true)
        intentosReconexionRef.current = 0
      }

      ws.onmessage = (ev) => {
        try {
          const mensaje = JSON.parse(ev.data) as MensajeServidor
          if (mensaje.tipo === 'actualizacion') {
            setCamiones((prev) => {
              const siguiente = new Map(prev)
              siguiente.set(mensaje.camion.id, {
                ...mensaje.camion,
                ultima_actualizacion: mensaje.timestamp,
              })
              return siguiente
            })
          } else if (mensaje.tipo === 'modo_cambiado') {
            setModoActual(mensaje.modo)
            if (mensaje.modo === 'real') {
              // En modo real ocultamos los camiones simulados; sólo quedan los
              // que vengan marcados como es_real desde el puente ESP32.
              setCamiones((prev) => {
                const siguiente = new Map<number, CamionEnVivo>()
                for (const [id, c] of prev) {
                  if (c.es_real) siguiente.set(id, c)
                }
                return siguiente
              })
            }
            // En modo 'simulacion' no purgamos: los snapshots simulados volverán
            // a llegar por su cuenta.
          } else if (mensaje.tipo === 'estado_proxy_real') {
            setEstadoProxyReal({
              estado: mensaje.estado,
              url: mensaje.url,
              tipo_error: mensaje.tipo_error ?? null,
              mensaje: mensaje.mensaje ?? null,
              timestamp: mensaje.timestamp,
            })
          } else if (mensaje.tipo === 'alerta') {
            const alerta = mensaje.alerta
            const descripcion = alerta.mensaje ?? undefined
            if (alerta.severidad === 'danger') {
              toast.error(alerta.titulo, { description: descripcion, duration: 8000 })
            } else if (alerta.severidad === 'warning') {
              toast.warning(alerta.titulo, { description: descripcion, duration: 6000 })
            } else {
              toast.info(alerta.titulo, { description: descripcion, duration: 4000 })
            }
          }
          // 'cambio_estado': el snapshot siguiente ya trae el nuevo estado, no
          // mutamos acá. Espacio reservado para futuras notificaciones toast.
        } catch (error) {
          console.error('WS parse error', error)
        }
      }

      ws.onclose = () => {
        setConectado(false)
        if (!activo) return
        const delay = Math.min(30000, 1000 * 2 ** intentosReconexionRef.current)
        intentosReconexionRef.current += 1
        timeoutRef.current = window.setTimeout(conectar, delay)
      }

      ws.onerror = () => {
        // onclose se dispara a continuación y maneja la reconexión.
      }
    }

    conectar()

    return () => {
      activo = false
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      wsRef.current?.close()
    }
  }, [])

  function cambiarVelocidad(multiplier: number) {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tipo: 'set_speed', multiplier }))
    }
  }

  return { camiones, conectado, cambiarVelocidad, modoActual, estadoProxyReal }
}
