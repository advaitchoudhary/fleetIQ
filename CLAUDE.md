# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start (one command)
```bash
bash setup.sh          # installs deps, creates .env files, runs migration, prints default credentials
```

### Docker (recommended)
```bash
docker-compose up      # starts MongoDB + backend + frontend together
```

### Manual

**Backend** (`cd server`)
```bash
npm run dev            # ts-node + nodemon (hot reload)
npm run build          # tsc compile to dist/
npm start              # run compiled dist/index.js
```

**Frontend** (`cd client`)
```bash
npm run dev            # Vite dev server on port 5173
npm run build          # TypeScript check + Vite bundle
npm run lint           # ESLint
```

### Utility Scripts (`cd server`)
```bash
node scripts/migrateToMultiTenant.js   # one-time: assign all data to default org
node scripts/seedDemoData.js           # insert demo vehicles/maintenance/warranties/parts
```

Default dev credentials (created by setup.sh): `admin@gmail.com` / `admin123`

Platform admin (created manually): `platform@fleetiq.com` / `admin123` — role `admin`, no org scope, redirects to `/select-org` on login.

---

## Architecture

### Monorepo Layout
```
/server   Express + TypeScript API (port 8000)
/client   React + Vite SPA (port 5173)
```

The Vite dev server proxies `/api/*` → `http://localhost:8000`, so the frontend always calls `/api/...` relative URLs. The proxy target is `VITE_BACKEND_URL` (env var) or `http://localhost:8000`.

All API base URL references on the client go through `client/src/utils/env.ts` → `API_BASE_URL`.

### Backend Structure

`server/src/index.ts` is the entry point — it connects Mongoose, registers all routes, and serves the `uploads/` directory as static files.

The server follows a flat **route → controller → model** pattern. Every feature has:
- `routes/<name>Route.js` — Express router, applies `protect` + `authorizeRoles` middleware
- `controller/<name>Controller.js` — business logic
- `model/<name>Model.js` — Mongoose schema

**Auth middleware** (`server/middleware/authMiddleware.js`):
- `protect` — verifies JWT from `Authorization: Bearer <token>` header **or** `admin_token` cookie (fallback)
- `authorizeRoles(...roles)` — checks `req.user.role` against allowed roles
- `getOrgFilter(req)` — returns `{ organizationId }` scoped to the caller's org; `admin` with no org gets `{}` (sees all)

**Feature gate middleware** (`server/middleware/featureGate.js`):
- `requireDriverModule` / `requireVehicleModule` — subscription paywall guard; checks the org's plan includes the required module (`"driver"`, `"vehicle"`, or `"bundle"`). Blocks with 402 if subscription is inactive, 403 if plan doesn't cover the feature. `admin` role bypasses all gates.

### Multi-Tenancy

Every core model (`Vehicle`, `Maintenance`, `Warranty`, `Part`, `Driver`, etc.) has an `organizationId` field (ObjectId ref to `Organization`). All queries must be scoped using `getOrgFilter(req)`. The `Organization` model is the top-level tenant.

Roles and their access:
- `admin` — platform-wide, no org scope; logs in → `/select-org`; can switch into any org via `POST /api/auth/switch-org`; bypasses feature gates
- `company_admin` — org-scoped admin; logs in → `/admin-home`; all admin routes must accept both `"admin"` and `"company_admin"`
- `dispatcher` — limited admin access, org-scoped
- `driver` — driver portal only; authenticates via a separate driver login flow (not this server's `/api/auth`)

### Frontend Structure

`client/src/App.tsx` defines all routes. `ProtectedRoute` wraps admin routes and checks `AuthContext` for role.

`AuthContext` (`client/src/contexts/AuthContext.tsx`) stores the JWT in `localStorage` and sets `axios.defaults.headers.common["Authorization"]` on load. The `admin_token` cookie is set server-side on login for cookie-based auth fallback.

AuthContext exposes:
- `login()` — handles role-based redirect (`admin` → `/select-org`, `company_admin`/`dispatcher` → `/admin-home`, `driver` → `/dashboard`)
- `loginDirect(token, user)` — sets token + user directly (used by `CompanyRegister` after self-registration)
- `switchOrg(orgId, orgName)` — saves original token as `superadmin_token` in localStorage, exchanges for a scoped JWT via `POST /api/auth/switch-org`, navigates to `/admin-home`
- `exitOrg()` — restores original token, clears org context, navigates back to `/select-org`
- `isInsideOrg` / `activeOrgName` — derived from localStorage, used by Navbar to show the org context banner

### Org Onboarding & Admin Flows

**Company self-registration** (`/register` → `CompanyRegister.tsx`):
- Calls `POST /api/organizations/register` — creates org + `company_admin` user in one step, returns JWT
- No Stripe checkout on sign-up; org starts on a 14-day free trial automatically
- On success: logs user in via `loginDirect()` and navigates to `/admin-home`

**Platform admin org selector** (`/select-org` → `OrgSelector.tsx`):
- Only accessible to `admin` role
- Fetches all orgs from `GET /api/organizations/`
- Each card shows org name, email, subscription status badge, trial/renewal date, and an "Enter →" button
- "Enter →" calls `switchOrg()` — issues a scoped JWT with `organizationId` embedded so `getOrgFilter()` works normally
- Navbar shows a slim indigo banner "Viewing: \<orgName\>" with "← Back to Org List" while inside an org

Pages are self-contained — each page component owns its fetch logic, state, and modals. There are no shared data-fetching hooks.

### Stripe Integration

- **Stripe Connect** (`paymentRoute`, `paymentController`) — driver payouts
- **Stripe Billing** (`subscriptionRoute`, `subscriptionController`) — org subscriptions (Driver / Vehicle / Bundle plans, monthly + annual)
- Stripe webhooks require raw body; webhook routes use `express.raw()` per-route, registered **before** `bodyParser.json()`

### File Uploads

Multer saves files to `uploads/` (served statically). Driver application documents go to `uploads/driver-applications/`. The `uploadRoute` handles dispatch-related PDFs.

### Environment Variables

Copy `server/.env.example` → `server/.env` and `client/.env.example` → `client/.env`.

Key server vars: `MONGO_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `CLIENT_URL`, `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` (optional — email skipped if unset).

Key client var: `VITE_API_BASE_URL=http://localhost:8000/api`
