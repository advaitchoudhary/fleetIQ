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
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.formContainer}>
          <div style={styles.iconCircle}>
            <FaLock size={28} color="#2563EB" />
          </div>
          <h2 style={styles.title}>Change Password</h2>
          <p style={styles.description}>
            To change your password, please fill in the fields below. <br />
            Your password must contain at least 8 characters, and must include at least one upper case letter,
            one lower case letter, one number and one special character.
          </p>
          {/* Role selection radio (admin only) */}
          {userRole === "admin" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ marginRight: "10px" }}>
                <input
                  type="radio"
                  value="admin"
                  checked={selectedRole === "admin"}
                  onChange={() => setSelectedRole("admin")}
                />{" "}
                Admin
              </label>
              <label>
                <input
                  type="radio"
                  value="driver"
                  checked={selectedRole === "driver"}
                  onChange={() => setSelectedRole("driver")}
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
                style={styles.inputs}
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
    </>
  );
};

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: "450px",
    textAlign: "center",
  },
  iconCircle: {
    backgroundColor: "#EEF2FF",
    borderRadius: "50%",
    padding: "15px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#111827",
  },
  description: {
    fontSize: "14px",
    color: "#6B7280",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: "16px",
  },
  inputIcon: {
    position: "absolute",
    top: "50%",
    left: "12px",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
    fontSize: "16px",
  },
  eyeIcon: {
    position: "absolute",
    top: "50%",
    right: "12px",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#9CA3AF",
    fontSize: "16px",
  },
  input: {
    width: "82%",
    padding: "12px 40px 12px 40px",
    fontSize: "1rem",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  inputs: {
    width: "100%",
    padding: "12px 25px 12px 25px",
    fontSize: "1rem",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "1rem",
    backgroundColor: "#4F46E5",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
    borderRadius: "8px",
    transition: "background 0.3s",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  error: {
    color: "red",
    fontSize: "14px",
    marginBottom: "10px",
  },
  success: {
    color: "green",
    fontSize: "14px",
    marginBottom: "10px",
  },
};

export default ChangePassword;