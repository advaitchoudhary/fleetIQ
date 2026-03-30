---
name: tracking-agent
description: Builds the full vehicle tracking feature for FleetIQ — driver GPS location sharing via polling, admin live map, trip history. No WebSocket, no Redis, pure MongoDB + 30s polling.
---

You are a senior full-stack engineer building the **Vehicle Tracking** feature for FleetIQ fleet management SaaS from scratch.

## Architecture Decision
- **No WebSocket, no Redis, no in-memory cache**
- Driver app pushes GPS location every 30s via `POST /api/tracking/location`
- Admin map pulls all vehicle locations every 30s via `GET /api/tracking/live` (`setInterval`)
- MongoDB is the only state store
- Map: Leaflet + OpenStreetMap (free, no API key)

## Your Task
Build the complete tracking feature end-to-end in this order:

---

### STEP 1 — vehicleModel.js: Add lastLocation field

File: `server/model/vehicleModel.js`

Read the file first, then add this field to the schema (before the closing brace of the schema definition):

```js
lastLocation: {
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  speed: { type: Number, default: null },       // km/h from browser Geolocation API
  timestamp: { type: Date, default: null },
  isActive: { type: Boolean, default: false },  // true = trip currently in progress
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
},
```

---

### STEP 2 — Create locationModel.js (trip history)

File: `server/model/locationModel.js`

```js
const mongoose = require("mongoose");

const coordSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    tripStart: { type: Date, default: Date.now },
    tripEnd: { type: Date, default: null },
    totalDistance: { type: Number, default: 0 }, // km, calculated on trip end
    coordinates: [coordSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);
```

---

### STEP 3 — Create trackingController.js

File: `server/controller/trackingController.js`

```js
const Vehicle = require("../model/vehicleModel");
const Location = require("../model/locationModel");
const Driver = require("../model/driverModel");
const { getOrgFilter } = require("../middleware/authMiddleware");

// Helper: calculate distance between two lat/lng points in km (Haversine)
function haversineDistance(coords) {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const R = 6371;
    const dLat = ((coords[i].lat - coords[i - 1].lat) * Math.PI) / 180;
    const dLng = ((coords[i].lng - coords[i - 1].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coords[i - 1].lat * Math.PI) / 180) *
        Math.cos((coords[i].lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total * 10) / 10;
}

// POST /api/tracking/trips/start
// Driver starts a trip — creates a Location doc and marks vehicle as active
const startTrip = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const driverId = req.user.id;
    const organizationId = req.organizationId;

    if (!vehicleId) return res.status(400).json({ message: "vehicleId is required" });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Close any existing active trip for this vehicle
    await Location.findOneAndUpdate(
      { vehicleId, tripEnd: null },
      { tripEnd: new Date() }
    );

    const trip = await Location.create({
      organizationId,
      vehicleId,
      driverId,
      tripStart: new Date(),
      coordinates: [],
    });

    await Vehicle.findByIdAndUpdate(vehicleId, {
      "lastLocation.isActive": true,
      "lastLocation.driverId": driverId,
    });

    res.status(201).json({ tripId: trip._id, message: "Trip started" });
  } catch (err) {
    console.error("startTrip error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/tracking/location
// Driver pushes GPS ping every 30s
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, speed, vehicleId, tripId } = req.body;
    const driverId = req.user.id;

    if (!lat || !lng || !vehicleId || !tripId) {
      return res.status(400).json({ message: "lat, lng, vehicleId, tripId are required" });
    }

    const coord = { lat, lng, speed: speed || 0, timestamp: new Date() };

    // Update vehicle lastLocation
    await Vehicle.findByIdAndUpdate(vehicleId, {
      lastLocation: {
        lat,
        lng,
        speed: speed || 0,
        timestamp: new Date(),
        isActive: true,
        driverId,
      },
    });

    // Append coord to trip history
    await Location.findByIdAndUpdate(tripId, {
      $push: { coordinates: coord },
    });

    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("updateLocation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/tracking/trips/:tripId/end
// Driver ends a trip
const endTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { vehicleId } = req.body;

    const trip = await Location.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const totalDistance = haversineDistance(trip.coordinates);

    await Location.findByIdAndUpdate(tripId, {
      tripEnd: new Date(),
      totalDistance,
    });

    if (vehicleId) {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        "lastLocation.isActive": false,
      });
    }

    res.json({ message: "Trip ended", totalDistance });
  } catch (err) {
    console.error("endTrip error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/tracking/live
// Admin: get all vehicles with their lastLocation for the org
const getLiveLocations = async (req, res) => {
  try {
    const orgFilter = getOrgFilter(req);
    const vehicles = await Vehicle.find(orgFilter)
      .select("unitNumber make model type status lastLocation assignedDriverId")
      .populate("assignedDriverId", "name email")
      .lean();

    res.json(vehicles);
  } catch (err) {
    console.error("getLiveLocations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/tracking/history/:vehicleId
// Admin: get past trips for a vehicle
const getTripHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const trips = await Location.find({ vehicleId, tripEnd: { $ne: null } })
      .sort({ tripStart: -1 })
      .limit(20)
      .populate("driverId", "name email")
      .lean();

    res.json(trips);
  } catch (err) {
    console.error("getTripHistory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { startTrip, updateLocation, endTrip, getLiveLocations, getTripHistory };
```

