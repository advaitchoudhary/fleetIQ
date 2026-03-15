#!/bin/sh
# FleetIQ backend entrypoint
# Runs migration first, then starts the server
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║    FleetIQ Backend Starting...       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Wait for MongoDB to be ready ────────────────────────────────────────────
echo "⏳ Waiting for MongoDB at $MONGO_URL..."
until node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 3000 })
  .then(() => { mongoose.disconnect(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   MongoDB not ready yet — retrying in 3s..."
  sleep 3
done
echo "✅ MongoDB is ready"
echo ""

# ── Run migration (idempotent — safe to run every startup) ──────────────────
echo "🔄 Running multi-tenant migration..."
node scripts/migrateToMultiTenant.js
echo ""

# ── Start the server ─────────────────────────────────────────────────────────
echo "🚀 Starting FleetIQ server on port ${PORT:-8000}..."
exec npx ts-node -r dotenv/config src/index.ts
