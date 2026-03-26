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

---

## Vehicle Tracking

### Overview

Vehicle tracking is a polling-based, browser-GPS feature with no WebSockets, no Redis, and no third-party telematics. MongoDB is the sole state store.

Two polling loops run independently at 30-second intervals:

1. **Driver push loop** — the driver's browser calls `POST /api/tracking/location` every 30 seconds with coordinates from the Web Geolocation API. Each ping updates `vehicle.lastLocation` (overwrite) and appends one entry to the `Location.coordinates[]` array (append-only for the current trip).
2. **Admin pull loop** — the admin map page calls `GET /api/tracking/live` every 30 seconds via `setInterval`. The response is all org vehicles with their current `lastLocation`; React state is set with the new array, which re-renders the map markers.

Polling was chosen over WebSockets because: no in-memory pub/sub infrastructure is needed, 30-second latency is acceptable for long-haul fleet tracking, MongoDB document updates are cheap, and the entire feature adds zero new server dependencies.

### Architecture

```
DRIVER BROWSER (Dashboard.tsx)
  └─ navigator.geolocation.getCurrentPosition()
       └─ POST /api/tracking/location (every 30s)
            └─ Express → trackingController.updateLocation()
                 ├─ Vehicle.findByIdAndUpdate  → vehicle.lastLocation (overwrite)
                 └─ Location.findByIdAndUpdate → coordinates[] $push

ADMIN BROWSER (Tracking.tsx)
  └─ setInterval(fetchLive, 30000)
       └─ GET /api/tracking/live
            └─ Express → trackingController.getLiveLocations()
                 └─ Vehicle.find(orgFilter).populate("assignedDriverId")
                      └─ JSON response → setVehicles() → map pins re-render
```

### Data Models

**`server/model/locationModel.js`** — one document per trip

```
organizationId   ObjectId  ref: "Organization"   required
vehicleId        ObjectId  ref: "Vehicle"         required
driverId         ObjectId  ref: "Driver"          required
tripStart        Date      default: Date.now
tripEnd          Date      default: null          (null = trip in progress)
totalDistance    Number    default: 0             (km, calculated at trip end via Haversine)
coordinates      [coordSchema]                    (append-only during trip)
```

`coordSchema` (subdocument, `_id: false`):

```
lat        Number   required
lng        Number   required
speed      Number   default: 0   (km/h)
timestamp  Date     default: Date.now
```

The `{ _id: false }` option on `coordSchema` suppresses subdocument `_id` generation, keeping the coordinates array lean.

**`server/model/vehicleModel.js` — `lastLocation` subdocument** (inline on the Vehicle document, not a ref)

```
lat        Number   default: null
lng        Number   default: null
speed      Number   default: null   (km/h)
timestamp  Date     default: null
isActive   Boolean  default: false  (true = trip currently in progress)
driverId   ObjectId ref: "Driver"   default: null
```

`lastLocation` is overwritten on every ping; it holds only the most recent position. Historical positions live in `Location.coordinates[]`.

### Backend Routes

All routes are registered at `/api/tracking` in `server/src/index.ts` after `bodyParser.json()`. No raw-body parsing is needed.

```
POST   /api/tracking/trips/start
  middleware: protect, authorizeRoles("driver")
  purpose:    creates a new Location document, marks vehicle.lastLocation.isActive = true

POST   /api/tracking/location
  middleware: protect, authorizeRoles("driver")
  purpose:    updates vehicle.lastLocation, appends coordinate to Location.coordinates[]

POST   /api/tracking/trips/:tripId/end
  middleware: protect, authorizeRoles("driver")
  purpose:    sets tripEnd timestamp, calculates totalDistance via Haversine, sets isActive = false

GET    /api/tracking/live
  middleware: protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireTrackingModule
  purpose:    returns all org vehicles with lastLocation + populated assignedDriverId

GET    /api/tracking/history/:vehicleId
  middleware: protect, authorizeRoles("admin", "company_admin", "dispatcher"), requireTrackingModule
  purpose:    returns last 20 completed trips for a vehicle, sorted by tripStart desc
```

