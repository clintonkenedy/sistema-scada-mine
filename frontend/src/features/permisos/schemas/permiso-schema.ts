import { z } from 'zod'

export const esquemaCrearPermiso = z.object({
  name: z
    .string({ error: 'El nombre es requerido' })
    .min(1, { error: 'El nombre es requerido' })
    .regex(/^[a-z]+\.[a-z_]+$/, {
      error: 'Formato inválido. Usá modulo.accion (minúsculas)',
    })
    .max(100, { error: 'Máximo 100 caracteres' }),
})

export type EsquemaCrearPermiso = z.infer<typeof esquemaCrearPermiso>
