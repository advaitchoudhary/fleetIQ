# FleetIQ — Production Readiness Checklist

Last reviewed: 2026-03-25

---

## SECURITY

- [ ] **Add rate limiting** — No brute-force protection on login, registration, password endpoints (`npm install express-rate-limit`)
- [ ] **Remove hardcoded CORS origins** — AWS IP `3.13.233.198` and local IPs hardcoded in `server/src/index.ts`; use env vars
- [ ] **Remove API key from `.env.example`** — Resend key committed there; replace with `re_REPLACE_ME`
- [ ] **Remove JWT fallback secret** — `docker-compose.yml` exposes a fallback `fleetiq_dev_secret_change_in_production`
- [ ] **Add input validation** — No validation library (joi/zod) on any API endpoints; raw `req.body` goes straight to DB
- [ ] **Encrypt sensitive fields** — SIN numbers and bank account details stored as plaintext in MongoDB
- [ ] **Add CSRF protection** — POST/PUT/DELETE endpoints have no CSRF defense

---

## AUTH & USERS

- [ ] **Password reset flow** — No forgot-password / email recovery exists; users are permanently locked out if they forget their password
- [ ] **Email verification on registration** — Anyone can register with any email without verifying ownership
- [ ] **Rate limit driver login** — `POST /drivers/login` has zero brute-force protection
- [ ] **Protect username check endpoint** — `GET /drivers/check` is unauthenticated; allows username enumeration

---

## DATABASE

- [ ] **Add index on `User.email`** — Every login does a full collection scan; no index exists
- [ ] **Add index on `Driver.organizationId`** — Core multi-tenant query field, no index
- [ ] **Add index on `Timesheet.organizationId` + `driver`** — High-volume query fields with no index
- [ ] **Add compound unique index on `Driver.organizationId + email`** — Prevent duplicate drivers across orgs

---

## INFRASTRUCTURE / DEVOPS

- [ ] **Fix Docker frontend build** — Currently runs `npm run dev` in production container; must use `npm run build` + serve static files
- [ ] **Add health check endpoint** — No `GET /health` endpoint; required for load balancers and container orchestration
- [ ] **Replace console.log with structured logger** — Install `winston` or `pino`; console.log is not suitable for production
- [ ] **Set `NODE_ENV=production`** — Not set anywhere in docker-compose; affects cookie security and error verbosity
- [ ] **Use secret management** — Secrets passed as plain env vars; use AWS Secrets Manager / Docker Secrets in prod
- [ ] **Database backup strategy** — No MongoDB backup/snapshot workflow documented or automated
- [ ] **Set up monitoring/alerting** — No uptime monitoring, no error tracking (Sentry), no performance monitoring

---

## MISSING CORE FEATURES

- [ ] **Password reset** — Repeated from Auth; critical enough to list twice
- [ ] **Audit logging** — No record of who changed what when; essential for regulated trucking industry
- [ ] **Driver license expiry alerts** — License expiry is stored but no automated email reminder is sent
- [x] **Timesheet export** — Excel/XLSX export implemented in `AllTimesheets.tsx`
- [x] **Drivers export** — Excel/XLSX export implemented in `Drivers.tsx`
- [x] **Vehicles export** — Excel/XLSX export implemented in `Vehicles.tsx`
- [x] **Fuel logs export** — Excel/XLSX export implemented in `FuelLogs.tsx`
- [x] **Maintenance history export** — Excel/XLSX export implemented in `Maintenance.tsx`
- [x] **Cost tracking export** — Tab-aware Excel/XLSX export implemented in `CostTracking.tsx`
- [ ] **Hours-of-service (HOS) tracking** — Federally mandated for commercial trucking in Canada/US
- [ ] **IFTA fuel tax reporting** — Required for interstate/interprovincial trucking
- [ ] **SMS notifications** — Time-sensitive alerts need SMS, not just email

---

## COMPLIANCE & LEGAL

- [ ] **GDPR right-to-deletion** — Privacy policy mentions GDPR but no data deletion endpoint exists
- [ ] **GDPR data export** — No endpoint for users to download their own data
- [ ] **Cookie consent banner** — App uses cookies but shows no consent notice (required in EU/Canada)
- [ ] **Data retention policy** — No automated deletion of inactive accounts/data

---

## NICE TO HAVE (Post-Launch)

- [ ] Remove all `console.log` statements from frontend components (Drivers.tsx, AllTimesheets.tsx, etc.)
- [ ] Add CI/CD deployment pipeline (currently only runs checks, doesn't deploy)
- [ ] Analytics dashboard (utilization rates, cost per km, driver performance)
- [ ] ELD (Electronic Logging Device) integration
- [ ] Mobile app / PWA for drivers

---

## Progress Snapshot

| Area | Status | Last Updated |
|---|---|---|
| Core product (drivers, vehicles, timesheets, billing) | 80% | 2026-03-25 |
| Security hardening | 40% | 2026-03-25 |
| Compliance | 20% | 2026-03-25 |
| DevOps / infrastructure | 50% | 2026-03-25 |
| Trucking-specific features | 30% | 2026-03-25 |

---

## Absolute Blockers Before First Paying Customer

1. **Password reset flow** — users will get locked out
2. **Rate limiting on login** — will get bot-attacked immediately
3. **Fix Docker production build** — currently serving a Vite dev server to production users
