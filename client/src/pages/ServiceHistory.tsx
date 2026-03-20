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
  completed: { bg: "#d1fae5", color: "#065f46" },
  scheduled: { bg: "#e0e7ff", color: "#3730a3" },
  in_progress: { bg: "#fef3c7", color: "#92400e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  satisfactory: { bg: "#d1fae5", color: "#065f46" },
  defects_noted: { bg: "#fef3c7", color: "#92400e" },
  out_of_service: { bg: "#fee2e2", color: "#991b1b" },
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
      setFleetSummary(Array.isArray(s) ? s : []);
      setVehicles(Array.isArray(v) ? v : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFleetSummary(); }, [fetchFleetSummary]);

  const fetchVehicleHistory = async (vehicleId: string) => {
    if (!vehicleId) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      const res = await fetch(`${API_BASE_URL}/service-history/${vehicleId}?${params}`, { headers });
      const data = await res.json();
      setVehicleInfo(data.vehicle);
      setEvents(data.events || []);
      setSummary(data.summary);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
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
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaHistory style={{ color: "#4F46E5" }} /> Service History
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Unified timeline of all maintenance, inspections, and fuel logs per vehicle</p>
          </div>
          <select style={styles.vehicleSelect} value={selectedVehicleId} onChange={(e) => handleVehicleChange(e.target.value)}>
            <option value="">— Select a vehicle —</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model} ({v.year})</option>
            ))}
          </select>
        </div>

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
                  <div style={{ fontSize: "13px", color: "#374151", marginTop: "8px" }}>
                    <div>Total events: <strong>{item.totalEvents}</strong></div>
                    {item.lastMaintenance && (
                      <div style={{ marginTop: "4px" }}>Last maintenance: <strong>{new Date(item.lastMaintenance.scheduledDate || item.lastMaintenance.completedDate).toLocaleDateString()}</strong></div>
                    )}
                    {item.lastInspection && (
                      <div style={{ marginTop: "4px" }}>Last inspection: <strong>{new Date(item.lastInspection.date).toLocaleDateString()}</strong></div>
                    )}
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#4F46E5", fontWeight: 600 }}>View history →</div>
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
                            <strong style={{ fontSize: "15px", color: "#111827" }}>{event.title}</strong>
                            {event.status && (
                              <span style={{ ...styles.badge, background: STATUS_COLORS[event.status]?.bg || "#f3f4f6", color: STATUS_COLORS[event.status]?.color || "#374151" }}>
                                {event.status.replace("_", " ")}
                              </span>
                            )}
                            {event.cost > 0 && (
                              <span style={{ ...styles.badge, background: "#f3f4f6", color: "#374151" }}>
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
  wrapper: { minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "24px" },
  vehicleSelect: { padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#fff", minWidth: "280px", color: "#111827" },
  fleetGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  fleetCard: { background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer" },
  fleetCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  vehicleBanner: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statValue: { fontSize: "22px", fontWeight: 800, color: "#4F46E5" },
  statLabel: { fontSize: "12px", color: "#6b7280", marginTop: "4px" },
  filtersRow: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" },
  select: { padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#fff" },
  dateInput: { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" },
  filterBtn: { padding: "9px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" },
  timeline: { display: "flex", flexDirection: "column", gap: "12px" },
  timelineItem: { display: "flex", gap: "0", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  timelineBar: { width: "5px", flexShrink: 0 },
  timelineContent: { padding: "16px 18px", flex: 1 },
  timelineHeader: { display: "flex", gap: "12px", alignItems: "flex-start" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "60px 0", color: "#6b7280", fontSize: "15px" },
};

export default ServiceHistory;
