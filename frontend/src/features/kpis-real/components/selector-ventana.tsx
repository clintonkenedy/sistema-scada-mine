import { Button } from '@/shared/components/ui/button'
import type { VentanaHistorico } from '../types/historico'

const VENTANAS: { valor: VentanaHistorico; etiqueta: string }[] = [
  { valor: '5min', etiqueta: '5 min' },
  { valor: '1h', etiqueta: '1 hora' },
  { valor: '6h', etiqueta: '6 horas' },
  { valor: '24h', etiqueta: '24 horas' },
]

type Props = {
  valor: VentanaHistorico
  onChange: (v: VentanaHistorico) => void
}

export function SelectorVentana({ valor, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {VENTANAS.map((v) => (
        <Button
          key={v.valor}
          size="sm"
          variant={v.valor === valor ? 'default' : 'outline'}
          onClick={() => onChange(v.valor)}
        >
          {v.etiqueta}
        </Button>
      ))}
    </div>
  )
}
