import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { FaWrench, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaBell } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "var(--t-indigo-bg)", color: "var(--t-indigo)" },
  in_progress: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  completed: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  cancelled: { bg: "var(--t-hover-bg)", color: "var(--t-text-faint)" },
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
  nextInspectionDate: "",
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
      nextInspectionDate: rec.nextInspectionDate ? rec.nextInspectionDate.slice(0, 10) : "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.title.trim()) {
      alert("Vehicle and title are required.");
      return;
    }
    if (form.title.trim().length > 100) {
      alert("Title must be 100 characters or fewer.");
      return;
    }
    if (form.odometer !== "") {
      const odo = Number(form.odometer);
      if (!Number.isInteger(odo) || odo < 0 || odo > 10_000_000) {
        alert("Odometer must be a whole number between 0 and 10,000,000 km.");
        return;
      }
    }
    if (form.cost !== "") {
      const cost = Number(form.cost);
      if (isNaN(cost) || cost < 0) {
        alert("Cost must be a positive number.");
        return;
      }
    }
    if (!form.scheduledDate) {
      alert("Scheduled date is required.");
      return;
    }
    if (form.status === "completed" && !form.completedDate) {
      alert("Completed date is required when status is Completed.");
      return;
    }
    if (form.completedDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const comp = new Date(form.completedDate + "T00:00:00");
      if (comp > today) {
        alert("Completed date cannot be in the future.");
        return;
      }
      if (form.scheduledDate) {
        const sched = new Date(form.scheduledDate + "T00:00:00");
        if (comp < sched) {
          alert("Completed date cannot be before the scheduled date.");
          return;
        }
      }
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        odometer: form.odometer ? Number(form.odometer) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        scheduledDate: form.scheduledDate || undefined,
        completedDate: form.completedDate || undefined,
        nextInspectionDate: form.nextInspectionDate || undefined,
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
      { header: "Next Inspection Date", key: "nextInspectionDate" },
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
        nextInspectionDate: r.nextInspectionDate ? r.nextInspectionDate.slice(0, 10) : "",
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>VEHICLE MANAGEMENT</span>
          <span style={{ color: "var(--t-text-ghost)" }}>›</span>
          <span style={{ color: "var(--t-text-faint)" }}>MAINTENANCE</span>
        </div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Maintenance</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Track work orders, service records, and upcoming maintenance tasks.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            {dueAlerts.length > 0 && (
              <button onClick={() => setShowAlerts(!showAlerts)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-warning-bg)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", color: "var(--t-warning)", fontSize: "13px", fontWeight: 600, padding: "10px 18px" }}>
                <FaBell size={14} /> {dueAlerts.length} Due Soon
              </button>
            )}
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, padding: "10px 18px" }}>
              Export
            </button>
            <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", padding: "10px 20px" }}>
              <FaPlus size={13} /> Schedule Maintenance
            </button>
          </div>
        </div>

        {/* Due Alerts Panel */}
        {showAlerts && dueAlerts.length > 0 && (
          <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "var(--t-warning)" }}>Maintenance Due Within 14 Days</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dueAlerts.map((alert: any) => (
                <div key={alert._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--t-text-muted)" }}>
                  <span><strong>{vehicleMap[alert.vehicleId?._id || alert.vehicleId] || "Vehicle"}</strong> — {alert.title}</span>
                  <span style={{ color: "var(--t-warning)" }}>{alert.scheduledDate ? new Date(alert.scheduledDate).toLocaleDateString() : "TBD"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "240px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
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
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>Loading maintenance records...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>
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
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-text-secondary)" }}>{vehicleMap[vId] || "—"}</td>
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
                          <button onClick={() => { setSelectedRecord(r); setIsDeleteModalOpen(true); }} style={{ ...styles.iconBtn, color: "var(--t-error)" }} title="Delete"><FaTrashAlt size={14} /></button>
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
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-indigo)" }}>
                  <FaEdit size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{editingRecord ? "Edit Maintenance Record" : "Schedule Maintenance"}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{editingRecord ? "Update maintenance record details" : "Create a new maintenance work order"}</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              {/* Section: Assignment */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>ASSIGNMENT</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>
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
                  <input
                    style={{ ...styles.input, ...(form.title.trim().length > 100 ? { borderColor: "var(--t-error)" } : {}) }}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Oil change, Tire rotation"
                    maxLength={100}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: form.title.trim().length > 90 ? "var(--t-warning)" : "var(--t-text-ghost)", fontWeight: 500, textAlign: "right" }}>{form.title.length}/100</p>
                </div>
              </div>
              {/* Section: Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>DETAILS</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>
              <div style={styles.formGrid}>
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
                  {(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const sched = form.scheduledDate ? new Date(form.scheduledDate + "T00:00:00") : null;
                    const isOverdue = sched && sched < today && (form.status === "scheduled" || form.status === "in_progress");
                    const daysOverdue = isOverdue ? Math.abs(Math.ceil((sched!.getTime() - today.getTime()) / 86_400_000)) : null;
                    return (
                      <>
                        <label style={styles.label}>Scheduled Date *</label>
                        <input
                          style={{ ...styles.input, ...(isOverdue ? { borderColor: "var(--t-warning)" } : {}) }}
                          type="date"
                          value={form.scheduledDate}
                          onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                        />
                        {isOverdue && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-warning)", fontWeight: 500 }}>⚠ Overdue by {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}.</p>}
                      </>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const sched = form.scheduledDate ? new Date(form.scheduledDate + "T00:00:00") : null;
                    const comp = form.completedDate ? new Date(form.completedDate + "T00:00:00") : null;
                    const isBeforeSched = sched && comp && comp < sched;
                    const isFuture = comp && comp > today;
                    const isRequired = form.status === "completed" && !form.completedDate;
                    const hasError = isBeforeSched || isFuture;
                    return (
                      <>
                        <label style={styles.label}>Completed Date{form.status === "completed" ? " *" : ""}</label>
                        <input
                          style={{ ...styles.input, ...(hasError || isRequired ? { borderColor: "var(--t-error)" } : {}) }}
                          type="date"
                          value={form.completedDate}
                          onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                        />
                        {isBeforeSched && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>⚠ Cannot be before the scheduled date.</p>}
                        {!isBeforeSched && isFuture && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>⚠ Cannot be in the future.</p>}
                        {isRequired && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Required when status is Completed.</p>}
                      </>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const next = form.nextInspectionDate ? new Date(form.nextInspectionDate + "T00:00:00") : null;
                    const isOverdue = next && next < today;
                    const daysUntil = next ? Math.ceil((next.getTime() - today.getTime()) / 86_400_000) : null;
                    const isSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;
                    return (
                      <>
                        <label style={styles.label}>Next Inspection Date</label>
                        <input
                          style={{ ...styles.input, ...(isOverdue ? { borderColor: "var(--t-error)" } : isSoon ? { borderColor: "var(--t-warning)" } : {}) }}
                          type="date"
                          value={form.nextInspectionDate}
                          onChange={(e) => setForm({ ...form, nextInspectionDate: e.target.value })}
                        />
                        {isOverdue && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>⚠ Overdue by {Math.abs(daysUntil!)} day{Math.abs(daysUntil!) !== 1 ? "s" : ""}.</p>}
                        {isSoon && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-warning)", fontWeight: 500 }}>⚠ Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}.</p>}
                      </>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const odo = form.odometer !== "" ? Number(form.odometer) : null;
                    const isInvalid = odo !== null && (!Number.isInteger(odo) || odo < 0 || odo > 10_000_000);
                    return (
                      <>
                        <label style={styles.label}>Odometer (km)</label>
                        <input
                          style={{ ...styles.input, ...(isInvalid ? { borderColor: "var(--t-error)" } : {}) }}
                          type="number"
                          min={0}
                          max={10_000_000}
                          step={1}
                          value={form.odometer}
                          onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                          placeholder="e.g. 150000"
                        />
                        {isInvalid && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Must be a whole number between 0 and 10,000,000.</p>}
                      </>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const cost = form.cost !== "" ? Number(form.cost) : null;
                    const isInvalid = cost !== null && (isNaN(cost) || cost < 0);
                    return (
                      <>
                        <label style={styles.label}>Cost ($)</label>
                        <input
                          style={{ ...styles.input, ...(isInvalid ? { borderColor: "var(--t-error)" } : {}) }}
                          type="number"
                          step="0.01"
                          min={0}
                          value={form.cost}
                          onChange={(e) => setForm({ ...form, cost: e.target.value })}
                          placeholder="e.g. 250.00"
                        />
                        {isInvalid && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Cost must be a positive number.</p>}
                      </>
                    );
                  })()}
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
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={saving}>
                {saving ? "Saving..." : editingRecord ? "Update" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedRecord && (
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
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-indigo)" }}>
                  <FaTrashAlt size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Delete Record</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>This action cannot be undone</div>
                </div>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <p style={{ marginTop: "24px", textAlign: "center", color: "var(--t-text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{selectedRecord.title}</strong>? This action cannot be undone.
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
  tableContainer: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "var(--t-surface-alt)", borderBottom: "1px solid var(--t-border)" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--t-indigo)", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" },
  input: { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--t-border-strong)", fontSize: "14px", color: "var(--t-text)", background: "var(--t-input-bg)", outline: "none", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
  label: { display: "block", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", marginBottom: "7px", letterSpacing: "0.8px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
};

export default Maintenance;
