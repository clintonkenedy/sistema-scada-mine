import { useConfiguracion } from '../hooks/use-configuracion'
import { TarjetaConfiguracion } from './tarjeta-configuracion'

export function PaginaConfiguracion() {
  const { data, isLoading, isError } = useConfiguracion()

  if (isLoading) {
    return <div className="p-6">Cargando configuración...</div>
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-destructive">Error al cargar configuración</div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración SCADA</h1>
        <p className="text-muted-foreground mt-2">
          Parámetros del sistema SCADA. Los cambios se aplican automáticamente al
          simulador en background (puede tardar hasta 30s).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((cfg) => (
          <TarjetaConfiguracion key={cfg.id} configuracion={cfg} />
        ))}
      </div>
    </div>
  )
}
