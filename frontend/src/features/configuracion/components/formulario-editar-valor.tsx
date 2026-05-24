import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useActualizarConfiguracion } from '../hooks/use-mutaciones-configuracion'
import {
  esquemaEditarConfiguracion,
  type FormEditarConfiguracion,
} from '../schemas/configuracion-schema'
import type { ConfiguracionScada } from '../types/configuracion'

type Props = {
  configuracion: ConfiguracionScada
  onCancel: () => void
  onSuccess: () => void
}

export function FormularioEditarValor({ configuracion, onCancel, onSuccess }: Props) {
  const mutacion = useActualizarConfiguracion()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormEditarConfiguracion>({
    resolver: zodResolver(esquemaEditarConfiguracion),
    defaultValues: { valor: configuracion.valor },
  })

  const esNumerico =
    configuracion.tipo === 'entero' || configuracion.tipo === 'decimal'

  function onSubmit(data: FormEditarConfiguracion) {
    mutacion.mutate(
      { clave: configuracion.clave, valor: data.valor },
      { onSuccess },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type={esNumerico ? 'number' : 'text'}
          step={configuracion.tipo === 'decimal' ? '0.1' : '1'}
          min={configuracion.minimo ?? undefined}
          max={configuracion.maximo ?? undefined}
          {...register('valor')}
          className="text-lg font-mono"
          disabled={mutacion.isPending}
        />
        <Button size="sm" type="submit" disabled={mutacion.isPending}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={mutacion.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {errors.valor && (
        <p className="text-xs text-destructive">{errors.valor.message}</p>
      )}
      {mutacion.isError && (
        <p className="text-xs text-destructive">
          Error al guardar. Verifica el valor.
        </p>
      )}
    </form>
  )
}
