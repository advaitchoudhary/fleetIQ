import React, { useState, useEffect, useCallback } from "react";
import { FaShieldAlt, FaPlus, FaEdit, FaTrashAlt, FaFileAlt, FaWrench } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const WARRANTY_TYPES = ["manufacturer", "extended", "part", "tire", "battery", "other"];
const CLAIM_STATUSES = ["submitted", "approved", "denied", "pending"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  expired: { bg: "var(--t-hover-bg)", color: "var(--t-text-faint)" },
  claimed: { bg: "var(--t-indigo-bg)", color: "var(--t-indigo)" },
  voided: { bg: "var(--t-error-bg)", color: "var(--t-error)" },
};

const CLAIM_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  submitted: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  approved: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  denied: { bg: "var(--t-error-bg)", color: "var(--t-error)" },
  pending: { bg: "var(--t-indigo-bg)", color: "var(--t-indigo)" },
};

const emptyForm = {
  vehicleId: "", title: "", type: "manufacturer", provider: "",
  policyNumber: "", startDate: "", expiryDate: "", mileageLimit: "",
  currentMileage: "", coverageDetails: "", notes: "",
};

const todayLocal = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const emptyClaimForm = {
  claimDate: todayLocal(),
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
  const [claimForm, setClaimForm] = useState({ ...emptyClaimForm, claimDate: todayLocal() });
  const [saving, setSaving] = useState(false);
  const [isEditClaimModalOpen, setIsEditClaimModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<any>(null);
  const [editingClaimWarrantyId, setEditingClaimWarrantyId] = useState<string>("");
  const [editClaimForm, setEditClaimForm] = useState({ status: "submitted", approvedAmount: "" });

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
    if (!form.vehicleId) {
      alert("Please select a vehicle.");
      return;
    }
    if (!form.title.trim()) {
      alert("Warranty title is required.");
      return;
    }
    if (!form.startDate) {
      alert("Start date is required.");
      return;
    }
    if (!form.expiryDate) {
      alert("Expiry date is required.");
      return;
    }
    if (form.startDate && form.expiryDate && form.startDate > form.expiryDate) {
      alert("Expiry date must be after start date.");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, mileageLimit: form.mileageLimit ? Number(form.mileageLimit) : undefined, currentMileage: form.currentMileage ? Number(form.currentMileage) : undefined };
      const url = editingWarranty ? `${API_BASE_URL}/warranties/${editingWarranty._id}` : `${API_BASE_URL}/warranties`;
      const method = editingWarranty ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to save warranty.");
        setSaving(false);
        return;
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedWarranty) return;
    try {
      const res = await fetch(`${API_BASE_URL}/warranties/${selectedWarranty._id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to delete warranty.");
        return;
      }
      setIsDeleteModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
  };

  const handleAddClaim = async () => {
    if (!selectedWarranty) return;
    if (!claimForm.description.trim()) {
      alert("Claim description is required.");
      return;
    }
    if (!claimForm.claimDate) {
      alert("Claim date is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/warranties/${selectedWarranty._id}/claims`, {
        method: "POST", headers,
        body: JSON.stringify({ ...claimForm, claimAmount: Number(claimForm.claimAmount) || 0 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to submit claim.");
        setSaving(false);
        return;
      }
      setIsClaimModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
    setSaving(false);
  };

  const openEditClaim = (warrantyId: string, claim: any) => {
    setEditingClaimWarrantyId(warrantyId);
    setEditingClaim(claim);
    setEditClaimForm({ status: claim.status || "submitted", approvedAmount: claim.approvedAmount != null ? String(claim.approvedAmount) : "" });
    setIsEditClaimModalOpen(true);
  };

  const handleUpdateClaim = async () => {
    if (!editingClaim || !editingClaimWarrantyId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/warranties/${editingClaimWarrantyId}/claims/${editingClaim._id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ status: editClaimForm.status, approvedAmount: Number(editClaimForm.approvedAmount) || 0 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to update claim.");
        setSaving(false);
        return;
      }
      setIsEditClaimModalOpen(false);
      fetchAll();
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
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
      <div style={{ ...styles.container, padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>WARRANTIES</div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Warranty Tracking</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Track vehicle warranties, expiry dates, and claims.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button style={{ background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} onClick={openAdd}>
              <FaPlus size={13} /> Add Warranty
            </button>
          </div>
        </div>

        {/* Info blurb */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { icon: "🛡️", title: "Manufacturer & Extended", body: "Centralise all OEM factory warranties and third-party extended service agreements in one place. Never miss a coverage window again." },
            { icon: "📋", title: "Claims Management", body: "File and track warranty claims against any registered warranty. Record claim amounts, approval status, and claim reference numbers for your audit trail." },
            { icon: "🔔", title: "Expiry Alerts", body: "FleetIQ automatically flags warranties expiring within 30 days so you can renew coverage or plan replacements before you're exposed to uninsured repair costs." },
          ].map((card) => (
            <div key={card.title} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--t-text-secondary)", marginBottom: "4px" }}>{card.title}</div>
              <div style={{ fontSize: "12.5px", color: "var(--t-text-dim)", lineHeight: "1.55" }}>{card.body}</div>
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
                        <span style={{ color: isExpiringSoon(w) && w.status === "active" ? "var(--t-error)" : "var(--t-text-muted)", fontWeight: isExpiringSoon(w) ? 700 : 400 }}>
                          {w.expiryDate ? new Date(w.expiryDate.slice(0, 10) + "T00:00:00").toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: STATUS_COLORS[w.status]?.bg || "var(--t-hover-bg)", color: STATUS_COLORS[w.status]?.color || "var(--t-text-faint)" }}>
                          {w.status}
                        </span>
                      </td>
                      <td style={styles.td}>{w.claims?.length || 0}</td>
                      <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={styles.iconBtn} title="Edit" onClick={() => openEdit(w)}><FaEdit size={13} /></button>
                          <button style={{ ...styles.iconBtn, color: "var(--t-info)" }} title="File Claim" onClick={() => { setSelectedWarranty(w); setClaimForm({ ...emptyClaimForm, claimDate: todayLocal() }); setIsClaimModalOpen(true); }}><FaFileAlt size={13} /></button>
                          <button style={{ ...styles.iconBtn, color: "var(--t-error)" }} title="Delete" onClick={() => { setSelectedWarranty(w); setIsDeleteModalOpen(true); }}><FaTrashAlt size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === w._id && (
                      <tr>
                        <td colSpan={8} style={{ padding: "0 16px 16px", background: "var(--t-stripe)" }}>
                          <div style={{ padding: "12px 0", fontSize: "13px", color: "var(--t-text-muted)" }}>
                            {w.coverageDetails && <p style={{ marginBottom: "8px" }}><strong>Coverage:</strong> {w.coverageDetails}</p>}
                            {w.mileageLimit && <p style={{ marginBottom: "8px" }}><strong>Mileage Limit:</strong> {w.mileageLimit.toLocaleString()} km</p>}
                            {w.policyNumber && <p style={{ marginBottom: "8px" }}><strong>Policy #:</strong> {w.policyNumber}</p>}
                            <strong>Claims:</strong>
                            {(!w.claims || w.claims.length === 0) ? (
                              <span style={{ color: "var(--t-text-faint)", marginLeft: "8px" }}>No claims filed</span>
                            ) : (
                              <table style={{ width: "100%", marginTop: "8px", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    {["Date", "Description", "Claimed", "Approved", "Status", "Claim #", ""].map((h) => (
                                      <th key={h} style={{ ...styles.th, background: "var(--t-surface-alt)" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {w.claims.map((c: any) => (
                                    <tr key={c._id} style={styles.tr}>
                                      <td style={styles.td}>{c.claimDate ? new Date(c.claimDate.slice(0, 10) + "T00:00:00").toLocaleDateString() : "—"}</td>
                                      <td style={styles.td}>{c.description}</td>
                                      <td style={styles.td}>${(c.claimAmount || 0).toFixed(2)}</td>
                                      <td style={styles.td}>${(c.approvedAmount || 0).toFixed(2)}</td>
                                      <td style={styles.td}>
                                        <span style={{ ...styles.badge, background: CLAIM_STATUS_COLORS[c.status]?.bg || "var(--t-hover-bg)", color: CLAIM_STATUS_COLORS[c.status]?.color || "var(--t-text-faint)" }}>
                                          {c.status}
                                        </span>
                                      </td>
                                      <td style={styles.td}>{c.claimNumber || "—"}</td>
                                      <td style={styles.td}>
                                        <button onClick={() => openEditClaim(w._id, c)} style={{ ...styles.iconBtn, color: "var(--t-indigo)" }} title="Edit claim status"><FaEdit size={12} /></button>
                                      </td>
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
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaEdit size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{editingWarranty ? "Edit Warranty" : "Add Warranty"}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{editingWarranty ? "Update warranty details" : "Register a new warranty"}</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
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
            </div>
            {/* Footer */}
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingWarranty ? "Update" : "Add Warranty"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && selectedWarranty && (
        <div style={styles.modalOverlay} onClick={() => setIsClaimModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaFileAlt size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>File Claim</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{selectedWarranty.title}</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsClaimModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
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
            </div>
            {/* Footer */}
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsClaimModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleAddClaim} disabled={saving}>{saving ? "Saving..." : "Submit Claim"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Claim Modal */}
      {isEditClaimModalOpen && editingClaim && (
        <div style={styles.modalOverlay} onClick={() => setIsEditClaimModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaEdit size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Update Claim</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{editingClaim.description}</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsEditClaimModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: "24px 28px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={editClaimForm.status} onChange={(e) => setEditClaimForm((f) => ({ ...f, status: e.target.value }))}>
                  {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Approved Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  style={styles.input}
                  value={editClaimForm.approvedAmount}
                  onChange={(e) => setEditClaimForm((f) => ({ ...f, approvedAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsEditClaimModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleUpdateClaim} disabled={saving}>{saving ? "Saving..." : "Update Claim"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedWarranty && (
        <div style={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaTrashAlt size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Delete Warranty?</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>This action cannot be undone</div>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ height: "24px" }} />
              <p style={{ color: "var(--t-text-dim)", fontSize: "14px", margin: 0 }}>Delete <strong>{selectedWarranty.title}</strong>? This cannot be undone.</p>
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
  tr: { borderBottom: "1px solid var(--t-stripe)", cursor: "pointer" },
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

export default Warranties;
