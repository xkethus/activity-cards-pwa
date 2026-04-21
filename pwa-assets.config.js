import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera automáticamente todos los íconos PWA + apple-touch-icon
// desde el SVG fuente: public/pwa-icon.svg
//
// Ejecutar: npm run generate-pwa-assets
// Outputs en public/:
//   pwa-64x64.png
//   pwa-192x192.png
//   pwa-512x512.png
//   apple-touch-icon-180x180.png
//   maskable-icon-512x512.png

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: '#ffffff' },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: '#ffffff' },
    },
  },
  images: ['public/pwa-icon.svg'],
})
