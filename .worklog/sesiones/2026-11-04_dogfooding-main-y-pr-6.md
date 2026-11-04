# Sesión: 2026-11-04 — Dogfooding de `main` y PR #6 de José

## Contexto
- **Objetivo:** probar el sistema completo (`main` de backend y frontend) antes de pedirle a José que ajuste sus copias locales al renombre de los repos, y acompañar ese ajuste.
- **Quién:** Aldo Saavedra Reyes (`baxtercl`), con Claude Code. José (`jos3nacho`) hizo la migración de sus clones y el PR #6.
- **Rama:** `docs/worklog-dogfooding-main`
- **Continuación de:** [2026-11-04_renombre-y-cierre-de-prs.md](2026-11-04_renombre-y-cierre-de-prs.md)
- **Repo hermano:** [emsa-sgff-backend/.worklog/sesiones/2026-11-04_dogfooding-main.md](https://github.com/stonks-lab/emsa-sgff-backend/blob/main/.worklog/sesiones/2026-11-04_dogfooding-main.md)

## Registro

### 14:50 — Estado antes de probar
- **Hallazgo:** los dos repos locales en `main`, limpios y al día con `origin`. En GitHub solo existe `main` en ambos (fuente: `gh api repos/stonks-lab/<repo>/branches`). `stonks-lab/dabdpo-backend` redirige a `emsa-sgff-backend` (fuente: `gh api repos/stonks-lab/dabdpo-backend`).
- **Hallazgo:** los dos repos son **públicos** en GitHub (fuente: `gh repo view --json visibility`). Se lo señalé a Aldo por si no es intencional; no se cambió nada.

### 15:01 — Stack local y smoke de la API
- **Hallazgo:** el stack local (`sgff/local/up.sh`, fuera de los repos) levantó con `main` en ambos repos. El smoke dio **77/77 endpoints con 200**, idéntico a la corrida anterior (fuente: `local/run/smoke-dogfood.txt` vs `smoke-final.txt`).

### 15:05 — Dogfooding en Chrome (usuario `admin`)
- **Hallazgo:** las 22 rutas de `App.tsx` cargan con **0 requests con error** (fuente: `PerformanceResourceTiming.responseStatus` por ruta) y **0 errores en consola** (fuente: `read_console_messages`). Las que la heurística marcó con gráficos vacíos (Proyecciones, Estado Proyectos, Licitaciones, Metros, Dashboard DPO, Presupuesto Perforación) se revisaron por captura y tienen datos.
- **Hallazgo:** Simulación guarda, aparece en la lista con su línea y se borra (fuente: `POST /simulacion/guardar` → `{"id":2,"ok":true}`, `GET /simulacion/2` con 1 línea, `DELETE` 200).
- **Hallazgo:** login de `dab`, `dpo` y `estrategico` responde 200 con su rol; `/auth/users` les responde 403. Con esos tokens los demás endpoints de datos responden 200: los permisos por rol solo existen en el menú. Ya estaba en el backlog del backend (ítem de autenticación), no es regresión.
- **Hallazgo:** con el `.env` real del backend, Licitaciones y Modificaciones muestran datos **reales** de Monday incluso en local.
- **Hallazgo:** KPI Contratos muestra "—" en "Desviación de sondajes" y "Recuperación de muestras". **[inferido]** faltan esos datos en el seed local → confirmar con Aldo si con datos reales aparecen.
- **Error propio:** un script que recorría las rutas con esperas largas dentro de la página cortó la conexión de la extensión y congeló la pestaña en `/modificaciones`. En una pestaña nueva la pantalla cargó bien, así que el problema fue el script y no la app. Se cambió a chequeos cortos por ruta.

### 15:11 — Stack abajo
- **Hallazgo:** `down.sh` borró contenedor, datos e imagen; sin puertos ocupados y repos limpios (fuente: `docker ps -a`, `docker images`, `lsof`, `git status`).

### ~15:15 — Prompt para la migración de José
- **Decisión:** por Aldo, pasarle a José un prompt para su Claude Code que cambie los remotos, respalde ramas con commits propios antes de borrarlas y **no renombre carpetas**: `run_servicio.bat` del backend usa una ruta fija (`C:\Dev\Tablero-integrado\tablero-web\backend`) y la tarea `TableroDabDpo` dejaría de levantar.
- **Hallazgo:** el Claude Code de José se detuvo porque el frontend tenía cambios sin commitear en `MetrosPerforados.tsx` y `vite.config.ts`, y ofreció commitear en `feat/simulacion-improvements`, hacer stash o no seguir. Se comprobó que `main` **no** tenía esos cambios (fuente: `grep` en `main`).
- **Decisión:** por Aldo, ninguna de esas opciones: llevar los cambios a una rama nueva desde `origin/main` con dos commits atómicos y abrir un PR sin mergear. Commitear en `feat/…` dejaba el trabajo en una rama ya borrada en GitHub, y el stash sobre `main` dejaba los cambios directo en `main`.

### 15:30 — PR #6 de José
- **Hallazgo:** [PR #6](https://github.com/stonks-lab/emsa-sgff-frontend/pull/6), rama `refactor/metros-pai-versiones`, commits `7e2d85f` (`MetrosPerforados.tsx`: `fetch` manual → `api.get()`, sin `console.log`) y `c8caccf` (proxy de Vite a `127.0.0.1` con `changeOrigin` y log de errores).
- **Hallazgo:** lo que dice el PR sobre el build es cierto: `tsc -b` da los **mismos 32 errores** en `main` y en la rama; el PR no agrega ninguno, y `vite build` funciona en ambas (fuente: worktrees temporales con `npx tsc -b` y `npx vite build`).
- **Hallazgo:** los commits de José están firmados con el nombre `stonks-lab` y el mismo correo que sus commits anteriores (fuente: `git log --format='%an <%ae>'`).

### 15:33 — Revisión y merge
- **Decisión:** por Aldo, aprobar con dos observaciones que no bloquean: el `.catch(() => {})` oculta los errores al cargar las versiones PAI, y José debería configurar `git config user.name` con su nombre (fuente: review de `baxtercl` en el PR #6).
- **Hallazgo:** José lo mergeó a las 15:34 con merge commit `f79fb54` y borró la rama. El `main` local avanzó en fast-forward y quedó igual al remoto (fuente: `git rev-parse HEAD` = `git ls-remote origin refs/heads/main`).

### 15:40–16:06 — José reporta pantallas sin datos
- **Hallazgo:** José informó que Proyecciones y Simulación no cargaban información en su equipo. Con el stack local arriba (15:40–15:46 y 15:52–16:06, fuente: `local/run/up-proyecciones.out`, `up-revision.out`, `down-revision.out`), las dos pantallas cargan con datos.
- **Hallazgo:** el Claude Code de José encontró que su `frontend/dist` era del 29-oct y no tenía el rediseño de Simulación del 2-nov (`80f43ec`; su bundle no contenía el texto "Reemplazar"). Lo reconstruyó con `npx vite build` (fuente: reporte de José; su `dist` quedó con fecha 04-nov 15:48).
- **Hallazgo:** la lista de simulaciones guardadas muestra "No hay simulaciones guardadas" mientras `/simulacion/lista` carga (~1,1 s), porque no tiene estado de carga (`Simulacion.tsx:685`). En la primera revisión lo atribuí a una carrera con el login; no era eso.

### ~16:30 — Diagnóstico del backend de José
- **Hallazgo:** con el código en disco en `7c0a6b9`, el backend de José respondía 404 en 13 rutas: `alertas/filtros`, `licitaciones/adjudicacion-*` y `gestion-proveedores*`, `kpi-contratos/*`, `monday/tendencia-razones` y `proyectos-inicio`. Son exactamente las rutas que están en `main` y no en el `main` viejo `2e76ab2` (fuente: reporte de José; comparación de los `@router` con `git show` en los dos commits). El proceso en el puerto 8000 corría código anterior a la integración.
- **Hallazgo:** el 500 de `/proyecciones/tabla` y `/comparacion` es el bug conocido de `2e76ab2`: llama a `get_proyecciones()` con parámetros que ya no existían (backlog del backend, ítem 1; corregido en `main` por el PR #4). No es pandas: el Claude Code de José lo atribuía a `fillna("")` en pandas 3, pero aquí `/tabla` responde 200 con pandas 3.1.0.
- **Hallazgo:** Aldo detectó que José tenía cambios en staging en el backend. Los guardó en un stash (WIP), hizo `git pull origin main` y desde entonces las pantallas funcionan (fuente: Aldo). El stash quedó en el equipo de José **sin revisar** → mirar `git stash show --stat` antes de borrarlo.
- **Error propio:** presenté como causa que el servicio corría la subcarpeta `tablero-web\backend\`, ignorada por git (`.gitignore:53`), que es adonde apunta `run_servicio.bat`. Era una inferencia: no estaba comprobada y la causa fue otra. **[inferido]** queda por confirmar desde qué carpeta arranca la tarea `TableroDabDpo` → preguntar a José.
- **Hallazgo:** con datos reales, la lista de simulaciones vacía y la tabla P&C vs AdC vacía son esperables: puede que `dbo.Simulacion` no tenga filas, y no hay cargas AdC desde el 19-oct (backlog del backend, ítem 1a). Las que José vio en la pantalla de Aldo venían de la base de prueba en Docker. José sí tiene acceso a SQL Server (fuente: Aldo; `/simulacion/datos/*` le devuelve datos).

### ~17:50 — Usuarios en 0
- **Hallazgo:** con el backend actualizado, la pantalla Usuarios le muestra "0 usuarios" a José. `Usuarios.tsx:47` no captura el error de `/auth/users`. Su reporte decía que falta `users.json` en la raíz del backend, y `/auth/login` y `/auth/users` lo leen en cada llamada (`app/routers/auth.py`). **[inferido]** `/auth/users` responde 500 → confirmar en F12 (José). José sigue adentro porque `/auth/me` solo valida el token (8 h): si cierra sesión, nadie puede entrar hasta restaurar el archivo.
- **Decisión:** por Aldo, anotarlo en el backlog (ítem 6b). Se le pasó a José un prompt para restaurar `users.json` desde el stash o desde otra carpeta, sin mostrar su contenido ni commitearlo.

## Resumen
- **Logros:** `main` de los dos repos verificado de punta a punta (77/77 endpoints, 22 pantallas, escritura de simulaciones, login por rol). José migró sus clones y entregó su primer PR siguiendo GitHub Flow y Conventional Commits (PR #6, mergeado). Su equipo quedó corriendo `main`: `dist` reconstruido y backend con pull.
- **Bloqueos:** en el equipo de José, `users.json` faltante. José no debe cerrar sesión hasta restaurarlo.
- **Para retomar:**
  - José: restaurar `users.json`, revisar el stash del backend y confirmar desde qué carpeta corre la tarea `TableroDabDpo`.
  - Backlog: ítems 1 (los 32 errores de `tsc`), 6b (Usuarios) y 9 (nombre visible), y la autenticación del backend.
  - Propuesta sin decidir: estado de carga en la lista de Simulación.
