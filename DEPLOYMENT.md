# FleetIQ — Production Deployment Guide

## Overview

| Item | Value |
|------|-------|
| Server | Hetzner CPX11 (2 vCPU, 2 GB RAM, 40 GB SSD) |
| Location | Hillsboro, OR (us-west) |
| OS | Ubuntu 24.04 LTS |
| Server IP | 5.78.218.253 |
| Domain | fleetiqlogistics.com |
| Stack | Nginx → PM2 (Node.js) → MongoDB (localhost) |

---

## Architecture

```
Browser
  └─ https://fleetiqlogistics.com
       └─ Nginx (443/80)
            ├─ /api/*  → proxy → localhost:8000 (PM2 / Node.js)
            ├─ /uploads/* → proxy → localhost:8000/uploads/
            └─ /*      → /var/www/html (React static build)
```

---

## First-Time Setup

### 1. Create Hetzner Server

1. Go to [console.hetzner.com](https://console.hetzner.com)
2. Create server with:
   - **Type:** CPX11 (upgrade to CPX21 when going live with real users)
   - **Location:** Hillsboro, OR (us-west)
   - **Image:** Ubuntu 24.04
   - **Name:** `fleetiq-prod`
3. Note the public IPv4 address

### 2. Point DNS

In your IONOS DNS panel for `fleetiqlogistics.com`:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `5.78.218.253` | 300 |
| A | `www` | `5.78.218.253` | 300 |

### 3. SSH Into Server

```bash
ssh root@5.78.218.253
```

### 4. Install Dependencies

```bash
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl enable mongod && systemctl start mongod

# Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx && systemctl start nginx

# PM2
npm install -g pm2

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 27017/tcp
ufw --force enable
```

### 5. Clone Repo

```bash
git clone https://github.com/advaitchoudhary/fleetIQ /var/www/fleet-management
mkdir -p /var/www/fleet-management/server/uploads
```

### 6. Create Production .env

```bash
cat > /var/www/fleet-management/server/.env << 'EOF'
PORT=8000
NODE_ENV=production
MONGO_URL=mongodb://localhost:27017/FleetManagement
JWT_SECRET=<generate with: openssl rand -hex 32>
CLIENT_URL=https://fleetiqlogistics.com
RESEND_API_KEY=<your resend key>
EMAIL_FROM=FleetIQ <noreply@fleetiqlogistics.com>
STRIPE_SECRET_KEY=<your stripe key>
STRIPE_WEBHOOK_SECRET=<your webhook secret>
STRIPE_CONNECT_WEBHOOK_SECRET=<your connect webhook secret>
STRIPE_PRICE_DRIVER_MONTHLY=<price id>
STRIPE_PRICE_DRIVER_ANNUAL=<price id>
STRIPE_PRICE_VEHICLE_MONTHLY=<price id>
STRIPE_PRICE_VEHICLE_ANNUAL=<price id>
STRIPE_PRICE_BUNDLE_MONTHLY=<price id>
STRIPE_PRICE_BUNDLE_ANNUAL=<price id>
HERE_API_KEY=<your here api key>
OPENAI_API_KEY=<your openai key>
EOF
```

### 7. Set Up Nginx (HTTP only first)

```bash
cat > /etc/nginx/sites-available/fleetiq << 'EOF'
server {
    listen 80;
    server_name fleetiqlogistics.com www.fleetiqlogistics.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://localhost:8000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/fleetiq /etc/nginx/sites-enabled/fleetiq
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 8. Get SSL Certificate

DNS must be propagated before running this:

```bash
certbot --nginx -d fleetiqlogistics.com -d www.fleetiqlogistics.com \
  --non-interactive --agree-tos -m dvtchoudhary@gmail.com
```

### 9. Update Nginx with Full SSL Config

```bash
cat > /etc/nginx/sites-available/fleetiq << 'EOF'
server {
    listen 80;
    server_name fleetiqlogistics.com www.fleetiqlogistics.com;
    return 301 https://fleetiqlogistics.com$request_uri;
}

server {
    listen 443 ssl;
    server_name www.fleetiqlogistics.com;

    ssl_certificate /etc/letsencrypt/live/fleetiqlogistics.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fleetiqlogistics.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://fleetiqlogistics.com$request_uri;
}

server {
    listen 443 ssl;
    server_name fleetiqlogistics.com;

    ssl_certificate /etc/letsencrypt/live/fleetiqlogistics.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fleetiqlogistics.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://localhost:8000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
EOF

nginx -t && systemctl reload nginx
```

### 10. Build and Start App

```bash
chmod +x /var/www/fleet-management/build.sh
bash /var/www/fleet-management/build.sh
```

### 11. Create Initial Admin User

```bash
cd /var/www/fleet-management/server
node scripts/createAdminUser.js
```

Default credentials: `admin@gmail.com` / `admin123` — **change password after first login.**

---

## Future Deploys

SSH in and run one command:

```bash
bash /var/www/fleet-management/build.sh
```

This will:
1. `git pull` latest from main
2. Rebuild frontend → copy to `/var/www/html`
3. Rebuild backend TypeScript → `dist/`
4. Restart PM2 process

---

## Useful Commands

```bash
# Check app status
pm2 ls

# View live logs
pm2 logs fleet-api --lines 50

# Restart app
pm2 restart fleet-api

# Check nginx status
systemctl status nginx

# Test nginx config
nginx -t

# Check MongoDB
systemctl status mongod

# Check firewall
ufw status
```

---

## Upgrading Server (when you get real users)

1. Go to Hetzner Console → `fleetiq-prod` → **Resize**
2. Power off the server
3. Select **CPX21** (4 GB RAM, 80 GB SSD, $13.99/mo)
4. Power back on — same IP, same data, ~5 min downtime

---

## Going Live Checklist

- [ ] Change `admin@gmail.com` password
- [ ] Switch Stripe test keys to live keys in `.env`
- [ ] Add `STRIPE_CONNECT_WEBHOOK_SECRET` to `.env`
- [ ] Update Stripe webhook URLs to `https://fleetiqlogistics.com/api/subscriptions/webhook`
- [ ] Verify `fleetiqlogistics.com` domain on [resend.com/domains](https://resend.com/domains) for email delivery
- [ ] Update `EMAIL_FROM` to `FleetIQ <noreply@fleetiqlogistics.com>`
- [ ] Upgrade server to CPX21
