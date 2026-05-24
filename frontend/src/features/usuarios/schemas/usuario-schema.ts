import { z } from 'zod'

export const esquemaCrearUsuario = z
  .object({
    name: z
      .string({ error: 'El nombre completo es requerido' })
      .min(1, { error: 'El nombre completo es requerido' })
      .max(255, { error: 'Máximo 255 caracteres' }),
    email: z.email({ error: 'Email inválido' }),
    password: z
      .string({ error: 'La contraseña es requerida' })
      .min(8, { error: 'Mínimo 8 caracteres' }),
    password_confirmation: z.string({ error: 'Confirmá la contraseña' }),
    dni: z.string().max(20, { error: 'Máximo 20 caracteres' }).nullable().optional(),
    nombres: z
      .string({ error: 'Los nombres son requeridos' })
      .min(1, { error: 'Los nombres son requeridos' })
      .max(100, { error: 'Máximo 100 caracteres' }),
    apellido_paterno: z
      .string({ error: 'El apellido paterno es requerido' })
      .min(1, { error: 'El apellido paterno es requerido' })
      .max(100, { error: 'Máximo 100 caracteres' }),
    apellido_materno: z
      .string()
      .max(100, { error: 'Máximo 100 caracteres' })
      .nullable()
      .optional(),
    activo: z.boolean().optional(),
    rol: z.string().nullable().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    error: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  })

export type EsquemaCrearUsuario = z.infer<typeof esquemaCrearUsuario>

export const esquemaEditarUsuario = z
  .object({
    name: z
      .string()
      .min(1, { error: 'El nombre no puede estar vacío' })
      .max(255, { error: 'Máximo 255 caracteres' })
      .optional(),
    email: z.email({ error: 'Email inválido' }).optional(),
    password: z
      .string()
      .min(8, { error: 'Mínimo 8 caracteres' })
      .optional()
      .or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
    dni: z.string().max(20, { error: 'Máximo 20 caracteres' }).nullable().optional(),
    nombres: z
      .string()
      .min(1, { error: 'Los nombres no pueden estar vacíos' })
      .max(100, { error: 'Máximo 100 caracteres' })
      .optional(),
    apellido_paterno: z
      .string()
      .min(1, { error: 'El apellido paterno no puede estar vacío' })
      .max(100, { error: 'Máximo 100 caracteres' })
      .optional(),
    apellido_materno: z
      .string()
      .max(100, { error: 'Máximo 100 caracteres' })
      .nullable()
      .optional(),
    activo: z.boolean().optional(),
    rol: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.password_confirmation
      }
      return true
    },
    {
      error: 'Las contraseñas no coinciden',
      path: ['password_confirmation'],
    },
  )

export type EsquemaEditarUsuario = z.infer<typeof esquemaEditarUsuario>
