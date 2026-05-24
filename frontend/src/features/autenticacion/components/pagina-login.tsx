import { Navigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { useUsuarioActual } from '../hooks/use-usuario-actual'
import { FormularioLogin } from './formulario-login'

export function PaginaLogin() {
  const { isLoading, isSuccess, data } = useUsuarioActual()

  // Derivar autenticación de la query directamente (sincrónico)
  // para evitar race condition con el useEffect de Zustand.
  if (!isLoading && isSuccess && data != null) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">SCADA Mine</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema SCADA para monitoreo de operaciones mineras
          </p>
        </CardHeader>
        <CardContent>
          <FormularioLogin />
        </CardContent>
      </Card>
    </div>
  )
}
