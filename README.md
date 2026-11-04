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

La app queda en `http://localhost:5173`. En desarrollo, Vite redirige las llamadas a `/api` hacia `http://localhost:8000` (ver `vite.config.ts`).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Ejecuta Oxlint |

## Estructura del proyecto

```
src/
├── api/client.ts     # Cliente axios y llamadas a la API (/api)
├── components/       # Componentes reutilizables (Layout, KpiCard, PageHeader…)
├── config/modules.ts # Definición de módulos y sus rutas
├── pages/            # Una vista por pantalla
├── App.tsx           # Rutas
└── main.tsx          # Punto de entrada
```

## Despliegue

`npm run build` genera `dist/`. En producción, el backend sirve ese build: espera encontrarlo en `frontend/dist`, en el mismo directorio padre que el backend.

## Documentación

La documentación técnica y funcional va en la carpeta [`docs/`](docs/) de este repositorio.

## Contribuir

1. Crea una rama desde `main` (`feat/…`, `fix/…`, `docs/…`).
2. Haz commits con tu propia identidad de git/GitHub.
3. Abre un Pull Request para revisión.

---

© EMSA. Uso interno.
