# Historial reconstruido: 30-sep a 3-nov de 2026

Antes del 4-nov este repo no tenía worklog. Esta página reconstruye ese período **solo desde git y GitHub**. Para el *por qué* de cada cambio la única fuente son los mensajes de commit. Lo que no dicen está marcado como inferencia o pregunta abierta.

Reconstruido el 2026-11-04 por Aldo Saavedra, durante la sesión [2026-11-04](sesiones/2026-11-04_renombre-y-cierre-de-prs.md). El backend tiene su propio historial, más complejo, en `emsa-sgff-backend/.worklog/HISTORIAL-RECONSTRUIDO.md`.

## Cómo leer las etiquetas

| Etiqueta | Significa | Cómo comprobarlo |
|---|---|---|
| **[git]** | Dato verificable en el repo | El comando indicado o `git show <hash>` |
| **[mensaje]** | Lo dice el mensaje del commit, escrito por su autor | `git log -1 <hash>` |
| **[inferido]** | Interpretación de los datos, sin confirmar | Preguntar a José (ver al final) |

## Línea de tiempo

Fuente: `git log --all --reverse --date=format:'%Y-%m-%d %H:%M' --format='%h|%ad|%an|%s'`. Horas en hora de Chile.

| Fecha | Commit | Rama | Identidad git | Qué dice el mensaje |
|---|---|---|---|---|
| 09-30 17:33 | `564c970` | `main` | `riffocardenas-bit` | Frontend inicial |
| 10-05 18:13 | `3a70ff3` | `main` | `riffocardenas-bit` | Design system EMSA, nuevas páginas, timeline de saldo |
| 10-06 17:55 | `dc1a5aa` | `main` | `riffocardenas-bit` | Timeline de saldo por contrato, timeline P&C con colores por EP |
| 10-13 18:54 | `0220a45` | `main` | `riffocardenas-bit` | Scroll, licitaciones Monday, exportar a Excel; agrega la tabla P&C vs AdC (`getPycComparacion`) **[git]** |
| 10-14 13:07 | `2d86a74` | `main` | `riffocardenas-bit` | Timeline de saldo por proyecto (`getEstadoProyectosTimeline`) en Análisis por Proyecto |
| 10-19 12:48 | `d57ec22` | `main` | `riffocardenas-bit` | Página SOLPEs |
| 10-19 18:01 | `d94a2d6` | `main` | `riffocardenas-bit` | Licitaciones con donuts por Tipo Servicio |
| 10-21 17:37 | `fc10393` | `main` | `stonks-lab` | Filtros de fecha, Dashboard DAB |
| 10-26 18:03 | `10e1d2f` | `main` | `stonks-lab` | Dashboard DAB: licitaciones activas |
| 10-27 12:44 | `abcbc68` | `main` | `stonks-lab` | Selector de versión PAI, Presupuesto Perforación |
| 10-29 13:21 | `81ce44f` | `main` | `stonks-lab` | Modelos Productivos, drill-down Modificaciones, tendencia por razón |
| 10-29 18:18 | `2681b8c` | `main` | `stonks-lab` | Módulo KPI Contratos, rediseño Alertas. Último commit de `main` antes del 4-nov |
| 11-02 17:05 | `80f43ec` | `feat/simulacion-improvements` | `stonks-lab` | Simulación: rediseño de tabla, reemplazo por período |
| 11-03 13:17 | `f37ed1f` | `feat/simulacion-improvements` | `stonks-lab` | Auth JWT, error boundary, fix Metros/Presupuesto |

## Hechos verificados

1. **Una sola historia.** El repo tiene un solo commit raíz (`564c970`) **[git]** (`git rev-list --max-parents=0 --all`). El 21-oct cambió la identidad git, pero el trabajo siguió sobre `main`: el padre de `fc10393` es `d94a2d6`. En el backend, ese mismo día nació una historia aparte (`master`).
2. **Dos identidades, un correo.** `riffocardenas-bit` y `stonks-lab` firman con el mismo correo **[git]**.
3. **Pareado con el backend.** Los commits coinciden en fecha y hora (±1 minuto) con los del backend, salvo `f37ed1f` **[git]**. La parte de backend de la auth (`2e76ab2`) se commiteó a las 18:11 del mismo día, en `main` del backend y con la otra identidad.
4. **El frontend de `main` (29-oct) llamaba a endpoints que el `main` del backend no tenía.** El 4-nov, con el backend de `main`, 11 endpoints daban 404 y 2 daban 500, y había pantallas vacías o trabadas (KPI Contratos, Alertas, Dashboard DPO) **[prueba local del 4-nov]**. Esos endpoints estaban en `master` del backend.
5. **Pantallas que no se tocaron más.** `AnalisisProyecto.tsx` no cambia desde el 14-oct y `Proyecciones.tsx` desde el 13-oct **[git]**. Siguen llamando a `/saldo-timeline` y a `/comparacion` con los filtros `proyecto`/`periodo_hasta`, que el `master` del backend no tiene.
6. **`npm run build` falla** por 32 errores de tipos; `vite build` sí compila **[prueba local del 4-nov]**. Ver `docs/BACKLOG.md`, ítem 1.

## Inferencias (sin confirmar)

- **[inferido]** El 21-oct el trabajo pasó a otro entorno con otra configuración de git (`stonks-lab`). Aquí el repo sí era un clon, por eso la historia siguió en `main`. Ver el historial del backend.
- **[inferido]** No hay rastro en git de que se haya decidido dejar de usar `/saldo-timeline` o `/comparacion`: las pantallas simplemente no se tocaron (hecho 5).

## Preguntas abiertas para José

1. ¿La tabla P&C vs AdC y el botón AdC deben seguir? Desde el 19-oct el backend no carga AdC (backlog del backend, ítem 1a).
2. ¿`feat/simulacion-improvements` ya se puede borrar? Su contenido entró completo a `main` con el PR #2 (`458c283`).

Cuando José responda, registra la respuesta en la sesión que corresponda y actualiza esta página, con la fuente.
