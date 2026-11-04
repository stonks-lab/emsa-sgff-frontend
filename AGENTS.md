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
- La documentación va en la carpeta `docs/` de este repo. No hay un repo `-docs` aparte.
- No subas secretos ni archivos `.env`.
