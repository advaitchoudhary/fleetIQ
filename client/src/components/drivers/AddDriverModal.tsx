import React, { useState, useRef } from "react";
import axios from "axios";
import { FaEdit, FaClipboard, FaCalendarAlt } from "react-icons/fa";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, parseISO } from "date-fns";
import { API_BASE_URL } from "../../utils/env";
import {
  WORK_AUTH_OPTIONS,
  INITIAL_DRIVER_STATE,
  INITIAL_ADD_ERRORS,
  workAuthNeedsExpiry,
  generatePassword,
  formatContact,
  formatSIN,
  validateHstGst,
  validateExpiryDate,
  validateWorkAuthExpiry,
} from "../../utils/driverUtils";

interface Props {
  isOpen: boolean;
  orgCategories: string[];
  orgCategoriesConfigured: boolean;
  onClose: () => void;
  onSaved: () => void;
  onConfigureCategories: () => void;
}

const AddDriverModal: React.FC<Props> = ({
  isOpen,
  orgCategories,
  orgCategoriesConfigured,
  onClose,
  onSaved,
  onConfigureCategories,
}) => {
  const [driver, setDriver] = useState<any>({ ...INITIAL_DRIVER_STATE, password: generatePassword() });
  const [fieldErrors, setFieldErrors] = useState(INITIAL_ADD_ERRORS);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showWorkAuthPicker, setShowWorkAuthPicker] = useState(false);
  const [error, setError] = useState("");
  const [customRates, setCustomRates] = useState<{ cat: string; rate: string }[]>([]);
  const [usernameError, setUsernameError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = () => {
    setDriver({ ...INITIAL_DRIVER_STATE, password: generatePassword() });
    setFieldErrors(INITIAL_ADD_ERRORS);
    setError("");
    setUsernameError("");
    setCustomRates([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textarea);
  };

  const handleCopyPassword = (password: string) => {
    const showCopied = () => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(password).then(showCopied).catch(() => fallbackCopy(password));
    } else {
      fallbackCopy(password);
    }
  };

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sinDigits = (driver.sinNo || "").replace(/\D/g, "");
    const contactDigits = (driver.contact || "").replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, "");
    const needsWorkAuthExpiry = workAuthNeedsExpiry(driver.workStatus);
    const emailVal = (driver.email || "").trim();

    const errors = {
      name: !(driver.name || "").trim() ? "Name is required." : "",
      email: !emailVal ? "Email is required." : !emailRegex.test(emailVal) ? "Enter a valid email address." : "",
      contact: !contactDigits.length ? "Contact number is required." : contactDigits.length !== 10 ? "Enter a valid 10-digit phone number." : "",
      hst_gst: validateHstGst(driver.hst_gst || ""),
      sinNo: sinDigits.length !== 9 ? "SIN must be 9 digits." : "",
      licence: !(driver.licence || "").trim() ? "Licence class is required." : "",
      licence_expiry_date: !(driver.licence_expiry_date || "").trim() ? "Licence expiry date is required." : validateExpiryDate(driver.licence_expiry_date || ""),
      workAuthExpiry: needsWorkAuthExpiry ? validateWorkAuthExpiry(driver.workAuthExpiry || "") : "",
      password: (driver.password || "").trim().length < 6 ? "Password must be at least 6 characters." : "",
      username: usernameError || !(driver.username || "").trim() ? (usernameError || "Username is required.") : "",
      workStatus: !(driver.workStatus || "").trim() ? "Work authorization is required." : "",
    };

    setFieldErrors(errors);
    setError("");
    if (Object.values(errors).some((e) => e && !e.startsWith("Warning"))) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/drivers`,
        { ...driver, username: (driver.username || "").trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 201 || response.status === 200) {
        resetForm();
        onSaved();
      }
    } catch (err: any) {
      console.error("Error creating driver:", err);
      setError(err.response?.data?.message || "Failed to create driver. Please check all fields and try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={handleClose}
    >
      <div
        style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "920px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaEdit size={16} color="var(--t-indigo)" />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Add New Driver</div>
              <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>
                Create a new driver profile and credentials &nbsp;<span style={{ color: "var(--t-error)" }}>*</span> Required fields
              </div>
            </div>
          </div>
          <button onClick={handleClose} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "0 28px 24px", overflowY: "auto" }}>

          {/* IDENTITY & CREDENTIALS */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>IDENTITY & CREDENTIALS</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="text" placeholder="Enter name"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.name ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { setDriver({ ...driver, name: e.target.value }); setFieldErrors((prev) => ({ ...prev, name: e.target.value.trim() === "" ? "Name is required." : "" })); }} />
              {fieldErrors.name && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.name}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>EMAIL ADDRESS <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="email" placeholder="Enter email"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.email ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { const v = e.target.value; setDriver({ ...driver, email: v }); const emailErr = !v.trim() ? "Email is required." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "Enter a valid email address." : ""; setFieldErrors((prev) => ({ ...prev, email: emailErr })); }} />
              {fieldErrors.email && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>USERNAME <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="text" placeholder="Enter username" value={driver.username}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${(usernameError || fieldErrors.username) ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { const v = e.target.value.trim(); setDriver({ ...driver, username: v }); setFieldErrors((prev) => ({ ...prev, username: "" })); if (v) { checkUsernameExists(v); } else { setUsernameError(""); } }} />
              {(fieldErrors.username || usernameError) && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.username || usernameError}</p>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>CONTACT NO. <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="text" placeholder="+1 (416) 555-0191" value={driver.contact}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.contact ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { const formatted = formatContact(e.target.value); setDriver({ ...driver, contact: formatted }); const digits = formatted.replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, ""); setFieldErrors((prev) => ({ ...prev, contact: digits.length > 0 && digits.length < 10 ? "Enter a valid 10-digit phone number." : "" })); }} />
              {fieldErrors.contact && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.contact}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>BUSINESS NAME</label>
              <input type="text" placeholder="Enter business name"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => setDriver({ ...driver, business_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>HST/GST NUMBER</label>
              <input type="text" placeholder="e.g. 123456789RT0001"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.hst_gst ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { setDriver({ ...driver, hst_gst: e.target.value }); setFieldErrors((prev: any) => ({ ...prev, hst_gst: validateHstGst(e.target.value) })); }} />
              {fieldErrors.hst_gst && <div style={{ fontSize: "11px", color: "var(--t-error)", marginTop: "4px" }}>{fieldErrors.hst_gst}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>SIN NO. <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="text" placeholder="XXX-XXX-XXX" value={driver.sinNo}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.sinNo ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { const formatted = formatSIN(e.target.value); setDriver({ ...driver, sinNo: formatted }); const digits = formatted.replace(/\D/g, ""); setFieldErrors((prev) => ({ ...prev, sinNo: digits.length > 0 && digits.length < 9 ? "SIN must be 9 digits." : digits.length === 0 ? "SIN No. is required." : "" })); }} />
              {fieldErrors.sinNo && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.sinNo}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTHORIZATION <span style={{ color: "var(--t-error)" }}>*</span></label>
              <select value={driver.workStatus}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box", cursor: "pointer" }}
                onChange={(e) => { setDriver({ ...driver, workStatus: e.target.value, workAuthExpiry: "" }); setShowWorkAuthPicker(false); setFieldErrors((prev) => ({ ...prev, workStatus: "" })); }}>
                <option value="">Select work authorization</option>
                {WORK_AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
              </select>
              {fieldErrors.workStatus && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.workStatus}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>STATUS</label>
              <select
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box", cursor: "pointer" }}
                onChange={(e) => setDriver({ ...driver, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* LICENSING & EXPIRY */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "28px 0 20px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>LICENSING & EXPIRY</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: workAuthNeedsExpiry(driver.workStatus) ? "1fr 1fr 1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE CLASS <span style={{ color: "var(--t-error)" }}>*</span></label>
              <input type="text" placeholder="e.g. AZ, DZ, G" value={driver.licence}
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.licence ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => { const upper = e.target.value.toUpperCase(); setDriver({ ...driver, licence: upper }); setFieldErrors((prev) => ({ ...prev, licence: upper.trim() === "" ? "Licence class is required." : "" })); }} />
              {fieldErrors.licence && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.licence}</p>}
            </div>
            <div style={{ position: "relative" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE EXPIRY DATE <span style={{ color: "var(--t-error)" }}>*</span></label>
              <div onClick={() => setShowExpiryPicker((v) => !v)}
                style={{ padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.licence_expiry_date?.startsWith("Warning") ? "var(--t-warning)" : fieldErrors.licence_expiry_date ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <span style={{ color: driver.licence_expiry_date ? "var(--t-text)" : "var(--t-text-ghost)" }}>{driver.licence_expiry_date ? format(parseISO(driver.licence_expiry_date), "MMM d, yyyy") : "Select expiry date"}</span>
                <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
              </div>
              {showExpiryPicker && (<>
                <div onClick={() => setShowExpiryPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                  <DayPicker mode="single" selected={driver.licence_expiry_date ? parseISO(driver.licence_expiry_date) : undefined}
                    onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); setDriver({ ...driver, licence_expiry_date: dateStr }); setFieldErrors((prev) => ({ ...prev, licence_expiry_date: validateExpiryDate(dateStr) })); setShowExpiryPicker(false); } }} />
                </div>
              </>)}
              {fieldErrors.licence_expiry_date && <p style={{ margin: "4px 0 0", fontSize: "11px", color: fieldErrors.licence_expiry_date.startsWith("Warning") ? "var(--t-warning)" : "var(--t-error)" }}>{fieldErrors.licence_expiry_date}</p>}
            </div>
            {workAuthNeedsExpiry(driver.workStatus) && (
              <div style={{ position: "relative" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTH EXPIRY <span style={{ color: "var(--t-error)" }}>*</span></label>
                <div onClick={() => setShowWorkAuthPicker((v) => !v)}
                  style={{ padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.workAuthExpiry ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ color: driver.workAuthExpiry ? "var(--t-text)" : "var(--t-text-ghost)" }}>{driver.workAuthExpiry ? format(parseISO(driver.workAuthExpiry), "MMM d, yyyy") : "Select expiry date"}</span>
                  <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                </div>
                {showWorkAuthPicker && (<>
                  <div onClick={() => setShowWorkAuthPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                    <DayPicker mode="single" selected={driver.workAuthExpiry ? parseISO(driver.workAuthExpiry) : undefined}
                      onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); setDriver({ ...driver, workAuthExpiry: dateStr }); setFieldErrors((prev) => ({ ...prev, workAuthExpiry: validateWorkAuthExpiry(dateStr) })); setShowWorkAuthPicker(false); } }} />
                  </div>
                </>)}
                {fieldErrors.workAuthExpiry && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.workAuthExpiry}</p>}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>PASSWORD <span style={{ color: "var(--t-error)" }}>*</span></label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" value={driver.password} placeholder="Enter password"
                  style={{ flex: 1, padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${fieldErrors.password ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" }}
                  onChange={(e) => { setDriver({ ...driver, password: e.target.value }); setFieldErrors((prev) => ({ ...prev, password: e.target.value.trim().length < 6 ? "Password must be at least 6 characters." : "" })); }} />
                <button onClick={() => handleCopyPassword(driver.password)}
                  style={{ padding: "11px 14px", background: copySuccess ? "var(--t-success-bg)" : "var(--t-indigo-bg)", border: `1px solid ${copySuccess ? "rgba(5,150,105,0.3)" : "rgba(79,70,229,0.25)"}`, borderRadius: "8px", color: copySuccess ? "var(--t-success)" : "var(--t-indigo)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  <FaClipboard size={13} />{copySuccess ? "Copied!" : ""}
                </button>
              </div>
              {fieldErrors.password && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{fieldErrors.password}</p>}
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>ADDRESS</label>
              <input type="text" placeholder="Enter address"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                onChange={(e) => setDriver({ ...driver, address: e.target.value })} />
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" }}>EMERGENCY CONTACT</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME</label>
              <input type="text" placeholder="e.g. Jane Doe"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                value={driver.emergencyContact?.name || ""}
                onChange={(e) => setDriver({ ...driver, emergencyContact: { ...driver.emergencyContact, name: e.target.value } })} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>PHONE NUMBER</label>
              <input type="text" placeholder="e.g. +1 (416) 555-0100"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                value={driver.emergencyContact?.phone || ""}
                onChange={(e) => setDriver({ ...driver, emergencyContact: { ...driver.emergencyContact, phone: formatContact(e.target.value) } })} />
            </div>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>RELATIONSHIP</label>
              <input type="text" placeholder="e.g. Spouse, Parent"
                style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}
                value={driver.emergencyContact?.relationship || ""}
                onChange={(e) => setDriver({ ...driver, emergencyContact: { ...driver.emergencyContact, relationship: e.target.value } })} />
            </div>
          </div>

          {/* RATE CONFIGURATION */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>RATE CONFIGURATION</span>
            <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
            <button
              onClick={onConfigureCategories}
              style={{ padding: "4px 10px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text-faint)", fontSize: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
              ⚙ Configure
            </button>
          </div>

          {!orgCategoriesConfigured ? (
            <div style={{ padding: "28px 20px", textAlign: "center", background: "var(--t-surface-alt)", borderRadius: "10px", border: "1px dashed var(--t-border-strong)", marginBottom: "12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--t-text-dim)" }}>No categories configured yet</p>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--t-text-ghost)" }}>Click ⚙ Configure above to set up categories, then fill in rates.</p>
              <button onClick={onConfigureCategories}
                style={{ padding: "8px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                + Configure Categories
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {orgCategories.map((cat) => (
                <div key={cat} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "10px" }}>{cat.toUpperCase()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text-ghost)" }}>$</span>
                    <input type="number" placeholder="0.00"
                      style={{ flex: 1, padding: "8px 10px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text)", fontSize: "14px", fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" }}
                      onChange={(e) => setDriver((prev: any) => ({ ...prev, categoryRates: { ...prev.categoryRates, [cat]: e.target.value } }))} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom per-driver rates */}
          {customRates.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {customRates.map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", gap: "8px", alignItems: "center" }}>
                  <input type="text" placeholder="Category name" value={row.cat}
                    style={{ padding: "10px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
                    onChange={(e) => {
                      const oldCat = row.cat;
                      const newCat = e.target.value;
                      setCustomRates((prev) => prev.map((r, i) => i === idx ? { ...r, cat: newCat } : r));
                      setDriver((prev: any) => {
                        const next = { ...prev.categoryRates };
                        if (oldCat) delete next[oldCat];
                        if (newCat.trim()) next[newCat] = row.rate;
                        return { ...prev, categoryRates: next };
                      });
                    }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--t-text-ghost)", fontWeight: 600 }}>$</span>
                    <input type="number" placeholder="0.00" value={row.rate}
                      style={{ flex: 1, background: "none", border: "none", color: "var(--t-text)", fontSize: "13px", fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", outline: "none", width: "100%", padding: 0 }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomRates((prev) => prev.map((r, i) => i === idx ? { ...r, rate: val } : r));
                        if (row.cat.trim()) {
                          setDriver((prev: any) => ({ ...prev, categoryRates: { ...prev.categoryRates, [row.cat]: val } }));
                        }
                      }} />
                  </div>
                  <button
                    onClick={() => {
                      setCustomRates((prev) => prev.filter((_, i) => i !== idx));
                      if (row.cat.trim()) {
                        setDriver((prev: any) => {
                          const next = { ...prev.categoryRates };
                          delete next[row.cat];
                          return { ...prev, categoryRates: next };
                        });
                      }
                    }}
                    style={{ width: "36px", height: "36px", background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "var(--t-error)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setCustomRates((prev) => [...prev, { cat: "", rate: "" }])}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--t-hover-bg)", border: "1px dashed var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
            + Add Rate
          </button>

        </div>

        {/* Footer */}
        <div style={{ padding: "20px 28px", borderTop: "1px solid var(--t-hover-bg)", flexShrink: 0 }}>
          {error && (
            <div style={{ marginBottom: "12px", padding: "10px 14px", background: "var(--t-error-bg)", border: "1px solid var(--t-error)", borderRadius: "8px", color: "var(--t-error)", fontSize: "13px", fontWeight: 500 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={handleClose} style={{ padding: "11px 20px", background: "none", border: "none", color: "var(--t-text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              Close without saving
            </button>
            <button
              onClick={handleSubmit}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
              ✓ Add Driver Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddDriverModal;
