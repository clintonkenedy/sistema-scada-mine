import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

interface PropiedadesFiltroAlertas {
  severidad: string | undefined
  leida: string | undefined
  onCambiarSeveridad: (valor: string | null) => void
  onCambiarLeida: (valor: string | null) => void
}

const VALOR_TODOS = '__todos__'

export function FiltroAlertas({
  severidad,
  leida,
  onCambiarSeveridad,
  onCambiarLeida,
}: PropiedadesFiltroAlertas) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        value={severidad ?? VALOR_TODOS}
        onValueChange={(v) => onCambiarSeveridad(v === VALOR_TODOS ? null : v)}
      >
        <SelectTrigger aria-label="Filtrar por severidad" className="h-10 w-auto min-w-[180px]">
          <SelectValue placeholder="Todas las severidades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={VALOR_TODOS}>Todas las severidades</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="danger">Danger</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={leida ?? VALOR_TODOS}
        onValueChange={(v) => onCambiarLeida(v === VALOR_TODOS ? null : v)}
      >
        <SelectTrigger aria-label="Filtrar por estado de lectura" className="h-10 w-auto min-w-[180px]">
          <SelectValue placeholder="Todas (leídas y no)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={VALOR_TODOS}>Todas</SelectItem>
          <SelectItem value="0">Solo no leídas</SelectItem>
          <SelectItem value="1">Solo leídas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
