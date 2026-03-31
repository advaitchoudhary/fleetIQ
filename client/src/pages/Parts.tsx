import React, { useState, useEffect, useCallback } from "react";
import { FaBox, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaCheckCircle, FaWrench } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const CATEGORIES = ["engine", "brakes", "tires", "electrical", "body", "filters", "fluids", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  engine: "var(--t-accent)", brakes: "var(--t-error)", tires: "var(--t-success)",
  electrical: "var(--t-warning)", body: "var(--t-indigo)", filters: "var(--t-info)",
  fluids: "var(--t-accent)", other: "var(--t-text-dim)",
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
      <div style={{ ...styles.container, padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>FLEET OPERATIONS</span>
          <span style={{ color: "var(--t-text-ghost)" }}>›</span>
          <span style={{ color: "var(--t-text-faint)" }}>PARTS INVENTORY</span>
        </div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Parts Inventory</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Manage spare parts, stock levels, and usage history.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button style={{ background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} onClick={openAdd}>
              <FaPlus size={13} /> Add Part
            </button>
          </div>
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
                      <span style={{ ...styles.badge, background: CATEGORY_COLORS[part.category] || "var(--t-text-dim)", color: "#fff" }}>
                        {part.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: isLow(part) ? "var(--t-error)" : "var(--t-text-secondary)", fontWeight: isLow(part) ? 700 : 400 }}>
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
                        <button style={{ ...styles.iconBtn, color: "var(--t-success)" }} title="Use Part" onClick={() => openUse(part)}><FaCheckCircle size={13} /></button>
                        <button style={{ ...styles.iconBtn, color: "var(--t-error)" }} title="Delete" onClick={() => openDelete(part)}><FaTrashAlt size={13} /></button>
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
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaEdit size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{editingPart ? "Edit Part" : "Add Part"}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{editingPart ? "Update part details" : "Add a new part to inventory"}</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
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
            </div>
            {/* Footer */}
            <div style={styles.modalFooter}>
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
        <div style={styles.modalOverlay} onClick={() => setIsUseModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaWrench size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Use Part</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{selectedPart.name} — Available: <strong>{selectedPart.quantity}</strong></div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsUseModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
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
            </div>
            {/* Footer */}
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsUseModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleUsePart} disabled={saving}>{saving ? "Saving..." : "Use Part"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedPart && (
        <div style={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaTrashAlt size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Delete Part?</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>This action cannot be undone</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
              <p style={{ color: "var(--t-text-dim)", fontSize: "14px", margin: 0 }}>
                Are you sure you want to delete <strong>{selectedPart.name}</strong>? This cannot be undone.
              </p>
            </div>
            {/* Footer */}
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button style={styles.deleteBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "var(--t-bg)", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" },
  primaryBtn: { padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" },
  alertBanner: { background: "var(--t-warning-bg)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "12px 18px", marginBottom: "20px", fontSize: "14px", color: "var(--t-warning)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "var(--t-surface)", borderRadius: "12px", padding: "20px", border: "1px solid var(--t-border)", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  statValue: { fontSize: "28px", fontWeight: 800, color: "var(--t-indigo)" },
  statLabel: { fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" },
  filtersRow: { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "220px", padding: "9px 14px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" },
  select: { padding: "9px 14px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-select-bg)", color: "var(--t-text-secondary)" },
  tableWrapper: { overflowX: "auto", background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "13px 16px", textAlign: "left", background: "var(--t-surface-alt)", borderBottom: "1px solid var(--t-border)", fontWeight: 700, color: "var(--t-indigo)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  iconBtn: { background: "var(--t-hover-bg)", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", alignItems: "center" },
  emptyState: { textAlign: "center", padding: "60px 0", color: "var(--t-text-dim)", fontSize: "15px" },
  modalOverlay: { position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" },
  closeBtn: { width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  formGroup: { marginBottom: "16px" },
  label: { fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" },
  input: { width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" },
  modalFooter: { padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 },
  cancelBtn: { padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" },
  deleteBtn: { padding: "10px 20px", background: "var(--t-error)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" },
};

export default Parts;
