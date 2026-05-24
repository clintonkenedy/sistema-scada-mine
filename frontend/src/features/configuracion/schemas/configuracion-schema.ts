import { z } from 'zod'

export const esquemaEditarConfiguracion = z.object({
  valor: z
    .string({ error: 'Valor requerido' })
    .min(1, { error: 'Valor requerido' })
    .max(255, { error: 'Máximo 255 caracteres' }),
})

export type FormEditarConfiguracion = z.infer<typeof esquemaEditarConfiguracion>
