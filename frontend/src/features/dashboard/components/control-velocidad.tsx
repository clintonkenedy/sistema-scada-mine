import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CircleCheck,
  Loader2,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'
import { useConfiguracion } from '@/features/configuracion/hooks/use-configuracion'
import { useActualizarConfiguracion } from '@/features/configuracion/hooks/use-mutaciones-configuracion'
import type {
  EstadoProxyReal,
  ModoOperacion,
} from '@/shared/hooks/use-websocket-camiones'

const _VELOCIDADES = [1, 5, 10, 50] as const
void _VELOCIDADES
const URL_REAL_DEFAULT = 'ws://localhost:8766'

type Props = {
  conectado: boolean
  modoActual: ModoOperacion
  estadoProxyReal: EstadoProxyReal
}

/**
 * Panel flotante de control del dashboard:
 * - Toggle entre modo simulación y modo real con UI optimista (cambia ya, sin
 *   esperar el broadcast del backend).
 * - URL del puente WebSocket real (ESP32) SIEMPRE visible (en ambos modos),
 *   con botón Conectar / Reconectar que también persiste el cambio de modo si
 *   estamos en simulación.
 * - Muestra estado granular del proxy real (`conectando` / `conectado` /
 *   `error` con `tipo_error` + `mensaje` user-friendly / `desconectado`).
 */
export function ControlVelocidad({
  conectado,
  modoActual,
  estadoProxyReal,
}: Props) {
  const { data: configs } = useConfiguracion()
  const mutacion = useActualizarConfiguracion()

  const cfgVelocidad = configs?.find(
    (c) => c.clave === 'simulador_speed_multiplier',
  )
  const cfgUrl = configs?.find((c) => c.clave === 'url_websocket_real')

  const _velocidadActual = cfgVelocidad ? Number(cfgVelocidad.valor) : 1
  const urlActualConfig = cfgUrl?.valor ?? URL_REAL_DEFAULT

  const [urlInput, setUrlInput] = useState(urlActualConfig)
  const [modoOptimista, setModoOptimista] = useState<ModoOperacion>(modoActual)

  // Sincronizar modo optimista cuando el backend confirma el cambio
  useEffect(() => {
    setModoOptimista(modoActual)
  }, [modoActual])

  // Sincronizar input URL con la config persistida cuando cambia desde otro lado
  useEffect(() => {
    setUrlInput(urlActualConfig)
  }, [urlActualConfig])

  const _esperandoCambioModo = modoOptimista !== modoActual

  function cambiarModo(nuevoModo: ModoOperacion) {
    if (nuevoModo === modoOptimista) return
    setModoOptimista(nuevoModo) // optimista — UI cambia ya
    mutacion.mutate(
      { clave: 'modo_operacion', valor: nuevoModo },
      {
        onError: () => {
          setModoOptimista(modoActual) // rollback
        },
      },
    )
  }

  function _cambiarVelocidad(v: number) {
    mutacion.mutate({
      clave: 'simulador_speed_multiplier',
      valor: String(v),
    })
  }
  // Referencias a símbolos preservados como dead code reversible (bloque UI comentado).
  void _velocidadActual
  void _esperandoCambioModo
  void _cambiarVelocidad

  function aplicarUrl() {
    if (urlInput !== urlActualConfig) {
      mutacion.mutate({ clave: 'url_websocket_real', valor: urlInput })
    }
    if (modoOptimista === 'simulacion') {
      cambiarModo('real')
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10 w-80 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
      {/* Header: estado conexión al backend */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            conectado ? 'bg-green-500' : 'bg-red-500',
          )}
        />
        <span className="text-xs text-muted-foreground">
          {conectado ? 'Conectado al backend' : 'Desconectado del backend'}
        </span>
      </div>

      {/* Toggle Modo oculto — sistema en modo real único.
          Para revertir: descomentar el bloque siguiente */}
      {/*
      <div className="mb-3">
        <Label className="mb-1 block text-xs text-muted-foreground">Modo</Label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={modoOptimista === 'simulacion' ? 'default' : 'outline'}
            onClick={() => cambiarModo('simulacion')}
            disabled={mutacion.isPending && esperandoCambioModo}
            className="flex-1"
          >
            {modoOptimista === 'simulacion' && esperandoCambioModo && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            Simulación
          </Button>
          <Button
            size="sm"
            variant={modoOptimista === 'real' ? 'default' : 'outline'}
            onClick={() => cambiarModo('real')}
            disabled={mutacion.isPending && esperandoCambioModo}
            className="flex-1"
          >
            {modoOptimista === 'real' && esperandoCambioModo && (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            Real
          </Button>
        </div>
        {esperandoCambioModo && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Aplicando cambio de modo...
          </p>
        )}
      </div>
      */}

      {/* Reemplazo: header fijo "Modo Real" */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Modo</Label>
          <span className="text-xs font-semibold bg-amber-400/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
            Real (ESP32)
          </span>
        </div>
      </div>

      {/* Velocidad simulador oculta — configurable desde /configuracion */}

      {/* Conexión real — SIEMPRE visible */}
      <div className="space-y-2 border-t pt-3">
        <Label className="block text-xs text-muted-foreground">
          Conexión real (ESP32)
        </Label>

        <div className="flex gap-1">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ws://localhost:8766"
            className="h-8 font-mono text-xs"
            disabled={mutacion.isPending}
          />
          <Button
            size="sm"
            onClick={aplicarUrl}
            disabled={mutacion.isPending}
            className="px-3"
          >
            {mutacion.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : modoOptimista === 'real' ? (
              'Reconectar'
            ) : (
              'Conectar'
            )}
          </Button>
        </div>

        <EstadoProxy estado={estadoProxyReal} modoActual={modoActual} />
      </div>

      {mutacion.isError && (
        <p className="mt-2 text-xs text-destructive">
          Error al guardar configuración
        </p>
      )}
    </div>
  )
}

function EstadoProxy({
  estado,
  modoActual: _modoActual,
}: {
  estado: EstadoProxyReal
  modoActual: ModoOperacion
}) {
  // Ya no chequeamos modo — siempre mostramos estado real (modo real único en UI)
  if (!estado) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Esperando estado del proxy...</span>
      </div>
    )
  }

  if (estado.estado === 'conectando') {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="break-all">Conectando a {estado.url}...</span>
      </div>
    )
  }

  if (estado.estado === 'conectado') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CircleCheck className="h-3 w-3" />
          <span>Conectado — recibiendo telemetría</span>
        </div>
        <p className="break-all pl-5 font-mono text-[10px] text-muted-foreground">
          {estado.url}
        </p>
      </div>
    )
  }

  if (estado.estado === 'error') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="font-medium">Error de conexión</span>
        </div>
        {estado.mensaje && (
          <p className="pl-5 text-[11px] text-destructive/90">
            {estado.mensaje}
          </p>
        )}
        {estado.tipo_error && (
          <p className="pl-5 font-mono text-[10px] text-muted-foreground">
            Tipo: {estado.tipo_error}
          </p>
        )}
      </div>
    )
  }

  // desconectado
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <WifiOff className="h-3 w-3" />
      <span>Desconectado</span>
    </div>
  )
}
