import { useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { useSesionStore } from '@/features/autenticacion/stores/sesion-store'
import { FormularioEditarValor } from './formulario-editar-valor'
import type { ConfiguracionScada } from '../types/configuracion'

type Props = {
  configuracion: ConfiguracionScada
}

const NOMBRES_LEGIBLES: Record<string, string> = {
  tiempo_muerto_minutos: 'Tiempo muerto',
  velocidad_parado_kmh: 'Velocidad para "parado"',
  tiempo_minimo_zona_segundos: 'Tiempo mínimo en zona',
  simulador_speed_multiplier: 'Multiplicador del simulador',
}

function nombreLegible(clave: string): string {
  return NOMBRES_LEGIBLES[clave] ?? clave
}

export function TarjetaConfiguracion({ configuracion }: Props) {
  const [editando, setEditando] = useState(false)
  const puedeEditar = useSesionStore((s) => s.tienePermiso('configuracion.editar'))

  const valorMostrado = `${configuracion.valor}${
    configuracion.unidad ? ' ' + configuracion.unidad : ''
  }`

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-base">{nombreLegible(configuracion.clave)}</CardTitle>
          {configuracion.descripcion && (
            <CardDescription className="mt-2 text-xs">
              {configuracion.descripcion}
            </CardDescription>
          )}
        </div>
        {puedeEditar && !editando && (
          <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editando ? (
          <FormularioEditarValor
            configuracion={configuracion}
            onCancel={() => setEditando(false)}
            onSuccess={() => setEditando(false)}
          />
        ) : (
          <div className="text-2xl font-mono font-semibold">{valorMostrado}</div>
        )}
        {configuracion.minimo !== null && configuracion.maximo !== null && (
          <div className="mt-2 text-xs text-muted-foreground">
            Rango permitido: {configuracion.minimo} - {configuracion.maximo}
            {configuracion.unidad ? ' ' + configuracion.unidad : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
