export type TipoConfiguracion = 'entero' | 'decimal' | 'texto' | 'booleano'

export type ConfiguracionScada = {
  id: number
  clave: string
  valor: string
  valor_tipado: string | number | boolean
  tipo: TipoConfiguracion
  descripcion: string | null
  unidad: string | null
  minimo: number | null
  maximo: number | null
  updated_at: string | null
  modificado_por: {
    id: number
    nombre: string
  } | null
}
