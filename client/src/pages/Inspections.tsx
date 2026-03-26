import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckSquare, FaPlus, FaSearch, FaEye, FaClipboardCheck } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  satisfactory: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  defects_noted: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  out_of_service: { bg: "var(--t-error-bg)", color: "var(--t-error)" },
};

const TYPE_LABELS: Record<string, string> = {
  pre_trip: "Pre-Trip",
  post_trip: "Post-Trip",
  annual: "Annual",
};


const Inspections: React.FC = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [defaultChecklist, setDefaultChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInspection, setViewingInspection] = useState<any>(null);
  const [form, setForm] = useState({
    vehicleId: "",
    type: "pre_trip",
    date: new Date().toISOString().slice(0, 10),
    odometer: "",
    notes: "",
  });
  const [checklist, setChecklist] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inspRes, vehRes, checkRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/inspections`, { headers }),
        axios.get(`${API_BASE_URL}/vehicles`, { headers }),
        axios.get(`${API_BASE_URL}/inspections/default-checklist`, { headers }),
      ]);
      setInspections(inspRes.data || []);
      setVehicles(vehRes.data || []);
      setDefaultChecklist(checkRes.data);
    } catch (err) {
      console.error("Failed to fetch inspections", err);
      setInspections([]);
      setVehicles([]);
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
    setForm({ vehicleId: "", type: "pre_trip", date: new Date().toISOString().slice(0, 10), odometer: "", notes: "" });
    setChecklist(defaultChecklist.map((item: any) => ({ ...item, status: "ok", notes: "" })));
    setIsModalOpen(true);
  };

  const handleChecklistChange = (index: number, field: "status" | "notes", value: string) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value };
    setChecklist(updated);
  };

  const handleSave = async () => {
    if (!form.vehicleId) {
      alert("Please select a vehicle.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/inspections`,
        { ...form, odometer: form.odometer ? Number(form.odometer) : undefined, checklistItems: checklist },
        { headers }
      );
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit inspection");
    } finally {
      setSaving(false);
    }
  };

  const filtered = inspections.filter((i) => {
    const vId = i.vehicleId?._id || i.vehicleId;
    const vehicleName = vehicleMap[vId] || "";
    const q = searchText.toLowerCase();
    const matchSearch = vehicleName.toLowerCase().includes(q) || i.type?.includes(q);
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchType = filterType === "all" || i.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const groupedChecklist = viewingInspection?.checklistItems?.reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) || {};

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaCheckSquare size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Inspections (DVIR)</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Driver Vehicle Inspection Reports</p>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
            <FaPlus size={14} /> New Inspection
          </button>
        </div>
      </div>
      <div style={{ padding: "28px 40px", maxWidth: "1300px", margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total", value: inspections.length, color: "var(--t-accent)" },
            { label: "Satisfactory", value: inspections.filter((i) => i.status === "satisfactory").length, color: "var(--t-success)" },
            { label: "Defects Noted", value: inspections.filter((i) => i.status === "defects_noted").length, color: "var(--t-warning)" },
            { label: "Out of Service", value: inspections.filter((i) => i.status === "out_of_service").length, color: "var(--t-error)" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
            <input placeholder="Search by vehicle..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ ...styles.input, paddingLeft: "36px" }} />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...styles.input, maxWidth: "150px" }}>
            <option value="all">All Types</option>
            <option value="pre_trip">Pre-Trip</option>
            <option value="post_trip">Post-Trip</option>
            <option value="annual">Annual</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...styles.input, maxWidth: "160px" }}>
            <option value="all">All Statuses</option>
            <option value="satisfactory">Satisfactory</option>
            <option value="defects_noted">Defects Noted</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>Loading inspections...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>
              {inspections.length === 0 ? "No inspections yet. Submit your first DVIR." : "No inspections match your filters."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Date", "Vehicle", "Type", "Driver", "Odometer", "Defects", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const sc = STATUS_COLORS[i.status] || STATUS_COLORS.satisfactory;
                  const vId = i.vehicleId?._id || i.vehicleId;
                  const defectCount = (i.checklistItems || []).filter((c: any) => c.status === "defect").length;
                  return (
                    <tr key={i._id} style={styles.tr}>
                      <td style={styles.td}>{i.date ? new Date(i.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : "—"}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-text-secondary)" }}>{vehicleMap[vId] || "—"}</td>
                      <td style={styles.td}>{TYPE_LABELS[i.type] || i.type}</td>
                      <td style={styles.td}>{i.driverId?.name || (typeof i.driverId === "string" ? i.driverId : "—")}</td>
                      <td style={styles.td}>{i.odometer != null ? `${i.odometer.toLocaleString()} km` : "—"}</td>
                      <td style={styles.td}>
                        {defectCount > 0 ? (
                          <span style={{ color: "var(--t-error)", fontWeight: 600 }}>{defectCount} defect{defectCount > 1 ? "s" : ""}</span>
                        ) : (
                          <span style={{ color: "var(--t-text-dim)" }}>None</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                          {i.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => setViewingInspection(i)} style={styles.iconBtn} title="View">
                          <FaEye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Inspection Modal */}
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
                  <FaClipboardCheck size={18} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>New Inspection (DVIR)</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>Submit a Driver Vehicle Inspection Report</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ ...styles.formGrid, marginTop: "24px" }}>
                <div>
                  <label style={styles.label}>Vehicle *</label>
                  <select style={styles.input} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} {v.make ? `— ${v.make} ${v.model}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Inspection Type</label>
                  <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="pre_trip">Pre-Trip</option>
                    <option value="post_trip">Post-Trip</option>
                    <option value="annual">Annual</option>
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
              </div>

              {/* Checklist */}
              <div style={{ marginTop: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)", marginBottom: "12px" }}>Inspection Checklist</h3>
                {checklist.length === 0 && <p style={{ color: "var(--t-text-dim)", fontSize: "13px" }}>Loading checklist...</p>}
                {Array.from(new Set(checklist.map((c) => c.category))).map((cat) => (
                  <div key={cat as string} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{cat as string}</div>
                    {checklist.filter((c) => c.category === cat).map((item, idx) => {
                      const realIdx = checklist.indexOf(item);
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--t-border)" }}>
                          <div style={{ flex: 1, fontSize: "13px", color: "var(--t-text-muted)" }}>{item.item}</div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer", color: item.status === "ok" ? "var(--t-success)" : "var(--t-text-dim)" }}>
                              <input type="radio" name={`item-${realIdx}`} value="ok" checked={item.status === "ok"} onChange={() => handleChecklistChange(realIdx, "status", "ok")} />
                              OK
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer", color: item.status === "defect" ? "var(--t-error)" : "var(--t-text-dim)" }}>
                              <input type="radio" name={`item-${realIdx}`} value="defect" checked={item.status === "defect"} onChange={() => handleChecklistChange(realIdx, "status", "defect")} />
                              Defect
                            </label>
                          </div>
                          {item.status === "defect" && (
                            <input
                              placeholder="Describe defect..."
                              value={item.notes || ""}
                              onChange={(e) => handleChecklistChange(realIdx, "notes", e.target.value)}
                              style={{ ...styles.input, maxWidth: "220px", fontSize: "12px" }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={styles.label}>Additional Notes</label>
                <textarea style={{ ...styles.input, height: "64px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={saving}>
                {saving ? "Submitting..." : "Submit Inspection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Inspection Modal */}
      {viewingInspection && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setViewingInspection(null)}
        >
          <div
            style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaClipboardCheck size={18} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Inspection Report</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>
                    {TYPE_LABELS[viewingInspection.type]} — {viewingInspection.date ? new Date(viewingInspection.date).toLocaleDateString(undefined, { timeZone: "UTC" }) : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ ...styles.badge, ...STATUS_COLORS[viewingInspection.status], fontSize: "13px", padding: "4px 12px" }}>
                  {viewingInspection.status?.replace(/_/g, " ")}
                </span>
                <button onClick={() => setViewingInspection(null)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px", marginBottom: "20px", fontSize: "13px" }}>
                <div><span style={{ color: "var(--t-text-dim)" }}>Vehicle:</span> <strong>{vehicleMap[viewingInspection.vehicleId?._id || viewingInspection.vehicleId] || "—"}</strong></div>
                <div><span style={{ color: "var(--t-text-dim)" }}>Driver:</span> <strong>{viewingInspection.driverId?.name || "—"}</strong></div>
                <div><span style={{ color: "var(--t-text-dim)" }}>Odometer:</span> <strong>{viewingInspection.odometer != null ? `${viewingInspection.odometer.toLocaleString()} km` : "—"}</strong></div>
                <div><span style={{ color: "var(--t-text-dim)" }}>Defects:</span> <strong style={{ color: (viewingInspection.checklistItems || []).filter((c: any) => c.status === "defect").length > 0 ? "var(--t-error)" : "var(--t-success)" }}>
                  {(viewingInspection.checklistItems || []).filter((c: any) => c.status === "defect").length} found
                </strong></div>
              </div>

              {Object.entries(groupedChecklist).map(([cat, items]: any) => (
                <div key={cat} style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{cat}</div>
                  {items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--t-border)", fontSize: "13px" }}>
                      <span style={{ color: "var(--t-text-muted)" }}>{item.item}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {item.notes && <span style={{ color: "var(--t-text-faint)", fontSize: "12px" }}>{item.notes}</span>}
                        <span style={{ ...styles.badge, ...(item.status === "ok" ? { background: "var(--t-success-bg)", color: "var(--t-success)" } : { background: "var(--t-error-bg)", color: "var(--t-error)" }) }}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {viewingInspection.notes && (
                <div style={{ marginTop: "16px", padding: "12px 16px", background: "var(--t-surface-alt)", borderRadius: "8px", border: "1px solid var(--t-border)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Additional Notes</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-muted)" }}>{viewingInspection.notes}</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setViewingInspection(null)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Close</button>
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
  th: { padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--t-indigo)", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" },
  input: { width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" },
  label: { fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
};

export default Inspections;
