import { z } from 'zod'

/** Tupla de estados operacionales. Fuente de verdad para Zod + UI. */
export const ESTADOS_CAMION = [
  'en_ruta_vacio',
  'en_carguio',
  'en_ruta_cargado',
  'descargando',
  'detenido',
  'mantenimiento',
] as const

export const esquemaCrearCamion = z.object({
  codigo: z
    .string({ error: 'El código es requerido' })
    .min(1, { error: 'El código es requerido' })
    .max(20, { error: 'Máximo 20 caracteres' })
    .regex(/^[A-Z0-9-]+$/, {
      error: 'Solo mayúsculas, números y guiones',
    }),
  patente: z
    .string()
    .max(20, { error: 'Máximo 20 caracteres' })
    .nullable()
    .optional(),
  modelo: z
    .string({ error: 'El modelo es requerido' })
    .min(1, { error: 'El modelo es requerido' })
    .max(100, { error: 'Máximo 100 caracteres' }),
  capacidad_toneladas: z.coerce
    .number({ error: 'La capacidad es requerida' })
    .min(0, { error: 'Debe ser mayor o igual a 0' })
    .max(9999.99, { error: 'Máximo 9999.99 toneladas' }),
  estado_actual: z.enum(ESTADOS_CAMION, {
    error: 'Estado inválido',
  }),
  activo: z.boolean().optional(),
})

export type EsquemaCrearCamion = z.infer<typeof esquemaCrearCamion>

export const esquemaEditarCamion = z.object({
  codigo: z
    .string()
    .min(1, { error: 'El código no puede estar vacío' })
    .max(20, { error: 'Máximo 20 caracteres' })
    .regex(/^[A-Z0-9-]+$/, {
      error: 'Solo mayúsculas, números y guiones',
    })
    .optional(),
  patente: z
    .string()
    .max(20, { error: 'Máximo 20 caracteres' })
    .nullable()
    .optional(),
  modelo: z
    .string()
    .min(1, { error: 'El modelo no puede estar vacío' })
    .max(100, { error: 'Máximo 100 caracteres' })
    .optional(),
  capacidad_toneladas: z.coerce
    .number()
    .min(0, { error: 'Debe ser mayor o igual a 0' })
    .max(9999.99, { error: 'Máximo 9999.99 toneladas' })
    .optional(),
  estado_actual: z.enum(ESTADOS_CAMION, { error: 'Estado inválido' }).optional(),
  activo: z.boolean().optional(),
})

export type EsquemaEditarCamion = z.infer<typeof esquemaEditarCamion>
