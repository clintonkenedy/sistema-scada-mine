import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

interface BuscadorTextoProps {
  valor: string
  onCambio: (valor: string) => void
  placeholder?: string
  milisegundosDebounce?: number
  className?: string
}

/**
 * Input de búsqueda con debounce interno.
 *
 * El estado local evita llamar `onCambio` en cada tecla — se propaga
 * después de `milisegundosDebounce` ms sin actividad del usuario.
 *
 * Cuando `valor` cambia externamente (ej: reset desde el padre),
 * el estado local se sincroniza automáticamente.
 */
export function BuscadorTexto({
  valor,
  onCambio,
  placeholder = 'Buscar...',
  milisegundosDebounce = 400,
  className,
}: BuscadorTextoProps) {
  const [valorLocal, setValorLocal] = useState(valor)

  // Sincronizar con cambios externos (ej: reset desde el padre)
  useEffect(() => {
    setValorLocal(valor)
  }, [valor])

  // Debounce: propagar cambios después de N ms sin tipear
  useEffect(() => {
    if (valorLocal === valor) return
    const timer = setTimeout(() => {
      onCambio(valorLocal)
    }, milisegundosDebounce)
    return () => clearTimeout(timer)
  }, [valorLocal, valor, onCambio, milisegundosDebounce])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={valorLocal}
        onChange={(e) => setValorLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  )
}
