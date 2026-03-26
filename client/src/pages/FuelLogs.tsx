import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { FaGasPump, FaPlus, FaEdit, FaTrashAlt, FaSearch } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const emptyForm = {
  vehicleId: "",
  date: new Date().toISOString().slice(0, 10),
  odometer: "",
  litres: "",
  pricePerLitre: "",
  fuelType: "diesel",
  fuelStation: "",
  city: "",
  notes: "",
};

const DEMO_VEHICLES_FUEL = [
  { _id: "demo-v1", unitNumber: "U-101", make: "Kenworth", model: "T680" },
  { _id: "demo-v2", unitNumber: "U-102", make: "Freightliner", model: "Cascadia" },
  { _id: "demo-v3", unitNumber: "U-103", make: "Ford", model: "Transit 350" },
  { _id: "demo-v5", unitNumber: "U-105", make: "Ram", model: "1500 Classic" },
];

const DEMO_FUEL_LOGS = [
  { _id: "demo-f1", vehicleId: "demo-v1", date: "2026-03-15", odometer: 156340, litres: 420, pricePerLitre: 1.529, fuelType: "diesel", fuelStation: "Petro-Canada", city: "Toronto, ON", totalCost: 642.18, notes: "" },
  { _id: "demo-f2", vehicleId: "demo-v2", date: "2026-03-14", odometer: 204780, litres: 385, pricePerLitre: 1.519, fuelType: "diesel", fuelStation: "Pilot Flying J", city: "Mississauga, ON", totalCost: 584.82, notes: "" },
  { _id: "demo-f3", vehicleId: "demo-v3", date: "2026-03-13", odometer: 34560, litres: 58, pricePerLitre: 1.689, fuelType: "gasoline", fuelStation: "Shell", city: "Brampton, ON", totalCost: 97.97, notes: "" },
  { _id: "demo-f4", vehicleId: "demo-v1", date: "2026-03-08", odometer: 155120, litres: 395, pricePerLitre: 1.549, fuelType: "diesel", fuelStation: "Esso", city: "London, ON", totalCost: 611.56, notes: "Long-haul Windsor run." },
  { _id: "demo-f5", vehicleId: "demo-v5", date: "2026-03-07", odometer: 67890, litres: 72, pricePerLitre: 1.699, fuelType: "gasoline", fuelStation: "Petro-Canada", city: "Oakville, ON", totalCost: 122.33, notes: "" },
  { _id: "demo-f6", vehicleId: "demo-v2", date: "2026-02-28", odometer: 203900, litres: 410, pricePerLitre: 1.499, fuelType: "diesel", fuelStation: "Love's Travel Stop", city: "Hamilton, ON", totalCost: 614.59, notes: "" },
  { _id: "demo-f7", vehicleId: "demo-v3", date: "2026-02-25", odometer: 33880, litres: 54, pricePerLitre: 1.659, fuelType: "gasoline", fuelStation: "Canadian Tire Gas+", city: "Mississauga, ON", totalCost: 89.59, notes: "" },
  { _id: "demo-f8", vehicleId: "demo-v1", date: "2026-02-20", odometer: 153600, litres: 440, pricePerLitre: 1.509, fuelType: "diesel", fuelStation: "Husky", city: "Kitchener, ON", totalCost: 663.96, notes: "Full tank before weekend." },
];

const DEMO_FUEL_STATS = [
  { vehicleId: "demo-v1", totalFillUps: 3, totalLitres: 1255, totalCost: 1917.70, avgL100km: 38.2 },
  { vehicleId: "demo-v2", totalFillUps: 2, totalLitres: 795, totalCost: 1199.41, avgL100km: 37.4 },
  { vehicleId: "demo-v3", totalFillUps: 2, totalLitres: 112, totalCost: 187.56, avgL100km: 16.4 },
  { vehicleId: "demo-v5", totalFillUps: 1, totalLitres: 72, totalCost: 122.33, avgL100km: 14.1 },
];

const FuelLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [logsRes, vehRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/fuel-logs`, { headers }),
        axios.get(`${API_BASE_URL}/vehicles`, { headers }),
        axios.get(`${API_BASE_URL}/fuel-logs/stats`, { headers }),
      ]);
      setLogs(logsRes.data.length > 0 ? logsRes.data : DEMO_FUEL_LOGS);
      setVehicles(vehRes.data.length > 0 ? vehRes.data : DEMO_VEHICLES_FUEL);
      setStats(statsRes.data.length > 0 ? statsRes.data : DEMO_FUEL_STATS);
    } catch (err) {
      console.error("Failed to fetch fuel logs", err);
      setLogs(DEMO_FUEL_LOGS);
      setVehicles(DEMO_VEHICLES_FUEL);
      setStats(DEMO_FUEL_STATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const vehicleMap: Record<string, string> = {};
  vehicles.forEach((v) => { vehicleMap[v._id] = v.unitNumber || `${v.make} ${v.model}`; });

  const openAddModal = () => {
    setEditingLog(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (log: any) => {
    setEditingLog(log);
    setForm({
      vehicleId: log.vehicleId?._id || log.vehicleId || "",
      date: log.date ? log.date.slice(0, 10) : "",
      odometer: log.odometer?.toString() || "",
      litres: log.litres?.toString() || "",
      pricePerLitre: log.pricePerLitre?.toString() || "",
      fuelType: log.fuelType || "diesel",
      fuelStation: log.fuelStation || "",
      city: log.city || "",
      notes: log.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.litres || !form.pricePerLitre) {
      alert("Vehicle, litres, and price per litre are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        odometer: form.odometer ? Number(form.odometer) : undefined,
        litres: Number(form.litres),
        pricePerLitre: Number(form.pricePerLitre),
      };
      if (editingLog) {
        await axios.put(`${API_BASE_URL}/fuel-logs/${editingLog._id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/fuel-logs`, payload, { headers });
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save fuel log");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/fuel-logs/${selectedLog._id}`, { headers });
      setIsDeleteModalOpen(false);
      setSelectedLog(null);
      fetchAll();
    } catch {
      alert("Failed to delete fuel log");
    }
  };

  const handleExport = () => {
    if (!filtered.length) { alert("No fuel logs to export."); return; }
    exportFuelLogs();
  };

  const exportFuelLogs = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fuel Logs");
    worksheet.columns = [
      { header: "Date", key: "date" },
      { header: "Vehicle", key: "vehicle" },
      { header: "Fuel Type", key: "fuelType" },
      { header: "Odometer (km)", key: "odometer" },
      { header: "Litres", key: "litres" },
      { header: "Price/L ($)", key: "pricePerLitre" },
      { header: "Total Cost ($)", key: "totalCost" },
      { header: "Station", key: "fuelStation" },
      { header: "City", key: "city" },
      { header: "Notes", key: "notes" },
    ];
    worksheet.addRows(filtered.map((l: any) => {
      const vId = l.vehicleId?._id || l.vehicleId;
      return {
        date: l.date ? l.date.slice(0, 10) : "",
        vehicle: vehicleMap[vId] || "",
        fuelType: l.fuelType || "",
        odometer: l.odometer != null ? l.odometer : "",
        litres: l.litres != null ? l.litres : "",
        pricePerLitre: l.pricePerLitre != null ? l.pricePerLitre : "",
        totalCost: l.totalCost != null ? l.totalCost : "",
        fuelStation: l.fuelStation || "",
        city: l.city || "",
        notes: l.notes || "",
      };
    }));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fuel_logs_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary totals
  const totalSpent = logs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const totalLitres = logs.reduce((sum, l) => sum + (l.litres || 0), 0);

  const filtered = logs.filter((l) => {
    const q = searchText.toLowerCase();
    const vId = l.vehicleId?._id || l.vehicleId;
    const vehicleName = vehicleMap[vId] || "";
    const matchSearch = vehicleName.toLowerCase().includes(q) || l.fuelStation?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    const matchVehicle = filterVehicle === "all" || vId === filterVehicle;
    return matchSearch && matchVehicle;
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaGasPump size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet Management</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Fuel Logs</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Track fleet fuel consumption and costs</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              Export
            </button>
            <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              <FaPlus size={14} /> Log Fuel-Up
            </button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" }}>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Entries", value: logs.length.toString(), color: "#4F46E5" },
            { label: "Total Litres", value: `${totalLitres.toFixed(0)} L`, color: "#0891b2" },
            { label: "Total Fuel Cost", value: `$${totalSpent.toFixed(2)}`, color: "#dc2626" },
            { label: "Vehicles Tracked", value: new Set(logs.map((l) => l.vehicleId?._id || l.vehicleId)).size.toString(), color: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-Vehicle Stats */}
        {stats.length > 0 && (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#111827" }}>Fuel Efficiency by Vehicle</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {stats.map((s: any) => (
                <div key={s.vehicleId} style={{ background: "#f9fafb", borderRadius: "8px", padding: "14px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827", marginBottom: "8px" }}>{vehicleMap[s.vehicleId] || s.vehicleId}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span>Fill-ups: {s.fillUps ?? s.totalFillUps}</span>
                    <span>Total: {s.totalLitres?.toFixed(1)} L</span>
                    <span>Spent: ${s.totalCost?.toFixed(2)}</span>
                    {s.avgL100km > 0 && <span style={{ color: "#4F46E5", fontWeight: 600 }}>{s.avgL100km?.toFixed(1)} L/100km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input placeholder="Search by vehicle, station, city..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ ...styles.input, paddingLeft: "36px" }} />
          </div>
          <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} style={{ ...styles.input, maxWidth: "180px" }}>
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{vehicleMap[v._id]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading fuel logs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              {logs.length === 0 ? "No fuel logs yet. Log your first fill-up." : "No logs match your filters."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Date", "Vehicle", "Odometer", "Litres", "Price/L", "Total Cost", "Station", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const vId = l.vehicleId?._id || l.vehicleId;
                  return (
                    <tr key={l._id} style={styles.tr}>
                      <td style={styles.td}>{l.date ? new Date(l.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : "—"}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>{vehicleMap[vId] || "—"}</td>
                      <td style={styles.td}>{l.odometer != null ? `${l.odometer.toLocaleString()} km` : "—"}</td>
                      <td style={styles.td}>{l.litres?.toFixed(1)} L</td>
                      <td style={styles.td}>${l.pricePerLitre?.toFixed(3)}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#dc2626" }}>${l.totalCost?.toFixed(2)}</td>
                      <td style={styles.td}>{[l.fuelStation, l.city].filter(Boolean).join(", ") || "—"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEditModal(l)} style={styles.iconBtn} title="Edit"><FaEdit size={14} /></button>
                          <button onClick={() => { setSelectedLog(l); setIsDeleteModalOpen(true); }} style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete"><FaTrashAlt size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editingLog ? "Edit Fuel Log" : "Log Fuel-Up"}</h2>
            <div style={styles.formGrid}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Vehicle *</label>
                <select style={styles.input} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{vehicleMap[v._id]}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Date</label>
                <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Odometer (km)</label>
                <input style={styles.input} type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Litres *</label>
                <input style={styles.input} type="number" step="0.1" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} placeholder="e.g. 120.5" />
              </div>
              <div>
                <label style={styles.label}>Price per Litre ($) *</label>
                <input style={styles.input} type="number" step="0.001" value={form.pricePerLitre} onChange={(e) => setForm({ ...form, pricePerLitre: e.target.value })} placeholder="e.g. 1.589" />
              </div>
              <div>
                <label style={styles.label}>Fuel Type</label>
                <select style={styles.input} value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                  <option value="diesel">Diesel</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Estimated Total</label>
                <div style={{ padding: "9px 12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", fontWeight: 600, color: "#4F46E5" }}>
                  {form.litres && form.pricePerLitre ? `$${(Number(form.litres) * Number(form.pricePerLitre)).toFixed(2)}` : "—"}
                </div>
              </div>
              <div>
                <label style={styles.label}>Fuel Station</label>
                <input style={styles.input} value={form.fuelStation} onChange={(e) => setForm({ ...form, fuelStation: e.target.value })} placeholder="e.g. Petro-Canada" />
              </div>
              <div>
                <label style={styles.label}>City</label>
                <input style={styles.input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, height: "64px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setIsModalOpen(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.primaryBtn} disabled={saving}>
                {saving ? "Saving..." : editingLog ? "Update" : "Log Fuel-Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedLog && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete Fuel Log</h2>
            <p style={{ color: "#374151", marginBottom: "24px" }}>
              Delete this fuel entry for <strong>{vehicleMap[selectedLog.vehicleId?._id || selectedLog.vehicleId]}</strong> on {selectedLog.date ? new Date(selectedLog.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : ""}?
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setIsDeleteModalOpen(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleDelete} style={{ ...styles.primaryBtn, background: "#dc2626" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: { background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  secondaryBtn: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 500, cursor: "pointer" },
  iconBtn: { background: "#f3f4f6", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" },
  statCard: { background: "#fff", borderRadius: "12px", border: "1px solid #e0e7ff", padding: "20px", boxShadow: "0 1px 6px rgba(79,70,229,0.06)" },
  tableContainer: { background: "#fff", borderRadius: "16px", border: "1px solid #e0e7ff", overflow: "hidden", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "#f5f3ff", borderBottom: "2px solid #e0e7ff" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f0f0ff" },
  td: { padding: "14px 16px", color: "#374151", verticalAlign: "middle" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" },
  modal: { background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: "#111827" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
};

export default FuelLogs;
