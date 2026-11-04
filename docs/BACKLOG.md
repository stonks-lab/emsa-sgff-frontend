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
El JWT se guarda en `localStorage` (`src/auth/AuthContext.tsx`, `src/api/client.ts`), así que queda expuesto ante cualquier XSS. Evaluar una cookie `HttpOnly` con el backend. Además, `MetrosPerforados.tsx` usa `fetch` con el token a mano en vez del cliente `axios` común.

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
