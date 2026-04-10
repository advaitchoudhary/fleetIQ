# FleetIQ Deployment Checklist
## Target: fleetiqlogistics.com — Hetzner CPX22 (€5.99/mo)

---

## Pre-Deploy Code Fixes (Do Before Provisioning Server)

- [ ] **`server/.env.example`** — Replace real Resend API key with placeholder `re_REPLACE_ME`
- [ ] **`client/src/pages/FileDriverApplication.tsx` line 491** — Replace `admin@premierchoicemployment.ca` with `admin@fleetiqlogistics.com`
- [ ] **Commit and push** both fixes to `main` branch

> Already done: CORS updated, nginx config updated, build.sh cleaned up.

---

## Step 1 — Provision Hetzner Server

- [ ] Go to [hetzner.com/cloud](https://hetzner.com/cloud) → Create Server
- [ ] Select: **Regular Performance → CPX22**
- [ ] OS: **Ubuntu 22.04 LTS**
- [ ] Region: **ASH** (US East) or closest to your users
- [ ] Add your SSH public key
- [ ] Note the **public IP address** → `___________________`

---

## Step 2 — DNS Records

In your domain registrar for `fleetiqlogistics.com`:

- [ ] Add `A` record: `@` → `<VPS-IP>` (TTL: 300)
- [ ] Add `A` record: `www` → `<VPS-IP>` (TTL: 300)
- [ ] Wait 5–30 min, then verify: `dig fleetiqlogistics.com` returns VPS IP

---

## Step 3 — Update Nginx Config with Real IP

In `nginx-conf/fleet`, replace `<YOUR_VPS_IP>` on **lines 4 and 16** with the real IP:

- [ ] Line 4: `server_name <VPS-IP> fleetiqlogistics.com www.fleetiqlogistics.com;`
- [ ] Line 16: `server_name <VPS-IP>;`
- [ ] Commit and push to `main`

---

## Step 4 — Server Setup (SSH in as root)

```bash
# OS update
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# Nginx + Certbot + PM2
apt install -y nginx certbot python3-certbot-nginx
npm install -g pm2

# App directories
mkdir -p /var/www/fleet-management /var/www/html
```

Checklist:
- [ ] Node.js 20 installed (`node -v`)
- [ ] MongoDB running (`systemctl status mongod`)
- [ ] Nginx installed (`nginx -v`)
- [ ] PM2 installed (`pm2 -v`)

---

## Step 5 — Clone Repo & Create .env Files

```bash
cd /var/www
git clone https://github.com/<your-repo>/fleetIQ fleet-management
```

Create `server/.env` (this file is never committed to git):

```bash
cat > /var/www/fleet-management/server/.env << 'EOF'
PORT=8000
NODE_ENV=production
MONGO_URL=mongodb://localhost:27017/FleetManagement
JWT_SECRET=<run: openssl rand -hex 32>
CLIENT_URL=https://fleetiqlogistics.com
RESEND_API_KEY=<get from resend.com — generate a fresh key>
EMAIL_FROM=FleetIQ <noreply@fleetiqlogistics.com>
EOF
```

Create `client/.env` (used only at build time):

```bash
echo "VITE_API_BASE_URL=https://fleetiqlogistics.com/api" \
  > /var/www/fleet-management/client/.env
```

- [ ] `server/.env` created with all values filled in
- [ ] `client/.env` created

---

## Step 6 — Build & Start App

```bash
bash /var/www/fleet-management/build.sh
```

Then run the one-time DB migration:

```bash
cd /var/www/fleet-management/server
node scripts/migrateToMultiTenant.js
```

- [ ] Build completed without errors
- [ ] `pm2 status` shows `fleet-api` as `online`
- [ ] Migration script ran successfully

---

## Step 7 — Configure Nginx

```bash
cp /var/www/fleet-management/nginx-conf/fleet /etc/nginx/sites-available/fleetiqlogistics
ln -s /etc/nginx/sites-available/fleetiqlogistics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

- [ ] `nginx -t` passes (no errors)
- [ ] Nginx reloaded

---

## Step 8 — SSL Certificate (Free via Let's Encrypt)

```bash
certbot --nginx -d fleetiqlogistics.com -d www.fleetiqlogistics.com
# When prompted: choose option 2 (redirect HTTP → HTTPS)
certbot renew --dry-run
```

- [ ] Certificate issued for `fleetiqlogistics.com` and `www.fleetiqlogistics.com`
- [ ] Dry-run renewal succeeded

---

## Step 9 — Verify Everything Works

- [ ] `https://fleetiqlogistics.com` → FleetIQ landing page loads
- [ ] `https://fleetiqlogistics.com/api/auth` → JSON response (not 404)
- [ ] Login: `admin@gmail.com` / `admin123` → redirects to `/select-org`
- [ ] Browser padlock → certificate shows `fleetiqlogistics.com`
- [ ] On server: `pm2 status` → `fleet-api` is `online`
- [ ] On server: `systemctl status mongod` → `active (running)`

---

## Post-Deploy: Before First Paying Customer

- [ ] Add rate limiting to `POST /api/auth/login` (package `express-rate-limit` already installed)
- [ ] Implement forgot-password / password reset flow
- [ ] Add `GET /api/health` endpoint for uptime monitoring
- [ ] Add MongoDB indexes on `email` and `organizationId` fields
- [ ] Set up Resend email domain verification for `fleetiqlogistics.com`

---

## Ongoing Redeploy (After Code Changes)

```bash
cd /var/www/fleet-management
git pull
cd client && npm run build && cp -r dist/* /var/www/html/
cd ../server && npm run build && pm2 restart fleet-api
```

---

## Monthly Cost Summary

| Service | Cost |
|---------|------|
| Hetzner CPX22 VPS | €5.99/month |
| MongoDB (self-hosted on VPS) | €0 |
| SSL — Let's Encrypt | €0 |
| Resend email (3k emails/month) | €0 |
| OpenStreetMap (vehicle tracking tiles) | €0 |
| **Total** | **€5.99/month** |
