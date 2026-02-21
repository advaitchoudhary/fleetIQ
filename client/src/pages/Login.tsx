import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, [role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const loginUrl = role === "driver" ? `${API_BASE_URL}/drivers/login` : `${API_BASE_URL}/auth/login`;
    const payload = role === "driver"
      ? { username: email.trim(), password: password.trim() }
      : { email: email.trim(), password: password.trim() };

    try {
      const response = await axios.post(loginUrl, payload);
      const { token, driver } = response.data;

      localStorage.setItem("token", token);

      if (role === "admin") {
        await login(email.trim(), password.trim()); // Admin flow → existing login handles redirect
      } else {
        // Normalize driver user object
        const driverUser = {
          id: driver.id,
          username: driver.username,
          name: driver.name,
          email: driver.email,
          role: driver.role,
        };
        localStorage.setItem("user", JSON.stringify(driverUser));
        console.log("Driver login successful. Token and user stored.");
        if(role === "driver") {
          // Auto-redirect driver to dashboard
          window.location.href = "/dashboard";
        }
        else {
          // Redirect admin to admin dashboard
          window.location.href = "/users";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid credentials or login failed.");
    }
  };

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => navigate("/")}
        onMouseEnter={() => setIsBackButtonHovered(true)}
        onMouseLeave={() => setIsBackButtonHovered(false)}
        style={{
          ...styles.backButton,
          backgroundColor: isBackButtonHovered 
            ? "rgba(255, 255, 255, 0.3)" 
            : "rgba(255, 255, 255, 0.2)",
          borderColor: isBackButtonHovered 
            ? "rgba(255, 255, 255, 0.5)" 
            : "rgba(255, 255, 255, 0.3)",
        }}
      >
        <FaArrowLeft style={{ marginRight: "8px", fontSize: "12px" }} />
        Back
      </button>
      <div style={styles.overlay}>
        <h1 style={styles.title}>Welcome to the Driver Portal</h1>
        <p style={styles.description}>
          Manage your trips, track your hours, and stay updated with important information.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
          </select>
          {role === "driver" ? (
            <input
              type="text"
              placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          ) : (
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    height: "100vh",
    backgroundImage: `url('/fleet.avif')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(16px)",
    padding: "44px 40px",
    borderRadius: "16px",
    textAlign: "center",
    color: "#fff",
    maxWidth: "420px",
    width: "100%",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    marginBottom: "8px",
    marginTop: 0,
    letterSpacing: "-0.3px",
    lineHeight: "1.2",
  },
  description: {
    fontSize: "15px",
    marginBottom: "28px",
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: 400,
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    width: "92%",
    padding: "11px 14px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "Inter, system-ui, sans-serif",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "Inter, system-ui, sans-serif",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
  },
  button: {
    padding: "12px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    transition: "background 0.2s ease",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
    marginTop: "4px",
    letterSpacing: "0.2px",
  },
  backButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    padding: "8px 18px",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.3px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
  },
};

export default Login;