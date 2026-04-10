# FleetIQ — Feature Plan
## Hardware Telematics Integration + IFTA Mileage Reporting
### Branch: `telematics-IFTA`

---

## Overview

| Feature | What it does | Who benefits |
|---------|-------------|-------------|
| **Hardware Telematics** | Pulls real GPS from Geotab / Samsara OBD-II devices every 5 min — works 24/7 without driver opening the app | Fleet admins, dispatchers |
| **IFTA Reporting** | Auto-generates quarterly fuel tax reports per jurisdiction from existing GPS trip data + fuel logs | Company admins, accountants |

---

## Feature 1: Hardware Telematics Integration

### How it works
Each organization chooses an integration type: **Browser GPS** (default, existing), **Geotab**, or **Samsara**.

When hardware is configured, a server-side cron runs every 5 minutes, polls the provider API, and writes position data into the exact same models the browser GPS uses (`Vehicle.lastLocation` + `Location.coordinates[]`). The admin live map (`/tracking`) works without any changes.

### Data Flow
```
Admin UI → POST /api/telematics/devices (pair device + credentials)
                    ↓
Server cron (every 5 min) → GeotabClient / SamsaraClient
                    ↓
Normalize: { vehicleId, lat, lng, speed, odometer, timestamp }
                    ↓
Vehicle.lastLocation (overwrite) + Location.coordinates[] (append if trip active)
                    ↓
GET /api/tracking/live → Admin map (no changes needed)
```

### New Files to Create

| File | Purpose |
|------|---------|
| `server/model/telematicsDeviceModel.js` | Stores device pairings (encrypted credentials) |
| `server/utils/credentialCrypto.js` | AES-256-GCM encrypt/decrypt using JWT_SECRET (Node.js `crypto`, no new packages) |
| `server/utils/geotabClient.js` | Geotab JSON-RPC API client — `authenticate()` + `getPositions()` |
| `server/utils/samsaraClient.js` | Samsara REST API client — `getPositions()` |
| `server/utils/telematicsAdapter.js` | Unified `pollAllDevices()` — calls both providers, normalizes output, writes to DB |
| `server/controller/telematicsController.js` | `pairDevice`, `testConnection`, `getOrgDevices`, `unpairDevice`, `syncNow` |
| `server/routes/telematicsRoute.js` | Express router, gated by `requireVehicleModule` |

### Files to Modify

| File | Change |
|------|--------|
| `server/model/organizationModel.js` | Add `integrationType: enum["browser","geotab","samsara"], default: "browser"` |
| `server/model/vehicleModel.js` | Add `telematicsSource: enum["none","browser","geotab","samsara"], default: "none"` |
| `server/src/index.ts` | Import + register `/api/telematics` route; add 5-min `setInterval` calling `pollAllDevices()` |
| `server/package.json` | Add `axios` (for HTTP calls to provider APIs) |
| `client/src/pages/Vehicles.tsx` | Add "Connect Device" button per vehicle row + inline `TelematicsModal` component |
| `client/src/pages/Tracking.tsx` | Show GPS source badge in vehicle marker popup |

### TelematicsDevice Model Schema
```js
organizationId   ObjectId   ref: "Organization"   required
vehicleId        ObjectId   ref: "Vehicle"         required
provider         String     enum: ["geotab","samsara"]   required
deviceSerial     String     required
  // Geotab: device serial number
  // Samsara: Samsara vehicle ID
credentials      String     required   // AES-256-GCM encrypted JSON string
  // Geotab:  { server, database, username, password }
  // Samsara: { apiToken }
lastSync         Date       null
lastError        String     null
isActive         Boolean    true
```

### API Routes
```
POST   /api/telematics/devices           → pairDevice     (admin/company_admin)
POST   /api/telematics/test              → testConnection  (admin/company_admin)
GET    /api/telematics/devices           → getOrgDevices   (admin/company_admin/dispatcher)
DELETE /api/telematics/devices/:id       → unpairDevice    (admin/company_admin)
POST   /api/telematics/devices/:id/sync  → syncNow         (admin/company_admin)
```

