#!/bin/bash
# ──────────────────────────────────────────────────────────────
#  setup-github.command  —  Sube Activity Cards a GitHub Pages
#  Doble clic para ejecutar (o clic derecho → Abrir la 1ª vez)
# ──────────────────────────────────────────────────────────────

REPO_NAME="activity-cards-pwa"
GITHUB_USER="xkethus"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Colores ───────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC}  $1"; }
warn() { echo -e "${YELLOW}▶${NC}  $1"; }
err()  { echo -e "${RED}✗${NC}  $1"; }

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Activity Cards → GitHub Pages      ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── 1. Verificar Homebrew ─────────────────────────────────────
warn "Verificando Homebrew..."
if ! command -v brew &>/dev/null; then
  warn "Instalando Homebrew (necesario para gh)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Agregar brew al PATH para Apple Silicon
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
fi
ok "Homebrew disponible"

# ── 2. Verificar / instalar gh CLI ───────────────────────────
warn "Verificando gh CLI..."
if ! command -v gh &>/dev/null; then
  warn "Instalando gh CLI..."
  brew install gh
fi
ok "gh CLI disponible ($(gh --version | head -1))"

# ── 3. Autenticación con GitHub ───────────────────────────────
if ! gh auth status &>/dev/null; then
  warn "Iniciando sesión en GitHub..."
  echo "  Se abrirá el navegador. Inicia sesión y autoriza gh."
  echo ""
  gh auth login --hostname github.com --git-protocol https --web
else
  ok "Ya autenticado en GitHub"
fi

# ── 4. Ir al proyecto ─────────────────────────────────────────
cd "$PROJECT_DIR" || { err "No se encontró el directorio del proyecto: $PROJECT_DIR"; exit 1; }
ok "Directorio: $PROJECT_DIR"

# ── 5. Crear repositorio en GitHub ───────────────────────────
warn "Creando repositorio $GITHUB_USER/$REPO_NAME en GitHub..."
if gh repo view "$GITHUB_USER/$REPO_NAME" &>/dev/null; then
  ok "El repositorio ya existe — continuando"
else
  gh repo create "$REPO_NAME" --public --source=. --remote=origin
  ok "Repositorio creado"
fi

# ── 6. Asegurar que el remote esté configurado ───────────────
if ! git remote get-url origin &>/dev/null; then
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi
ok "Remote origin configurado"

# ── 7. Commit inicial si hay cambios ─────────────────────────
if [[ -n $(git status --porcelain) ]]; then
  warn "Hay cambios sin commitear — haciendo commit..."
  git add -A
  git commit -m "deploy: configuración GitHub Pages + workflow CI/CD"
  ok "Commit creado"
fi

# ── 8. Push ───────────────────────────────────────────────────
warn "Subiendo código a GitHub..."
git push -u origin master
ok "Código subido"

# ── 9. Activar GitHub Pages (deploy desde Actions) ───────────
warn "Activando GitHub Pages..."
gh api "repos/$GITHUB_USER/$REPO_NAME/pages" \
  --method POST \
  -f build_type=workflow 2>/dev/null \
  || gh api "repos/$GITHUB_USER/$REPO_NAME/pages" \
       --method PUT \
       -f build_type=workflow 2>/dev/null \
  || warn "Pages ya estaba activo o se activa solo con el primer deploy"

# ── 10. Esperar el deploy ─────────────────────────────────────
echo ""
warn "Esperando que GitHub Actions haga el deploy..."
echo "  (esto tarda ~1 minuto)"
echo ""
sleep 5
gh run watch --repo "$GITHUB_USER/$REPO_NAME" || true

# ── Listo ─────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║  ✅  ¡Listo!                                        ║"
echo "  ║                                                      ║"
printf "  ║  🌐  https://%s.github.io/%s/\n" "$GITHUB_USER" "$REPO_NAME"
echo "  ║                                                      ║"
echo "  ║  Abre esa URL en Chrome para instalar la PWA.        ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

open "https://$GITHUB_USER.github.io/$REPO_NAME/"
