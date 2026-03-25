import React, { useState, useEffect, useCallback } from "react";
import { FaHistory } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const EVENT_COLORS: Record<string, string> = {
  maintenance: "#4F46E5",
  inspection: "#059669",
  fuel: "#0891b2",
};

const EVENT_ICONS: Record<string, string> = {
  maintenance: "🔧",
  inspection: "✅",
  fuel: "⛽",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7" },
  scheduled: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
  in_progress: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d" },
  cancelled: { bg: "rgba(255,255,255,0.06)", color: "#9ca3af" },
  satisfactory: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7" },
  defects_noted: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d" },
  out_of_service: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
};

const DEMO_FLEET_SUMMARY = [
  {
    vehicle: { _id: "demo-v1", unitNumber: "U-101", make: "Kenworth", model: "T680", year: 2022 },
    totalEvents: 8,
    lastMaintenance: { scheduledDate: "2026-02-10", completedDate: "2026-02-10", title: "Engine Oil & Filter Change" },
    lastInspection: { date: "2026-03-20", status: "satisfactory" },
  },
  {
    vehicle: { _id: "demo-v2", unitNumber: "U-102", make: "Freightliner", model: "Cascadia", year: 2021 },
    totalEvents: 6,
    lastMaintenance: { scheduledDate: "2026-03-18", completedDate: "", title: "Front Brake Pad Replacement" },
    lastInspection: { date: "2026-03-19", status: "defects_noted" },
  },
  {
    vehicle: { _id: "demo-v3", unitNumber: "U-103", make: "Ford", model: "Transit 350", year: 2023 },
    totalEvents: 4,
    lastMaintenance: { scheduledDate: "2026-04-12", completedDate: "", title: "Tire Rotation & Balance" },
    lastInspection: { date: "2026-03-18", status: "satisfactory" },
  },
  {
    vehicle: { _id: "demo-v5", unitNumber: "U-105", make: "Ram", model: "1500 Classic", year: 2022 },
    totalEvents: 3,
    lastMaintenance: { scheduledDate: "2026-03-02", completedDate: "2026-03-02", title: "Post-Incident Inspection" },
    lastInspection: null,
  },
];

