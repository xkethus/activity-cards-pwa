#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  make-zip.sh  —  Genera el ZIP distribuible de Activity Cards
#  Ejecutar desde la raíz del proyecto: bash deploy/make-zip.sh
# ─────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT/deploy"
OUT_DIR="$ROOT/dist-release"
ZIP_NAME="ActivityCards.zip"

echo "▶  Generando íconos PWA..."
cd "$ROOT"
npm run generate-pwa-assets

echo "▶  Compilando el proyecto..."
npm run build

echo "▶  Empaquetando para distribución..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/app"

# Copiar el build
cp -r "$ROOT/dist/." "$OUT_DIR/app/"

# Copiar el launcher y las instrucciones
cp "$DEPLOY_DIR/Abrir Activity Cards.command" "$OUT_DIR/"
cp "$DEPLOY_DIR/LEER PRIMERO.txt" "$OUT_DIR/"

# Hacer el launcher ejecutable
chmod +x "$OUT_DIR/Abrir Activity Cards.command"

# Crear el ZIP (desde dentro de dist-release para que al extraer quede limpio)
cd "$OUT_DIR/.."
rm -f "$DEPLOY_DIR/$ZIP_NAME"
zip -r "$DEPLOY_DIR/$ZIP_NAME" "dist-release" -x "*.DS_Store"

# Renombrar la carpeta dentro del ZIP a "Activity Cards"
# (zip no permite renombrar en vuelo; lo hacemos con un temp)
rm -rf /tmp/ac-zip-tmp
mkdir /tmp/ac-zip-tmp
cp -r "$OUT_DIR" "/tmp/ac-zip-tmp/Activity Cards"
chmod +x "/tmp/ac-zip-tmp/Activity Cards/Abrir Activity Cards.command"
cd /tmp/ac-zip-tmp
rm -f "$DEPLOY_DIR/$ZIP_NAME"
zip -r "$DEPLOY_DIR/$ZIP_NAME" "Activity Cards" -x "*.DS_Store"

rm -rf /tmp/ac-zip-tmp "$OUT_DIR"

echo ""
echo "✅  Listo: deploy/$ZIP_NAME"
echo "   Comparte ese archivo con los usuarios finales."
