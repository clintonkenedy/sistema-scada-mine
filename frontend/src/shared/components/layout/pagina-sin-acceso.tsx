import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/shared/components/ui/button-variants'

export function PaginaSinAcceso() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <ShieldX className="h-16 w-16 text-destructive" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Sin acceso</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          No tenés permiso para acceder a esta sección. Si creés que es un error, contactá al
          administrador del sistema.
        </p>
      </div>
      <Link to="/dashboard" className={buttonVariants({ variant: 'default' })}>
        Volver al dashboard
      </Link>
    </div>
  )
}
