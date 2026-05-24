/** Formatea segundos como `Xh Ym`, `Xm Ys` o `Xs` según magnitud. */
export function formatearMinutos(segundos: number): string {
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  if (min < 60) return `${min}m ${seg}s`
  const h = Math.floor(min / 60)
  const minR = min % 60
  return `${h}h ${minR}m`
}

/** Formatea metros a km cuando supera 1000 m. */
export function formatearMetros(m: number): string {
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(2)} km`
}

/** Hora HH:mm en locale es-PE. */
export function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