const DEMO_VEHICLE_HISTORIES: Record<string, { vehicle: any; events: any[]; summary: any }> = {
  "demo-v1": {
    vehicle: { _id: "demo-v1", unitNumber: "U-101", make: "Kenworth", model: "T680", year: 2022, odometer: 156340, licensePlate: "ON-TRK-101" },
    summary: { totalMaintenanceCost: 435, totalFuelCost: 1917.70, totalCost: 2352.70, totalEvents: 8 },
    events: [
      { eventType: "maintenance", title: "Annual Safety Inspection (CVIP)", status: "scheduled", cost: 250, date: "2026-04-05", odometer: 156340, detail: "Vendor: Certified Truck Inspections Ltd.", notes: "" },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 642.18, date: "2026-03-15", odometer: 156340, detail: "420 L · $1.529/L · Petro-Canada, Toronto ON", notes: "" },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 611.56, date: "2026-03-08", odometer: 155120, detail: "395 L · $1.549/L · Esso, London ON", notes: "Long-haul Windsor run." },
      { eventType: "inspection", title: "Pre-Trip Inspection", status: "satisfactory", cost: 0, date: "2026-03-20", odometer: 156340, detail: "Type: Pre-Trip · Driver: D001", notes: "All systems checked and operational." },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 663.96, date: "2026-02-20", odometer: 153600, detail: "440 L · $1.509/L · Husky, Kitchener ON", notes: "Full tank before weekend." },
      { eventType: "maintenance", title: "Engine Oil & Filter Change", status: "completed", cost: 185, date: "2026-02-10", odometer: 155000, detail: "Vendor: FleetPro Service Centre", notes: "15W-40 Rotella T6, 10L. Oil filter replaced." },
      { eventType: "inspection", title: "Annual Safety Inspection (CVIP)", status: "satisfactory", cost: 0, date: "2025-04-10", odometer: 142000, detail: "Type: Annual", notes: "MTO annual CVIP — passed with no defects." },
      { eventType: "maintenance", title: "Coolant System Flush", status: "completed", cost: 0, date: "2025-01-22", odometer: 130000, detail: "Vendor: FleetPro Service Centre", notes: "OAT extended-life coolant used." },
    ],
  },
  "demo-v2": {
    vehicle: { _id: "demo-v2", unitNumber: "U-102", make: "Freightliner", model: "Cascadia", year: 2021, odometer: 204780, licensePlate: "ON-TRK-102" },
    summary: { totalMaintenanceCost: 860, totalFuelCost: 1199.41, totalCost: 2059.41, totalEvents: 6 },
    events: [
      { eventType: "maintenance", title: "Front Brake Pad Replacement", status: "in_progress", cost: 540, date: "2026-03-18", odometer: 204780, detail: "Vendor: TruckStop Auto", notes: "Parts ordered — vehicle grounded until complete." },
      { eventType: "inspection", title: "Pre-Trip Inspection", status: "defects_noted", cost: 0, date: "2026-03-19", odometer: 204780, detail: "Type: Pre-Trip · Driver: D003", notes: "Front brake pad thickness below minimum. Replacement ordered." },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 584.82, date: "2026-03-14", odometer: 204780, detail: "385 L · $1.519/L · Pilot Flying J, Mississauga ON", notes: "" },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 614.59, date: "2026-02-28", odometer: 203900, detail: "410 L · $1.499/L · Love's Travel Stop, Hamilton ON", notes: "" },
      { eventType: "maintenance", title: "Coolant System Flush", status: "completed", cost: 320, date: "2026-01-22", odometer: 198400, detail: "Vendor: FleetPro Service Centre", notes: "Full drain and refill with OAT coolant. Windshield fluid topped up." },
      { eventType: "maintenance", title: "Air Filter Replacement", status: "completed", cost: 0, date: "2025-09-15", odometer: 160000, detail: "Vendor: FleetPro Service Centre", notes: "Primary and safety elements replaced." },
    ],
  },
  "demo-v3": {
    vehicle: { _id: "demo-v3", unitNumber: "U-103", make: "Ford", model: "Transit 350", year: 2023, odometer: 34560, licensePlate: "ON-VAN-103" },
    summary: { totalMaintenanceCost: 120, totalFuelCost: 187.56, totalCost: 307.56, totalEvents: 4 },
    events: [
      { eventType: "maintenance", title: "Tire Rotation & Balance", status: "scheduled", cost: 120, date: "2026-04-12", odometer: 34560, detail: "Vendor: Kal Tire", notes: "" },
      { eventType: "inspection", title: "Post-Trip Inspection", status: "satisfactory", cost: 0, date: "2026-03-18", odometer: 34560, detail: "Type: Post-Trip · Driver: D005", notes: "No issues noted on return." },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 97.97, date: "2026-03-13", odometer: 34560, detail: "58 L · $1.689/L · Shell, Brampton ON", notes: "" },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 89.59, date: "2026-02-25", odometer: 33880, detail: "54 L · $1.659/L · Canadian Tire Gas+, Mississauga ON", notes: "" },
    ],
  },
  "demo-v5": {
    vehicle: { _id: "demo-v5", unitNumber: "U-105", make: "Ram", model: "1500 Classic", year: 2022, odometer: 67890, licensePlate: "ON-PCK-105" },
    summary: { totalMaintenanceCost: 0, totalFuelCost: 122.33, totalCost: 122.33, totalEvents: 3 },
    events: [
      { eventType: "maintenance", title: "Post-Incident Inspection", status: "completed", cost: 0, date: "2026-03-02", odometer: 67890, detail: "Vendor: Internal", notes: "Minor fender contact in parking lot. No structural damage found." },
      { eventType: "fuel", title: "Fuel Fill-Up", status: null, cost: 122.33, date: "2026-03-07", odometer: 67890, detail: "72 L · $1.699/L · Petro-Canada, Oakville ON", notes: "" },
      { eventType: "inspection", title: "Annual Safety Inspection (CVIP)", status: "satisfactory", cost: 0, date: "2025-12-15", odometer: 58000, detail: "Type: Annual", notes: "Passed with no defects." },
    ],
  },
};

