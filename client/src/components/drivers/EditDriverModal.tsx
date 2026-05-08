import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, parseISO } from "date-fns";
import { FaCalendarAlt, FaEdit } from "react-icons/fa";
import { API_BASE_URL } from "../../utils/env";
import {
  WORK_AUTH_OPTIONS,
  workAuthNeedsExpiry,
  formatContact,
  formatSIN,
  validateHstGst,
  validateExpiryDate,
  validateWorkAuthExpiry,
} from "../../utils/driverUtils";

interface Props {
  isOpen: boolean;
  driver: any | null;
  orgCategories: string[];
  orgCategoriesConfigured: boolean;
  onClose: () => void;
  onSaved: () => void;
  onConfigureCategories: () => void;
}

const INITIAL_FIELD_ERRORS = {
  name: "", email: "", contact: "", hst_gst: "", sinNo: "",
  licence: "", licence_expiry_date: "", workAuthExpiry: "",
};

const EditDriverModal: React.FC<Props> = ({
  isOpen,
  driver,
  orgCategories,
  orgCategoriesConfigured,
  onClose,
  onSaved,
  onConfigureCategories,
}) => {
  const [localDriver, setLocalDriver] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showWorkAuthPicker, setShowWorkAuthPicker] = useState(false);
  const [modalError, setModalError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [driverNotes, setDriverNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteType, setNewNoteType] = useState("General");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [driverPayouts, setDriverPayouts] = useState<any[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && driver) {
      const legacyMap: Record<string, string> = {
        "Backhaul": "backhaulRate",
        "Combo": "comboRate",
        "Extra Sheet/E.W": "extraSheetEWRate",
        "Regular/Banner": "regularBannerRate",
        "Wholesale": "wholesaleRate",
        "Wholesale DZ": "wholesaleRate",
      };
      const seededRates: Record<string, string> = { ...(driver.categoryRates || {}) };
      for (const [cat, field] of Object.entries(legacyMap)) {
        if (!seededRates[cat] && driver[field]) seededRates[cat] = String(driver[field]);
      }
      setLocalDriver({ ...driver, categoryRates: seededRates });
      setFieldErrors(INITIAL_FIELD_ERRORS);
      setModalError("");
      setUsernameError("");
      setShowExpiryPicker(false);
      setShowWorkAuthPicker(false);
      setNewNoteBody("");
      setNewNoteType("General");
      fetchDriverNotes(driver._id);
      fetchDriverPayouts(driver._id);
    }
  }, [isOpen, driver]);

  const checkUsernameExists = (username: string) => {
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/drivers/check?username=${username}`);
        setUsernameError(response.data.exists ? "Username already exists." : "");
      } catch (err) {
        console.error("Failed to check username:", err);
      }
    }, 400);
  };

  const handleInputChange = (field: string, value: any) => {
    setLocalDriver((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUsernameChangeEdit = (value: string) => {
    setLocalDriver((prev: any) => ({ ...prev, username: value }));
    if (driver && driver.username === value.trim()) {
      setUsernameError("");
    } else if (value.trim()) {
      checkUsernameExists(value.trim());
    } else {
      setUsernameError("");
    }
  };

  const updateDriver = async () => {
    try {
      const token = localStorage.getItem("token");
      const { trainings, complianceDocuments, ...payload } = localDriver;
      await axios.put(`${API_BASE_URL}/drivers/${localDriver._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSaved();
    } catch (error: any) {
      console.error("Error updating driver:", error);
      setModalError(error.response?.data?.message || "Failed to update driver. Please check all fields and try again.");
    }
  };

  const fetchDriverNotes = async (driverId: string) => {
    setNotesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/drivers/${driverId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverNotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDriverNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (driverId: string) => {
    if (!newNoteBody.trim()) return;
    setNoteSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/drivers/${driverId}/notes`,
        { type: newNoteType, body: newNoteBody.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDriverNotes((prev) => [res.data, ...prev]);
      setNewNoteBody("");
      setNewNoteType("General");
    } catch {
      // silent — note body validation is client-side
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (driverId: string, noteId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/drivers/${driverId}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch {
      // silent
    }
  };

  const fetchDriverPayouts = async (driverId: string) => {
    setPayoutsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/payments?driverId=${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverPayouts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDriverPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  };

  if (!isOpen || !localDriver) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "var(--t-surface)", borderRadius: "16px", maxWidth: "960px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)", border: "1px solid var(--t-border)" }}>

        {/* Modal Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg,#4F46E5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FaEdit size={16} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Edit Driver Profile</h2>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--t-text-dim)" }}>Update credentials, rates, and licensing information</p>
            </div>
          </div>
          <button
            onClick={() => { setUsernameError(""); onClose(); }}
            style={{ background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", fontFamily: "Inter, system-ui, sans-serif" }}
          >✕</button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 28px" }}>

          {/* Section: Identity & Credentials */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>IDENTITY &amp; CREDENTIALS</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME</label>
              <input type="text" defaultValue={localDriver?.name}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.name ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => { handleInputChange("name", e.target.value); setFieldErrors((prev) => ({ ...prev, name: e.target.value.trim() === "" ? "Name is required." : "" })); }} />
              {fieldErrors.name && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.name}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>EMAIL ADDRESS</label>
              <input type="email" defaultValue={localDriver?.email}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.email ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => { const v = e.target.value; handleInputChange("email", v); const emailErr = !v.trim() ? "Email is required." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "Enter a valid email address." : ""; setFieldErrors((prev) => ({ ...prev, email: emailErr })); }} />
              {fieldErrors.email && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>USERNAME</label>
              <input type="text" placeholder="Enter username" defaultValue={localDriver?.username}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${usernameError ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => handleUsernameChangeEdit(e.target.value)} />
              {usernameError && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{usernameError}</p>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>CONTACT NUMBER</label>
              <input type="text" placeholder="+1 (416) 555-0191" value={localDriver?.contact || ""}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.contact ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => {
                  const formatted = formatContact(e.target.value);
                  handleInputChange("contact", formatted);
                  const digits = formatted.replace(/\D/g, "");
                  setFieldErrors((prev) => ({ ...prev, contact: digits.length > 0 && digits.length < 10 ? "Enter a valid 10-digit phone number." : "" }));
                }} />
              {fieldErrors.contact && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.contact}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>SIN NUMBER</label>
              <input type="text" placeholder="XXX-XXX-XXX" value={localDriver?.sinNo || ""}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.sinNo ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => {
                  const formatted = formatSIN(e.target.value);
                  handleInputChange("sinNo", formatted);
                  const digits = formatted.replace(/\D/g, "");
                  setFieldErrors((prev) => ({ ...prev, sinNo: digits.length > 0 && digits.length < 9 ? "SIN must be 9 digits." : digits.length === 0 ? "SIN No. is required." : "" }));
                }} />
              {fieldErrors.sinNo && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.sinNo}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>STATUS</label>
              <select value={localDriver?.status || "Active"}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                onChange={(e) => handleInputChange("status", e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>HST / GST NUMBER</label>
              <input type="text" placeholder="e.g. 123456789RT0001" defaultValue={localDriver?.hst_gst}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.hst_gst ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => { handleInputChange("hst_gst", e.target.value); setFieldErrors((prev: any) => ({ ...prev, hst_gst: validateHstGst(e.target.value) })); }} />
              {fieldErrors.hst_gst && <div style={{ fontSize: "11px", color: "var(--t-error)", marginTop: "4px" }}>{fieldErrors.hst_gst}</div>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>BUSINESS NAME</label>
              <input type="text" placeholder="Optional — if incorporated" defaultValue={localDriver?.business_name}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => handleInputChange("business_name", e.target.value)} />
            </div>
          </div>

          {/* Section: Rate Configuration */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>RATE CONFIGURATION</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
            <button
              onClick={onConfigureCategories}
              style={{ padding: "4px 10px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text-faint)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              ⚙ Configure
            </button>
          </div>

          {!orgCategoriesConfigured ? (
            <div style={{ padding: "28px 20px", textAlign: "center" as const, background: "var(--t-indigo-bg)", borderRadius: "10px", border: "1px dashed rgba(79,70,229,0.3)", marginBottom: "12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--t-text-dim)" }}>No categories configured yet</p>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--t-text-ghost)" }}>Click ⚙ Configure above to set up categories, then fill in rates.</p>
              <button
                onClick={onConfigureCategories}
                style={{ padding: "8px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                + Configure Categories
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>
              {orgCategories.map((cat) => (
                <div key={cat} style={{ background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "14px" }}>
                  <label style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-indigo)", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>{cat.toUpperCase()}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", color: "var(--t-text-dim)" }}>$</span>
                    <input
                      type="number"
                      key={`${localDriver?._id}-${cat}`}
                      defaultValue={localDriver?.categoryRates?.[cat] ?? ""}
                      style={{ flex: 1, padding: "8px 10px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", width: "100%", boxSizing: "border-box" as const }}
                      onChange={(e) => setLocalDriver((prev: any) => ({ ...prev, categoryRates: { ...prev.categoryRates, [cat]: e.target.value } }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Licensing & Expiry */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>LICENSING &amp; EXPIRY</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE CLASS</label>
              <input type="text" placeholder="e.g. AZ, DZ, G" value={localDriver?.licence || ""}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.licence ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase();
                  handleInputChange("licence", upper);
                  setFieldErrors((prev) => ({ ...prev, licence: upper.trim() === "" ? "Licence class is required." : "" }));
                }} />
              {fieldErrors.licence && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.licence}</p>}
            </div>
            <div style={{ position: "relative" as const }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE EXPIRY DATE</label>
              <div onClick={() => setShowExpiryPicker(v => !v)}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.licence_expiry_date?.startsWith("Warning") ? "var(--t-warning)" : fieldErrors.licence_expiry_date ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                {(() => {
                  const raw = localDriver?.licence_expiry_date;
                  const dateStr = raw ? (raw.includes("T") ? raw.split("T")[0] : raw) : "";
                  return <span style={{ color: dateStr ? "var(--t-text)" : "var(--t-text-ghost)" }}>{dateStr ? format(parseISO(dateStr), "MMM d, yyyy") : "Select expiry date"}</span>;
                })()}
                <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
              </div>
              {showExpiryPicker && (
                <>
                  <div onClick={() => setShowExpiryPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                    <DayPicker mode="single"
                      selected={(() => { const raw = localDriver?.licence_expiry_date; const s = raw ? (raw.includes("T") ? raw.split("T")[0] : raw) : ""; return s ? parseISO(s) : undefined; })()}
                      onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); handleInputChange("licence_expiry_date", dateStr); setFieldErrors((prev) => ({ ...prev, licence_expiry_date: validateExpiryDate(dateStr) })); setShowExpiryPicker(false); } }} />
                  </div>
                </>
              )}
              {fieldErrors.licence_expiry_date && (
                <p style={{ margin: "5px 0 0", fontSize: "11px", color: fieldErrors.licence_expiry_date.startsWith("Warning") ? "var(--t-warning)" : "var(--t-error)" }}>{fieldErrors.licence_expiry_date}</p>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTHORIZATION</label>
              <select value={localDriver?.workStatus || ""}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: localDriver?.workStatus ? "var(--t-text)" : "var(--t-text-ghost)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                onChange={(e) => { handleInputChange("workStatus", e.target.value); handleInputChange("workAuthExpiry", ""); setShowWorkAuthPicker(false); }}>
                <option value="">Select work authorization</option>
                {WORK_AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
            </div>
            {workAuthNeedsExpiry(localDriver?.workStatus) && (
              <div style={{ position: "relative" as const }}>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTH EXPIRY DATE</label>
                <div onClick={() => setShowWorkAuthPicker(v => !v)}
                  style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.workAuthExpiry ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                  <span style={{ color: localDriver?.workAuthExpiry ? "var(--t-text)" : "var(--t-text-ghost)" }}>
                    {localDriver?.workAuthExpiry ? format(parseISO(localDriver.workAuthExpiry), "MMM d, yyyy") : "Select expiry date"}
                  </span>
                  <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                </div>
                {showWorkAuthPicker && (
                  <>
                    <div onClick={() => setShowWorkAuthPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                      <DayPicker mode="single"
                        selected={localDriver?.workAuthExpiry ? parseISO(localDriver.workAuthExpiry) : undefined}
                        onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); handleInputChange("workAuthExpiry", dateStr); setFieldErrors((prev) => ({ ...prev, workAuthExpiry: validateWorkAuthExpiry(dateStr) })); setShowWorkAuthPicker(false); } }} />
                    </div>
                  </>
                )}
                {fieldErrors.workAuthExpiry && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.workAuthExpiry}</p>}
              </div>
            )}
          </div>

          {/* Section: Emergency Contact */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>EMERGENCY CONTACT</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME</label>
              <input type="text" placeholder="e.g. Jane Doe"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                value={localDriver?.emergencyContact?.name || ""}
                onChange={(e) => handleInputChange("emergencyContact", { ...localDriver?.emergencyContact, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>PHONE NUMBER</label>
              <input type="text" placeholder="e.g. +1 (416) 555-0100"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                value={localDriver?.emergencyContact?.phone || ""}
                onChange={(e) => handleInputChange("emergencyContact", { ...localDriver?.emergencyContact, phone: formatContact(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>RELATIONSHIP</label>
              <input type="text" placeholder="e.g. Spouse, Parent"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                value={localDriver?.emergencyContact?.relationship || ""}
                onChange={(e) => handleInputChange("emergencyContact", { ...localDriver?.emergencyContact, relationship: e.target.value })} />
            </div>
          </div>

          {/* Section: Notes & Incidents */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>NOTES & INCIDENTS</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          {/* Add note form */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start" }}>
            <select
              value={newNoteType}
              onChange={(e) => setNewNoteType(e.target.value)}
              style={{ padding: "10px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer", flexShrink: 0 }}
            >
              {["General", "Warning", "Incident", "Compliment"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <textarea
              placeholder="Write a note…"
              value={newNoteBody}
              onChange={(e) => setNewNoteBody(e.target.value)}
              rows={2}
              style={{ flex: 1, padding: "10px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", resize: "vertical" as const, minHeight: "60px" }}
            />
            <button
              onClick={() => handleAddNote(localDriver._id)}
              disabled={noteSubmitting || !newNoteBody.trim()}
              style={{ padding: "10px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: newNoteBody.trim() ? "pointer" : "not-allowed", fontFamily: "Inter, system-ui, sans-serif", opacity: newNoteBody.trim() ? 1 : 0.5, flexShrink: 0 }}
            >
              {noteSubmitting ? "Adding…" : "Add Note"}
            </button>
          </div>

          {/* Notes list */}
          {notesLoading ? (
            <div style={{ padding: "20px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading notes…</div>
          ) : driverNotes.length === 0 ? (
            <div style={{ background: "var(--t-surface-alt)", border: "1px dashed var(--t-border)", borderRadius: "10px", padding: "24px", textAlign: "center" as const }}>
              <p style={{ margin: 0, color: "var(--t-text-ghost)", fontSize: "13px" }}>No notes yet. Add the first one above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {driverNotes.map((note: any) => {
                const typeCfg: Record<string, { color: string; bg: string }> = {
                  General:    { color: "#4F46E5", bg: "rgba(79,70,229,0.1)"   },
                  Warning:    { color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
                  Incident:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
                  Compliment: { color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
                };
                const cfg = typeCfg[note.type] || typeCfg.General;
                const dateStr = note.createdAt
                  ? new Date(note.createdAt).toLocaleString("en-CA", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                  : "";
                return (
                  <div key={note._id} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "20px", background: cfg.bg, color: cfg.color }}>
                          {note.type.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--t-text-ghost)" }}>
                          {note.authorName} · {dateStr}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(localDriver._id, note._id)}
                        title="Delete note"
                        style={{ background: "none", border: "none", color: "var(--t-text-ghost)", cursor: "pointer", padding: "2px 6px", fontSize: "13px", lineHeight: 1, borderRadius: "4px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-text-ghost)")}
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>
                      {note.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section: Payout History */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>PAYOUT HISTORY</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          {payoutsLoading ? (
            <div style={{ padding: "24px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading payouts…</div>
          ) : driverPayouts.length === 0 ? (
            <div style={{ background: "var(--t-surface-alt)", border: "1px dashed var(--t-border)", borderRadius: "10px", padding: "28px", textAlign: "center" as const }}>
              <p style={{ margin: 0, color: "var(--t-text-ghost)", fontSize: "13px" }}>No payouts recorded for this driver yet.</p>
            </div>
          ) : (
            <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--t-hover-bg)" }}>
                    {["DATE", "PERIOD", "AMOUNT (CAD)", "TIMESHEETS", "STATUS"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left" as const, fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverPayouts.map((p: any, i: number) => {
                    const statusCfg: Record<string, { bg: string; color: string }> = {
                      paid:       { bg: "var(--t-success-bg)", color: "var(--t-success)" },
                      pending:    { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
                      processing: { bg: "var(--t-info-bg)",    color: "var(--t-info)" },
                      failed:     { bg: "var(--t-error-bg)",   color: "var(--t-error)" },
                    };
                    const sc = statusCfg[p.status] || statusCfg.pending;
                    const paidDate = p.paidAt ? format(new Date(p.paidAt), "MMM d, yyyy") : (p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : "—");
                    const periodStr = p.periodFrom && p.periodTo
                      ? `${format(new Date(p.periodFrom), "MMM d")} – ${format(new Date(p.periodTo), "MMM d, yyyy")}`
                      : "—";
                    const amountCad = ((p.amount || 0) / 100).toFixed(2);
                    return (
                      <tr key={p._id || i} style={{ borderBottom: i < driverPayouts.length - 1 ? "1px solid var(--t-stripe)" : "none", background: i % 2 === 1 ? "var(--t-stripe)" : "transparent" }}>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text-secondary)" }}>{paidDate}</td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text-faint)" }}>{periodStr}</td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text)", fontWeight: 600 }}>${amountCad}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--t-text-dim)" }}>{(p.timesheetIds || []).length} sheet{(p.timesheetIds || []).length !== 1 ? "s" : ""}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{p.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: "20px 28px", borderTop: "1px solid var(--t-border)", flexShrink: 0 }}>
          {modalError && (
            <div style={{ marginBottom: "12px", padding: "10px 14px", background: "var(--t-error-bg)", border: "1px solid var(--t-error)", borderRadius: "8px", color: "var(--t-error)", fontSize: "13px", fontWeight: 500 }}>
              {modalError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              onClick={() => { setUsernameError(""); onClose(); }}
              style={{ padding: "11px 20px", background: "none", border: "none", color: "var(--t-text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              Close without saving
            </button>
            <button
              onClick={() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const sinDigits = (localDriver.sinNo || "").replace(/\D/g, "");
                const contactDigits = (localDriver.contact || "").replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, "");
                const needsWorkAuthExpiry = workAuthNeedsExpiry(localDriver?.workStatus);
                const emailVal = (localDriver.email || "").trim();
                const errors = {
                  name: !(localDriver.name || "").trim() ? "Name is required." : "",
                  email: !emailVal ? "Email is required." : !emailRegex.test(emailVal) ? "Enter a valid email address." : "",
                  contact: contactDigits.length > 0 && contactDigits.length !== 10 ? "Enter a valid 10-digit phone number." : "",
                  hst_gst: validateHstGst(localDriver.hst_gst || ""),
                  sinNo: sinDigits.length !== 9 ? "SIN must be 9 digits." : "",
                  licence: !(localDriver.licence || "").trim() ? "Licence class is required." : "",
                  licence_expiry_date: validateExpiryDate(localDriver.licence_expiry_date || ""),
                  workAuthExpiry: needsWorkAuthExpiry ? validateWorkAuthExpiry(localDriver.workAuthExpiry || "") : "",
                };
                setFieldErrors(errors);
                if (usernameError) { setModalError("Please resolve the username error before submitting."); return; }
                if (!(localDriver.username || "").trim()) { setModalError("Username is required."); return; }
                const hasError = errors.name || errors.email || errors.contact || errors.hst_gst || errors.sinNo || errors.licence || (errors.licence_expiry_date && !errors.licence_expiry_date.startsWith("Warning")) || errors.workAuthExpiry;
                if (hasError) { setModalError(""); return; }
                setModalError("");
                updateDriver();
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
              ✓ Update Driver Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDriverModal;
