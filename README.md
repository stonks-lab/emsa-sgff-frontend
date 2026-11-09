# emsa-sgff-frontend

Interfaz web del **SGFF — Sistema de Gestión Físico-Financiera** de EMSA.

El SGFF conecta la gestión **física** (la operación: proyectos, sondajes, metros perforados) con la gestión **financiera** (contratos, licitaciones, compras, presupuesto). Así se puede ver el impacto económico de cada decisión operativa. Reemplaza el trabajo que hoy se hace en planillas Excel y en Monday.com.

Backend asociado: [`emsa-sgff-backend`](https://github.com/stonks-lab/emsa-sgff-backend).

## Módulos

| Módulo | Vistas |
|---|---|
| **Home** | Resumen ejecutivo |
| **Estrategia** | Saldo de contratos, estados de pago, proyecciones, análisis por proyecto, sourcing plan, simulación |
| **Operatividad** | Estado de proyectos, metros perforados, presupuesto de perforación |
| **Modelos productivos** | Sondajes, campamento, movimiento de tierra |
| **DAB** (Dirección de Abastecimiento) | Alertas, licitaciones, SOLPEs, dashboard DAB, KPI de contratos, modificaciones |
| **DPO** (Dirección de Proyectos y Operaciones) | Dashboard DPO |
| **Administración** | Carga de datos |

## Stack

- [React 19](https://react.dev/) · TypeScript · [Vite](https://vite.dev/)
- Tailwind CSS 4
- React Router
- Recharts (gráficos)
- axios (cliente HTTP)
- SheetJS `xlsx` (exportación e importación de planillas)
- Oxlint (linter)

## Requisitos previos

- Node.js 20 o superior y npm
- El backend [`emsa-sgff-backend`](https://github.com/stonks-lab/emsa-sgff-backend) corriendo en `http://localhost:8000`

## Instalación y ejecución local

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173/sgff/`. En desarrollo, Vite reenvía las llamadas a `/sgff/api` hacia `http://localhost:8000/api`, sin el prefijo (ver `vite.config.ts`).

### Sub-ruta `/sgff/`

En el servidor, el SGFF convive con otras apps en el mismo IIS, cada una en `/<nombre-de-la-app>`. Por eso la app se compila con `base: '/sgff/'` y todas sus URLs absolutas (API, imágenes de `public/`, redirecciones, router) salen de [`src/config/base.ts`](src/config/base.ts). **No escribas rutas que empiecen con `/` a mano:** usa `API_BASE` o `publicUrl()`. Las rutas del router (`navigate('/saldo')`, `<Route path>`) sí van sin prefijo, porque `BrowserRouter` lo agrega con `basename`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos y build de producción en `dist/`. Hoy falla por errores de tipos previos (ver `docs/BACKLOG.md`); para generar `dist/` sin el chequeo: `npx vite build` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Ejecuta Oxlint |

## Estructura del proyecto

```
src/
├── api/client.ts     # Cliente axios y llamadas a la API (/sgff/api)
├── config/base.ts    # Sub-ruta de publicación (/sgff/) y URLs derivadas
├── components/       # Componentes reutilizables (Layout, KpiCard, PageHeader…)
├── config/modules.ts # Definición de módulos y sus rutas
├── pages/            # Una vista por pantalla
├── App.tsx           # Rutas
└── main.tsx          # Punto de entrada
```

## Despliegue

`npx vite build` genera `dist/`. En producción, el backend sirve ese build: espera encontrarlo en `frontend/dist`, en el mismo directorio padre que el backend. IIS publica la app en `http://<servidor>/sgff/` y le quita el `/sgff` a cada pedido antes de reenviarlo al backend. El procedimiento completo está en el runbook del backend: [`docs/RUNBOOK-WINDOWS-SERVER.md`](https://github.com/stonks-lab/emsa-sgff-backend/blob/main/docs/RUNBOOK-WINDOWS-SERVER.md).

## Documentación

La documentación técnica y funcional va en la carpeta [`docs/`](docs/) de este repositorio.

## Contribuir

1. Crea una rama desde `main` (`feat/…`, `fix/…`, `docs/…`).
2. Haz commits con tu propia identidad de git/GitHub.
3. Abre un Pull Request para revisión.

---

© EMSA. Uso interno.
