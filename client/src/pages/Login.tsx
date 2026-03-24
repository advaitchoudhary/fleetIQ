import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";
import { FaTruck, FaCheckCircle, FaUsers, FaCar, FaCreditCard, FaArrowRight } from "react-icons/fa";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1.5px solid ${focusedField === field ? "#4F46E5" : "#e5e7eb"}`,
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    background: focusedField === field ? "#fafafe" : "#fff",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const benefits = [
    { icon: <FaUsers size={14} />, text: "Driver management & applications" },
    { icon: <FaCar size={14} />, text: "Vehicle & fleet operations" },
    { icon: <FaCreditCard size={14} />, text: "Timesheets & Stripe payouts" },
    { icon: <FaCheckCircle size={14} />, text: "Compliance & document tracking" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }

        .login-orb-1 {
          position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%);
          top: -80px; left: -80px; pointer-events: none;
        }
        .login-orb-2 {
          position: absolute; width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%);
          bottom: 80px; right: -60px; pointer-events: none;
        }
        .login-orb-3 {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%);
          top: 50%; left: 40px; pointer-events: none;
        }

        .login-benefit-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500;
          transition: background 0.2s;
        }
        .login-benefit-item:hover { background: rgba(255,255,255,0.1); }

        .login-role-btn {
          flex: 1; padding: 9px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          border: 1.5px solid #e5e7eb;
          transition: all 0.2s;
        }
        .login-role-btn.active {
          background: #4F46E5; color: #fff;
          border-color: #4F46E5;
          box-shadow: 0 2px 10px rgba(79,70,229,0.3);
        }
        .login-role-btn:not(.active) {
          background: #fff; color: #6b7280;
        }
        .login-role-btn:not(.active):hover {
          border-color: #4F46E5; color: #4F46E5;
        }

        .login-submit-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #4F46E5, #7c3aed);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(79,70,229,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .login-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(79,70,229,0.55);
        }
        .login-submit-btn:active { transform: translateY(0); }

        select.login-select {
          appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg fill="%236b7280" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 36px !important;
          cursor: pointer;
        }

        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-form-card { animation: loginFadeIn 0.5s ease-out both; }

        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div
        className="login-left-panel"
        style={{
          width: "42%",
          minHeight: "100vh",
          background: "linear-gradient(160deg, #0A0F1E 0%, #0F172A 50%, #1A0B3E 100%)",
          padding: "48px 48px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="login-orb-1" />
        <div className="login-orb-2" />
        <div className="login-orb-3" />

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #4F46E5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaTruck size={18} color="#fff" />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Fleet<span style={{ color: "#818CF8" }}>IQ</span>
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 12px", borderRadius: "100px",
              background: "rgba(129,140,248,0.18)", color: "#a5b4fc",
              border: "1px solid rgba(129,140,248,0.3)",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
              textTransform: "uppercase", marginBottom: "20px",
            }}>
              Fleet Operations Platform
            </div>
            <h1 style={{
              margin: "0 0 16px",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 800, color: "#fff",
              lineHeight: 1.15, letterSpacing: "-0.5px",
            }}>
              Everything your fleet needs, in one place.
            </h1>
            <p style={{ margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              Sign in to manage drivers, vehicles, timesheets, and payouts — all from a single dashboard.
            </p>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "48px" }}>
            {benefits.map((b, i) => (
              <div key={i} className="login-benefit-item">
                <span style={{ color: "#818CF8", flexShrink: 0 }}>{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>

          {/* Mock dashboard card */}
          <div style={{
            padding: "20px 24px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "20px",
          }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px" }}>
              Live Dashboard
            </div>
            {[
              { label: "Active Drivers", value: "24", color: "#a5b4fc" },
              { label: "Payouts This Month", value: "$18,430", color: "#34d399" },
              { label: "Vehicles On-Road", value: "18", color: "#38bdf8" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{row.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            padding: "20px 24px", borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, fontStyle: "italic" }}>
              "Managing 5 companies used to require 3 separate tools. FleetIQ does it all in one dashboard."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>R</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Raj T.</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Director of Operations, GTA Transport Group</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="login-right-panel"
        style={{
          width: "58%",
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          position: "relative",
        }}
      >
        {/* Top-right link — pinned, not in the flow */}
        <div style={{ position: "absolute", top: "28px", right: "32px" }}>
          <span style={{ fontSize: "13px", color: "#6b7280", cursor: "pointer" }} onClick={() => navigate("/register")}>Don't have an account? </span>
          <button
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Sign up →
          </button>
        </div>

        <div style={{ width: "100%", maxWidth: "420px" }} className="login-form-card">

          {/* Form card */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

            {/* Header inside card */}
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#111827", letterSpacing: "-0.3px" }}>
                Welcome back
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                Sign in to your FleetIQ account to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Role toggle */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Sign in as
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className={`login-role-btn ${role === "admin" ? "active" : ""}`}
                      onClick={() => setRole("admin")}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      className={`login-role-btn ${role === "driver" ? "active" : ""}`}
                      onClick={() => setRole("driver")}
                    >
                      Driver
                    </button>
                  </div>
                </div>

                {/* Error */}
                {loginError && (
                  <div style={{ color: "#dc2626", fontSize: "13px", padding: "10px 14px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                    {loginError}
                  </div>
                )}

                {/* Email / Username */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {role === "driver" ? "Username" : "Email"}
                  </label>
                  {role === "driver" ? (
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                      style={inputStyle("email")}
                    />
                  ) : (
                    <input
                      type="email"
                      placeholder="admin@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                      style={inputStyle("email")}
                    />
                  )}
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("password")}
                  />
                </div>

                <button type="submit" className="login-submit-btn">
                  <span>Sign In</span>
                  <FaArrowRight size={13} />
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    ← Back to homepage
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Trust indicators */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "24px", flexWrap: "wrap" }}>
            {["Secure login", "256-bit encrypted", "SOC 2 ready"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#9ca3af" }}>
                <FaCheckCircle size={10} style={{ color: "#4F46E5" }} />
                {t}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
