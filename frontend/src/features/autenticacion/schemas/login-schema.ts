import { z } from 'zod'

// NOTA ZOD 4: z.string().email() fue removido en Zod 4.
// El email ahora es z.email() como validador de nivel superior.
// Para combinar "requerido" + "formato válido" se usa z.email() con validación min separada
// o se usa z.string().min(1).pipe(z.email()) para mensajes específicos por caso.
export const esquemaLogin = z.object({
  email: z
    .string({ error: 'El email es requerido' })
    .min(1, { error: 'El email es requerido' })
    .pipe(z.email({ error: 'Ingresá un email válido' })),
  password: z
    .string({ error: 'La contraseña es requerida' })
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }),
})

export type DatosLogin = z.infer<typeof esquemaLogin>
