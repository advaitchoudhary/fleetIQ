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
  if (score <= 1) return { label: "Weak",   color: "#dc2626", bg: "#fee2e2", width: "33%"  };
  if (score <= 2) return { label: "Fair",   color: "#d97706", bg: "#fef3c7", width: "66%"  };
  return             { label: "Strong", color: "#16a34a", bg: "#dcfce7", width: "100%" };
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
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
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

    if (!oldPassword || !newPassword || !confirmPassword) {
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
      setTimeout(() => navigate(userRole === "driver" ? "/dashboard" : "/admin-home"), 2000);
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
    border: `1px solid ${hasError ? "#dc2626" : focused === name ? "#4F46E5" : "#d1d5db"}`,
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    boxShadow: focused === name ? "0 0 0 3px rgba(79,70,229,0.1)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const isDisabled = loading || !oldPassword || !newPassword || !confirmPassword ||
    (selectedRole === "driver" && userRole !== "driver" && !selectedDriver);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e0e7ff", boxShadow: "0 2px 16px rgba(79,70,229,0.07)", padding: "40px", width: "100%", maxWidth: "440px" }}>

          {/* Icon + Title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <FaLock size={20} color="#4F46E5" />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
              Change Password
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
              Must be at least 8 characters and include uppercase, number, and special character.
            </p>
          </div>

          {/* Role toggle — admin/company_admin only */}
          {(userRole === "admin" || userRole === "company_admin") && (
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "8px", padding: "3px", marginBottom: "20px", gap: "3px" }}>
              {["admin", "driver"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  style={{ flex: 1, padding: "7px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s", fontFamily: "Inter, system-ui, sans-serif",
                    background: selectedRole === role ? "#fff" : "transparent",
                    color: selectedRole === role ? "#4F46E5" : "#6b7280",
                    boxShadow: selectedRole === role ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
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
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Select Driver
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", background: "#fff", fontFamily: "Inter, system-ui, sans-serif", color: selectedDriver ? "#111827" : "#9ca3af", boxSizing: "border-box" }}
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
              {error   && <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626" }}>{error}</div>}
              {success && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", fontSize: "13px", color: "#059669", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCheckCircle /> {success}
                </div>
              )}

              {/* Current Password */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>Current Password</label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "13px" }} />
                  <input
                    type={showOld ? "text" : "password"}
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    onFocus={() => setFocused("old")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("old")}
                  />
                  <span onClick={() => setShowOld(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#9ca3af" }}>
                    {showOld ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </span>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: "6px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "13px" }} />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocused("new")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("new")}
                  />
                  <span onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#9ca3af" }}>
                    {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </span>
                </div>
              </div>

              {/* Strength bar */}
              {strength && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: "4px", transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: strength.color, marginTop: "3px", display: "inline-block" }}>{strength.label}</span>
                </div>
              )}

              {/* Confirm Password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "13px" }} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused(null)}
                    style={inputStyle("confirm", passwordsMismatch)}
                  />
                  <span onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#9ca3af" }}>
                    {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </span>
                  {passwordsMatch && (
                    <FaCheckCircle style={{ position: "absolute", right: "38px", top: "50%", transform: "translateY(-50%)", color: "#16a34a", fontSize: "13px" }} />
                  )}
                </div>
                {passwordsMismatch && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#dc2626" }}>Passwords do not match</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                style={{ width: "100%", padding: "11px", fontSize: "14px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: isDisabled ? "not-allowed" : "pointer", transition: "background 0.2s", fontFamily: "Inter, system-ui, sans-serif",
                  background: isDisabled ? "#c7d2fe" : "#4F46E5",
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
