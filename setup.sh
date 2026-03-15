#!/usr/bin/env bash
# =============================================================================
# FleetIQ — One-Command Setup Script
# Run this after cloning the repo to get fully set up for local development.
#
# Usage:
#   chmod +x setup.sh && ./setup.sh
# =============================================================================

set -e  # Exit immediately on any error

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Colour

# ── Helpers ───────────────────────────────────────────────────────────────────
step()  { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
ok()    { echo -e "  ${GREEN}✔ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠ $1${NC}"; }
fail()  { echo -e "  ${RED}✘ $1${NC}"; exit 1; }
info()  { echo -e "  ${CYAN}→ $1${NC}"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║         FleetIQ — Dev Setup              ║"
echo "║  Fleet Management SaaS Platform          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Check prerequisites ───────────────────────────────────────────────
step "Checking prerequisites"

# Node.js
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install from https://nodejs.org (v18+ required)"
fi
NODE_VERSION=$(node -v)
ok "Node.js $NODE_VERSION"

# npm
if ! command -v npm &>/dev/null; then
  fail "npm is not installed. It comes with Node.js — reinstall Node."
fi
ok "npm $(npm -v)"

# MongoDB
MONGO_RUNNING=false
if command -v mongod &>/dev/null; then
  ok "mongod found: $(mongod --version | head -1)"
  # Try connecting
  if command -v mongosh &>/dev/null; then
    if mongosh --quiet --eval "db.runCommand({ping:1})" mongodb://localhost:27017 &>/dev/null 2>&1; then
      MONGO_RUNNING=true
      ok "MongoDB is running on localhost:27017"
    else
      warn "MongoDB is installed but not running."
    fi
  elif command -v mongo &>/dev/null; then
    if mongo --quiet --eval "db.runCommand({ping:1})" mongodb://localhost:27017 &>/dev/null 2>&1; then
      MONGO_RUNNING=true
      ok "MongoDB is running on localhost:27017"
    else
      warn "MongoDB is installed but not running."
    fi
  fi
else
  warn "mongod not found in PATH."
fi

if [ "$MONGO_RUNNING" = false ]; then
  echo ""
  echo -e "  ${YELLOW}Please start MongoDB before continuing:${NC}"
  echo -e "  ${CYAN}macOS (Homebrew):${NC}  brew services start mongodb-community"
  echo -e "  ${CYAN}Linux (systemd):${NC}   sudo systemctl start mongod"
  echo -e "  ${CYAN}Windows:${NC}           net start MongoDB"
  echo -e "  ${CYAN}Manual:${NC}            mongod --dbpath /data/db"
  echo ""
  read -p "  Press Enter once MongoDB is running, or Ctrl+C to exit..." _
  echo ""
fi

# ── Step 2: Install server dependencies ───────────────────────────────────────
step "Installing server dependencies"
cd server
npm install --legacy-peer-deps
# Ensure ts-node is available (needed to run TypeScript directly)
if ! npx ts-node --version &>/dev/null 2>&1; then
  info "Installing ts-node..."
  npm install --save-dev ts-node
fi
ok "Server dependencies installed"
cd ..

# ── Step 3: Install client dependencies ───────────────────────────────────────
step "Installing client dependencies"
cd client
npm install --legacy-peer-deps
ok "Client dependencies installed"
cd ..

# ── Step 4: Set up environment files ─────────────────────────────────────────
step "Setting up environment files"

# Server .env
if [ -f server/.env ]; then
  ok "server/.env already exists — skipping"
else
  if [ -f server/.env.example ]; then
    cp server/.env.example server/.env
    # Auto-generate a random JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/your_jwt_secret_here/$JWT_SECRET/" server/.env
    else
      sed -i "s/your_jwt_secret_here/$JWT_SECRET/" server/.env
    fi
    ok "server/.env created (JWT_SECRET auto-generated)"
    warn "Open server/.env and fill in EMAIL_USER, EMAIL_PASS, and Stripe keys when needed"
  else
    fail "server/.env.example not found. Please pull the latest code."
  fi
fi

# Client .env
if [ -f client/.env ]; then
  ok "client/.env already exists — skipping"
else
  if [ -f client/.env.example ]; then
    cp client/.env.example client/.env
    ok "client/.env created"
  else
    # Create it directly if example is missing
    echo "VITE_API_BASE_URL=http://localhost:8000/api" > client/.env
    ok "client/.env created"
  fi
fi

# ── Step 5: Verify MongoDB connection ─────────────────────────────────────────
step "Verifying MongoDB connection"
MONGO_URL=$(grep "^MONGO_URL=" server/.env | cut -d '=' -f2-)
info "Connecting to: $MONGO_URL"

node -e "
const mongoose = require('./server/node_modules/mongoose');
mongoose.connect('$MONGO_URL', { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('CONNECTED'); process.exit(0); })
  .catch(e => { console.log('FAILED: ' + e.message); process.exit(1); })
" && ok "MongoDB connection successful" || fail "Cannot connect to MongoDB at $MONGO_URL — is it running?"

# ── Step 6: Run multi-tenant migration ────────────────────────────────────────
step "Running multi-tenant migration"
info "This creates the default organization and links all existing data."
info "Safe to run multiple times — skips if already migrated."
echo ""

cd server
node scripts/migrateToMultiTenant.js
cd ..

echo ""
ok "Migration complete"

# ── Step 7: Show summary ───────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅  Setup Complete! You're ready to code.  ${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo ""
echo -e "${BOLD}Start the servers:${NC}"
echo ""
echo -e "  ${CYAN}Terminal 1 — Backend:${NC}"
echo -e "  cd server && npx ts-node -r dotenv/config src/index.ts"
echo ""
echo -e "  ${CYAN}Terminal 2 — Frontend:${NC}"
echo -e "  cd client && npm run dev"
echo ""
echo -e "${BOLD}Then open:${NC} ${CYAN}http://localhost:5173${NC}"
echo ""
echo -e "${BOLD}Default login:${NC}"
echo -e "  Role:     ${CYAN}Admin${NC}"
echo -e "  Email:    ${CYAN}admin@gmail.com${NC}"
echo -e "  Password: ${CYAN}admin123${NC}"
echo ""
echo -e "${YELLOW}${BOLD}Next steps before going live:${NC}"
echo -e "  1. Add real email credentials to ${CYAN}server/.env${NC} (EMAIL_USER, EMAIL_PASS)"
echo -e "  2. Add Stripe keys to ${CYAN}server/.env${NC} (STRIPE_SECRET_KEY + Price IDs)"
echo -e "  3. Register webhook endpoints in Stripe Dashboard"
echo ""
