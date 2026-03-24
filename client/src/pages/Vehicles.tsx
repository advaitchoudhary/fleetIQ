import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaTruck, FaPlus, FaEdit, FaTrashAlt, FaSearch } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#dcfce7", color: "#166534" },
  inactive: { bg: "#f3f4f6", color: "#6b7280" },
  in_maintenance: { bg: "#fef9c3", color: "#854d0e" },
  out_of_service: { bg: "#fee2e2", color: "#991b1b" },
};

const TYPE_LABELS: Record<string, string> = {
  truck: "Truck",
  trailer: "Trailer",
  van: "Van",
  pickup: "Pickup",
  other: "Other",
};

const emptyForm = {
  unitNumber: "",
  make: "",
  model: "",
  year: "",
  vin: "",
  licensePlate: "",
  type: "truck",
  status: "active",
  odometer: "",
  ownership: "owned",
  fuelType: "diesel",
  insuranceExpiry: "",
  registrationExpiry: "",
  notes: "",
};


const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Build headers fresh on each call so a re-login token is always picked up
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicles`, { headers: getHeaders() });
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setForm({
      unitNumber: vehicle.unitNumber || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
      vin: vehicle.vin || "",
      licensePlate: vehicle.licensePlate || "",
      type: vehicle.type || "truck",
      status: vehicle.status || "active",
      odometer: vehicle.odometer?.toString() || "",
      ownership: vehicle.ownership || "owned",
      fuelType: vehicle.fuelType || "diesel",
      insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.slice(0, 10) : "",
      registrationExpiry: vehicle.registrationExpiry ? vehicle.registrationExpiry.slice(0, 10) : "",
      notes: vehicle.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.unitNumber.trim()) {
      alert("Unit number is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : undefined,
        odometer: form.odometer !== "" ? Number(form.odometer) : undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        registrationExpiry: form.registrationExpiry || undefined,
      };
      if (editingVehicle) {
        await axios.put(`${API_BASE_URL}/vehicles/${editingVehicle._id}`, payload, { headers: getHeaders() });
      } else {
        await axios.post(`${API_BASE_URL}/vehicles`, payload, { headers: getHeaders() });
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/vehicles/${selectedVehicle._id}`, { headers: getHeaders() });
      setIsDeleteModalOpen(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const q = searchText.toLowerCase();
    return (
      v.unitNumber?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.licensePlate?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    inMaintenance: vehicles.filter((v) => v.status === "in_maintenance").length,
    outOfService: vehicles.filter((v) => v.status === "out_of_service").length,
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaTruck size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet Management</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Vehicles</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Manage your fleet vehicles</p>
            </div>
          </div>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
            <FaPlus size={14} /> Add Vehicle
          </button>
        </div>
      </div>
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" }}>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Vehicles", value: stats.total, color: "#4F46E5" },
            { label: "Active", value: stats.active, color: "#16a34a" },
            { label: "In Maintenance", value: stats.inMaintenance, color: "#ca8a04" },
            { label: "Out of Service", value: stats.outOfService, color: "#dc2626" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px", maxWidth: "360px" }}>
          <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            placeholder="Search by unit, make, model, plate..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ ...styles.input, paddingLeft: "36px", width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading vehicles...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
              {vehicles.length === 0 ? "No vehicles yet. Add your first vehicle to get started." : "No vehicles match your search."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Unit #", "Make / Model", "Year", "Type", "License Plate", "Odometer", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const sc = STATUS_COLORS[v.status] || STATUS_COLORS.inactive;
                  return (
                    <tr key={v._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>{v.unitNumber}</td>
                      <td style={styles.td}>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</td>
                      <td style={styles.td}>{v.year || "—"}</td>
                      <td style={styles.td}>{TYPE_LABELS[v.type] || v.type}</td>
                      <td style={styles.td}>{v.licensePlate || "—"}</td>
                      <td style={styles.td}>{v.odometer != null ? `${v.odometer.toLocaleString()} km` : "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                          {v.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEditModal(v)} style={styles.iconBtn} title="Edit">
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedVehicle(v); setIsDeleteModalOpen(true); }}
                            style={{ ...styles.iconBtn, color: "#dc2626" }}
                            title="Delete"
                          >
                            <FaTrashAlt size={14} />
                          </button>
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
            <h2 style={styles.modalTitle}>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Unit Number *</label>
                <input style={styles.input} value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. Truck-001" />
              </div>
              <div>
                <label style={styles.label}>Make</label>
                <input style={styles.input} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="e.g. Freightliner" />
              </div>
              <div>
                <label style={styles.label}>Model</label>
                <input style={styles.input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Cascadia" />
              </div>
              <div>
                <label style={styles.label}>Year</label>
                <input style={styles.input} type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2021" />
              </div>
              <div>
                <label style={styles.label}>VIN</label>
                <input style={styles.input} value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} placeholder="17-character VIN" />
              </div>
              <div>
                <label style={styles.label}>License Plate</label>
                <input style={styles.input} value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Type</label>
                <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="truck">Truck</option>
                  <option value="trailer">Trailer</option>
                  <option value="van">Van</option>
                  <option value="pickup">Pickup</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="in_maintenance">In Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Odometer (km)</label>
                <input style={styles.input} type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Ownership</label>
                <select style={styles.input} value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                  <option value="rented">Rented</option>
                </select>
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
                <label style={styles.label}>Insurance Expiry</label>
                <input style={styles.input} type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
              </div>
              <div>
                <label style={styles.label}>Registration Expiry</label>
                <input style={styles.input} type="date" value={form.registrationExpiry} onChange={(e) => setForm({ ...form, registrationExpiry: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, height: "72px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setIsModalOpen(false)} style={styles.secondaryBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.primaryBtn} disabled={saving}>
                {saving ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedVehicle && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: "420px" }}>
            <h2 style={styles.modalTitle}>Delete Vehicle</h2>
            <p style={{ color: "#374151", marginBottom: "24px" }}>
              Are you sure you want to delete <strong>{selectedVehicle.unitNumber}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setIsDeleteModalOpen(false)} style={styles.secondaryBtn} disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} style={{ ...styles.primaryBtn, background: "#dc2626" }} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  primaryBtn: {
    background: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  iconBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    color: "#374151",
    display: "flex",
    alignItems: "center",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e0e7ff",
    padding: "20px",
    boxShadow: "0 1px 6px rgba(79,70,229,0.06)",
  },
  tableContainer: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e0e7ff",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(79,70,229,0.07)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeaderRow: {
    background: "#f5f3ff",
    borderBottom: "2px solid #e0e7ff",
  },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f0f0ff",
  },
  td: {
    padding: "14px 16px",
    color: "#374151",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "16px",
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    width: "100%",
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    margin: "0 0 20px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
};

export default Vehicles;
