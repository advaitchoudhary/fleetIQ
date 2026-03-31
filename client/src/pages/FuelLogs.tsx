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
      setLogs(logsRes.data.length > 0 ? logsRes.data : []);
      setVehicles(vehRes.data.length > 0 ? vehRes.data : []);
      setStats(statsRes.data.length > 0 ? statsRes.data : []);
    } catch (err) {
      console.error("Failed to fetch fuel logs", err);
      setLogs([]);
      setVehicles([]);
      setStats([]);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>VEHICLE MANAGEMENT</span>
          <span style={{ color: "var(--t-text-ghost)" }}>›</span>
          <span style={{ color: "var(--t-text-faint)" }}>FUEL LOGS</span>
        </div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Fuel Logs</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Track fleet fuel consumption and costs.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, padding: "10px 18px" }}>
              Export
            </button>
            <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", padding: "10px 20px" }}>
              <FaPlus size={13} /> Log Fuel-Up
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Entries", value: logs.length.toString(), color: "var(--t-indigo)" },
            { label: "Total Litres", value: `${totalLitres.toFixed(0)} L`, color: "var(--t-info)" },
            { label: "Total Fuel Cost", value: `$${totalSpent.toFixed(2)}`, color: "var(--t-error)" },
            { label: "Vehicles Tracked", value: new Set(logs.map((l) => l.vehicleId?._id || l.vehicleId)).size.toString(), color: "var(--t-accent)" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-Vehicle Stats */}
        {stats.length > 0 && (
          <div style={{ background: "var(--t-surface)", borderRadius: "12px", border: "1px solid var(--t-border)", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>Fuel Efficiency by Vehicle</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {stats.map((s: any) => (
                <div key={s.vehicleId} style={{ background: "var(--t-surface-alt)", borderRadius: "8px", padding: "14px", border: "1px solid var(--t-border)" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--t-text-secondary)", marginBottom: "8px" }}>{vehicleMap[s.vehicleId] || s.vehicleId}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-faint)", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span>Fill-ups: {s.fillUps ?? s.totalFillUps}</span>
                    <span>Total: {s.totalLitres?.toFixed(1)} L</span>
                    <span>Spent: ${s.totalCost?.toFixed(2)}</span>
                    {s.avgL100km > 0 && <span style={{ color: "var(--t-indigo)", fontWeight: 600 }}>{s.avgL100km?.toFixed(1)} L/100km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
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
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>Loading fuel logs...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>
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
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-text-secondary)" }}>{vehicleMap[vId] || "—"}</td>
                      <td style={styles.td}>{l.odometer != null ? `${l.odometer.toLocaleString()} km` : "—"}</td>
                      <td style={styles.td}>{l.litres?.toFixed(1)} L</td>
                      <td style={styles.td}>${l.pricePerLitre?.toFixed(3)}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-error)" }}>${l.totalCost?.toFixed(2)}</td>
                      <td style={styles.td}>{[l.fuelStation, l.city].filter(Boolean).join(", ") || "—"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEditModal(l)} style={styles.iconBtn} title="Edit"><FaEdit size={14} /></button>
                          <button onClick={() => { setSelectedLog(l); setIsDeleteModalOpen(true); }} style={{ ...styles.iconBtn, color: "var(--t-error)" }} title="Delete"><FaTrashAlt size={14} /></button>
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
        <div
          style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaGasPump size={18} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{editingLog ? "Edit Fuel Log" : "Log Fuel-Up"}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>Record vehicle fuel consumption details</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ ...styles.formGrid, marginTop: "24px" }}>
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
                  <div style={{ padding: "9px 12px", background: "var(--t-surface-alt)", borderRadius: "8px", border: "1px solid var(--t-border)", fontSize: "14px", fontWeight: 600, color: "var(--t-indigo)" }}>
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
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={saving}>
                {saving ? "Saving..." : editingLog ? "Update" : "Log Fuel-Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedLog && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "420px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaTrashAlt size={18} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Delete Fuel Log</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>This action cannot be undone</div>
                </div>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <p style={{ color: "var(--t-text-muted)", marginTop: "24px", marginBottom: 0 }}>
                Delete this fuel entry for <strong>{vehicleMap[selectedLog.vehicleId?._id || selectedLog.vehicleId]}</strong> on {selectedLog.date ? new Date(selectedLog.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : ""}?
              </p>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: "10px 20px", background: "var(--t-error)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: { background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  secondaryBtn: { background: "var(--t-hover-bg)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 500, cursor: "pointer" },
  iconBtn: { background: "var(--t-hover-bg)", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", alignItems: "center" },
  statCard: { background: "var(--t-surface)", borderRadius: "12px", border: "1px solid var(--t-border)", padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  tableContainer: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "var(--t-surface-alt)", borderBottom: "1px solid var(--t-border)" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--t-indigo)", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  input: { width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" },
  label: { fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
};

export default FuelLogs;