Driver POST routes carry no feature gate — an active trip must never be interrupted by a subscription change mid-journey.

### Controller Functions

All five functions are in `server/controller/trackingController.js`.

**`startTrip(req, res)`**
- Validates that `vehicleId` is present in `req.body`; 400 if missing.
- Looks up the vehicle; 404 if not found.
- Closes any existing open trip for that vehicle by setting `tripEnd: new Date()` on any `Location` document where `{ vehicleId, tripEnd: null }` (prevents orphaned open trips).
- Creates a new `Location` document with `organizationId` from `req.organizationId`, `driverId` from `req.user.id`, empty `coordinates[]`, and `tripStart: new Date()`.
- Sets `vehicle.lastLocation.isActive = true` and `vehicle.lastLocation.driverId = driverId`.
- Returns `{ tripId, message }` with HTTP 201.

**`updateLocation(req, res)`**
- Validates `lat`, `lng`, `vehicleId`, `tripId` from `req.body`. The null-equality check (`lat == null`) deliberately allows coordinate value `0` (equator/prime meridian) to pass validation, unlike a falsy check.
- Builds a `coord` object `{ lat, lng, speed: speed || 0, timestamp: new Date() }`.
- Overwrites `vehicle.lastLocation` entirely (all six fields including `isActive: true` and `driverId`) via `Vehicle.findByIdAndUpdate`.
- Appends `coord` to `Location.coordinates[]` via `$push`.
- Returns `{ message }` with HTTP 200.

**`endTrip(req, res)`**
- Takes `tripId` from `req.params` and optional `vehicleId` from `req.body`.
- Loads the `Location` document; 404 if not found.
- Calculates `totalDistance` by passing `trip.coordinates` to `haversineDistance()`.
- Persists `tripEnd: new Date()` and `totalDistance` to the Location document.
- If `vehicleId` was provided, sets `vehicle.lastLocation.isActive = false`.
- Returns `{ message, totalDistance }` with HTTP 200.
- On error: state is NOT reset — the trip remains open so the driver can retry `endTrip`. The interval is also restored client-side on failure (see Dashboard section).

**`getLiveLocations(req, res)`**
- Calls `getOrgFilter(req)` for multi-tenant scoping.
- `Vehicle.find(orgFilter)` — selects `unitNumber make model type status lastLocation assignedDriverId`.
- `.populate("assignedDriverId", "name email")` so the map popup can show the driver's name.
- Returns the array as JSON.

**`getTripHistory(req, res)`**
- Takes `vehicleId` from `req.params`.
- Calls `getOrgFilter(req)` and spreads it into the query filter alongside `{ vehicleId, tripEnd: { $ne: null } }` — the `$ne: null` excludes any currently open trip.
- `.sort({ tripStart: -1 }).limit(20)` — most recent 20 completed trips.
- `.populate("driverId", "name email")` for display in the sidebar.
- Returns the array as JSON.

### Haversine Distance

`haversineDistance(coords)` in `trackingController.js` iterates over consecutive coordinate pairs and applies the Haversine formula using Earth's mean radius `R = 6371` km. It computes the great-circle distance between each pair of lat/lng points, sums them, and returns the total rounded to one decimal place (`Math.round(total * 10) / 10`). Returns `0` if fewer than two coordinates exist. This formula is appropriate because it accounts for Earth's curvature, which matters at the distances typical of long-haul trucking routes.

### Feature Gating

`requireTrackingModule` is defined in `server/middleware/featureGate.js` as:

```js
const requireTrackingModule = checkFeature("vehicle");
```

Tracking is bundled with the vehicle module — the same gate as `requireVehicleModule`. Access rules:

- Orgs on `"vehicle"` or `"bundle"` plan with `status: "active"` or `status: "trialing"` (and non-expired trial) can access all admin GET routes.
- Orgs on `"driver"`-only plan receive HTTP 403 with `code: "FEATURE_NOT_IN_PLAN"` on GET routes.
- Orgs with an expired subscription receive HTTP 402 with `code: "SUBSCRIPTION_INACTIVE"`.
- Driver POST routes (`/trips/start`, `/location`, `/trips/:tripId/end`) have no `requireTrackingModule` guard — active trips are never interrupted by subscription state.
- `admin` role bypasses all gates unconditionally.

