import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Obtiene el valor de un cookie por nombre desde document.cookie.
 * Usado para leer el XSRF-TOKEN que Sanctum setea tras GET /sanctum/csrf-cookie.
 */
function obtenerCookie(nombre: string): string | null {
  const valor = `; ${document.cookie}`
  const partes = valor.split(`; ${nombre}=`)
  if (partes.length === 2) {
    return partes.pop()?.split(';').shift() ?? null
  }
  return null
}

/**
 * Interceptor de request para manejar CSRF token de Laravel Sanctum SPA.
 *
 * Flujo para requests mutantes (POST, PUT, PATCH, DELETE):
 * 1. Obtener el CSRF cookie del backend (si no existe o está expirado)
 * 2. Leer el cookie XSRF-TOKEN del document.cookie
 * 3. Decodificar (viene URL-encoded) y agregarlo al header X-XSRF-TOKEN
 *
 * Axios NO hace este paso automáticamente en cross-origin (localhost:5173 → localhost:8000).
 * Por eso hay que leerlo y setearlo manualmente.
 */
api.interceptors.request.use(async (config) => {
  const metodo = config.method ?? ''
  const esMutante = ['post', 'put', 'patch', 'delete'].includes(metodo)

  if (esMutante) {
    // 1. Asegurar que el cookie XSRF-TOKEN está seteado
    await axios.get(
      `${import.meta.env.VITE_API_URL || ''}/sanctum/csrf-cookie`,
      { withCredentials: true },
    )

    // 2. Leer el cookie del document
    const xsrfToken = obtenerCookie('XSRF-TOKEN')

    // 3. Decodificar y agregarlo al header (el cookie viene URL-encoded)
    if (xsrfToken) {
      config.headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken))
    }
  }

  return config
})

export default api
