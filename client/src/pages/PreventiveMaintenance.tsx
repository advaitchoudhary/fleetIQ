import React, { useState, useEffect, useCallback } from "react";
import { FaTools, FaPlus, FaEdit, FaTrashAlt, FaWrench } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const MAINTENANCE_TYPES = ["preventive", "inspection", "tire", "oil_change", "other"];
const VEHICLE_TYPES = ["truck", "trailer", "van", "pickup", "other"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  on_track: { bg: "#d1fae5", color: "#065f46" },
  due_soon: { bg: "#fef3c7", color: "#92400e" },
  overdue: { bg: "#fee2e2", color: "#991b1b" },
};

const emptyTemplateForm = {
  name: "", description: "", maintenanceType: "preventive",
  intervalKm: "", intervalDays: "", estimatedCost: "",
  estimatedDuration: "", vendor: "", applicableVehicleTypes: [] as string[], notes: "",
};

const emptyScheduleForm = {
  vehicleId: "", templateId: "", lastCompletedDate: "", lastCompletedOdometer: "", notes: "",
};

const PreventiveMaintenance: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dueSchedules, setDueSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedules" | "templates">("schedules");
  const [searchText, setSearchText] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"template" | "schedule">("template");
  const [templateForm, setTemplateForm] = useState({ ...emptyTemplateForm });
  const [scheduleForm, setScheduleForm] = useState({ ...emptyScheduleForm });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes, vRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pm/templates`, { headers }),
        fetch(`${API_BASE_URL}/pm/schedules`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/pm/schedules/due`, { headers }),
      ]);
      const [t, s, v, d] = await Promise.all([tRes.json(), sRes.json(), vRes.json(), dRes.json()]);
      setTemplates(Array.isArray(t) ? t : []);
      setSchedules(Array.isArray(s) ? s : []);
      setVehicles(Array.isArray(v) ? v : []);
      setDueSchedules(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAddTemplate = () => { setEditingTemplate(null); setTemplateForm({ ...emptyTemplateForm }); setIsTemplateModalOpen(true); };
  const openEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name || "", description: t.description || "",
      maintenanceType: t.maintenanceType || "preventive",
      intervalKm: t.intervalKm != null ? String(t.intervalKm) : "",
      intervalDays: t.intervalDays != null ? String(t.intervalDays) : "",
      estimatedCost: t.estimatedCost != null ? String(t.estimatedCost) : "",
      estimatedDuration: t.estimatedDuration != null ? String(t.estimatedDuration) : "",
      vendor: t.vendor || "", applicableVehicleTypes: t.applicableVehicleTypes || [], notes: t.notes || "",
    });
    setIsTemplateModalOpen(true);
  };

  const openAddSchedule = () => { setEditingSchedule(null); setScheduleForm({ ...emptyScheduleForm }); setIsScheduleModalOpen(true); };
  const openEditSchedule = (s: any) => {
    setEditingSchedule(s);
    setScheduleForm({
      vehicleId: s.vehicleId?._id || s.vehicleId || "",
      templateId: s.templateId?._id || s.templateId || "",
      lastCompletedDate: s.lastCompletedDate ? s.lastCompletedDate.slice(0, 10) : "",
      lastCompletedOdometer: s.lastCompletedOdometer != null ? String(s.lastCompletedOdometer) : "",
      notes: s.notes || "",
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const body = {
        ...templateForm,
        intervalKm: templateForm.intervalKm ? Number(templateForm.intervalKm) : undefined,
        intervalDays: templateForm.intervalDays ? Number(templateForm.intervalDays) : undefined,
        estimatedCost: templateForm.estimatedCost ? Number(templateForm.estimatedCost) : 0,
        estimatedDuration: templateForm.estimatedDuration ? Number(templateForm.estimatedDuration) : undefined,
      };
      const url = editingTemplate ? `${API_BASE_URL}/pm/templates/${editingTemplate._id}` : `${API_BASE_URL}/pm/templates`;
      await fetch(url, { method: editingTemplate ? "PUT" : "POST", headers, body: JSON.stringify(body) });
      setIsTemplateModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const body = {
        ...scheduleForm,
        lastCompletedOdometer: scheduleForm.lastCompletedOdometer ? Number(scheduleForm.lastCompletedOdometer) : undefined,
      };
      const url = editingSchedule ? `${API_BASE_URL}/pm/schedules/${editingSchedule._id}` : `${API_BASE_URL}/pm/schedules`;
      await fetch(url, { method: editingSchedule ? "PUT" : "POST", headers, body: JSON.stringify(body) });
      setIsScheduleModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const url = deleteType === "template"
      ? `${API_BASE_URL}/pm/templates/${selectedItem._id}`
      : `${API_BASE_URL}/pm/schedules/${selectedItem._id}`;
    await fetch(url, { method: "DELETE", headers });
    setIsDeleteModalOpen(false);
    fetchAll();
  };

  const handleGenerate = async (scheduleId: string) => {
    setGenerating(scheduleId);
    try {
      await fetch(`${API_BASE_URL}/pm/schedules/${scheduleId}/generate`, { method: "POST", headers });
      fetchAll();
    } catch (err) { console.error(err); }
    setGenerating(null);
  };

  const filteredSchedules = schedules.filter((s) =>
    !searchText ||
    s.vehicleId?.unitNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
    s.templateId?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredTemplates = templates.filter((t) =>
    !searchText || t.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const overdueCount = dueSchedules.filter((s) => s.status === "overdue").length;
  const dueSoonCount = dueSchedules.filter((s) => s.status === "due_soon").length;

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaTools style={{ color: "#4F46E5" }} /> Preventive Maintenance
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>PM templates, schedules, and automated work order generation</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={styles.secondaryBtn} onClick={openAddSchedule}><FaWrench size={13} /> Assign to Vehicle</button>
            <button style={styles.primaryBtn} onClick={openAddTemplate}><FaPlus size={13} /> New Template</button>
          </div>
        </div>

        {dueSchedules.length > 0 && (
          <div style={styles.alertBanner}>
            {overdueCount > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>🔴 {overdueCount} overdue </span>}
            {dueSoonCount > 0 && <span style={{ color: "#92400e", fontWeight: 700 }}>⚠ {dueSoonCount} due soon</span>}
            <span style={{ marginLeft: "8px" }}>— review schedules below</span>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabRow}>
          {([["schedules", "Schedules"], ["templates", "PM Templates"]] as const).map(([key, label]) => (
            <button key={key} style={{ ...styles.tab, ...(activeTab === key ? styles.activeTab : {}) }} onClick={() => { setActiveTab(key); setSearchText(""); }}>
              {label}
            </button>
          ))}
        </div>

        <div style={styles.filtersRow}>
          <input style={styles.searchInput} placeholder={activeTab === "schedules" ? "Search by vehicle or PM task..." : "Search templates..."} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : activeTab === "schedules" ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Vehicle", "PM Task", "Last Completed", "Last Odometer", "Next Due Date", "Next Due Odometer", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#6b7280", padding: "40px" }}>No schedules yet. Assign a PM template to a vehicle.</td></tr>
                ) : filteredSchedules.map((s) => (
                  <tr key={s._id} style={styles.tr}>
                    <td style={styles.td}><strong>{s.vehicleId?.unitNumber || "—"}</strong> <span style={{ color: "#6b7280", fontSize: "12px" }}>{s.vehicleId?.make}</span></td>
                    <td style={styles.td}>{s.templateId?.name || "—"}</td>
                    <td style={styles.td}>{s.lastCompletedDate ? new Date(s.lastCompletedDate).toLocaleDateString() : "—"}</td>
                    <td style={styles.td}>{s.lastCompletedOdometer ? `${s.lastCompletedOdometer.toLocaleString()} km` : "—"}</td>
                    <td style={styles.td}>{s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString() : "—"}</td>
                    <td style={styles.td}>{s.nextDueOdometer ? `${s.nextDueOdometer.toLocaleString()} km` : "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: STATUS_COLORS[s.status]?.bg || "#f3f4f6", color: STATUS_COLORS[s.status]?.color || "#374151" }}>
                        {s.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button style={styles.iconBtn} title="Edit" onClick={() => openEditSchedule(s)}><FaEdit size={13} /></button>
                        <button
                          style={{ ...styles.iconBtn, color: "#059669" }}
                          onClick={() => handleGenerate(s._id)}
                          disabled={generating === s._id}
                          title="Generate maintenance work order"
                        >
                          <FaWrench size={13} />
                        </button>
                        <button style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete" onClick={() => { setSelectedItem(s); setDeleteType("schedule"); setIsDeleteModalOpen(true); }}><FaTrashAlt size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Name", "Type", "Interval (km)", "Interval (days)", "Est. Cost", "Vendor", "Active", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#6b7280", padding: "40px" }}>No templates yet. Create your first PM template.</td></tr>
                ) : filteredTemplates.map((t) => (
                  <tr key={t._id} style={styles.tr}>
                    <td style={styles.td}><strong>{t.name}</strong></td>
                    <td style={styles.td}>{t.maintenanceType}</td>
                    <td style={styles.td}>{t.intervalKm ? `${t.intervalKm.toLocaleString()} km` : "—"}</td>
                    <td style={styles.td}>{t.intervalDays ? `${t.intervalDays} days` : "—"}</td>
                    <td style={styles.td}>{t.estimatedCost ? `$${t.estimatedCost}` : "—"}</td>
                    <td style={styles.td}>{t.vendor || "—"}</td>
                    <td style={styles.td}><span style={{ color: t.isActive ? "#059669" : "#6b7280", fontWeight: 600 }}>{t.isActive ? "Yes" : "No"}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={styles.iconBtn} title="Edit" onClick={() => openEditTemplate(t)}><FaEdit size={13} /></button>
                        <button style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete" onClick={() => { setSelectedItem(t); setDeleteType("template"); setIsDeleteModalOpen(true); }}><FaTrashAlt size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editingTemplate ? "Edit Template" : "New PM Template"}</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input style={styles.input} value={templateForm.name} onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Oil Change, Tire Rotation" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maintenance Type</label>
                <select style={styles.input} value={templateForm.maintenanceType} onChange={(e) => setTemplateForm((f) => ({ ...f, maintenanceType: e.target.value }))}>
                  {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </select>
              </div>
              {[
                { label: "Interval (km)", key: "intervalKm", placeholder: "e.g. 8000" },
                { label: "Interval (days)", key: "intervalDays", placeholder: "e.g. 90" },
                { label: "Estimated Cost ($)", key: "estimatedCost", placeholder: "0" },
                { label: "Est. Duration (hours)", key: "estimatedDuration", placeholder: "e.g. 2" },
                { label: "Vendor/Shop", key: "vendor", placeholder: "" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>{label}</label>
                  <input type={["intervalKm","intervalDays","estimatedCost","estimatedDuration"].includes(key) ? "number" : "text"} style={styles.input} value={(templateForm as any)[key]} placeholder={placeholder} onChange={(e) => setTemplateForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Applicable Vehicle Types</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {VEHICLE_TYPES.map((vt) => (
                  <label key={vt} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={templateForm.applicableVehicleTypes.includes(vt)}
                      onChange={(e) => setTemplateForm((f) => ({
                        ...f,
                        applicableVehicleTypes: e.target.checked
                          ? [...f.applicableVehicleTypes, vt]
                          : f.applicableVehicleTypes.filter((x) => x !== vt),
                      }))}
                    />
                    {vt}
                  </label>
                ))}
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={templateForm.description} onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsTemplateModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSaveTemplate} disabled={saving}>{saving ? "Saving..." : editingTemplate ? "Update" : "Create Template"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "520px" }}>
            <h2 style={styles.modalTitle}>{editingSchedule ? "Edit Schedule" : "Assign PM to Vehicle"}</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle *</label>
              <select style={styles.input} value={scheduleForm.vehicleId} onChange={(e) => setScheduleForm((f) => ({ ...f, vehicleId: e.target.value }))}>
                <option value="">— Select vehicle —</option>
                {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>PM Template *</label>
              <select style={styles.input} value={scheduleForm.templateId} onChange={(e) => setScheduleForm((f) => ({ ...f, templateId: e.target.value }))}>
                <option value="">— Select template —</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.intervalKm ? `${t.intervalKm}km` : ""}{t.intervalDays ? ` / ${t.intervalDays}d` : ""})</option>)}
              </select>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Completed Date</label>
                <input type="date" style={styles.input} value={scheduleForm.lastCompletedDate} onChange={(e) => setScheduleForm((f) => ({ ...f, lastCompletedDate: e.target.value }))} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Odometer (km)</label>
                <input type="number" style={styles.input} value={scheduleForm.lastCompletedOdometer} onChange={(e) => setScheduleForm((f) => ({ ...f, lastCompletedOdometer: e.target.value }))} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={scheduleForm.notes} onChange={(e) => setScheduleForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsScheduleModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSaveSchedule} disabled={saving}>{saving ? "Saving..." : editingSchedule ? "Update" : "Assign"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete {deleteType === "template" ? "Template" : "Schedule"}?</h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button style={{ ...styles.primaryBtn, background: "#dc2626" }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "24px" },
  primaryBtn: { padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", fontFamily: "Inter, system-ui, sans-serif" },
  secondaryBtn: { padding: "10px 18px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", fontFamily: "Inter, system-ui, sans-serif" },
  alertBanner: { background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "10px", padding: "12px 18px", marginBottom: "20px", fontSize: "14px", color: "#92400e" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e5e7eb" },
  tab: { padding: "10px 20px", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#6b7280", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "-1px" },
  activeTab: { color: "#4F46E5", borderBottom: "2px solid #4F46E5" },
  filtersRow: { marginBottom: "16px" },
  searchInput: { width: "300px", padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" },
  tableWrapper: { background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "12px 16px", textAlign: "left", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "14px 16px", color: "#374151", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  iconBtn: { background: "#f3f4f6", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" },
  emptyState: { textAlign: "center", padding: "60px 0", color: "#6b7280", fontSize: "15px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modal: { background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: "#111827" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "4px" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" },
};

export default PreventiveMaintenance;
