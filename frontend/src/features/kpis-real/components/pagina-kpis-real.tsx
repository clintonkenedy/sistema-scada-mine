import { useState } from 'react'
import { useCamionReal } from '../hooks/use-camion-real'
import { useHistoricoCamion } from '../hooks/use-historico-camion'
import { SelectorVentana } from './selector-ventana'
import { KpisEnVivo } from './kpis-en-vivo'
import { KpisHistoricoAgregado } from './kpis-historico-agregado'
import { ChartsHistorico } from './charts-historico'
import type { VentanaHistorico } from '../types/historico'

/**
 * Página /kpis-real: resuelve el camión REAL-01, muestra una sección "EN VIVO"
 * con los últimos snapshots del WebSocket y una sección "HISTÓRICO" con KPIs
 * agregados + 4 charts para la ventana de tiempo seleccionada.
 */
export function PaginaKpisReal() {
  const [ventana, setVentana] = useState<VentanaHistorico>('1h')
  const { data: camionReal, isLoading: cargandoCamion } = useCamionReal()
  const camionId = camionReal?.id ?? null
  const {
    data: historico,
    isLoading: cargandoHistorico,
    isError: errorHistorico,
  } = useHistoricoCamion(camionId, ventana)

  if (cargandoCamion) {
    return <div className="p-6">Cargando datos del camión REAL-01...</div>
  }

  if (!camionReal) {
    return (
      <div className="max-w-4xl p-6">
        <h1 className="mb-2 text-3xl font-bold">KPIs Real</h1>
        <p className="text-muted-foreground">
          No se encontró un camión configurado como real (REAL-01). Asegurate de
          que el seeder haya creado el camión REAL-01 con{' '}
          <code>es_real = true</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">KPIs del camión REAL-01</h1>
        <p className="mt-1 text-muted-foreground">
          Datos en vivo del ESP32 (cuando hay modo Real activo) + histórico
          desde la base de datos.
        </p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          En vivo (WebSocket)
        </h2>
        <KpisEnVivo camionRealId={camionReal.id} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <SelectorVentana valor={ventana} onChange={setVentana} />
        </div>

        {cargandoHistorico && (
          <div className="p-8 text-center text-muted-foreground">
            Cargando histórico...
          </div>
        )}

        {errorHistorico && (
          <div className="p-8 text-center text-destructive">
            Error al cargar histórico. Verificá que tengas el permiso{' '}
            <code>camiones.ver_historico</code>.
          </div>
        )}

        {historico && (
          <div className="space-y-4">
            <KpisHistoricoAgregado agregados={historico.agregados} />
            <ChartsHistorico series={historico.series} />
          </div>
        )}
      </section>
    </div>
  )
}
