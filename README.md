# ActivityCards

Web app autónoma (frontend-only) para capturar un programa por sesiones y generar fichas (cards) + exportar a PDF (1 página por sesión).

## Stack
- React + TypeScript + Vite
- TailwindCSS
- React Router (HashRouter) para que funcione en `file://` sin servidor

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

## Dev
```bash
npm install
npm run dev
```

## Build (para compartir)
```bash
npm run build
```
Salida en `dist/`.

> Nota: si compartes `dist/` como zip, tus colegas pueden abrir `dist/index.html`.
> Para navegación, usa `/#/edit` y `/#/print`.

## Export a DOCX (pendiente)
La estructura de datos ya está lista (`src/lib/types.ts`) y existe export a Markdown.
El siguiente paso es implementar `src/exports/toDocx.ts` usando la librería `docx`.