### Geotab Integration Details
- API endpoint: `POST https://<server>.geotab.com/apiv1`
- Auth method: JSON-RPC `Authenticate` call → returns `credentials.sessionId`
- Position method: `Get` with `typeName: "DeviceStatusInfo"` → returns lat/lng/speed/odometer per device
- Sessions cached per org (5-min TTL) to avoid re-auth on every poll
- Server URL examples: `my.geotab.com`, `my3.geotab.com` (customer-specific)

### Samsara Integration Details
- API endpoint: `GET https://api.samsara.com/fleet/vehicles/locations`
- Auth: `Authorization: Bearer <apiToken>` header
- Response: array of `{ id, location: { latitude, longitude, speedMilesPerHour, heading } }`
- No session management needed — token-based

### UI: Connect Device Modal (in Vehicles.tsx)
```
Provider: [ Geotab ▼ | Samsara ]

[If Geotab selected]
  Server URL:  [my.geotab.com    ]
  Database:    [                 ]
  Username:    [                 ]
  Password:    [                 ]

[If Samsara selected]
  API Token:   [                 ]
  Vehicle ID:  [                 ]

[ Test Connection ]  [ Save & Pair ]
```

---

## Feature 2: IFTA Mileage Reporting

### What IFTA is
Interstate carriers (26,000+ lbs or 3+ axles operating across states) must file quarterly reports showing miles driven in each state/province and fuel purchased per jurisdiction. FleetIQ generates this automatically from existing GPS trip data + fuel logs.

### How it works
```
Admin selects: Quarter + Year + Vehicle (optional)
      ↓
Load all completed Location documents for the period
      ↓
For each coordinate pair → detect state/province via HERE Geocoding API
  (cached by 1km² grid cell — reduces API calls by ~85% on highway)
      ↓
Haversine sum per jurisdiction (reuses existing haversineDistance() logic)
      ↓
Join with FuelLog entries grouped by state
      ↓
Apply static IFTA tax rates per jurisdiction
      ↓
Return table: Jurisdiction | Miles | Fuel Purchased | Tax Rate | Net Tax
      ↓
Optional: Download as PDF (PDFKit, same pattern as timesheet invoices)
```

### New Files to Create

| File | Purpose |
|------|---------|
| `server/utils/hereGeocode.js` | HERE Geocoding API wrapper; in-memory LRU cache (max 10k entries) |
| `server/utils/iftaTaxRates.js` | Static JSON — 48 US states + 10 CA provinces with current rates |
| `server/controller/iftaController.js` | `generateReport()` + `downloadPDF()` |
| `server/routes/iftaRoute.js` | Express router |
| `client/src/pages/IFTA.tsx` | Report UI page |

### Files to Modify

| File | Change |
|------|--------|
| `server/model/fuelLogModel.js` | Add `state: { type: String, default: null }` — jurisdiction where fuel was purchased |
| `server/src/index.ts` | Import + register `/api/ifta` route; warn if `HERE_API_KEY` missing |
| `client/src/App.tsx` | Add `<Route path="/ifta" ... />` |
| `client/src/pages/Navbar.tsx` | Add "IFTA Reports" link in admin sidebar |
| `server/.env.example` | Add `HERE_API_KEY=<from developer.here.com>` |

### API Routes
```
GET  /api/ifta/report      ?quarter=Q1&year=2026&vehicleId=<optional>  → JSON report
GET  /api/ifta/report/pdf  ?quarter=Q1&year=2026&vehicleId=<optional>  → PDF download
```
Both routes: `protect`, `authorizeRoles("admin","company_admin","dispatcher")`, `requireVehicleModule`.

