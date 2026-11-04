# Índice de sesiones de trabajo

Una fila por sesión; la agrega `/cierre-sesion`. El detalle está en `sesiones/AAAA-MM-DD_tema.md` y el protocolo en [`.claude/rules/sesiones.md`](../.claude/rules/sesiones.md).

## 2026

### Noviembre

| Fecha | Tema | Ubicación clave | Estado |
|---|---|---|---|
| [11-04](sesiones/2026-11-04_renombre-y-cierre-de-prs.md) | Renombre `dabdpo-frontend` → `emsa-sgff-frontend`, README, `AGENTS.md`/`CLAUDE.md` y backlog. Merge de Simulación y auth JWT a `main` (PR #2, con merge commit). Pantallas verificadas en Chrome contra el backend de `main` y el del PR #4 del backend. Creación del worklog | `README.md`, `AGENTS.md`, `docs/BACKLOG.md`, `.worklog/` | ✅ (depende del PR #4 del backend) |
| [11-04](sesiones/2026-11-04_dogfooding-main-y-pr-6.md) | Dogfooding de `main` (22 pantallas, simulación, login por rol) con el backend de `main` antes de la migración de José. Prompt de migración para José y revisión de su PR #6 (`MetrosPerforados.tsx` con `api.get`, proxy de Vite), aprobado y mergeado por él. Seguimiento de las pantallas sin datos en su equipo: `dist` del 29-oct, backend con código anterior a la integración y `users.json` faltante ("0 usuarios", backlog 6b) | `.worklog/`, `docs/BACKLOG.md` | ✅ |

## Antes del worklog

| Período | Qué | Fuente |
|---|---|---|
| 2026-09-30 a 2026-11-03 | Desarrollo en `main` y, los últimos 2 commits, en `feat/simulacion-improvements` | [HISTORIAL-RECONSTRUIDO.md](HISTORIAL-RECONSTRUIDO.md): solo git, con hechos e inferencias marcados |
