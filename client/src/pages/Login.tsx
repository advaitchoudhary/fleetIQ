import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";
import { FaArrowLeft, FaTruck } from "react-icons/fa";


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login, loginDirect } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
    setLoginError("");
  }, [role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError("Email/username and password are required.");
      return;
    }

    try {
      if (role === "driver") {
        // Driver login — hits the dedicated driver endpoint
        const response = await axios.post(`${API_BASE_URL}/drivers/login`, {
          username: email.trim(),
          password: password.trim(),
        });
        const { token, driver } = response.data;

        const driverUser = {
          id: driver.id,
          name: driver.name,
          email: driver.email || driver.username,
          role: driver.role,
          driverId: driver.driverId || null,
          organizationId: driver.organizationId || null,
          orgName: driver.orgName || null,
        };
        await loginDirect(token, driverUser);
        navigate("/dashboard");
      } else {
        // Admin / company_admin / dispatcher login — delegate entirely to AuthContext.login()
        // which calls POST /api/auth/login, stores token+user, and handles role-based redirect.
        await login(email.trim(), password.trim());
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Invalid credentials or login failed.";
      setLoginError(msg);
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative background orbs */}
      <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "15%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginBackIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes loginPulseGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(79, 70, 229, 0); }
          50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px -8px rgba(79, 70, 229, 0.15); }
        }
        [data-login-back] {
          animation: loginBackIn 0.5s ease-out both;
        }
        [data-login-card] {
          animation: loginFadeIn 0.6s ease-out both;
          animation-delay: 0.1s;
          transition: box-shadow 0.4s ease;
        }
        [data-login-card]:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px -8px rgba(79, 70, 229, 0.2);
        }
        [data-login-title] {
          animation: loginSlideUp 0.5s ease-out both;
          animation-delay: 0.3s;
        }
        [data-login-desc] {
          animation: loginSlideUp 0.5s ease-out both;
          animation-delay: 0.4s;
        }
        [data-login-form] > *:nth-child(1) { animation: loginSlideUp 0.4s ease-out both; animation-delay: 0.5s; }
        [data-login-form] > *:nth-child(2) { animation: loginSlideUp 0.4s ease-out both; animation-delay: 0.6s; }
        [data-login-form] > *:nth-child(3) { animation: loginSlideUp 0.4s ease-out both; animation-delay: 0.7s; }
        [data-login-form] > *:nth-child(4) { animation: loginSlideUp 0.4s ease-out both; animation-delay: 0.8s; }
        [data-login-btn]:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5) !important;
        }
        [data-login-btn]:active {
          transform: translateY(0);
        }
        [data-login-input]:focus {
          border-color: rgba(79, 70, 229, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
      `}</style>
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
        data-login-back
      >
        <FaArrowLeft style={{ marginRight: "8px", fontSize: "12px" }} />
        Back
      </button>
      <div style={styles.overlay} data-login-card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          <FaTruck size={24} style={{ color: "#818CF8" }} />
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>
        <h1 style={styles.title} data-login-title>Welcome back</h1>
        <p style={styles.description} data-login-desc>
          Manage your trips, track your hours, and stay updated with important information.
        </p>
        <form onSubmit={handleSubmit} style={styles.form} data-login-form>
          {loginError && (
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "4px", padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.12)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", margin: 0 }}>
              {loginError}
            </p>
          )}
          <select value={role} onChange={(e) => { setRole(e.target.value); setLoginError(""); }} style={styles.select} data-login-input>
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
              data-login-input
            />
          ) : (
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              data-login-input
            />
          )}
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            data-login-input
          />
          <button type="submit" style={styles.button} data-login-btn>Login</button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    height: "100vh",
    background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 60%, #0F172A 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    overflow: "hidden",
  },
  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(20px)",
    padding: "44px 40px",
    borderRadius: "20px",
    textAlign: "center",
    color: "#fff",
    maxWidth: "420px",
    width: "100%",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(129, 140, 248, 0.08)",
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