---

### STEP 4 — Create trackingRoute.js

File: `server/routes/trackingRoute.js`

```js
const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { requireTrackingModule } = require("../middleware/featureGate");
const {
  startTrip,
  updateLocation,
  endTrip,
  getLiveLocations,
  getTripHistory,
} = require("../controller/trackingController");

// Driver routes (push location)
router.post("/trips/start", protect, authorizeRoles("driver"), startTrip);
router.post("/location", protect, authorizeRoles("driver"), updateLocation);
router.post("/trips/:tripId/end", protect, authorizeRoles("driver"), endTrip);

// Admin/dispatcher routes (pull location)
router.get(
  "/live",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  requireTrackingModule,
  getLiveLocations
);
router.get(
  "/history/:vehicleId",
  protect,
  authorizeRoles("admin", "company_admin", "dispatcher"),
  requireTrackingModule,
  getTripHistory
);

module.exports = router;
```

---

### STEP 5 — featureGate.js: Add requireTrackingModule

File: `server/middleware/featureGate.js`

Read the file first. Add `requireTrackingModule` by adding this line near the bottom alongside the existing exports:

```js
const requireTrackingModule = checkFeature("vehicle"); // tracking is part of vehicle module
```

And export it:
```js
module.exports = { requireDriverModule, requireVehicleModule, requireTrackingModule };
```

---

### STEP 6 — Register route in server index

Find the server entry point (`server/src/index.ts` or `server/index.js`). Read it, then register the tracking route alongside the other routes:

```js
const trackingRoute = require("./routes/trackingRoute");
// ... register with:
app.use("/api/tracking", trackingRoute);
```

---

### STEP 7 — Install Leaflet in client

Run: `cd /Users/advaitchoudhary/Documents/fleetIQ/client && npm install leaflet react-leaflet @types/leaflet`

---

### STEP 8 — Add Start/Stop Trip UI to Dashboard.tsx

File: `client/src/pages/Dashboard.tsx`

Read the file first to understand the existing structure. Then add a tracking card to the driver dashboard.

