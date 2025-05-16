import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import axios from "axios";

import { API_BASE_URL } from "../utils/env"; //


const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        { oldPassword, newPassword },
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
      setTimeout(() => navigate("/profile"), 2000);
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
          <h2>Change Password</h2>
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleChangePassword}
            style={loading || !oldPassword || !newPassword || !confirmPassword ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </>
  );
};

// Define Styles
const styles: {
  container: React.CSSProperties;
  formContainer: React.CSSProperties;
  input: React.CSSProperties;
  button: React.CSSProperties;
  buttonDisabled: React.CSSProperties;
  error: React.CSSProperties;
  success: React.CSSProperties;
} = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f4",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "30px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    width: "400px",
  },
  input: {
    margin: "10px 0",
    padding: "12px",
    fontSize: "1rem",
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    padding: "12px",
    fontSize: "1rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
    borderRadius: "5px",
    transition: "background 0.3s",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  error: {
    color: "red",
    fontSize: "1rem",
    marginBottom: "10px",
  },
  success: {
    color: "green",
    fontSize: "1rem",
    marginBottom: "10px",
  },
};

export default ChangePassword;
