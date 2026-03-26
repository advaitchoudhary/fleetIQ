import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { FaWrench, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaBell } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "#dbeafe", color: "#1d4ed8" },
  in_progress: { bg: "#fef9c3", color: "#854d0e" },
  completed: { bg: "#dcfce7", color: "#166534" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280" },
};

const TYPE_LABELS: Record<string, string> = {
  preventive: "Preventive",
  corrective: "Corrective",
  inspection: "Inspection",
  tire: "Tire",
  oil_change: "Oil Change",
  other: "Other",
};

const emptyForm = {
  vehicleId: "",
  type: "preventive",
  title: "",
  description: "",
  status: "scheduled",
  scheduledDate: "",
  completedDate: "",
  odometer: "",
  cost: "",
  vendor: "",
  notes: "",
};


const Maintenance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dueAlerts, setDueAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recRes, vehRes, alertRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/maintenance`, { headers }),
        axios.get(`${API_BASE_URL}/vehicles`, { headers }),
        axios.get(`${API_BASE_URL}/maintenance/due-alerts`, { headers }),
      ]);
      setRecords(recRes.data);
      setVehicles(vehRes.data);
      setDueAlerts(alertRes.data);
    } catch (err) {
      console.error("Failed to fetch maintenance data", err);
      setRecords([]);
      setVehicles([]);
      setDueAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const vehicleMap: Record<string, string> = {};
  vehicles.forEach((v) => {
    vehicleMap[v._id] = v.unitNumber || `${v.make} ${v.model}`;
  });

  const openAddModal = () => {
    setEditingRecord(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (rec: any) => {
    setEditingRecord(rec);
    setForm({
      vehicleId: rec.vehicleId?._id || rec.vehicleId || "",
      type: rec.type || "preventive",
      title: rec.title || "",
      description: rec.description || "",
      status: rec.status || "scheduled",
      scheduledDate: rec.scheduledDate ? rec.scheduledDate.slice(0, 10) : "",
      completedDate: rec.completedDate ? rec.completedDate.slice(0, 10) : "",
      odometer: rec.odometer?.toString() || "",
      cost: rec.cost?.toString() || "",
      vendor: rec.vendor || "",
      notes: rec.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.title.trim()) {
      alert("Vehicle and title are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        odometer: form.odometer ? Number(form.odometer) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        scheduledDate: form.scheduledDate || undefined,
        completedDate: form.completedDate || undefined,
      };
      if (editingRecord) {
        await axios.put(`${API_BASE_URL}/maintenance/${editingRecord._id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/maintenance`, payload, { headers });
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/maintenance/${selectedRecord._id}`, { headers });
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);
      fetchAll();
    } catch {
      alert("Failed to delete record");
    }
  };

  const handleExport = () => {
    if (!filtered.length) { alert("No maintenance records to export."); return; }
    exportMaintenance();
  };

  const exportMaintenance = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Maintenance");
    worksheet.columns = [
      { header: "Vehicle", key: "vehicle" },
      { header: "Title", key: "title" },
      { header: "Type", key: "type" },
      { header: "Status", key: "status" },
      { header: "Scheduled Date", key: "scheduledDate" },
      { header: "Completed Date", key: "completedDate" },
      { header: "Odometer (km)", key: "odometer" },
      { header: "Cost ($)", key: "cost" },
      { header: "Vendor", key: "vendor" },
      { header: "Notes", key: "notes" },
    ];
    worksheet.addRows(filtered.map((r: any) => {
      const vId = r.vehicleId?._id || r.vehicleId;
      return {
        vehicle: vehicleMap[vId] || "",
        title: r.title || "",
        type: TYPE_LABELS[r.type] || r.type || "",
        status: r.status?.replace(/_/g, " ") || "",
        scheduledDate: r.scheduledDate ? r.scheduledDate.slice(0, 10) : "",
        completedDate: r.completedDate ? r.completedDate.slice(0, 10) : "",
        odometer: r.odometer != null ? r.odometer : "",
        cost: r.cost != null ? r.cost : "",
        vendor: r.vendor || "",
        notes: r.notes || "",
      };
    }));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "maintenance_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = records.filter((r) => {
    const q = searchText.toLowerCase();
    const vehicleName = vehicleMap[r.vehicleId?._id || r.vehicleId] || "";
    const matchSearch =
      r.title?.toLowerCase().includes(q) ||
      r.vendor?.toLowerCase().includes(q) ||
      vehicleName.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaWrench size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet Management</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Maintenance</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Track maintenance & work orders</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" as const }}>
            {dueAlerts.length > 0 && (
              <button onClick={() => setShowAlerts(!showAlerts)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "8px", color: "#fde68a", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                <FaBell size={14} /> {dueAlerts.length} Due Soon
              </button>
            )}
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              Export
            </button>
            <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              <FaPlus size={14} /> Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" }}>

        {/* Due Alerts Panel */}
        {showAlerts && dueAlerts.length > 0 && (
          <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#854d0e" }}>Maintenance Due Within 14 Days</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dueAlerts.map((alert: any) => (
                <div key={alert._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#713f12" }}>
                  <span><strong>{vehicleMap[alert.vehicleId?._id || alert.vehicleId] || "Vehicle"}</strong> — {alert.title}</span>
                  <span style={{ color: "#854d0e" }}>{alert.scheduledDate ? new Date(alert.scheduledDate).toLocaleDateString() : "TBD"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "240px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              placeholder="Search by title, vendor, vehicle..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ ...styles.input, paddingLeft: "36px" }}
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...styles.input, maxWidth: "160px" }}>
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading maintenance records...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              {records.length === 0 ? "No maintenance records yet. Schedule your first one." : "No records match your filters."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Vehicle", "Title", "Type", "Scheduled Date", "Cost", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const sc = STATUS_COLORS[r.status] || STATUS_COLORS.scheduled;
                  const vId = r.vehicleId?._id || r.vehicleId;
                  return (
                    <tr key={r._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>{vehicleMap[vId] || "—"}</td>
                      <td style={styles.td}>{r.title}</td>
                      <td style={styles.td}>{TYPE_LABELS[r.type] || r.type}</td>
                      <td style={styles.td}>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : "—"}</td>
                      <td style={styles.td}>{r.cost != null ? `$${r.cost.toFixed(2)}` : "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                          {r.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEditModal(r)} style={styles.iconBtn} title="Edit"><FaEdit size={14} /></button>
                          <button onClick={() => { setSelectedRecord(r); setIsDeleteModalOpen(true); }} style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete"><FaTrashAlt size={14} /></button>
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
            <h2 style={styles.modalTitle}>{editingRecord ? "Edit Maintenance Record" : "Schedule Maintenance"}</h2>
            <div style={styles.formGrid}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Vehicle *</label>
                <select style={styles.input} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.unitNumber} {v.make ? `— ${v.make} ${v.model}` : ""}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Title *</label>
                <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Oil change, Tire rotation" />
              </div>
              <div>
                <label style={styles.label}>Type</label>
                <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="inspection">Inspection</option>
                  <option value="tire">Tire</option>
                  <option value="oil_change">Oil Change</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Scheduled Date</label>
                <input style={styles.input} type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Completed Date</label>
                <input style={styles.input} type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Odometer (km)</label>
                <input style={styles.input} type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Cost ($)</label>
                <input style={styles.input} type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Vendor / Shop</label>
                <input style={styles.input} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Bob's Auto Shop" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: "72px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setIsModalOpen(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.primaryBtn} disabled={saving}>
                {saving ? "Saving..." : editingRecord ? "Update" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedRecord && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete Record</h2>
            <p style={{ color: "#374151", marginBottom: "24px" }}>
              Are you sure you want to delete <strong>{selectedRecord.title}</strong>?
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
  tableContainer: { background: "#fff", borderRadius: "16px", border: "1px solid #e0e7ff", overflow: "hidden", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "#f5f3ff", borderBottom: "2px solid #e0e7ff" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f0f0ff" },
  td: { padding: "14px 16px", color: "#374151", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" },
  modal: { background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: "#111827" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
};

export default Maintenance;
