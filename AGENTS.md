# AGENTS.md

Instrucciones para agentes de IA y personas que trabajan en este repositorio.

## Proyecto

`emsa-sgff-frontend`: interfaz web del SGFF (Sistema de Gestión Físico-Financiera) de EMSA. Usa la API de [`emsa-sgff-backend`](https://github.com/stonks-lab/emsa-sgff-backend). Ver [README.md](README.md).

## Ramas y Git

- **La rama principal es `main`.** No existe `master` ni otra rama de integración.
- Crea cada rama desde un `main` actualizado (`git pull` antes), con prefijo `feat/`, `fix/` o `docs/`.
- Todo cambio entra a `main` por Pull Request. No hagas push directo a `main`.
- No crees ramas con historia propia (por ejemplo, un `git init` nuevo o un repo copiado). Si `git merge-base main <rama>` no devuelve nada, detente y avisa.
- Cada persona firma sus commits con su propia identidad de git/GitHub.
- Borra la rama cuando su PR esté mergeado.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173, redirige /api a http://localhost:8000
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

Antes de abrir un PR, corre `npm run build` y `npm run lint`. No agregues errores de tipos ni de lint nuevos.

## Convenciones

- Las llamadas a la API van en `src/api/client.ts`, con base `/api`.
- Los módulos y sus rutas se definen en `src/config/modules.ts`, y la navegación en `src/components/Layout.tsx`.
- Hay una vista por pantalla en `src/pages/`.
- Las pantallas capturan los errores de la API y muestran el bloque vacío. Que no haya errores en la consola no significa que la pantalla funcione: revisa que los bloques tengan datos.
- Antes de dar por "no usado" un endpoint o una función del cliente, búscala por la ruta **y** por el nombre de la función de `src/api/client.ts`.
- La documentación va en la carpeta `docs/` de este repo y los pendientes técnicos en [`docs/BACKLOG.md`](docs/BACKLOG.md). No hay un repo `-docs` aparte.
- No subas secretos ni archivos `.env`.

## Sesiones y worklog

El trabajo se registra en [`.worklog/`](.worklog/INDICE.md) con el protocolo de [`.claude/rules/sesiones.md`](.claude/rules/sesiones.md). Con Claude Code: `/inicio-sesion <objetivo>` al empezar y `/cierre-sesion` al terminar, en la misma rama.

- **Una sesión = una rama = un archivo** `.worklog/sesiones/AAAA-MM-DD_tema.md`, con su fila en `.worklog/INDICE.md`.
- Registra decisiones con hora, quién decidió y por qué. Anota también los hallazgos y los errores, incluidos los propios.
- **Cada hecho lleva su fuente** (commit, PR, comando o prueba). Lo que no se pudo comprobar se marca **[inferido]**, con a quién preguntar. No se reconstruye el *por qué* de un cambio ajeno desde su diff.
- Si la sesión también toca el backend, enlaza su archivo de sesión en `emsa-sgff-backend/.worklog/`.
- Lo anterior al 4-nov de 2026 está reconstruido desde git en [`.worklog/HISTORIAL-RECONSTRUIDO.md`](.worklog/HISTORIAL-RECONSTRUIDO.md).
