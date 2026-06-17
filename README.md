# CMM · Programa (antes ActivityCards PWA)

App para capturar fichas de actividad por sesiones, validarlas (flujo de aprobación)
y visualizar la saturación del calendario. Backend en Supabase (proyecto `cmm-programa-2026`);
login por enlace mágico al correo (sin contraseñas).

**Esta es la versión PWA (Progressive Web App)** — instalable como aplicación nativa en Mac, Windows, Linux, iOS y Android. Funciona completamente offline después del primer load.

## Stack
- React + TypeScript + Vite
- TailwindCSS
- React Router (HashRouter) para que funcione en `file://` sin servidor
- **Vite PWA Plugin** — Service Worker automático, manifest, cache offline

## Rutas
- `/#/` Vista (hero + una sesión)
- `/#/edit` Editor (form dinámico) + export/import JSON + export Markdown
- `/#/print` Modo impresión: 1 página por sesión (Carta). Abre `window.print()` automáticamente.

## Persistencia
- `localStorage` (por navegador)
- Compartir: Exportar JSON / Importar JSON

## PDF (Carta)
En Chrome, al imprimir:
- Destino: **Guardar como PDF**
- Tamaño papel: **Carta (Letter)**
- Activar: **Gráficos de fondo** (para gradientes)

## PWA Setup

### Generar íconos automáticamente
```bash
npm install
npm run generate-pwa-assets
```

Esto crea los íconos en `public/`:
- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `apple-touch-icon-180x180.png`
- `maskable-icon-512x512.png`

(Reemplaza `public/pwa-icon.svg` con tu propio diseño antes de ejecutar esto)

## Dev
```bash
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador. En Chrome/Edge, verás "Instalar" en la barra de direcciones.

## Build (para producción)
```bash
npm run build
```

Salida en `dist/` — completamente PWA-ready:
- ✅ Service Worker automático
- ✅ Funciona offline
- ✅ Instalable en home screen
- ✅ Sincroniza cambios automáticamente entre pestañas

## Cómo instalar la app

### En Mac (Chrome/Edge)
1. Abre la app en tu navegador (local dev o build publicado)
2. Buscaminas el botón "Instalar" en la barra de direcciones (o menú ⋮ → "Instalar app")
3. ¡Listo! La app aparece en Aplicaciones y en Launchpad

### En iOS (Safari)
1. Abre en Safari
2. Toca el botón Compartir
3. "Agregar a la pantalla de inicio"

### En Android (Chrome)
1. Abre en Chrome
2. Menú ⋮ → "Instalar aplicación"
3. Se agrega como app nativa

## Export a DOCX (pendiente)
La estructura de datos ya está lista (`src/lib/types.ts`) y existe export a Markdown.
El siguiente paso es implementar `src/exports/toDocx.ts` usando la librería `docx`.
