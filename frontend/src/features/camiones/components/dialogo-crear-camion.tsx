import { FormularioCamion } from './formulario-camion'
import type { EsquemaCrearCamion } from '../schemas/camion-schema'

interface Props {
  abierto: boolean
  alCerrar: () => void
  alSubmit: (datos: EsquemaCrearCamion) => void
  estaCargando?: boolean
  errores422?: Record<string, string[]>
}

/** Dialog wrapper para crear un camión nuevo. Delega al FormularioCamion. */
export function DialogoCrearCamion({
  abierto,
  alCerrar,
  alSubmit,
  estaCargando = false,
  errores422,
}: Props) {
  return (
    <FormularioCamion
      modo="crear"
      abierto={abierto}
      alCerrar={alCerrar}
      alSubmit={alSubmit}
      estaCargando={estaCargando}
      errores422={errores422}
    />
  )
}