### Multi-Tenancy

- `getLiveLocations` scopes `Vehicle.find()` with `getOrgFilter(req)` — each org sees only its own vehicles.
- `getTripHistory` spreads `getOrgFilter(req)` into the `Location.find()` query — each org sees only its own trip history (multi-tenancy fix applied here; without this, a dispatcher could fetch trips belonging to another org's vehicle if they knew the `vehicleId`).
- `organizationId` is stored on every `Location` document, set from `req.organizationId` in `startTrip`.
- Platform admin (role `"admin"`, no org scope) receives `{}` from `getOrgFilter`, so `getLiveLocations` returns all vehicles across all orgs.

### Frontend — Driver App (`client/src/pages/Dashboard.tsx`)

The tracking card is rendered inside the driver dashboard. It is hidden entirely when `assignedVehicle` is null.

**State:**
```
trackingActive       boolean          false = idle, true = trip in progress
tripId               string | null    Location document _id returned by startTrip
assignedVehicle      { _id, unitNumber } | null
lastPing             Date | null      timestamp of most recent successful ping
tripStart            Date | null      set when trip starts, used to display elapsed time
trackingIntervalRef  useRef<ReturnType<typeof setInterval>>
```

**`fetchAssignedVehicle`** (runs in `useEffect` on `user` change): calls `GET /api/vehicles`, iterates over all returned vehicles, and finds the first where `assignedDriverId === user.id` or `assignedDriverId._id === user.id` (handles both populated and unpopulated responses). Sets `assignedVehicle` with `{ _id, unitNumber }`.

**`handleStartTrip`**: calls `POST /api/tracking/trips/start` with `{ vehicleId: assignedVehicle._id }`. On success, stores the returned `tripId`, sets `trackingActive = true` and `tripStart = new Date()`, immediately calls `sendLocationPing` once, then starts a 30-second `setInterval` that calls `sendLocationPing` repeatedly.

**`sendLocationPing(currentTripId, vehicleId)`**: calls `navigator.geolocation.getCurrentPosition`. In the success callback, posts `{ lat, lng, speed, vehicleId, tripId }` to `POST /api/tracking/location`. Speed is converted from the browser's native m/s to km/h by multiplying by `3.6`; falls back to `0` if `pos.coords.speed` is null (most desktop browsers). Sets `lastPing` to `new Date()` on success.

**`handleEndTrip`**: clears `trackingIntervalRef.current` immediately. Calls `POST /api/tracking/trips/:tripId/end` with `{ vehicleId: assignedVehicle._id }`. On success: resets `trackingActive`, `tripId`, `tripStart`, `lastPing` to their initial values. On failure: restores the `setInterval` so location pings continue — the trip stays open and the driver can retry ending it later.

**Cleanup**: a dedicated `useEffect` with no deps returns `() => clearInterval(trackingIntervalRef.current)`, ensuring the interval is cleared if the driver navigates away.

**UI**: the card uses `background: "#f0fdf4"` (green tint) and a green border (`#86efac`) when active; `background: "#f9fafb"` (grey) when idle. The action button is red (`#ef4444`) to end the trip or blue (`#2563eb`) to start it.

### Frontend — Admin Map (`client/src/pages/Tracking.tsx`)

**Leaflet icon fix** — applied at module level before any component code:
```ts
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
```
This is required because webpack/Vite asset hashing breaks Leaflet's default icon URL resolution. Without it, all markers render as broken images.

**`fetchLive`**: `GET /api/tracking/live` via axios, sets `vehicles` state, sets `loading = false`. Called immediately on mount and then every 30 seconds via `setInterval(fetchLive, 30000)` stored in `intervalRef`. The `useEffect` cleanup calls `clearInterval` on unmount.

**Map setup**: `MapContainer` centered on `mapCenter`. Default center is `[43.65107, -79.347015]` (Toronto) when no vehicle has location data. If any vehicle has a `lastLocation.lat`, the map centers on the first such vehicle's coordinates. Zoom level: `10`. Tile layer: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) — free, no API key required.

**Marker icons**: two `L.Icon` instances loaded from the `pointhi/leaflet-color-markers` CDN:
- `activeIcon` — green marker (`marker-icon-green.png`) for vehicles where `lastLocation.isActive === true`
- `inactiveIcon` — grey marker (`marker-icon-grey.png`) for vehicles where `isActive === false` or no location

Each marker renders a `Popup` showing `unitNumber`, `make model`, driver name, speed in km/h, and last updated time.

**Vehicle sidebar** (300px fixed width, left panel): lists all org vehicles. Each row shows a colored status dot (green = `isActive`, grey = inactive), `unitNumber`, assigned driver name (or "Unassigned"), speed (shown only when active), and last ping timestamp. Clicking a row calls `handleVehicleClick`, which sets `selectedVehicle` and fetches trip history.

**Trip history**: on vehicle sidebar click, `GET /api/tracking/history/:vehicleId` is called. Results populate a trip list below the vehicle list showing date, `totalDistance` in km, driver name, and ping count (`coordinates.length`). Clicking a trip toggles `selectedTrip`.

**Polyline replay**: when `selectedTrip` is set and has more than one coordinate, a `Polyline` is drawn on the map with `positions={selectedTrip.coordinates.map(c => [c.lat, c.lng])}`, color `#2563eb` (blue), weight `3`. Clicking the same trip again deselects it and removes the polyline.

**State:**
```
vehicles         Vehicle[]    live data from /tracking/live
selectedVehicle  Vehicle | null
tripHistory      Trip[]
selectedTrip     Trip | null
loading          boolean
intervalRef      useRef<ReturnType<typeof setInterval>>
```

### Navbar

"Live Tracking" is added to the Vehicle Management section of the admin sidebar in `client/src/pages/Navbar.tsx`:

```ts
{renderNavItem("/tracking", <FaMapMarkerAlt size={16} />, "Live Tracking")}
```

It is placed after the "Vehicles" link and before "Maintenance", within the block gated by `ADMIN_ROLES.includes(user?.role ?? "")`. `ADMIN_ROLES = ["admin", "company_admin", "dispatcher"]`, matching the roles that can access the backend GET routes.

### Route Registration

`/api/tracking` is registered in `server/src/index.ts` at line 172, after `app.use(bodyParser.json())`:

```ts
app.use("/api/tracking", trackingRoutes);
```

It does not require raw body parsing, so there is no conflict with Stripe webhook routes (which are registered before `bodyParser.json()`).

### Dependencies

Client-only additions (`client/package.json`):
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `@types/leaflet`

No new server-side npm packages. No new environment variables are required.

### Known Limitations & Future Improvements

- Tracking only functions when the driver has the browser app open in the foreground. The Web Geolocation API requires an active browser tab; background GPS is not available in standard web browsers.
- No geofencing alerts, ignition event detection, or engine diagnostics — these require physical hardware (OBD-II devices or dedicated telematics units).
- `startTrip` does not verify that the provided `vehicleId` belongs to the driver's organization. The risk is low — exploiting this requires a valid driver JWT plus knowledge of a foreign `vehicleId` — but it is a gap worth closing with a `Vehicle.findOne({ _id: vehicleId, ...orgFilter })` check.
- `endTrip` has no ownership check on `tripId`. Any authenticated driver can end any trip by `tripId`. Should validate that `trip.driverId === req.user.id`.
- `fetchAssignedVehicle` in Dashboard.tsx fetches all org vehicles and filters client-side. For large fleets this is wasteful; a dedicated `GET /api/vehicles?assignedTo=me` endpoint would be more efficient.
- Future: integrate a Samsara or Geotab telematics API to replace browser-based GPS with always-on, hardware-sourced position data that works regardless of whether the driver has the app open.
