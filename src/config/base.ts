// Sub-ruta bajo la que se publica la app. Sale de `base` en vite.config.ts (hoy '/sgff/'):
// en el servidor, el SGFF convive con otras apps en el mismo IIS, cada una en /<nombre-de-la-app>.
// Todo lo que arme una URL absoluta (API, imágenes de public/, redirecciones) debe partir de aquí.
export const BASE = import.meta.env.BASE_URL

export const API_BASE = `${BASE}api`

// React Router espera el basename sin la barra final.
export const ROUTER_BASENAME = BASE.replace(/\/$/, '')

export const publicUrl = (archivo: string) => `${BASE}${archivo.replace(/^\//, '')}`
