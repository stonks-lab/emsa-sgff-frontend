# AGENTS.md

Instrucciones para agentes de IA y personas que trabajan en este repositorio.

## Proyecto

`emsa-sgff-frontend`: interfaz web del SGFF (Sistema de Gestión Físico-Financiera) de EMSA. Usa la API de [`emsa-sgff-backend`](https://github.com/stonks-lab/emsa-sgff-backend). Ver [README.md](README.md).

## Flujo de trabajo: GitHub Flow

**Regla:** este repo usa **GitHub Flow**. Pasará a **Gitflow** solo cuando lo decida Aldo Saavedra. Hasta que esa decisión quede escrita en este archivo, nadie, ni persona ni agente, crea `develop`, `release/*` ni `hotfix/*` ni cambia el flujo.

- **La rama principal es `main`**, la única permanente, y debe poder desplegarse siempre. No existe `master` ni otra rama de integración.
- Cada cambio va en una rama corta creada desde un `main` actualizado (`git pull` antes). El prefijo es el tipo de Conventional Commits: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/` o `test/`.
- Todo cambio entra a `main` por Pull Request. No hagas push directo a `main`.
- **Todo PR necesita la aprobación de otra persona del equipo** (Aldo Saavedra u otro miembro), **nunca de quien lo abrió**. Solo después de esa aprobación, el autor lo mergea como se indica abajo.
- Cómo mergear un PR:
  - **Squash merge** si es un solo cambio lógico. El título del PR va en formato Conventional Commits, porque queda como el commit en `main`.
  - **Create a merge commit** si trae varios commits atómicos que vale la pena conservar, o si une historias. El mensaje es `Merge PR #N: <título>`.
- No crees ramas con historia propia, por ejemplo con un `git init` nuevo o un repo copiado. Si `git merge-base main <rama>` no devuelve nada, detente y avisa.
- Cada persona firma sus commits con su propia identidad de git/GitHub. El proyecto es de EMSA.
- Borra la rama cuando su PR esté mergeado.
- Al pasar a Gitflow se actualizan este archivo, `CLAUDE.md` y `.claude/hooks/session-context.sh`.

## Commits

- **Conventional Commits, siempre:** `<tipo>(<ámbito opcional>): <descripción>`.
  - Tipos: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style` y `revert`.
  - Descripción en español, con minúscula inicial, sin punto final y de hasta 72 caracteres.
  - El cuerpo, opcional, explica qué cambia y por qué.
  - Un cambio incompatible lleva `!` después del tipo o el pie `BREAKING CHANGE: …`.
  - Ejemplos: `fix(analisis): mostrar un aviso cuando falla saldo-timeline`, `docs(backlog): actualizar el estado de los endpoints`.
- **Commits atómicos:** un commit es un solo cambio lógico, que funciona por sí mismo y se puede revertir sin arrastrar otra cosa.
  - No mezcles en un commit una funcionalidad con un refactor, con formato o con documentación de otro tema.
  - Si para describir el commit necesitas "y" entre dos cambios independientes, son dos commits. Usa `git add -p` para separar cambios dentro de un mismo archivo.
  - Los merge commits (`Merge PR #N: …`) quedan exentos del formato.
- Los commits anteriores a esta regla (adoptada el 2026-11-04 a las 14:38) no siempre la cumplen y no se reescriben.

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
