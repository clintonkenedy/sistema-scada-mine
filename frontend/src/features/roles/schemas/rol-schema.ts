import { z } from 'zod'

export const esquemaCrearRol = z.object({
  name: z
    .string({ error: 'El nombre es requerido' })
    .min(1, { error: 'El nombre es requerido' })
    .regex(/^[a-z_-]+$/, {
      error: 'Solo minúsculas, guiones y guiones bajos',
    })
    .max(100, { error: 'Máximo 100 caracteres' }),
})

export type EsquemaCrearRol = z.infer<typeof esquemaCrearRol>
