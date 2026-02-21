import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa"; // Install react-icons

import { useAuth } from "../contexts/AuthContext";

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Role selection logic
  const [selectedRole, setSelectedRole] = useState(
    userRole === "admin" ? "admin" : "driver"
  );
  const [selectedDriver, setSelectedDriver] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    if (selectedRole === "driver") {
      fetchDrivers();
    }
    // eslint-disable-next-line
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRole === "driver" && selectedDriver) {
      const driver = drivers.find((d: any) => d._id === selectedDriver);

      let passwordToUse = "";

      if (driver) {
        if (driver.plainPassword) {
          passwordToUse = driver.plainPassword;
        } else if (driver.password && !driver.password.startsWith("$2b$")) {
          passwordToUse = driver.password;
        } else {
          // If hashed password is present but no plain password is known → fallback to username (to assist admin)
          passwordToUse = driver.username || "";
        }
      }

      setOldPassword(passwordToUse);
    } else {
      setOldPassword("");
    }

    setNewPassword("");
    setConfirmPassword("");
  }, [selectedRole, selectedDriver, drivers]);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setDrivers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url =
        selectedRole === "driver"
          ? `${API_BASE_URL}/drivers/change-password`
          : `${API_BASE_URL}/auth/change-password`;

          const payload =
          selectedRole === "driver" && userRole === "admin"
            ? {
                oldPassword,
                newPassword: newPassword.trim(),
                driverId: selectedDriver
              }
            : {
                oldPassword,
                newPassword: newPassword.trim()
              };

        await axios.post(
          url,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            }
          }
        );

      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError((err as any).response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 480px) {
          [data-cp-form] { padding: 24px 16px !important; }
          [data-cp-title] { font-size: 20px !important; }
          [data-cp-input] { width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.formContainer} data-cp-form>
          <div style={styles.iconCircle}>
            <FaLock size={24} color="#4F46E5" />
          </div>
          <h2 style={styles.title} data-cp-title>Change Password</h2>
          <p style={styles.description}>
            To change your password, please fill in the fields below. <br />
            Your password must contain at least 8 characters, and must include at least one upper case letter,
            one lower case letter, one number and one special character.
          </p>
          {/* Role selection radio (admin only) */}
          {userRole === "admin" && (
            <div style={{ display: "flex", gap: "24px", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="admin"
                  checked={selectedRole === "admin"}
                  onChange={() => setSelectedRole("admin")}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                Admin
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="driver"
                  checked={selectedRole === "driver"}
                  onChange={() => setSelectedRole("driver")}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                Driver
              </label>
            </div>
          )}
          {/* Driver dropdown if driver role selected */}
          {selectedRole === "driver" && (
            <div style={{ marginBottom: "16px", width: "100%" }}>
              <select
                value={selectedDriver}
                onChange={(e) => {
                  const driverId = e.target.value;
                  setSelectedDriver(driverId);
                }}
                style={styles.selectInput}
              >
                <option value="">Select a Driver</option>
                {drivers
                  .filter((driver: any) => {
                    if (userRole === "driver") {
                      // If driver → only show self (match by email or username)
                      return driver.email === user?.email || driver.username === user?.email;
                    } else {
                      // If admin → show all drivers except "admin"
                      return driver.username !== "admin";
                    }
                  })
                  .map((driver: any) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {/* Only show form if allowed */}
          {selectedRole === "admin" || (selectedRole === "driver" && selectedDriver) ? (
            <>
              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}

              {/* Old Password */}
              <div style={styles.inputWrapper}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  style={styles.input}
                />
                <span onClick={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* New Password */}
              <div style={styles.inputWrapper}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                />
                <span onClick={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Confirm Password */}
              <div style={styles.inputWrapper}>
                <FaLock style={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button
                onClick={handleChangePassword}
                style={
                  loading || !oldPassword || !newPassword || !confirmPassword
                    ? { ...styles.button, ...styles.buttonDisabled }
                    : styles.button
                }
                disabled={loading || !oldPassword || !newPassword || !confirmPassword}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
  },
  iconCircle: {
    backgroundColor: "#eef2ff",
    borderRadius: "50%",
    padding: "16px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "8px",
    marginTop: 0,
    color: "#111827",
    letterSpacing: "-0.3px",
  },
  description: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "24px",
    lineHeight: "1.6",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: "14px",
  },
  inputIcon: {
    position: "absolute",
    top: "50%",
    left: "14px",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: "14px",
  },
  eyeIcon: {
    position: "absolute",
    top: "50%",
    right: "14px",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "10px 40px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  selectInput: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    marginTop: "8px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    cursor: "not-allowed",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    marginBottom: "12px",
    padding: "8px 14px",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    width: "100%",
    boxSizing: "border-box",
  },
  success: {
    color: "#059669",
    fontSize: "13px",
    marginBottom: "12px",
    padding: "8px 14px",
    backgroundColor: "#ecfdf5",
    borderRadius: "8px",
    border: "1px solid #a7f3d0",
    width: "100%",
    boxSizing: "border-box",
  },
};

export default ChangePassword;