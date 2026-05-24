import { FormularioCamion } from './formulario-camion'
import type { EsquemaEditarCamion } from '../schemas/camion-schema'
import type { Camion } from '../types/camion'

interface Props {
  abierto: boolean
  alCerrar: () => void
  camion: Camion | null
  alSubmit: (datos: EsquemaEditarCamion) => void
  estaCargando?: boolean
  errores422?: Record<string, string[]>
}

/** Dialog wrapper para editar un camión existente. Delega al FormularioCamion. */
export function DialogoEditarCamion({
  abierto,
  alCerrar,
  camion,
  alSubmit,
  estaCargando = false,
  errores422,
}: Props) {
  return (
    <FormularioCamion
      modo="editar"
      abierto={abierto}
      alCerrar={alCerrar}
      camionEditando={camion}
      alSubmit={alSubmit}
      estaCargando={estaCargando}
      errores422={errores422}
    />
  )
}
