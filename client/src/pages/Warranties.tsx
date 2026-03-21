import React, { useState, useEffect, useCallback } from "react";
import { FaShieldAlt, FaPlus, FaEdit, FaTrashAlt, FaFileAlt } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const WARRANTY_TYPES = ["manufacturer", "extended", "part", "tire", "battery", "other"];
const CLAIM_STATUSES = ["submitted", "approved", "denied", "pending"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#d1fae5", color: "#065f46" },
  expired: { bg: "#f3f4f6", color: "#6b7280" },
  claimed: { bg: "#dbeafe", color: "#1e40af" },
  voided: { bg: "#fee2e2", color: "#991b1b" },
};

const CLAIM_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  submitted: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#d1fae5", color: "#065f46" },
  denied: { bg: "#fee2e2", color: "#991b1b" },
  pending: { bg: "#e0e7ff", color: "#3730a3" },
};

const emptyForm = {
  vehicleId: "", title: "", type: "manufacturer", provider: "",
  policyNumber: "", startDate: "", expiryDate: "", mileageLimit: "",
  currentMileage: "", coverageDetails: "", notes: "",
};

const emptyClaimForm = {
  claimDate: new Date().toISOString().slice(0, 10),
  description: "", claimAmount: "", claimNumber: "", notes: "",
};


