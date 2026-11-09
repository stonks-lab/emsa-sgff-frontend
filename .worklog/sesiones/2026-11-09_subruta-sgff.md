# Sesión: 2026-11-09 — Publicar la app bajo la sub-ruta /sgff/

## Contexto
- **Objetivo:** que el SGFF funcione en `http://<servidor>/sgff`, junto a las otras apps del IIS, en vez del puerto 8080.
- **Quién:** Aldo Saavedra, con Claude Code.
- **Rama:** `feat/subruta-sgff`
- **Continuación de:** [2026-11-05_usuarios-y-tablas-colapsables.md](2026-11-05_usuarios-y-tablas-colapsables.md)
- **Repo hermano:** [`emsa-sgff-backend/.worklog/sesiones/2026-11-09_runbook-windows-server.md`](https://github.com/stonks-lab/emsa-sgff-backend/blob/docs/runbook-windows-server/.worklog/sesiones/2026-11-09_runbook-windows-server.md): despliegue y runbook

## Registro

### 10:40 — Sub-ruta
- **Decisión:** `base: '/sgff/'` fijo en `vite.config.ts`, por Aldo (convención del servidor: una app por sub-ruta). Alternativa descartada: una base configurable por variable de entorno. Hoy hay un solo destino, y una base fija evita builds con la base equivocada.
- **Hallazgo:** había URLs absolutas en 6 lugares: `api/client.ts` (base y redirección del 401), `AuthContext.tsx` (2 llamadas con `axios` directo), `Proyecciones.tsx` (su propio `axios.create`), los logos de `Login.tsx` y `Layout.tsx`, y el `BrowserRouter` sin `basename` (fuente: `grep`). Ahora todas salen de `src/config/base.ts` (commit `75eb04e`).
- **Hallazgo:** `public/logo-emsa-dark.svg`, que usa `Login.tsx`, nunca existió en el repo (fuente: `git log --all -- 'public/logo*'`). No viene de este cambio. Registrado en el backlog, ítem 5b.
- **Decisión:** la clave del token pasa de `token` a `sgff_token`, por Claude (commit `1135b7a`). Bajo `/sgff`, el SGFF comparte origen y `localStorage` con las otras apps del IIS, y una clave genérica podría pisarse. Efecto: quien tenga sesión abierta entra de nuevo una vez.
- **Prueba:** build con `npx vite build`, servido por el backend real detrás de un proxy que imita la regla de IIS (quita `/sgff`, y todo lo demás da 404). Respondieron bien `/sgff`, `/sgff/`, los assets, `favicon.svg`, `logo-emsa-light.svg`, las rutas profundas (`/sgff/saldo`, `/sgff/login`), `/sgff/api/health` y el login. `/api/health` y `/` dan 404, como corresponde (fuente: `curl` contra el proxy). En `vite dev` también responden `/sgff/`, `/sgff/saldo` y `/sgff/api/health`.
- **Prueba:** `tsc -b` sigue con los mismos 32 errores previos y `oxlint` con los mismos 98 avisos: ninguno nuevo (fuente: comparación antes y después).

## Resumen
- **Logros:** la app funciona bajo `/sgff/` en build y en desarrollo. Token con clave propia. README, AGENTS y backlog actualizados.
- **Bloqueos:** el PR necesita la aprobación de otra persona del equipo antes del merge. El servidor lo necesita mergeado para el Paso 4 del runbook.
- **Para retomar:** en desarrollo, la app ahora queda en `http://localhost:5173/sgff/`. El stack local (`local/up.sh`, fuera del repo) imprime la URL sin `/sgff/`.