### HERE Geocoding API Setup
1. Sign up at [developer.here.com](https://developer.here.com) (free: 250k requests/month)
2. Create project → API Keys → copy key
3. Add to `server/.env`: `HERE_API_KEY=<your_key>`
4. Endpoint: `GET https://revgeocode.search.hereapi.com/v1/revgeocode?at=<lat>,<lng>&apiKey=<key>`
5. Extract: `items[0].address.stateCode` (US) or `items[0].address.county` (Canada)

### Geocoding Cache Strategy
```
Key:   "${lat.toFixed(2)}_${lng.toFixed(2)}"   // ~1km² cell
Value: "NY"  |  "ON"  |  "QC"  etc.

Cache hits:
  - Highway driving — consecutive coords in same cell → 1 call per ~1km
  - A 10-hour highway trip (~800km) → ~100–200 API calls (not 1,200)
  - 10 vehicles/quarter → ~2,000 calls — well within 250k free tier

Cache size: max 10,000 entries (covers ~10,000km² road network)
```

### IFTA Report JSON Structure
```json
{
  "period": "Q1 2026",
  "generatedAt": "2026-04-09T...",
  "jurisdictions": [
    {
      "code": "ON",
      "name": "Ontario",
      "milesDriven": 1240.5,
      "fuelPurchasedLitres": 180.0,
      "taxRatePerLitre": 0.143,
      "netTaxDue": 25.74
    },
    ...
  ],
  "totals": {
    "milesDriven": 4820.3,
    "fuelPurchasedLitres": 720.0,
    "netTaxDue": 142.30
  }
}
```

### IFTA.tsx UI Layout
```
IFTA Quarterly Report
─────────────────────────────────────────
Quarter: [Q1 ▼]  Year: [2026 ▼]  Vehicle: [All Vehicles ▼]
                                              [ Generate Report ]

Loading... (geocoding coordinates)

┌─────────────────────────────────────────────────────────────┐
│ Jurisdiction │ Miles Driven │ Fuel (L) │ Tax Rate │ Tax Due  │
├─────────────────────────────────────────────────────────────┤
│ Ontario      │ 1,240.5      │ 180.0    │ $0.143   │ $25.74   │
│ New York     │ 890.2        │ 120.0    │ $0.403   │ $48.36   │
│ ...          │              │          │          │          │
├─────────────────────────────────────────────────────────────┤
│ TOTAL        │ 4,820.3      │ 720.0    │ —        │ $142.30  │
└─────────────────────────────────────────────────────────────┘

                                        [ Download PDF Report ]
```

### FuelLog `state` field — Backfilling
Existing fuel logs without a `state` value are excluded from IFTA fuel totals (miles are still counted from GPS). Admins can edit existing fuel logs to add the state retroactively. The field is optional in the schema — no migration required.

---

## Environment Variables Required

| Variable | Feature | Source |
|----------|---------|--------|
| `HERE_API_KEY` | IFTA geocoding | [developer.here.com](https://developer.here.com) — free 250k/mo |

No new env vars for telematics — credentials stored AES-encrypted in MongoDB per org.

---

## New npm Package

| Package | Where | Why |
|---------|-------|-----|
| `axios` | `server/package.json` | HTTP calls to Geotab JSON-RPC + Samsara REST APIs |

---

## Build Order

```
Feature 1 (Telematics):
  credentialCrypto.js
  → telematicsDeviceModel.js
  → geotabClient.js + samsaraClient.js
  → telematicsAdapter.js
  → telematicsController.js + telematicsRoute.js
  → index.ts (route + cron)
  → Vehicles.tsx (UI) + Tracking.tsx (badge)

Feature 2 (IFTA):
  hereGeocode.js
  → iftaTaxRates.js
  → iftaController.js + iftaRoute.js
  → index.ts (route)
  → IFTA.tsx + App.tsx + Navbar.tsx
```

---

## Testing

### Telematics
- Use Geotab MyAdmin demo sandbox at `demo.geotab.com` (free demo account, test devices)
- Use Samsara API sandbox (sandbox tokens at `cloud.samsara.com`)
- Pair a test device → wait 5 min → check `/api/tracking/live` for updated `lastLocation`
- Verify `telematicsSource` field on vehicle is set to provider name

### IFTA
- Add several fuel logs with `state` field filled
- Ensure Location documents exist for the quarter being tested
- Call `GET /api/ifta/report?quarter=Q1&year=2026` → verify JSON structure
- Download PDF → verify standard IFTA layout
- Test with zero fuel logs → should still show miles per jurisdiction (just no fuel data)

---

## Competitive Impact
After both features, FleetIQ directly competes with **Fleetio** ($4–10/vehicle/month) with meaningful advantages:
- Driver payments (Stripe Connect) — Fleetio doesn't have this
- Integrated timesheets — Fleetio requires third-party
- IFTA auto-reporting — Fleetio charges extra
- Multi-tenant SaaS architecture — Fleetio is single-tenant
- Pricing opportunity: **$15–25/vehicle/month**
