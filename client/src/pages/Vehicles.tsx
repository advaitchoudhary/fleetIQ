import React, { useEffect, useState, useCallback } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { FaTruck, FaPlus, FaEdit, FaTrashAlt, FaSearch, FaUserPlus } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(16,185,129,0.15)", color: "var(--t-success)" },
  inactive: { bg: "var(--t-hover-bg)", color: "var(--t-text-faint)" },
  in_maintenance: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  out_of_service: { bg: "rgba(239,68,68,0.15)", color: "var(--t-error)" },
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

  // Assign driver state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningVehicle, setAssigningVehicle] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Telematics state
  const [telematicsModal, setTelematicsModal] = useState<{ vehicleId: string; unitNumber: string } | null>(null);
  const [telProvider, setTelProvider] = useState<"geotab" | "samsara">("geotab");
  const [telForm, setTelForm] = useState({ server: "my.geotab.com", database: "", username: "", password: "", apiToken: "", deviceSerial: "" });
  const [telLoading, setTelLoading] = useState(false);
  const [telResult, setTelResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
    setTelematicsModal(null);
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
    if (form.vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(form.vin.trim())) {
      alert("VIN must be exactly 17 characters and contain only letters (A–Z, excluding I, O, Q) and digits (0–9).");
      return;
    }
    if (form.odometer !== "") {
      const odo = Number(form.odometer);
      if (!Number.isInteger(odo) || odo < 0 || odo > 10_000_000) {
        alert("Odometer must be a whole number between 0 and 10,000,000 km.");
        return;
      }
    }
    if (form.licensePlate.trim() && !/^[A-Z0-9 \-]{2,10}$/i.test(form.licensePlate.trim())) {
      alert("License plate must be 2–10 characters and contain only letters, numbers, spaces, or hyphens.");
      return;
    }
    if (form.model.trim() && !/^[A-Za-z0-9 \-\.]{1,50}$/.test(form.model.trim())) {
      alert("Model must be 1–50 characters and contain only letters, numbers, spaces, hyphens, or periods.");
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

  const openAssignModal = async (vehicle: any) => {
    setAssigningVehicle(vehicle);
    setSelectedDriverId(vehicle.assignedDriverId?._id || "");
    setIsAssignModalOpen(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/drivers`, { headers: getHeaders() });
      const list = Array.isArray(res.data) ? res.data : res.data.drivers || [];
      setDrivers(list.filter((d: any) => d.status === "Active"));
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  const handleAssignDriver = async () => {
    if (!assigningVehicle) return;
    setAssigning(true);
    try {
      await axios.post(
        `${API_BASE_URL}/vehicles/${assigningVehicle._id}/assign-driver`,
        { driverId: selectedDriverId || null },
        { headers: getHeaders() }
      );
      setIsAssignModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign driver");
    } finally {
      setAssigning(false);
    }
  };

  const handleTestConnection = async () => {
    setTelLoading(true);
    setTelResult(null);
    try {
      const credentials = telProvider === "geotab"
        ? { server: telForm.server, database: telForm.database, username: telForm.username, password: telForm.password }
        : { apiToken: telForm.apiToken };
      await axios.post("/api/telematics/test", { provider: telProvider, credentials });
      setTelResult({ ok: true, msg: "Connection successful!" });
    } catch (err: any) {
      setTelResult({ ok: false, msg: err.response?.data?.message || "Connection failed" });
    } finally {
      setTelLoading(false);
    }
  };

  const handlePairDevice = async () => {
    if (!telematicsModal) return;
    setTelLoading(true);
    setTelResult(null);
    try {
      const credentials = telProvider === "geotab"
        ? { server: telForm.server, database: telForm.database, username: telForm.username, password: telForm.password }
        : { apiToken: telForm.apiToken };
      await axios.post("/api/telematics/devices", {
        vehicleId: telematicsModal.vehicleId,
        provider: telProvider,
        deviceSerial: telForm.deviceSerial,
        credentials,
      });
      setTelResult({ ok: true, msg: "Device paired successfully!" });
      setTimeout(() => setTelematicsModal(null), 1500);
    } catch (err: any) {
      setTelResult({ ok: false, msg: err.response?.data?.message || "Pairing failed" });
    } finally {
      setTelLoading(false);
    }
  };

  const handleExport = () => {
    if (!filtered.length) { alert("No vehicles to export."); return; }
    exportVehicles();
  };

  const exportVehicles = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vehicles");
    worksheet.columns = [
      { header: "Unit #", key: "unitNumber" },
      { header: "Make", key: "make" },
      { header: "Model", key: "model" },
      { header: "Year", key: "year" },
      { header: "VIN", key: "vin" },
      { header: "License Plate", key: "licensePlate" },
      { header: "Type", key: "type" },
      { header: "Status", key: "status" },
      { header: "Odometer (km)", key: "odometer" },
      { header: "Fuel Type", key: "fuelType" },
      { header: "Ownership", key: "ownership" },
      { header: "Insurance Expiry", key: "insuranceExpiry" },
      { header: "Registration Expiry", key: "registrationExpiry" },
      { header: "Notes", key: "notes" },
    ];
    worksheet.addRows(filtered.map((v: any) => ({
      unitNumber: v.unitNumber || "",
      make: v.make || "",
      model: v.model || "",
      year: v.year || "",
      vin: v.vin || "",
      licensePlate: v.licensePlate || "",
      type: TYPE_LABELS[v.type] || v.type || "",
      status: v.status?.replace(/_/g, " ") || "",
      odometer: v.odometer != null ? v.odometer : "",
      fuelType: v.fuelType || "",
      ownership: v.ownership || "",
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.slice(0, 10) : "",
      registrationExpiry: v.registrationExpiry ? v.registrationExpiry.slice(0, 10) : "",
      notes: v.notes || "",
    })));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicles_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>VEHICLES</div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Vehicle Management</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Manage your fleet vehicles, assignments, and operational status.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, padding: "10px 18px" }}>
              Export
            </button>
            <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.35)", padding: "10px 20px" }}>
              <FaPlus size={13} /> Add Vehicle
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Vehicles", value: stats.total, color: "var(--t-accent)" },
            { label: "Active", value: stats.active, color: "var(--t-success)" },
            { label: "In Maintenance", value: stats.inMaintenance, color: "var(--t-warning)" },
            { label: "Out of Service", value: stats.outOfService, color: "var(--t-error)" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px", maxWidth: "360px" }}>
          <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
          <input
            placeholder="Search by unit, make, model, plate..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoComplete="off"
            style={{ ...styles.input, paddingLeft: "36px", width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>Loading vehicles...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>
              {vehicles.length === 0 ? "No vehicles yet. Add your first vehicle to get started." : "No vehicles match your search."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Unit #", "Make / Model", "Year", "Type", "License Plate", "Odometer", "Status", "Assigned Driver", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const sc = STATUS_COLORS[v.status] || STATUS_COLORS.inactive;
                  return (
                    <tr key={v._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-text-secondary)" }}>{v.unitNumber}</td>
                      <td style={styles.td}>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</td>
                      <td style={styles.td}>{v.year || "—"}</td>
                      <td style={styles.td}>{TYPE_LABELS[v.type] || v.type}</td>
                      <td style={styles.td}>{v.licensePlate || "—"}</td>
                      <td style={styles.td}>{v.odometer != null ? `${v.odometer.toLocaleString()} km` : "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                          {v.status?.replace(/_/g, " ")}
                        </span>
                        {v.telematicsSource && v.telematicsSource !== "none" && (
                          <span style={{ background: "#f3e8ff", color: "#7c3aed", borderRadius: 4, padding: "2px 6px", fontSize: 11, marginLeft: 6 }}>
                            🛰️ {v.telematicsSource === "geotab" ? "Geotab" : "Samsara"}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {v.assignedDriverId ? (
                          <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>
                            {v.assignedDriverId.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: "#9ca3af" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openEditModal(v)} style={styles.iconBtn} title="Edit">
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => openAssignModal(v)}
                            style={{ ...styles.iconBtn, color: "#4F46E5" }}
                            title="Assign Driver"
                          >
                            <FaUserPlus size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setIsModalOpen(false);
                              setEditingVehicle(null);
                              setTelematicsModal({ vehicleId: v._id, unitNumber: v.unitNumber });
                              setTelProvider("geotab");
                              setTelForm({ server: "my.geotab.com", database: "", username: "", password: "", apiToken: "", deviceSerial: "" });
                              setTelResult(null);
                            }}
                            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
                            title="Connect hardware GPS device"
                          >
                            🛰️ Connect
                          </button>
                          <button
                            onClick={() => { setSelectedVehicle(v); setIsDeleteModalOpen(true); }}
                            style={{ ...styles.iconBtn, color: "var(--t-error)" }}
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
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{editingVehicle ? "Update vehicle details" : "Add a new vehicle to your fleet"}</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              {/* Section: Basic Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>BASIC INFO</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>
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
                  <input
                    style={{ ...styles.input, ...(form.model.trim() && !/^[A-Za-z0-9 \-\.]{1,50}$/.test(form.model.trim()) ? { borderColor: "var(--t-error)" } : {}) }}
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g. Cascadia"
                    maxLength={50}
                  />
                  {form.model.trim() && !/^[A-Za-z0-9 \-\.]{1,50}$/.test(form.model.trim()) && (
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Only letters, numbers, spaces, hyphens, or periods allowed (max 50).</p>
                  )}
                </div>
                <div>
                  <label style={styles.label}>Year</label>
                  <input style={styles.input} type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2021" />
                </div>
                <div>
                  <label style={styles.label}>VIN</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(form.vin && form.vin.length !== 17 ? { borderColor: "var(--t-error)" } : {}),
                    }}
                    value={form.vin}
                    maxLength={17}
                    onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "") })}
                    placeholder="17-character VIN"
                  />
                  {form.vin.length > 0 && (
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: form.vin.length === 17 ? "var(--t-success)" : "var(--t-error)", fontWeight: 500 }}>
                      {form.vin.length === 17 ? "✓ Valid length" : `${form.vin.length}/17 characters`}
                    </p>
                  )}
                </div>
                <div>
                  <label style={styles.label}>License Plate</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(form.licensePlate.trim() && !/^[A-Z0-9 \-]{2,10}$/i.test(form.licensePlate.trim()) ? { borderColor: "var(--t-error)" } : {}),
                    }}
                    value={form.licensePlate}
                    maxLength={10}
                    onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase().replace(/[^A-Z0-9 \-]/gi, "") })}
                    placeholder="e.g. ABCD 1234"
                  />
                  {form.licensePlate.trim().length > 0 && !/^[A-Z0-9 \-]{2,10}$/i.test(form.licensePlate.trim()) && (
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>
                      Must be 2–10 characters (letters, numbers, spaces, hyphens only).
                    </p>
                  )}
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
              </div>
              {/* Section: Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>DETAILS</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Odometer (km)</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(form.odometer !== "" && (Number(form.odometer) < 0 || Number(form.odometer) > 10_000_000 || !Number.isInteger(Number(form.odometer))) ? { borderColor: "var(--t-error)" } : {}),
                    }}
                    type="number"
                    min={0}
                    max={10_000_000}
                    step={1}
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  />
                  {form.odometer !== "" && (() => {
                    const odo = Number(form.odometer);
                    if (odo < 0) return <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Odometer cannot be negative.</p>;
                    if (odo > 10_000_000) return <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Odometer exceeds maximum (10,000,000 km).</p>;
                    if (!Number.isInteger(odo)) return <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>Odometer must be a whole number.</p>;
                    return null;
                  })()}
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
                  {(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const expiry = form.insuranceExpiry ? new Date(form.insuranceExpiry + "T00:00:00") : null;
                    const isExpired = expiry && expiry < today;
                    const daysUntil = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000) : null;
                    const isSoonExpiring = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;
                    return (
                      <>
                        <label style={styles.label}>Insurance Expiry</label>
                        <input
                          style={{ ...styles.input, ...(isExpired ? { borderColor: "var(--t-error)" } : isSoonExpiring ? { borderColor: "var(--t-warning)" } : {}) }}
                          type="date"
                          value={form.insuranceExpiry}
                          onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })}
                        />
                        {isExpired && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>⚠ Insurance expired {Math.abs(daysUntil!)} day{Math.abs(daysUntil!) !== 1 ? "s" : ""} ago.</p>}
                        {isSoonExpiring && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-warning)", fontWeight: 500 }}>⚠ Expires in {daysUntil} day{daysUntil !== 1 ? "s" : ""}.</p>}
                      </>
                    );
                  })()}
                </div>
                <div>
                  {(() => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const expiry = form.registrationExpiry ? new Date(form.registrationExpiry + "T00:00:00") : null;
                    const isExpired = expiry && expiry < today;
                    const daysUntil = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000) : null;
                    const isSoonExpiring = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;
                    return (
                      <>
                        <label style={styles.label}>Registration Expiry</label>
                        <input
                          style={{
                            ...styles.input,
                            ...(isExpired ? { borderColor: "var(--t-error)" } : isSoonExpiring ? { borderColor: "var(--t-warning)" } : {}),
                          }}
                          type="date"
                          value={form.registrationExpiry}
                          onChange={(e) => setForm({ ...form, registrationExpiry: e.target.value })}
                        />
                        {isExpired && (
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)", fontWeight: 500 }}>
                            ⚠ Registration expired {Math.abs(daysUntil!)} day{Math.abs(daysUntil!) !== 1 ? "s" : ""} ago.
                          </p>
                        )}
                        {isSoonExpiring && (
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-warning)", fontWeight: 500 }}>
                            ⚠ Expires in {daysUntil} day{daysUntil !== 1 ? "s" : ""}.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Notes</label>
                  <textarea style={{ ...styles.input, height: "72px", resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={saving}>
                {saving ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {isAssignModalOpen && assigningVehicle && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div
            style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "440px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-indigo)" }}>
                  <FaUserPlus size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Assign Driver</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>{assigningVehicle.unitNumber} — select or unassign a driver</div>
                </div>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <div style={{ marginTop: "24px" }}>
                <label style={styles.label}>Driver</label>
                <select
                  style={styles.input}
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">— Unassign —</option>
                  {drivers.map((d: any) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={assigning}>
                Cancel
              </button>
              <button onClick={handleAssignDriver} style={{ padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={assigning}>
                {assigning ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telematics Modal */}
      {telematicsModal && (
        <div style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }} onClick={() => setTelematicsModal(null)}>
          <div style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "460px", boxShadow: "var(--t-shadow-lg)", fontFamily: "Inter, system-ui, sans-serif" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛰️</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-text)" }}>Connect Hardware GPS</div>
                  <div style={{ fontSize: 12, color: "var(--t-text-ghost)", marginTop: 2 }}>Vehicle: {telematicsModal.unitNumber}</div>
                </div>
              </div>
              <button onClick={() => setTelematicsModal(null)} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Provider tabs */}
              <div style={{ display: "flex", gap: 8 }}>
                {(["geotab", "samsara"] as const).map(p => (
                  <button key={p} onClick={() => { setTelProvider(p); setTelResult(null); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `2px solid ${telProvider === p ? "var(--t-indigo)" : "var(--t-border-strong)"}`, background: telProvider === p ? "var(--t-indigo-bg)" : "var(--t-surface)", color: telProvider === p ? "var(--t-indigo)" : "var(--t-text-muted)", cursor: "pointer", fontWeight: telProvider === p ? 700 : 400, fontSize: 13, fontFamily: "Inter, system-ui, sans-serif", textTransform: "capitalize" }}>
                    {p === "geotab" ? "Geotab" : "Samsara"}
                  </button>
                ))}
              </div>

              {/* Fields */}
              {telProvider === "geotab" ? (
                <>
                  {[["Server URL", "server", "my.geotab.com"], ["Database", "database", ""], ["Username", "username", ""], ["Password", "password", ""]].map(([label, field, placeholder]) => (
                    <div key={field}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                      <input type={field === "password" ? "password" : "text"} autoComplete={field === "password" ? "new-password" : "off"} value={(telForm as any)[field]} onChange={e => setTelForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--t-border-strong)", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "var(--t-hover-bg)", color: "var(--t-text)", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Device Serial</label>
                    <input type="text" autoComplete="off" value={telForm.deviceSerial} onChange={e => setTelForm(f => ({ ...f, deviceSerial: e.target.value }))} placeholder="b9 (Geotab device ID)" style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--t-border-strong)", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "var(--t-hover-bg)", color: "var(--t-text)", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }} />
                  </div>
                </>
              ) : (
                <>
                  {[["API Token", "apiToken", "samsara_api_..."], ["Samsara Vehicle ID", "deviceSerial", "281474978005248"]].map(([label, field, placeholder]) => (
                    <div key={field}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                      <input type={field === "apiToken" ? "password" : "text"} autoComplete={field === "apiToken" ? "new-password" : "off"} value={(telForm as any)[field]} onChange={e => setTelForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--t-border-strong)", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "var(--t-hover-bg)", color: "var(--t-text)", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }} />
                    </div>
                  ))}
                </>
              )}

              {telResult && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: telResult.ok ? "var(--t-success-bg)" : "var(--t-error-bg)", color: telResult.ok ? "var(--t-success)" : "var(--t-error)", fontSize: 13, fontWeight: 500 }}>
                  {telResult.ok ? "✅ " : "❌ "}{telResult.msg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", gap: 8 }}>
              <button onClick={() => setTelematicsModal(null)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: 8, color: "var(--t-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleTestConnection} disabled={telLoading} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--t-border-strong)", background: "var(--t-hover-bg)", color: "var(--t-text)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                {telLoading ? "Testing..." : "Test Connection"}
              </button>
              <button onClick={handlePairDevice} disabled={telLoading} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--t-indigo)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif" }}>
                {telLoading ? "Saving..." : "Save & Pair"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && selectedVehicle && (
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
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Delete Vehicle</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>This action cannot be undone</div>
                </div>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto", flexGrow: 1 }}>
              <p style={{ marginTop: "24px", textAlign: "center", color: "var(--t-text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{selectedVehicle.unitNumber}</strong>? This action cannot be undone.
              </p>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "10px", flexShrink: 0 }}>
              <button onClick={() => setIsDeleteModalOpen(false)} style={{ padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={deleting}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: "10px 20px", background: "var(--t-error)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} disabled={deleting}>
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
    background: "var(--t-accent)",
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
    background: "var(--t-hover-bg)",
    color: "var(--t-text-faint)",
    border: "1px solid var(--t-border-strong)",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
  iconBtn: {
    background: "var(--t-hover-bg)",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    color: "var(--t-text-faint)",
    display: "flex",
    alignItems: "center",
  },
  statCard: {
    background: "var(--t-surface)",
    borderRadius: "12px",
    border: "1px solid var(--t-border)",
    padding: "20px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
  },
  tableContainer: {
    background: "var(--t-surface)",
    borderRadius: "16px",
    border: "1px solid var(--t-border)",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeaderRow: {
    background: "var(--t-surface-alt)",
    borderBottom: "1px solid var(--t-border)",
  },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--t-indigo)",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid var(--t-stripe)",
  },
  td: {
    padding: "14px 16px",
    color: "var(--t-text-muted)",
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
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid var(--t-border-strong)",
    fontSize: "14px",
    color: "var(--t-text)",
    background: "var(--t-input-bg)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    marginBottom: "7px",
    letterSpacing: "0.8px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
};

export default Vehicles;
