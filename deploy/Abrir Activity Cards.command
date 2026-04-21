#!/bin/bash
# ──────────────────────────────────────────────────────────────
#  Abrir Activity Cards.command
#  Doble clic para abrir la aplicación en Chrome e instalarla.
# ──────────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$DIR/app"
PORT=8743

# ── Verificar que la carpeta app existe ───────────────────────
if [ ! -d "$APP_DIR" ]; then
  osascript -e 'display alert "No se encontró la carpeta app." message "Asegúrate de extraer el ZIP completo antes de abrir este archivo." as critical'
  exit 1
fi

# ── Verificar Python 3 ────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  osascript -e 'display alert "Python 3 no encontrado." message "Esta aplicación necesita Python 3. Instálalo desde python.org e inténtalo de nuevo." as critical'
  exit 1
fi

# ── Matar cualquier servidor previo en el mismo puerto ────────
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null || true

# ── Iniciar servidor local ────────────────────────────────────
cd "$APP_DIR"
python3 -m http.server $PORT --bind 127.0.0.1 &>/dev/null &
SERVER_PID=$!

# Esperar a que el servidor esté listo
for i in {1..10}; do
  if curl -s "http://localhost:$PORT" &>/dev/null; then
    break
  fi
  sleep 0.3
done

# ── Abrir Chrome ──────────────────────────────────────────────
URL="http://localhost:$PORT"

if [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" "$URL"
elif [ -d "/Applications/Google Chrome Canary.app" ]; then
  open -a "Google Chrome Canary" "$URL"
else
  # Fallback: navegador por defecto (Safari también puede instalar PWAs en macOS 14+)
  open "$URL"
fi

# ── Mantener servidor vivo ────────────────────────────────────
echo ""
echo "  Activity Cards está corriendo en $URL"
echo "  ► Instala la app desde Chrome: menú (⋮) → 'Instalar Activity Cards'"
echo "  ► Una vez instalada no necesitas volver a abrir este script."
echo "  ► Cierra esta ventana para apagar el servidor."
echo ""

wait $SERVER_PID
