import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { PaginadorTabla } from '@/shared/components/tablas/paginador-tabla'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { useAlertas } from '../hooks/use-alertas'
import { useContadoresAlertas } from '../hooks/use-contadores-alertas'
import { useMarcarLeida, useMarcarTodasLeidas } from '../hooks/use-mutaciones-alertas'
import { TablaAlertas } from './tabla-alertas'
import { FiltroAlertas } from './filtro-alertas'
import type { Alerta } from '../types/alerta'

export function PaginaAlertas() {
  const tienePermiso = useSesionStore((s) => s.tienePermiso)
  const puedeMarcar = tienePermiso('alertas.marcar_leida')

  const [idMarcando, setIdMarcando] = useState<number | null>(null)

  const resultado = useAlertas()
  const { data: contadores } = useContadoresAlertas()
  const marcarLeidaMutation = useMarcarLeida()
  const marcarTodasMutation = useMarcarTodasLeidas()

  function manejarMarcarLeida(alerta: Alerta) {
    setIdMarcando(alerta.id)
    marcarLeidaMutation.mutate(alerta.id, {
      onSettled: () => setIdMarcando(null),
    })
  }

  function manejarMarcarTodas() {
    marcarTodasMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos críticos detectados en tiempo real por el sistema SCADA
            {contadores && contadores.no_leidas > 0 && (
              <>
                {' '}
                — <strong className="text-foreground">{contadores.no_leidas}</strong> sin leer
              </>
            )}
          </p>
        </div>

        {puedeMarcar && (
          <Button
            variant="outline"
            onClick={manejarMarcarTodas}
            disabled={marcarTodasMutation.isPending || (contadores?.no_leidas ?? 0) === 0}
            className="shrink-0"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <FiltroAlertas
        severidad={resultado.estado.filtros.severidad}
        leida={resultado.estado.filtros.leida}
        onCambiarSeveridad={(v) => resultado.setFiltro('severidad', v)}
        onCambiarLeida={(v) => resultado.setFiltro('leida', v)}
      />

      {/* Loading */}
      {resultado.isLoading && (
        <div className="space-y-3" aria-label="Cargando alertas">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {resultado.isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <p className="text-sm">
            Error al cargar alertas:{' '}
            {resultado.error instanceof Error ? resultado.error.message : 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Tabla + Paginador */}
      {!resultado.isLoading && !resultado.isError && resultado.data && (
        <>
          <TablaAlertas
            datos={resultado.data.data}
            ordenActual={resultado.estado.orden}
            onOrdenar={(col, dir) => {
              if (dir === null) resultado.quitarOrden()
              else resultado.setOrden(col, dir)
            }}
            alMarcarLeida={manejarMarcarLeida}
            marcandoId={idMarcando}
          />
          <PaginadorTabla
            pagina={resultado.estado.pagina}
            ultimaPagina={resultado.data.meta.last_page}
            onCambio={resultado.setPagina}
          />
        </>
      )}
    </div>
  )
}