const Warranties: React.FC = () => {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [claimForm, setClaimForm] = useState({ ...emptyClaimForm });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, vRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warranties`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/warranties/expiry-alerts`, { headers }),
      ]);
      const [w, v, a] = await Promise.all([wRes.json(), vRes.json(), aRes.json()]);
      setWarranties(Array.isArray(w) ? w : []);
      setVehicles(Array.isArray(v) ? v : []);
      setExpiryAlerts(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error(err);
      setWarranties([]);
      setVehicles([]);
      setExpiryAlerts([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setEditingWarranty(null); setForm({ ...emptyForm }); setIsModalOpen(true); };
  const openEdit = (w: any) => {
    setEditingWarranty(w);
    setForm({
      vehicleId: w.vehicleId?._id || w.vehicleId || "",
      title: w.title || "", type: w.type || "manufacturer",
      provider: w.provider || "", policyNumber: w.policyNumber || "",
      startDate: w.startDate ? w.startDate.slice(0, 10) : "",
      expiryDate: w.expiryDate ? w.expiryDate.slice(0, 10) : "",
      mileageLimit: w.mileageLimit != null ? String(w.mileageLimit) : "",
      currentMileage: w.currentMileage != null ? String(w.currentMileage) : "",
      coverageDetails: w.coverageDetails || "", notes: w.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form, mileageLimit: form.mileageLimit ? Number(form.mileageLimit) : undefined, currentMileage: form.currentMileage ? Number(form.currentMileage) : undefined };
      const url = editingWarranty ? `${API_BASE_URL}/warranties/${editingWarranty._id}` : `${API_BASE_URL}/warranties`;
      const method = editingWarranty ? "PUT" : "POST";
      await fetch(url, { method, headers, body: JSON.stringify(body) });
      setIsModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedWarranty) return;
    await fetch(`${API_BASE_URL}/warranties/${selectedWarranty._id}`, { method: "DELETE", headers });
    setIsDeleteModalOpen(false);
    fetchAll();
  };

  const handleAddClaim = async () => {
    if (!selectedWarranty) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/warranties/${selectedWarranty._id}/claims`, {
        method: "POST", headers,
        body: JSON.stringify({ ...claimForm, claimAmount: Number(claimForm.claimAmount) || 0 }),
      });
      setIsClaimModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const isExpiringSoon = (w: any) => {
    const days = (new Date(w.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  const filtered = warranties.filter((w) => {
    const matchSearch = !searchText ||
      w.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.provider?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.policyNumber?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalClaimedValue = warranties.flatMap((w) => w.claims || []).reduce((s: number, c: any) => s + (c.approvedAmount || 0), 0);
  const totalClaims = warranties.reduce((s, w) => s + (w.claims?.length || 0), 0);

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaShieldAlt style={{ color: "#4F46E5" }} /> Warranty Tracking
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Track vehicle warranties, expiry dates, and claims</p>
          </div>
          <button style={styles.primaryBtn} onClick={openAdd}><FaPlus size={14} /> Add Warranty</button>
        </div>

        {/* Info blurb */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { icon: "🛡️", title: "Manufacturer & Extended", body: "Centralise all OEM factory warranties and third-party extended service agreements in one place. Never miss a coverage window again." },
            { icon: "📋", title: "Claims Management", body: "File and track warranty claims against any registered warranty. Record claim amounts, approval status, and claim reference numbers for your audit trail." },
            { icon: "🔔", title: "Expiry Alerts", body: "FleetIQ automatically flags warranties expiring within 30 days so you can renew coverage or plan replacements before you're exposed to uninsured repair costs." },
          ].map((card) => (
            <div key={card.title} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827", marginBottom: "4px" }}>{card.title}</div>
              <div style={{ fontSize: "12.5px", color: "#6b7280", lineHeight: "1.55" }}>{card.body}</div>
            </div>
          ))}
        </div>

        {expiryAlerts.length > 0 && (
          <div style={styles.alertBanner}>
            <span style={{ fontWeight: 700 }}>⚠ {expiryAlerts.length} warrant{expiryAlerts.length > 1 ? "ies" : "y"} expiring within 30 days:</span>
            {" "}{expiryAlerts.map((w) => `${w.vehicleId?.unitNumber || ""} — ${w.title}`).join(", ")}
          </div>
        )}

        <div style={styles.statsRow}>
          {[
            { label: "Active Warranties", value: warranties.filter((w) => w.status === "active").length },
            { label: "Expiring in 30 Days", value: expiryAlerts.length },
            { label: "Total Claims", value: totalClaims },
            { label: "Approved Claim Value", value: `$${totalClaimedValue.toFixed(2)}` },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.filtersRow}>
          <input style={styles.searchInput} placeholder="Search by title, provider, policy number..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <select style={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {["active", "expired", "claimed", "voided"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>No warranties found. Add your first warranty.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Vehicle", "Title", "Type", "Provider", "Expiry Date", "Status", "Claims", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <React.Fragment key={w._id}>
                    <tr style={styles.tr} onClick={() => setExpandedId(expandedId === w._id ? null : w._id)}>
                      <td style={styles.td}>{w.vehicleId?.unitNumber || "—"} {w.vehicleId?.make}</td>
                      <td style={styles.td}><strong>{w.title}</strong></td>
                      <td style={styles.td}>{w.type}</td>
                      <td style={styles.td}>{w.provider || "—"}</td>
                      <td style={styles.td}>
                        <span style={{ color: isExpiringSoon(w) && w.status === "active" ? "#dc2626" : "#374151", fontWeight: isExpiringSoon(w) ? 700 : 400 }}>
                          {w.expiryDate ? new Date(w.expiryDate).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: STATUS_COLORS[w.status]?.bg || "#f3f4f6", color: STATUS_COLORS[w.status]?.color || "#374151" }}>
                          {w.status}
                        </span>
                      </td>
                      <td style={styles.td}>{w.claims?.length || 0}</td>
                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={styles.iconBtn} title="Edit" onClick={() => openEdit(w)}><FaEdit size={13} /></button>
                          <button style={{ ...styles.iconBtn, color: "#1e40af" }} title="File Claim" onClick={() => { setSelectedWarranty(w); setClaimForm({ ...emptyClaimForm }); setIsClaimModalOpen(true); }}><FaFileAlt size={13} /></button>
                          <button style={{ ...styles.iconBtn, color: "#dc2626" }} title="Delete" onClick={() => { setSelectedWarranty(w); setIsDeleteModalOpen(true); }}><FaTrashAlt size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === w._id && (
                      <tr>
                        <td colSpan={8} style={{ padding: "0 16px 16px", background: "#f9fafb" }}>
                          <div style={{ padding: "12px 0", fontSize: "13px", color: "#374151" }}>
                            {w.coverageDetails && <p style={{ marginBottom: "8px" }}><strong>Coverage:</strong> {w.coverageDetails}</p>}
                            {w.mileageLimit && <p style={{ marginBottom: "8px" }}><strong>Mileage Limit:</strong> {w.mileageLimit.toLocaleString()} km</p>}
                            {w.policyNumber && <p style={{ marginBottom: "8px" }}><strong>Policy #:</strong> {w.policyNumber}</p>}
                            <strong>Claims:</strong>
                            {(!w.claims || w.claims.length === 0) ? (
                              <span style={{ color: "#6b7280", marginLeft: "8px" }}>No claims filed</span>
                            ) : (
                              <table style={{ width: "100%", marginTop: "8px", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    {["Date", "Description", "Claimed", "Approved", "Status", "Claim #"].map((h) => (
                                      <th key={h} style={{ ...styles.th, background: "#f3f4f6" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {w.claims.map((c: any) => (
                                    <tr key={c._id} style={styles.tr}>
                                      <td style={styles.td}>{c.claimDate ? new Date(c.claimDate).toLocaleDateString() : "—"}</td>
                                      <td style={styles.td}>{c.description}</td>
                                      <td style={styles.td}>${(c.claimAmount || 0).toFixed(2)}</td>
                                      <td style={styles.td}>${(c.approvedAmount || 0).toFixed(2)}</td>
                                      <td style={styles.td}>
                                        <span style={{ ...styles.badge, background: CLAIM_STATUS_COLORS[c.status]?.bg || "#f3f4f6", color: CLAIM_STATUS_COLORS[c.status]?.color || "#374151" }}>
                                          {c.status}
                                        </span>
                                      </td>
                                      <td style={styles.td}>{c.claimNumber || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
            <h2 style={styles.modalTitle}>{editingWarranty ? "Edit Warranty" : "Add Warranty"}</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Vehicle *</label>
                <select style={styles.input} value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">— Select vehicle —</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model} ({v.year})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Warranty Type</label>
                <select style={styles.input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {WARRANTY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {[
                { label: "Title *", key: "title" }, { label: "Provider", key: "provider" },
                { label: "Policy Number", key: "policyNumber" }, { label: "Start Date", key: "startDate", type: "date" },
                { label: "Expiry Date", key: "expiryDate", type: "date" },
                { label: "Mileage Limit (km)", key: "mileageLimit", type: "number" },
                { label: "Current Mileage (km)", key: "currentMileage", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>{label}</label>
                  <input type={type || "text"} style={styles.input} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Coverage Details</label>
              <textarea style={{ ...styles.input, height: "70px" }} value={form.coverageDetails} onChange={(e) => setForm((f) => ({ ...f, coverageDetails: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingWarranty ? "Update" : "Add Warranty"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && selectedWarranty && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "480px" }}>
            <h2 style={styles.modalTitle}>File Claim: {selectedWarranty.title}</h2>
            {[
              { label: "Claim Date", key: "claimDate", type: "date" },
              { label: "Claim Amount ($)", key: "claimAmount", type: "number" },
              { label: "Claim Number", key: "claimNumber" },
            ].map(({ label, key, type }) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input type={type || "text"} style={styles.input} value={(claimForm as any)[key]} onChange={(e) => setClaimForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea style={{ ...styles.input, height: "70px" }} value={claimForm.description} onChange={(e) => setClaimForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "60px" }} value={claimForm.notes} onChange={(e) => setClaimForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsClaimModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleAddClaim} disabled={saving}>{saving ? "Saving..." : "Submit Claim"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedWarranty && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete Warranty?</h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>Delete <strong>{selectedWarranty.title}</strong>? This cannot be undone.</p>
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
  tr: { borderBottom: "1px solid #f3f4f6", cursor: "pointer" },
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

export default Warranties;
