import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const activeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const inactiveIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

type Vehicle = {
  _id: string; unitNumber: string; make: string; model: string; type: string; status: string;
  assignedDriverId?: { name: string; email: string } | null;
  lastLocation?: { lat: number; lng: number; speed: number; timestamp: string; isActive: boolean; } | null;
};

type TripCoord = { lat: number; lng: number; speed: number; timestamp: string };
type Trip = { _id: string; tripStart: string; tripEnd: string; totalDistance: number; driverId?: { name: string }; coordinates: TripCoord[]; };

const Tracking: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stalenessRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tracking/live`);
      setVehicles(res.data);
      setLastRefresh(new Date());
      setSecondsSinceRefresh(0);
    } catch (e) {
      console.error("Failed to fetch live locations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 30000);
    // Tick seconds-since-refresh counter every second for the staleness badge
    stalenessRef.current = setInterval(() => setSecondsSinceRefresh((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stalenessRef.current) clearInterval(stalenessRef.current);
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
  const mapCenter: [number, number] = vehiclesWithLocation.length > 0
    ? [vehiclesWithLocation[0].lastLocation!.lat, vehiclesWithLocation[0].lastLocation!.lng]
    : [43.65107, -79.347015];

  return (
    <div style={{ minHeight: "100vh", background: "var(--t-bg)" }}>
      <Navbar />
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>LIVE TRACKING</div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Live Tracking</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Monitor active vehicles, recent pings, and route history in real time.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 170px)", padding: "0 40px 40px", boxSizing: "border-box", maxWidth: "1380px", margin: "0 auto" }}>
        <div style={{ width: 300, background: "var(--t-surface)", borderRight: "1px solid var(--t-border)", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--t-border)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--t-text)" }}>Live Tracking</div>
            <div style={{ fontSize: 12, color: "var(--t-text-ghost)", marginTop: 2 }}>
              {vehicles.filter(v => v.lastLocation?.isActive).length} active
            </div>
            {lastRefresh && (
              <div style={{
                fontSize: 11,
                marginTop: 4,
                color: secondsSinceRefresh > 60 ? "var(--t-error)" : "var(--t-text-ghost)",
                fontWeight: secondsSinceRefresh > 60 ? 600 : 400,
              }}>
                {secondsSinceRefresh > 60
                  ? `Data stale — ${secondsSinceRefresh}s since last update`
                  : `Updated ${secondsSinceRefresh}s ago`}
              </div>
            )}
          </div>
          {loading && <div style={{ padding: 20, color: "var(--t-text-faint)", textAlign: "center" }}>Loading...</div>}
          {vehicles.map((v) => (
            <div key={v._id} onClick={() => handleVehicleClick(v)} style={{
              padding: "12px 20px", borderBottom: "1px solid var(--t-border)", cursor: "pointer",
              background: selectedVehicle?._id === v._id ? "var(--t-indigo-bg)" : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.lastLocation?.isActive ? "#22c55e" : "var(--t-border-strong)", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--t-text)" }}>{v.unitNumber}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginTop: 2, paddingLeft: 16 }}>
                {v.assignedDriverId?.name || "Unassigned"}
                {v.lastLocation?.speed != null && v.lastLocation.isActive ? ` · ${v.lastLocation.speed} km/h` : ""}
              </div>
              {v.lastLocation?.timestamp && (
                <div style={{ fontSize: 11, color: "var(--t-text-ghost)", paddingLeft: 16, marginTop: 1 }}>
                  {new Date(v.lastLocation.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
          {selectedVehicle && tripHistory.length > 0 && (
            <div style={{ padding: "12px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--t-text-secondary)", marginBottom: 8 }}>
                Past Trips — {selectedVehicle.unitNumber}
              </div>
              {tripHistory.map((trip) => (
                <div key={trip._id} onClick={() => setSelectedTrip(selectedTrip?._id === trip._id ? null : trip)}
                  style={{ padding: "8px 10px", borderRadius: 6, background: selectedTrip?._id === trip._id ? "var(--t-indigo-bg)" : "var(--t-surface-alt)", cursor: "pointer", marginBottom: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 500, color: "var(--t-text)" }}>
                    {new Date(trip.tripStart).toLocaleDateString()} — {trip.totalDistance} km
                  </div>
                  <div style={{ color: "var(--t-text-faint)" }}>{trip.driverId?.name || "Unknown driver"} · {trip.coordinates.length} pings</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <MapContainer center={mapCenter} zoom={10} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicles.map((v) => v.lastLocation?.lat ? (
              <Marker key={v._id} position={[v.lastLocation.lat, v.lastLocation.lng]} icon={v.lastLocation.isActive ? activeIcon : inactiveIcon}>
                <Popup>
                  <strong>{v.unitNumber}</strong><br />
                  {v.make} {v.model}<br />
                  Driver: {v.assignedDriverId?.name || "Unassigned"}<br />
                  Speed: {v.lastLocation.speed ?? 0} km/h<br />
                  Updated: {new Date(v.lastLocation.timestamp).toLocaleTimeString()}
                </Popup>
              </Marker>
            ) : null)}
            {selectedTrip && selectedTrip.coordinates.length > 1 && (
              <Polyline positions={selectedTrip.coordinates.map((c) => [c.lat, c.lng])} color="#2563eb" weight={3} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
