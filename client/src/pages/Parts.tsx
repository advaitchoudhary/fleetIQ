import React, { useState, useEffect, useCallback } from "react";
import { FaBox, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaCheckCircle } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const CATEGORIES = ["engine", "brakes", "tires", "electrical", "body", "filters", "fluids", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  engine: "#4F46E5", brakes: "#dc2626", tires: "#059669",
  electrical: "#f59e0b", body: "#6366f1", filters: "#0891b2",
  fluids: "#7c3aed", other: "#6b7280",
};

const emptyForm = {
  name: "", partNumber: "", category: "other", description: "",
  quantity: "0", minimumQuantity: "0", unitCost: "0",
  supplier: "", location: "", compatibleVehicles: [] as string[], notes: "",
};

const emptyUseForm = { vehicleId: "", maintenanceId: "", quantityUsed: "1", notes: "" };


const Parts: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleMaintenance, setVehicleMaintenance] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [useForm, setUseForm] = useState({ ...emptyUseForm });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [partsRes, vehiclesRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/parts`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/parts/low-stock`, { headers }),
      ]);
      const [p, v, a] = await Promise.all([partsRes.json(), vehiclesRes.json(), alertsRes.json()]);
      setParts(Array.isArray(p) ? p : []);
      setVehicles(Array.isArray(v) ? v : []);
      setLowStockAlerts(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error(err);
      setParts([]);
      setVehicles([]);
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchVehicleMaintenance = async (vehicleId: string) => {
    if (!vehicleId) { setVehicleMaintenance([]); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/maintenance?vehicleId=${vehicleId}`, { headers });
      const data = await res.json();
      setVehicleMaintenance(Array.isArray(data) ? data : []);
    } catch { setVehicleMaintenance([]); }
  };

  const openAdd = () => {
    setEditingPart(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (part: any) => {
    setEditingPart(part);
    setForm({
      name: part.name || "",
      partNumber: part.partNumber || "",
      category: part.category || "other",
      description: part.description || "",
      quantity: String(part.quantity ?? 0),
      minimumQuantity: String(part.minimumQuantity ?? 0),
      unitCost: String(part.unitCost ?? 0),
      supplier: part.supplier || "",
      location: part.location || "",
      compatibleVehicles: (part.compatibleVehicles || []).map((v: any) => v._id || v),
      notes: part.notes || "",
    });
    setIsModalOpen(true);
  };

  const openDelete = (part: any) => { setSelectedPart(part); setIsDeleteModalOpen(true); };

  const openUse = (part: any) => {
    setSelectedPart(part);
    setUseForm({ ...emptyUseForm });
    setVehicleMaintenance([]);
    setIsUseModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Part name is required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        quantity: Number(form.quantity),
        minimumQuantity: Number(form.minimumQuantity),
        unitCost: Number(form.unitCost),
      };
      const url = editingPart ? `${API_BASE_URL}/parts/${editingPart._id}` : `${API_BASE_URL}/parts`;
      const method = editingPart ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to save part.");
        setSaving(false);
        return;
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedPart) return;
    try {
      const res = await fetch(`${API_BASE_URL}/parts/${selectedPart._id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to delete part.");
        return;
      }
      setIsDeleteModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
  };

  const handleUsePart = async () => {
    if (!selectedPart) return;
    const qty = Number(useForm.quantityUsed);
    if (!qty || qty <= 0) {
      alert("Quantity used must be greater than 0.");
      return;
    }
    if (qty > selectedPart.quantity) {
      alert(`Only ${selectedPart.quantity} units in stock.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/parts/${selectedPart._id}/use`, {
        method: "POST", headers,
        body: JSON.stringify({
          vehicleId: useForm.vehicleId || undefined,
          maintenanceId: useForm.maintenanceId || undefined,
          quantityUsed: qty,
          notes: useForm.notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to record part usage.");
        setSaving(false);
        return;
      }
      setIsUseModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
    setSaving(false);
  };

  const filtered = parts.filter((p) => {
    const matchSearch = !searchText ||
      p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.partNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalValue = parts.reduce((s, p) => s + (p.quantity || 0) * (p.unitCost || 0), 0);
  const categorySet = [...new Set(parts.map((p) => p.category))].length;

  const isLow = (p: any) => p.minimumQuantity > 0 && p.quantity <= p.minimumQuantity;

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <div style={styles.container}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaBox style={{ color: "#4F46E5" }} /> Parts Inventory
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Manage spare parts, stock levels, and usage history</p>
          </div>
          <button style={styles.primaryBtn} onClick={openAdd}><FaPlus size={14} /> Add Part</button>
        </div>

        {/* Low stock alert */}
        {lowStockAlerts.length > 0 && (
          <div style={styles.alertBanner}>
            <span style={{ fontWeight: 700 }}>⚠ {lowStockAlerts.length} part{lowStockAlerts.length > 1 ? "s" : ""} low on stock:</span>
            {" "}{lowStockAlerts.map((p) => p.name).join(", ")}
          </div>
        )}

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: "Total Parts", value: parts.length },
            { label: "Inventory Value", value: `$${totalValue.toFixed(2)}` },
            { label: "Low Stock", value: lowStockAlerts.length },
            { label: "Categories", value: categorySet },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={styles.filtersRow}>
          <input
            style={styles.searchInput}
            placeholder="Search by name, part number, supplier..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select style={styles.select} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>No parts found. Add your first part.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Part Name", "Part #", "Category", "In Stock", "Min Qty", "Unit Cost", "Supplier", "Location", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((part) => (
                  <tr key={part._id} style={styles.tr}>
                    <td style={styles.td}><strong>{part.name}</strong></td>
                    <td style={styles.td}>{part.partNumber || "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: CATEGORY_COLORS[part.category] || "#6b7280", color: "#fff" }}>
                        {part.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: isLow(part) ? "#dc2626" : "#111827", fontWeight: isLow(part) ? 700 : 400 }}>
                        {isLow(part) ? "⚠ " : ""}{part.quantity}
                      </span>
                    </td>
                    <td style={styles.td}>{part.minimumQuantity}</td>
                    <td style={styles.td}>${(part.unitCost || 0).toFixed(2)}</td>
                    <td style={styles.td}>{part.supplier || "—"}</td>
                    <td style={styles.td}>{part.location || "—"}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={styles.iconBtn} title="Edit" onClick={() => openEdit(part)}><FaEdit size={13} /></button>
                        <button style={{ ...styles.iconBtn, color: "#059669" }} title="Use Part" onClick={() => openUse(part)}><FaCheckCircle size={13} /></button>
                        <button style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete" onClick={() => openDelete(part)}><FaTrashAlt size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editingPart ? "Edit Part" : "Add Part"}</h2>
            <div style={styles.formGrid}>
              {[
                { label: "Part Name *", key: "name", type: "text" },
                { label: "Part Number", key: "partNumber", type: "text" },
                { label: "Quantity", key: "quantity", type: "number" },
                { label: "Minimum Quantity", key: "minimumQuantity", type: "number" },
                { label: "Unit Cost ($)", key: "unitCost", type: "number" },
                { label: "Supplier", key: "supplier", type: "text" },
                { label: "Location (shelf/bin)", key: "location", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type={type}
                    style={styles.input}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    min={type === "number" ? "0" : undefined}
                  />
                </div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Compatible Vehicles</label>
              <select
                multiple
                style={{ ...styles.input, height: "90px" }}
                value={form.compatibleVehicles}
                onChange={(e) => setForm((f) => ({ ...f, compatibleVehicles: Array.from(e.target.selectedOptions, (o) => o.value) }))}
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea style={{ ...styles.input, height: "70px" }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingPart ? "Update" : "Add Part"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Use Part Modal */}
      {isUseModalOpen && selectedPart && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "480px" }}>
            <h2 style={styles.modalTitle}>Use Part: {selectedPart.name}</h2>
            <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
              Available stock: <strong>{selectedPart.quantity}</strong>
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle (optional)</label>
              <select
                style={styles.input}
                value={useForm.vehicleId}
                onChange={(e) => {
                  setUseForm((f) => ({ ...f, vehicleId: e.target.value, maintenanceId: "" }));
                  fetchVehicleMaintenance(e.target.value);
                }}
              >
                <option value="">— Select vehicle —</option>
                {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>)}
              </select>
            </div>
            {vehicleMaintenance.length > 0 && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Link to Maintenance Job (optional)</label>
                <select style={styles.input} value={useForm.maintenanceId} onChange={(e) => setUseForm((f) => ({ ...f, maintenanceId: e.target.value }))}>
                  <option value="">— Select job —</option>
                  {vehicleMaintenance.map((m) => <option key={m._id} value={m._id}>{m.title} ({m.status})</option>)}
                </select>
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity Used *</label>
              <input type="number" min="1" max={selectedPart.quantity} style={styles.input} value={useForm.quantityUsed} onChange={(e) => setUseForm((f) => ({ ...f, quantityUsed: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={useForm.notes} onChange={(e) => setUseForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsUseModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleUsePart} disabled={saving}>{saving ? "Saving..." : "Use Part"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedPart && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete Part?</h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Are you sure you want to delete <strong>{selectedPart.name}</strong>? This cannot be undone.
            </p>
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
  alertBanner: { background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "10px", padding: "12px 18px", marginBottom: "20px", fontSize: "14px", color: "#92400e" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statValue: { fontSize: "28px", fontWeight: 800, color: "#4F46E5" },
  statLabel: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
  filtersRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "220px", padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" },
  select: { padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#fff" },
  tableWrapper: { overflowX: "auto", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
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
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" },
};

export default Parts;
