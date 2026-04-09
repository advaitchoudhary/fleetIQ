import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";
import {
  FaFileAlt, FaUser, FaPhoneAlt, FaTruck, FaClock,
  FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaTimesCircle,
  FaIdCard,
} from "react-icons/fa";

interface DriverProfile {
  name: string;
  email: string;
  driverId: string;
  status: string;
  licence: string;
  licence_expiry_date: string;
  hoursThisWeek: number;
}

interface Timesheet {
  _id: string;
  date: string;
  customer: string;
  category: string;
  status: string;
  totalHours: string;
  totalAmount?: number;
  totalPay?: number;
}

interface Vehicle {
  _id: string;
  unitNumber: string;
  make: string;
  model: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  approved: { color: "#059669", bg: "#d1fae5", icon: <FaCheckCircle size={11} />, label: "Approved" },
  pending:  { color: "#d97706", bg: "#fef3c7", icon: <FaHourglassHalf size={11} />, label: "Pending" },
  rejected: { color: "#dc2626", bg: "#fee2e2", icon: <FaTimesCircle size={11} />, label: "Rejected" },
  submitted:{ color: "#2563eb", bg: "#dbeafe", icon: <FaFileAlt size={11} />, label: "Submitted" },
};

const DriverHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // Trip tracking state
  const [trackingActive, setTrackingActive] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [tripStart, setTripStart] = useState<Date | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pingFailCount, setPingFailCount] = useState(0);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore active trip from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeTrip");
    if (saved) {
      try {
        const { tripId: tid, tripStart: ts } = JSON.parse(saved);
        setTripId(tid);
        setTripStart(new Date(ts));
        setTrackingActive(true);
      } catch { localStorage.removeItem("activeTrip"); }
    }
    return () => { if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current); };
  }, []);

  const sendLocationPing = (currentTripId: string, vehicleId: string) => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const token = localStorage.getItem("token");
          await axios.post(`${API_BASE_URL}/tracking/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : 0,
            vehicleId,
            tripId: currentTripId,
          }, { headers: { Authorization: `Bearer ${token}` } });
          setLastPing(new Date());
          setGeoError(null);
          setPingFailCount(0);
        } catch { setPingFailCount(c => c + 1); }
      },
      () => { setGeoError("Location access denied"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStartTrip = async () => {
    if (!vehicle) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/tracking/trips/start`,
        { vehicleId: vehicle._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newTripId = res.data.tripId;
      const now = new Date();
      setTripId(newTripId);
      setTripStart(now);
      setTrackingActive(true);
      setGeoError(null);
      setPingFailCount(0);
      localStorage.setItem("activeTrip", JSON.stringify({ tripId: newTripId, vehicleId: vehicle._id, tripStart: now }));
      sendLocationPing(newTripId, vehicle._id);
      trackingIntervalRef.current = setInterval(() => sendLocationPing(newTripId, vehicle._id), 30000);
    } catch { setGeoError("Failed to start trip"); }
  };

  const handleEndTrip = async () => {
    if (!tripId || !vehicle) return;
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/tracking/trips/${tripId}/end`,
        { vehicleId: vehicle._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrackingActive(false);
      setTripId(null);
      setTripStart(null);
      setLastPing(null);
      setPingFailCount(0);
      localStorage.removeItem("activeTrip");
    } catch {
      // Restore interval so trip continues if end fails
      if (tripId && vehicle) {
        trackingIntervalRef.current = setInterval(() => sendLocationPing(tripId, vehicle._id), 30000);
      }
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [driverRes, tsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/drivers/${user?.id}`, { headers }),
          axios.get(`${API_BASE_URL}/timesheets?noPagination=true`, { headers }),
        ]);

        setDriver(driverRes.data);

        const all = tsRes.data.data || tsRes.data;
        const mine = Array.isArray(all)
          ? all.filter((t: any) => t.driver === user?.email || t.driverEmail === user?.email)
          : [];
        setTimesheets(mine.slice(0, 5));

        try {
          const vRes = await axios.get(`${API_BASE_URL}/tracking/my-vehicle`, { headers });
          setVehicle(vRes.data);
        } catch {
          // no vehicle assigned
        }
      } catch (err) {
        console.error("DriverHome fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchAll();
  }, [user?.id, user?.email]);

  const licenceDaysLeft = driver?.licence_expiry_date
    ? Math.ceil((new Date(driver.licence_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const licenceColor =
    licenceDaysLeft === null ? "var(--t-text-faint)"
    : licenceDaysLeft <= 0 ? "var(--t-error)"
    : licenceDaysLeft <= 30 ? "var(--t-warning)"
    : "var(--t-success)";

  const licenceBg =
    licenceDaysLeft === null ? "var(--t-surface-alt)"
    : licenceDaysLeft <= 0 ? "var(--t-error-bg)"
    : licenceDaysLeft <= 30 ? "var(--t-warning-bg)"
    : "var(--t-success-bg)";

  const quickActions = [
    { label: "Submit Timesheet", icon: <FaFileAlt size={18} />, path: "/my-timesheet-submit", color: "var(--t-accent)" },
    { label: "My Timesheets",   icon: <FaClock size={18} />,    path: "/my-timesheet",         color: "#0891b2" },
    { label: "My Info",         icon: <FaUser size={18} />,     path: "/my-info",              color: "#7c3aed" },
    { label: "Contact Admin",   icon: <FaPhoneAlt size={18} />, path: "/contact-us",           color: "#059669" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          DASHBOARD
        </div>

        {/* Welcome header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
            Welcome back, {driver?.name || user?.name || "Driver"}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
            Here's an overview of your activity and status.
          </p>
        </div>

        {loading ? (
          <div style={{ color: "var(--t-text-faint)", fontSize: "14px" }}>Loading...</div>
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              {/* Hours this week */}
              <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "10px" }}>HOURS THIS WEEK</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--t-text)" }}>{driver?.hoursThisWeek ?? 0}</div>
                <div style={{ fontSize: "12px", color: "var(--t-text-dim)", marginTop: "4px" }}>hrs logged</div>
              </div>

              {/* Licence expiry */}
              <div style={{ background: licenceBg, border: `1px solid ${licenceColor}33`, borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: licenceColor, letterSpacing: "1px", marginBottom: "10px", opacity: 0.8 }}>LICENCE EXPIRY</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: licenceColor }}>
                  {licenceDaysLeft === null ? "—"
                    : licenceDaysLeft <= 0 ? "Expired"
                    : `${licenceDaysLeft}d`}
                </div>
                <div style={{ fontSize: "12px", color: licenceColor, marginTop: "4px", opacity: 0.8 }}>
                  {licenceDaysLeft === null ? "No date set"
                    : licenceDaysLeft <= 0 ? "Renew immediately"
                    : licenceDaysLeft <= 30 ? "Expiring soon"
                    : driver?.licence_expiry_date ? new Date(driver.licence_expiry_date).toLocaleDateString("en-CA") : ""}
                </div>
              </div>

              {/* Status */}
              <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "10px" }}>STATUS</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: driver?.status === "Active" ? "var(--t-success)" : "var(--t-warning)" }}>
                  {driver?.status || "—"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--t-text-dim)", marginTop: "4px" }}>
                  ID: {driver?.driverId || "—"}
                </div>
              </div>

              {/* Assigned vehicle */}
              <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "10px" }}>ASSIGNED VEHICLE</div>
                {vehicle ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaTruck size={18} color="var(--t-accent)" />
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--t-text)" }}>#{vehicle.unitNumber}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--t-text-dim)", marginTop: "4px" }}>{vehicle.make} {vehicle.model}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--t-text-faint)" }}>Unassigned</div>
                    <div style={{ fontSize: "12px", color: "var(--t-text-dim)", marginTop: "4px" }}>Contact your admin</div>
                  </>
                )}
              </div>
            </div>

            {/* Trip Tracking card */}
            {vehicle && (
              <div style={{
                background: trackingActive ? "#f0fdf4" : "var(--t-surface)",
                border: `1px solid ${trackingActive ? "#86efac" : "var(--t-border)"}`,
                borderRadius: "14px", padding: "16px 20px", marginBottom: "24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                boxShadow: "var(--t-shadow)",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--t-text)" }}>
                    {trackingActive ? "🟢 Trip Active" : "🚛 Start Trip"} — {vehicle.unitNumber}
                  </div>
                  {trackingActive && tripStart && (
                    <div style={{ fontSize: 13, color: "var(--t-text-dim)", marginTop: 4 }}>
                      Started: {tripStart.toLocaleTimeString()} &nbsp;|&nbsp;
                      Last ping: {lastPing ? lastPing.toLocaleTimeString() : "pending..."}
                    </div>
                  )}
                  {!trackingActive && (
                    <div style={{ fontSize: 13, color: "var(--t-text-dim)", marginTop: 2 }}>Share your location with dispatch</div>
                  )}
                  {geoError && (
                    <div style={{ fontSize: 12, color: "#b91c1c", background: "#fee2e2", borderRadius: 6, padding: "4px 8px", marginTop: 6 }}>
                      {geoError}
                    </div>
                  )}
                  {!geoError && pingFailCount >= 3 && (
                    <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "4px 8px", marginTop: 6 }}>
                      Location sync failed. Check your connection.
                    </div>
                  )}
                </div>
                <button
                  onClick={trackingActive ? handleEndTrip : handleStartTrip}
                  style={{
                    background: trackingActive ? "#ef4444" : "#2563eb",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "10px 20px", fontWeight: 600, fontSize: 14,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {trackingActive ? "End Trip" : "Start Trip"}
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                {quickActions.map((a) => (
                  <button
                    key={a.path}
                    onClick={() => navigate(a.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "16px 18px", background: "var(--t-surface)",
                      border: "1px solid var(--t-border)", borderRadius: "12px",
                      cursor: "pointer", boxShadow: "var(--t-shadow)",
                      fontFamily: "Inter, system-ui, sans-serif",
                      transition: "box-shadow 0.15s, border-color 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--t-shadow-lg)"; e.currentTarget.style.borderColor = "var(--t-border-strong)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--t-shadow)"; e.currentTarget.style.borderColor = "var(--t-border)"; }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${a.color}18`, border: `1px solid ${a.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text)" }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent timesheets */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>Recent Timesheets</h2>
                <button onClick={() => navigate("/my-timesheet")} style={{ background: "none", border: "none", color: "var(--t-accent)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                  View all →
                </button>
              </div>

              {timesheets.length === 0 ? (
                <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "12px", padding: "32px", textAlign: "center", color: "var(--t-text-faint)", fontSize: "14px" }}>
                  No timesheets submitted yet.{" "}
                  <span style={{ color: "var(--t-accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/my-timesheet-submit")}>
                    Submit your first one →
                  </span>
                </div>
              ) : (
                <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "var(--t-shadow)" }}>
                  {timesheets.map((ts, i) => {
                    const cfg = STATUS_CONFIG[ts.status] || STATUS_CONFIG["pending"];
                    return (
                      <div key={ts._id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px",
                        borderBottom: i < timesheets.length - 1 ? "1px solid var(--t-border)" : "none",
                        background: i % 2 === 1 ? "var(--t-stripe)" : "transparent",
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text)" }}>
                            {ts.date ? new Date(ts.date.slice(0, 10) + "T00:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "—"}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--t-text-dim)" }}>
                            {ts.customer || "—"} {ts.category ? `· ${ts.category}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          {ts.totalHours && (
                            <span style={{ fontSize: "12px", color: "var(--t-text-faint)" }}>{ts.totalHours}</span>
                          )}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                            color: cfg.color, background: cfg.bg,
                          }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Licence warning banner */}
            {licenceDaysLeft !== null && licenceDaysLeft <= 30 && (
              <div style={{
                marginTop: "24px", display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 20px", borderRadius: "12px",
                background: licenceDaysLeft <= 0 ? "var(--t-error-bg)" : "var(--t-warning-bg)",
                border: `1px solid ${licenceDaysLeft <= 0 ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)"}`,
                color: licenceDaysLeft <= 0 ? "var(--t-error)" : "var(--t-warning)",
                fontSize: "13px", fontWeight: 600,
              }}>
                <FaExclamationCircle size={16} />
                {licenceDaysLeft <= 0
                  ? "Your driver's licence has expired. Contact your admin immediately."
                  : `Your driver's licence expires in ${licenceDaysLeft} day${licenceDaysLeft === 1 ? "" : "s"}. Please renew it soon.`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverHome;
