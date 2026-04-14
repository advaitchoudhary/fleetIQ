import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "Weak",   color: "var(--t-error)",   bg: "var(--t-error-bg)",   width: "33%"  };
  if (score <= 2) return { label: "Fair",   color: "var(--t-warning)", bg: "var(--t-warning-bg)", width: "66%"  };
  return             { label: "Strong", color: "var(--t-success)",  bg: "var(--t-success-bg)", width: "100%" };
};

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;

  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused,     setFocused]     = useState<string | null>(null);

  const [selectedRole,   setSelectedRole]   = useState(userRole === "driver" ? "driver" : "admin");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [drivers,        setDrivers]        = useState<any[]>([]);

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (selectedRole === "driver") fetchDrivers();
  }, [selectedRole]);

  useEffect(() => {
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    setError(""); setSuccess("");
  }, [selectedRole, selectedDriver]);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  const handleSubmit = async () => {
    setError(""); setSuccess("");

    const isAdminResettingDriver = selectedRole === "driver" && userRole !== "driver";
    if ((!isAdminResettingDriver && !oldPassword) || !newPassword || !confirmPassword) {
      setError("All fields are required."); return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters."); return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match."); return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = selectedRole === "driver"
        ? `${API_BASE_URL}/drivers/change-password`
        : `${API_BASE_URL}/auth/change-password`;

      const payload = selectedRole === "driver" && userRole !== "driver"
        ? { oldPassword, newPassword, driverId: selectedDriver }
        : { oldPassword, newPassword };

      await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess("Password changed successfully!");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => navigate(userRole === "driver" ? "/dashboard" : "/admin-home"), 3000);
    } catch (err) {
      setError((err as any).response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string, hasError = false): React.CSSProperties => ({
    width: "100%",
    padding: "10px 40px",
    fontSize: "14px",
    border: `1px solid ${hasError ? "var(--t-error)" : focused === name ? "var(--t-accent)" : "var(--t-border-strong)"}`,
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    boxSizing: "border-box",
    boxShadow: focused === name ? "0 0 0 3px var(--t-indigo-bg)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const isAdminResettingDriver = selectedRole === "driver" && userRole !== "driver";
  const isDisabled = loading || (!isAdminResettingDriver && !oldPassword) || !newPassword || !confirmPassword ||
    (isAdminResettingDriver && !selectedDriver) || passwordsMismatch;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px", padding: "14px 40px 0" }}>
        CHANGE PASSWORD
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
        <div style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", boxShadow: "var(--t-shadow)", padding: "40px", width: "100%", maxWidth: "440px" }}>

          {/* Icon + Title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--t-indigo-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <FaLock size={20} color="var(--t-indigo)" />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
              Change Password
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-dim)", lineHeight: 1.6 }}>
              Must be at least 8 characters and include uppercase, number, and special character.
            </p>
          </div>

          {/* Role toggle — admin/company_admin only */}
          {(userRole === "admin" || userRole === "company_admin") && (
            <div style={{ display: "flex", background: "var(--t-input-bg)", borderRadius: "8px", padding: "3px", marginBottom: "20px", gap: "3px" }}>
              {["admin", "driver"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  style={{ flex: 1, padding: "7px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s", fontFamily: "Inter, system-ui, sans-serif",
                    background: selectedRole === role ? "var(--t-select-bg)" : "transparent",
                    color: selectedRole === role ? "var(--t-indigo)" : "var(--t-text-dim)",
                    boxShadow: selectedRole === role ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {role === "admin" ? "My Account" : "Driver Account"}
                </button>
              ))}
            </div>
          )}

          {/* Driver selector */}
          {selectedRole === "driver" && userRole !== "driver" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--t-text-faint)", marginBottom: "5px" }}>
                Select Driver
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: "14px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", outline: "none", background: "var(--t-select-bg)", fontFamily: "Inter, system-ui, sans-serif", color: selectedDriver ? "var(--t-text-secondary)" : "var(--t-text-dim)", boxSizing: "border-box" }}
              >
                <option value="">Select a driver</option>
                {drivers.filter((d: any) => d.username !== "admin").map((d: any) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Show form only when applicable */}
          {(selectedRole === "admin" || (selectedRole === "driver" && (userRole === "driver" || selectedDriver))) && (
            <>
              {error   && <div style={{ marginBottom: "14px", padding: "10px 14px", background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", fontSize: "13px", color: "var(--t-error)" }}>{error}</div>}
              {success && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", background: "var(--t-success-bg)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", fontSize: "13px", color: "var(--t-success)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCheckCircle /> {success}
                </div>
              )}

              {/* Current Password — hidden when admin is resetting a driver's password */}
              {!isAdminResettingDriver && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--t-text-faint)", marginBottom: "5px" }}>Current Password</label>
                  <div style={{ position: "relative" }}>
                    <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", fontSize: "13px" }} />
                    <input
                      type={showOld ? "text" : "password"}
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      onFocus={() => setFocused("old")}
                      onBlur={() => setFocused(null)}
                      style={inputStyle("old")}
                    />
                    <span onClick={() => setShowOld(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--t-text-faint)" }}>
                      {showOld ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </span>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div style={{ marginBottom: "6px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--t-text-faint)", marginBottom: "5px" }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", fontSize: "13px" }} />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocused("new")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("new")}
                  />
                  <span onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--t-text-faint)" }}>
                    {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </span>
                </div>
              </div>

              {/* Strength bar */}
              {strength && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ height: "4px", background: "var(--t-border)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: "4px", transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: strength.color, marginTop: "3px", display: "inline-block" }}>{strength.label}</span>
                </div>
              )}

              {/* Confirm Password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--t-text-faint)", marginBottom: "5px" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", fontSize: "13px" }} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("confirm", passwordsMismatch)}
                  />
                  <span onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--t-text-faint)" }}>
                    {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </span>
                  {passwordsMatch && (
                    <FaCheckCircle style={{ position: "absolute", right: "38px", top: "50%", transform: "translateY(-50%)", color: "var(--t-success)", fontSize: "13px" }} />
                  )}
                </div>
                {passwordsMismatch && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--t-error)" }}>Passwords do not match</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                style={{ width: "100%", padding: "11px", fontSize: "14px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: isDisabled ? "not-allowed" : "pointer", transition: "background 0.2s", fontFamily: "Inter, system-ui, sans-serif",
                  background: isDisabled ? "var(--t-surface-alt)" : "var(--t-accent)",
                  color: "#fff",
                }}
              >
                {loading ? "Updating…" : "Change Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
