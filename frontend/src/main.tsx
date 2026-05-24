import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'
import {
  BYPASS_AUTH_HABILITADO,
  obtenerUsuarioBypass,
} from './features/autenticacion/lib/usuario-bypass'
import { QUERY_KEY_USUARIO } from './features/autenticacion/hooks/use-usuario-actual'
import { useSesionStore } from './features/autenticacion/stores/sesion-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

// Bypass total de autenticación. Si VITE_BYPASS_AUTH === 'true', sembramos un
// Usuario mock con todos los permisos directamente en el cache de TanStack
// Query y en el store Zustand, evitando cualquier llamada al backend de auth.
// PELIGRO: habilitado en producción por decisión explícita del usuario.
if (BYPASS_AUTH_HABILITADO) {
  const usuarioMock = obtenerUsuarioBypass()
  queryClient.setQueryData(QUERY_KEY_USUARIO, usuarioMock)
  useSesionStore.getState().iniciarSesion(usuarioMock)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" expand visibleToasts={5} />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
