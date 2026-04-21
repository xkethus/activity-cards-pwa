#!/bin/bash
# ──────────────────────────────────────────────────────────────
#  subir-netlify.command  —  Sube Activity Cards a Netlify
#  Doble clic para ejecutar (o clic derecho → Abrir la 1ª vez)
# ──────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC}  $1"; }
warn() { echo -e "${YELLOW}▶${NC}  $1"; }
err()  { echo -e "${RED}✗${NC}  $1"; exit 1; }

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Activity Cards → Netlify           ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

cd "$PROJECT_DIR" || err "No se encontró el directorio del proyecto"

# ── 1. Node / npm ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  warn "Node.js no encontrado. Instálalo desde https://nodejs.org y vuelve a correr este script."
  open "https://nodejs.org"
  exit 1
fi
ok "Node $(node -v) disponible"

# ── 2. Netlify CLI ────────────────────────────────────────────
warn "Verificando netlify CLI..."
if ! command -v netlify &>/dev/null; then
  warn "Instalando netlify CLI..."
  npm install -g netlify-cli
fi
ok "netlify CLI disponible"

# ── 3. Login (abre el navegador una sola vez) ─────────────────
if ! netlify status &>/dev/null; then
  warn "Iniciando sesión en Netlify..."
  echo "  Se abrirá el navegador. Inicia sesión (o crea cuenta gratis) y autoriza."
  echo ""
  netlify login
else
  ok "Ya autenticado en Netlify"
fi

# ── 4. Build ──────────────────────────────────────────────────
warn "Generando íconos PWA..."
npm run generate-pwa-assets

warn "Compilando proyecto..."
npm run build
ok "Build listo en dist/"

# ── 5. Deploy ─────────────────────────────────────────────────
warn "Subiendo a Netlify..."

# Si ya hay un site vinculado (.netlify/state.json) hace deploy directo
# Si no, crea un site nuevo y lo vincula al proyecto
if [ -f ".netlify/state.json" ]; then
  netlify deploy --prod --dir=dist
else
  netlify deploy --prod --dir=dist --message "Activity Cards — deploy inicial"
fi

# ── 6. Abrir la URL ───────────────────────────────────────────
echo ""
SITE_URL=$(netlify status --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('siteUrl',''))" 2>/dev/null)

if [ -n "$SITE_URL" ]; then
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║  ✅  ¡Listo!                                        ║"
  echo "  ║                                                      ║"
  printf "  ║  🌐  %s\n" "$SITE_URL"
  echo "  ║                                                      ║"
  echo "  ║  Abre esa URL en Chrome para instalar la PWA.        ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo ""
  open "$SITE_URL"
else
  echo "  ✅  Deploy completado. Busca la URL arriba (lines 'Website URL')."
fi
