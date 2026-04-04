#!/bin/bash
set -e

APP_DIR=/var/www/fleet-management
WEB_ROOT=/var/www/html

cd "$APP_DIR"

git reset --hard
git pull

# --- Frontend ---
cd "$APP_DIR/client"
npm install --legacy-peer-deps
npm run build
rm -rf "$WEB_ROOT"/*
cp -r dist/* "$WEB_ROOT"/

# --- Nginx ---
nginx -t && systemctl reload nginx

# --- Backend ---
cd "$APP_DIR/server"
npm install --legacy-peer-deps
npm install --save-dev typescript
npm run build

# --- PM2 ---
pm2 delete fleet-api 2>/dev/null || true
pm2 start dist/index.js --name fleet-api
pm2 save
pm2 startup

pm2 ls
