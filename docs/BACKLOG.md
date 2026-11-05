# Backlog técnico — emsa-sgff-frontend

Pendientes detectados al revisar el repo y al preparar un entorno local de pruebas (noviembre 2026). Prioridad: **P1** bloquea o es riesgo de seguridad · **P2** reduce fricción o deuda importante · **P3** mejora.

Cuando trabajes un ítem, abre un issue o PR y enlázalo aquí. Borra el ítem cuando esté resuelto.

## P1

### 1. `npm run build` falla
`tsc -b` da 32 errores de tipos (en `main` y en `feat/simulacion-improvements`), así que el build oficial no termina. Hoy solo funciona `vite build` directo. Los errores se concentran en `Modificaciones.tsx`, `SolpeTiempos.tsx`, `Home.tsx`, `Simulacion.tsx` y `PresupuestoPerforacion.tsx`: tipos de `Formatter` de Recharts, variables sin usar y propiedades que no existen en el tipo.

### 2. `xlsx` con vulnerabilidades conocidas
`xlsx@^0.18.5`, la última versión de SheetJS publicada en npm, tiene vulnerabilidades conocidas: contaminación de prototipo (CVE-2023-30533) y ReDoS (CVE-2024-22363). SheetJS ya no publica en npm. Opciones: instalar la versión corregida desde el CDN de SheetJS o cambiar a otra librería (por ejemplo, `exceljs`).

## P2

### 3. Token en `localStorage`
El JWT se guarda en `localStorage` (`src/auth/AuthContext.tsx`, `src/api/client.ts`), así que queda expuesto ante cualquier XSS. Evaluar una cookie `HttpOnly` con el backend.

### 3b. Llamadas a endpoints: estado con el backend del PR #4
Contra el backend del [PR #4](https://github.com/stonks-lab/emsa-sgff-backend/pull/4), los 77 endpoints que llama el frontend responden 200 con datos de prueba. Hay que tener en cuenta:
- **Bloques vacíos sin error.** Las pantallas capturan los errores de la API (`.catch(() => setX(null))`) y muestran el bloque vacío, así que una pantalla rota puede no dar error en la consola. Para saber si un endpoint "no se usa", búscalo por la ruta **y** por el nombre de la función de `src/api/client.ts`.
- `getEstadoProyectosTimeline` (`/estado-proyectos/saldo-timeline`): **no eliminar.** Lo usa `AnalisisProyecto.tsx` para la tabla "Proyección de Saldo mínimo por Proyecto". Se había perdido en la integración y se recuperó desde `main` del backend.
- `getPycComparacion` (`/proyecciones/comparacion`) y los filtros `proyecto` y `periodo_hasta` de la tabla de `Proyecciones.tsx`: vuelven a funcionar con el PR #4. Pero **con datos reales la tabla P&C vs AdC queda vacía**: desde el 19-oct el backend no tiene ninguna carga AdC, y lo mismo pasa con el botón AdC del timeline. La columna "Tipo servicio" de esa tabla también sale vacía. Decisión de producto pendiente: volver a cargar AdC o sacar esas vistas (backlog del backend, ítem 1a).
- `/upload/proyecciones-adc` (carga AdC) no existe en ninguna rama del backend.
- En consola aparece una advertencia de React por `key` duplicada en listas de `Simulacion.tsx`.

### 4. Advertencias de lint
`oxlint` da 0 errores pero unas 98 advertencias. Las más relevantes: componentes creados durante el render (`react(static-components)`, en `SolpeTiempos.tsx`), `setState` dentro de efectos y llamadas impuras durante el render.

### 5. Despliegue acoplado al nombre de carpeta
El backend sirve el build desde `../frontend/dist`. Si este repo se clona con su nombre (`emsa-sgff-frontend`), el backend no lo encuentra. Coordinar con el ítem 6 del backlog del backend.

### 6. Bundle
Vite avisa de chunks grandes y de un `import()` dinámico de `src/api/client.ts` que no surte efecto, porque el mismo módulo también se importa de forma estática. Evaluar dividir por ruta con `React.lazy`.


## P3

### 7. Tests y CI
No hay tests ni CI. Partir con un workflow de GitHub Actions que corra `npm run build` y `npm run lint` en cada PR, y después agregar tests de componentes (Vitest + Testing Library).

### 8. Metadatos del paquete
En `package.json` el nombre es `frontend` y la versión `0.0.0`. Cambiarlo a `emsa-sgff-frontend`.

### 9. Nombre visible
La UI sigue diciendo "Tablero DAB-DPO" (`index.html`, `Layout.tsx`, `Home.tsx`). Decidir si pasa a SGFF.

### 10. Protección de `main`
`main` no tiene reglas de protección. Exigir PR y revisión antes de mergear.
