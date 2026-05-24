import { useState } from 'react'
import { MapaMina } from './mapa-mina'
import { PanelCamion } from './panel-camion'
import { ControlVelocidad } from './control-velocidad'
import { useWebSocketCamiones } from '@/shared/hooks/use-websocket-camiones'

/**
 * Dashboard principal: mapa Mapbox con camiones en vivo sobre el mina de
 * Ananea (Puno), panel lateral con detalle del camión seleccionado y panel
 * de control con toggle simulación/real + velocidad o URL del ESP32.
 *
 * El estado de modo / velocidad / URL ya no vive en el cliente — lo manejamos
 * vía configuración persistida en Laravel (`useConfiguracion`).
 */
export function PaginaDashboard() {
  const { camiones, conectado, modoActual, estadoProxyReal } =
    useWebSocketCamiones()
  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState<
    number | null
  >(null)

  const camionSeleccionado =
    camionSeleccionadoId !== null
      ? (camiones.get(camionSeleccionadoId) ?? null)
      : null

  return (
    <div className="relative h-full w-full">
      <MapaMina camiones={camiones} onCamionClick={setCamionSeleccionadoId} />
      <ControlVelocidad
        conectado={conectado}
        modoActual={modoActual}
        estadoProxyReal={estadoProxyReal}
      />
      <PanelCamion
        camion={camionSeleccionado}
        abierto={camionSeleccionadoId !== null}
        onClose={() => setCamionSeleccionadoId(null)}
      />
    </div>
  )
}