Add these state variables near the top of the component (after existing state):
```tsx
const [trackingActive, setTrackingActive] = useState(false);
const [tripId, setTripId] = useState<string | null>(null);
const [assignedVehicle, setAssignedVehicle] = useState<{ _id: string; unitNumber: string } | null>(null);
const [lastPing, setLastPing] = useState<Date | null>(null);
const [tripStart, setTripStart] = useState<Date | null>(null);
const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Make sure `useRef` is imported from React.

Add a `useEffect` to fetch the driver's assigned vehicle on mount:
```tsx
useEffect(() => {
  const fetchAssignedVehicle = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicles`);
      const vehicles: any[] = res.data;
      // Find vehicle assigned to this driver
      const mine = vehicles.find(
        (v) => v.assignedDriverId && (v.assignedDriverId === user?.id || v.assignedDriverId?._id === user?.id)
      );
      if (mine) setAssignedVehicle({ _id: mine._id, unitNumber: mine.unitNumber });
    } catch (e) {
      // silently fail — driver may not have an assigned vehicle
    }
  };
  fetchAssignedVehicle();
}, [user]);
```

Add these handler functions inside the component:
```tsx
const sendLocationPing = async (currentTripId: string, vehicleId: string) => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      await axios.post(`${API_BASE_URL}/tracking/location`, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed ? pos.coords.speed * 3.6 : 0, // m/s → km/h
        vehicleId,
        tripId: currentTripId,
      });
      setLastPing(new Date());
    } catch (e) {
      console.error("Location ping failed:", e);
    }
  });
};

const handleStartTrip = async () => {
  if (!assignedVehicle) return;
  try {
    const res = await axios.post(`${API_BASE_URL}/tracking/trips/start`, {
      vehicleId: assignedVehicle._id,
    });
    const newTripId = res.data.tripId;
    setTripId(newTripId);
    setTrackingActive(true);
    setTripStart(new Date());
    // Send first ping immediately
    sendLocationPing(newTripId, assignedVehicle._id);
    // Then every 30s
    trackingIntervalRef.current = setInterval(() => {
      sendLocationPing(newTripId, assignedVehicle._id);
    }, 30000);
  } catch (e) {
    console.error("Start trip failed:", e);
  }
};

const handleEndTrip = async () => {
  if (!tripId || !assignedVehicle) return;
  if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
  try {
    await axios.post(`${API_BASE_URL}/tracking/trips/${tripId}/end`, {
      vehicleId: assignedVehicle._id,
    });
  } catch (e) {
    console.error("End trip failed:", e);
  }
  setTrackingActive(false);
  setTripId(null);
  setTripStart(null);
  setLastPing(null);
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
  };
}, []);
```

Add the tracking card JSX somewhere visible in the return statement (near the top of the page content, after any existing header). Style it to match the existing dashboard aesthetic:

```tsx
{/* Vehicle Tracking Card */}
{assignedVehicle && (
  <div style={{
    background: trackingActive ? "#f0fdf4" : "#f9fafb",
    border: `1px solid ${trackingActive ? "#86efac" : "#e5e7eb"}`,
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
        {trackingActive ? "Trip Active" : "Start Trip"} — {assignedVehicle.unitNumber}
      </div>
      {trackingActive && tripStart && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Started: {tripStart.toLocaleTimeString()} &nbsp;|&nbsp;
          Last ping: {lastPing ? lastPing.toLocaleTimeString() : "pending..."}
        </div>
      )}
      {!trackingActive && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
          Share your location with dispatch
        </div>
      )}
    </div>
    <button
      onClick={trackingActive ? handleEndTrip : handleStartTrip}
      style={{
        background: trackingActive ? "#ef4444" : "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {trackingActive ? "End Trip" : "Start Trip"}
    </button>
  </div>
)}
```

---

### STEP 9 — Create Tracking.tsx (Admin Map Page)

File: `client/src/pages/Tracking.tsx`

Create this file:

```tsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const activeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const inactiveIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type Vehicle = {
  _id: string;
  unitNumber: string;
  make: string;
  model: string;
  type: string;
  status: string;
  assignedDriverId?: { name: string; email: string } | null;
  lastLocation?: {
    lat: number;
    lng: number;
    speed: number;
    timestamp: string;
    isActive: boolean;
  } | null;
};

type TripCoord = { lat: number; lng: number; speed: number; timestamp: string };
type Trip = {
  _id: string;
  tripStart: string;
  tripEnd: string;
  totalDistance: number;
  driverId?: { name: string };
  coordinates: TripCoord[];
};

const Tracking: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tracking/live`);
      setVehicles(res.data);
    } catch (e) {
      console.error("Failed to fetch live locations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleVehicleClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedTrip(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/tracking/history/${vehicle._id}`);
      setTripHistory(res.data);
    } catch (e) {
      setTripHistory([]);
    }
  };

  const vehiclesWithLocation = vehicles.filter((v) => v.lastLocation?.lat);
  const mapCenter: [number, number] =
    vehiclesWithLocation.length > 0
      ? [vehiclesWithLocation[0].lastLocation!.lat, vehiclesWithLocation[0].lastLocation!.lng]
      : [43.65107, -79.347015]; // Toronto default

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <div style={{
          width: 300,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          overflowY: "auto",
          flexShrink: 0,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Live Tracking</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              Refreshes every 30s &bull; {vehicles.filter(v => v.lastLocation?.isActive).length} active
            </div>
          </div>

          {loading && (
            <div style={{ padding: 20, color: "#6b7280", textAlign: "center" }}>Loading...</div>
          )}

          {vehicles.map((v) => (
            <div
              key={v._id}
              onClick={() => handleVehicleClick(v)}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                background: selectedVehicle?._id === v._id ? "#eff6ff" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: v.lastLocation?.isActive ? "#22c55e" : "#d1d5db",
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{v.unitNumber}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, paddingLeft: 16 }}>
                {v.assignedDriverId?.name || "Unassigned"}
                {v.lastLocation?.speed != null && v.lastLocation.isActive
                  ? ` · ${v.lastLocation.speed} km/h`
                  : ""}
              </div>
              {v.lastLocation?.timestamp && (
                <div style={{ fontSize: 11, color: "#9ca3af", paddingLeft: 16, marginTop: 1 }}>
                  {new Date(v.lastLocation.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}

          {/* Trip history panel */}
          {selectedVehicle && tripHistory.length > 0 && (
            <div style={{ padding: "12px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 8 }}>
                Past Trips — {selectedVehicle.unitNumber}
              </div>
              {tripHistory.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => setSelectedTrip(selectedTrip?._id === trip._id ? null : trip)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: selectedTrip?._id === trip._id ? "#dbeafe" : "#f9fafb",
                    cursor: "pointer",
                    marginBottom: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 500, color: "#111827" }}>
                    {new Date(trip.tripStart).toLocaleDateString()} — {trip.totalDistance} km
                  </div>
                  <div style={{ color: "#6b7280" }}>
                    {trip.driverId?.name || "Unknown driver"} · {trip.coordinates.length} pings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {vehicles.map((v) =>
              v.lastLocation?.lat ? (
                <Marker
                  key={v._id}
                  position={[v.lastLocation.lat, v.lastLocation.lng]}
                  icon={v.lastLocation.isActive ? activeIcon : inactiveIcon}
                >
                  <Popup>
                    <strong>{v.unitNumber}</strong><br />
                    {v.make} {v.model}<br />
                    Driver: {v.assignedDriverId?.name || "Unassigned"}<br />
                    Speed: {v.lastLocation.speed ?? 0} km/h<br />
                    Updated: {new Date(v.lastLocation.timestamp).toLocaleTimeString()}
                  </Popup>
                </Marker>
              ) : null
            )}

            {/* Selected trip polyline */}
            {selectedTrip && selectedTrip.coordinates.length > 1 && (
              <Polyline
                positions={selectedTrip.coordinates.map((c) => [c.lat, c.lng])}
                color="#2563eb"
                weight={3}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
```

---

### STEP 10 — Add /tracking route to App.tsx

File: `client/src/App.tsx`

Read the file first. Add the import:
```tsx
import Tracking from "./pages/Tracking";
```

Add the route inside the admin routes section (alongside other admin routes):
```tsx
<Route
  path="/tracking"
  element={
    <ProtectedRoute requiredRole={["admin", "company_admin", "dispatcher"]}>
      <Tracking />
    </ProtectedRoute>
  }
/>
```

If `ProtectedRoute` only accepts a string for `requiredRole`, use `"company_admin"` as the role and handle admin via the component itself. Check how other admin routes do it and match the pattern.

---

### STEP 11 — Add Tracking link to Navbar

Find the Navbar file (`client/src/pages/Navbar.tsx`). Read it and add a "Tracking" nav link pointing to `/tracking`, visible to admin/company_admin/dispatcher roles. Match the existing nav link style exactly.

---

### STEP 12 — Final verification

1. Read `server/src/index.ts` (or the server entry point) to confirm the tracking route is registered.
2. Read `client/src/App.tsx` to confirm the route is added.
3. Make sure all imports are correct in every file you created/modified.
4. Ensure `locationModel.js` is not imported anywhere that would cause circular deps.

---

## Important Rules
- Follow the existing code style in each file exactly — same indentation, same import style, same error handling pattern
- All admin GET routes must use `getOrgFilter(req)` for multi-tenancy
- Driver POST routes use `req.user.id` for driverId (from JWT payload)
- `requireTrackingModule` gates the admin endpoints (bundled with vehicle module for now)
- Do NOT add Socket.io, Redis, or any new infrastructure packages beyond leaflet
- Do NOT modify any unrelated files