const ServiceHistory: React.FC = () => {
  const [fleetSummary, setFleetSummary] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchFleetSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/service-history`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
      ]);
      const [s, v] = await Promise.all([summaryRes.json(), vehiclesRes.json()]);
      setFleetSummary(Array.isArray(s) && s.length > 0 ? s : DEMO_FLEET_SUMMARY);
      setVehicles(Array.isArray(v) && v.length > 0 ? v : DEMO_FLEET_SUMMARY.map((d) => d.vehicle));
    } catch (err) {
      console.error(err);
      setFleetSummary(DEMO_FLEET_SUMMARY);
      setVehicles(DEMO_FLEET_SUMMARY.map((d) => d.vehicle));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFleetSummary(); }, [fetchFleetSummary]);

  const fetchVehicleHistory = async (vehicleId: string) => {
    if (!vehicleId) return;
    setHistoryLoading(true);
    try {
      if (DEMO_VEHICLE_HISTORIES[vehicleId]) {
        const demo = DEMO_VEHICLE_HISTORIES[vehicleId];
        setVehicleInfo(demo.vehicle);
        setEvents(demo.events);
        setSummary(demo.summary);
        setHistoryLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      const res = await fetch(`${API_BASE_URL}/service-history/${vehicleId}?${params}`, { headers });
      const data = await res.json();
      setVehicleInfo(data.vehicle);
      setEvents(data.events || []);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      const demo = DEMO_VEHICLE_HISTORIES[vehicleId];
      if (demo) { setVehicleInfo(demo.vehicle); setEvents(demo.events); setSummary(demo.summary); }
    } finally { setHistoryLoading(false); }
  };

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    setFilterType("");
    if (id) fetchVehicleHistory(id);
    else { setVehicleInfo(null); setEvents([]); setSummary(null); }
  };

  const handleFilter = () => { if (selectedVehicleId) fetchVehicleHistory(selectedVehicleId); };

  const filteredEvents = events.filter((e) => !filterType || e.eventType === filterType);

  return (
    <div style={styles.wrapper}>
      <Navbar />
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaHistory size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Service History</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Unified timeline of maintenance, inspections, and fuel logs per vehicle</p>
            </div>
          </div>
          <select style={{ ...styles.vehicleSelect, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }} value={selectedVehicleId} onChange={(e) => handleVehicleChange(e.target.value)}>
            <option value="" style={{ background: "#1e1b4b", color: "#fff" }}>— Select a vehicle —</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id} style={{ background: "#1e1b4b", color: "#fff" }}>{v.unitNumber} — {v.make} {v.model} ({v.year})</option>
            ))}
          </select>
        </div>
      </div>
      <div style={styles.container}>

        {/* Fleet overview when no vehicle selected */}
        {!selectedVehicleId && (
          loading ? <div style={styles.emptyState}>Loading fleet data...</div> :
          fleetSummary.length === 0 ? <div style={styles.emptyState}>No vehicles found.</div> : (
            <div style={styles.fleetGrid}>
              {fleetSummary.map((item) => (
                <div key={item.vehicle._id} style={styles.fleetCard} onClick={() => handleVehicleChange(item.vehicle._id)}>
                  <div style={styles.fleetCardHeader}>
                    <strong>{item.vehicle.unitNumber}</strong>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{item.vehicle.make} {item.vehicle.model} {item.vehicle.year}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#d1d5db", marginTop: "8px" }}>
                    <div>Total events: <strong>{item.totalEvents}</strong></div>
                    {item.lastMaintenance && (
                      <div style={{ marginTop: "4px" }}>Last maintenance: <strong>{new Date(item.lastMaintenance.scheduledDate || item.lastMaintenance.completedDate).toLocaleDateString()}</strong></div>
                    )}
                    {item.lastInspection && (
                      <div style={{ marginTop: "4px" }}>Last inspection: <strong>{new Date(item.lastInspection.date).toLocaleDateString()}</strong></div>
                    )}
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#818CF8", fontWeight: 600 }}>View history →</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Vehicle history */}
        {selectedVehicleId && (
          <>
            {vehicleInfo && (
              <div style={styles.vehicleBanner}>
                <div>
                  <strong style={{ fontSize: "18px" }}>{vehicleInfo.unitNumber}</strong>
                  <span style={{ marginLeft: "12px", color: "#6b7280" }}>{vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}</span>
                  {vehicleInfo.odometer && <span style={{ marginLeft: "12px", color: "#6b7280" }}>{vehicleInfo.odometer.toLocaleString()} km</span>}
                </div>
                {vehicleInfo.licensePlate && <span style={{ fontSize: "13px", color: "#6b7280" }}>Plate: {vehicleInfo.licensePlate}</span>}
              </div>
            )}

            {summary && (
              <div style={styles.statsRow}>
                {[
                  { label: "Total Maintenance Cost", value: `$${summary.totalMaintenanceCost.toFixed(2)}` },
                  { label: "Total Fuel Cost", value: `$${summary.totalFuelCost.toFixed(2)}` },
                  { label: "Total Cost", value: `$${summary.totalCost.toFixed(2)}` },
                  { label: "Total Events", value: summary.totalEvents },
                ].map((s) => (
                  <div key={s.label} style={styles.statCard}>
                    <div style={styles.statValue}>{s.value}</div>
                    <div style={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div style={styles.filtersRow}>
              <select style={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Events</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspections</option>
                <option value="fuel">Fuel Logs</option>
              </select>
              <input type="date" style={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
              <input type="date" style={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
              <button style={styles.filterBtn} onClick={handleFilter}>Apply</button>
            </div>

            {historyLoading ? (
              <div style={styles.emptyState}>Loading history...</div>
            ) : filteredEvents.length === 0 ? (
              <div style={styles.emptyState}>No events found for selected filters.</div>
            ) : (
              <div style={styles.timeline}>
                {filteredEvents.map((event, idx) => (
                  <div key={idx} style={styles.timelineItem}>
                    <div style={{ ...styles.timelineBar, background: EVENT_COLORS[event.eventType] || "#6b7280" }} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={{ fontSize: "22px" }}>{EVENT_ICONS[event.eventType]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "15px", color: "#e5e7eb" }}>{event.title}</strong>
                            {event.status && (
                              <span style={{ ...styles.badge, background: STATUS_COLORS[event.status]?.bg || "rgba(255,255,255,0.06)", color: STATUS_COLORS[event.status]?.color || "#9ca3af" }}>
                                {event.status.replace("_", " ")}
                              </span>
                            )}
                            {event.cost > 0 && (
                              <span style={{ ...styles.badge, background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                                ${event.cost.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "3px" }}>
                            {event.date ? new Date(event.date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : ""}
                            {event.odometer ? ` · ${event.odometer.toLocaleString()} km` : ""}
                            {event.detail ? ` · ${event.detail}` : ""}
                          </div>
                          {event.notes && <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>{event.notes}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#0d1117", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" },
  vehicleSelect: { padding: "9px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#1c2128", minWidth: "280px", color: "#e5e7eb" },
  fleetGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  fleetCard: { background: "#161b22", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 1px 6px rgba(0,0,0,0.3)", cursor: "pointer" },
  fleetCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  vehicleBanner: { background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#161b22", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  statValue: { fontSize: "22px", fontWeight: 800, color: "#818CF8" },
  statLabel: { fontSize: "12px", color: "#6b7280", marginTop: "4px" },
  filtersRow: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" },
  select: { padding: "9px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#1c2128", color: "#e5e7eb" },
  dateInput: { padding: "9px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "rgba(255,255,255,0.05)", color: "#e5e7eb" },
  filterBtn: { padding: "9px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" },
  timeline: { display: "flex", flexDirection: "column", gap: "12px" },
  timelineItem: { display: "flex", gap: "0", background: "#161b22", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  timelineBar: { width: "5px", flexShrink: 0 },
  timelineContent: { padding: "16px 18px", flex: 1 },
  timelineHeader: { display: "flex", gap: "12px", alignItems: "flex-start" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "60px 0", color: "#6b7280", fontSize: "15px" },
};

export default ServiceHistory;
