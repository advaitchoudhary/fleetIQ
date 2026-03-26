import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";
import { FaTruck, FaCheckCircle, FaUsers, FaCar, FaCreditCard, FaArrowRight, FaShieldAlt } from "react-icons/fa";

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
    padding: "13px 14px 13px 44px",
    borderRadius: "10px",
    border: `1.5px solid ${focusedField === field ? "#7B6CF6" : "rgba(255,255,255,0.08)"}`,
    fontSize: "14px",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    background: "#1A2235",
    transition: "border-color 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const features = [
    { icon: <FaUsers size={15} />, title: "Driver Management & Applications", desc: "Manage driver profiles, onboarding, and documents in one place." },
    { icon: <FaShieldAlt size={15} />, title: "Compliance & Document Tracking", desc: "Stay audit-ready with automated compliance and file storage." },
    { icon: <FaCreditCard size={15} />, title: "Stripe-Powered Driver Payouts", desc: "Process and track driver payments directly from your dashboard." },
    { icon: <FaCar size={15} />, title: "Vehicle & Fleet Operations", desc: "Track vehicles, maintenance, warranties, and fuel logs." },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", display: "flex", background: "#090D18" }}>
      <style>{`
        * { box-sizing: border-box; }

        .fl-left {
          width: 45%; min-height: 100vh; padding: 48px;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.05);
        }

        .fl-right {
          width: 55%; min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 32px; position: relative;
        }

        .fl-mockup {
          background: #0F1629;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          padding: 20px;
          margin-bottom: 36px;
        }
        .fl-mockup-bar {
          height: 5px;
          background: linear-gradient(90deg, #7B6CF6 0%, #06B6D4 55%, rgba(255,255,255,0.06) 100%);
          border-radius: 3px; margin-bottom: 14px;
        }
        .fl-mockup-stats {
          display: flex; gap: 10px; margin-bottom: 14px;
        }
        .fl-mockup-stat {
          flex: 1; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; padding: 10px 12px;
        }
        .fl-mockup-stat-label { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
        .fl-mockup-stat-val { font-size: 16px; font-weight: 700; color: #fff; }
        .fl-mockup-stat-val.cyan { color: #06B6D4; }
        .fl-mockup-stat-val.green { color: #34D399; }
        .fl-mockup-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 12px 0; }
        .fl-mockup-row {
          display: flex; justify-content: space-between;
          font-size: 11px; margin-bottom: 7px;
        }

        .fl-feature {
          display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px;
        }
        .fl-feature-icon {
          width: 36px; height: 36px;
          background: rgba(123,108,246,0.12);
          border: 1px solid rgba(123,108,246,0.25);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #7B6CF6; flex-shrink: 0;
        }

        .fl-card {
          width: 100%; max-width: 420px;
          background: #0F1629;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px 32px;
        }

        .fl-role-btn {
          flex: 1; padding: 9px 12px; border-radius: 9px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: transparent; color: rgba(255,255,255,0.45);
          transition: all 0.2s;
        }
        .fl-role-btn.active {
          background: #7B6CF6; color: #fff;
          border-color: #7B6CF6;
          box-shadow: 0 2px 12px rgba(123,108,246,0.4);
        }
        .fl-role-btn:not(.active):hover {
          border-color: rgba(123,108,246,0.4); color: #a78bfa;
        }

        .fl-submit-btn {
          width: 100%; padding: 14px;
          background: #7B6CF6;
          color: #fff; border: none; border-radius: 50px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(123,108,246,0.35);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .fl-submit-btn:hover {
          background: #6D5EE8;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(123,108,246,0.5);
        }
        .fl-submit-btn:active { transform: translateY(0); }

        .fl-input-wrap { position: relative; }
        .fl-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25); pointer-events: none;
          font-size: 13px; font-style: normal;
        }

        .fl-badge-row {
          display: flex; justify-content: center; gap: 24px;
        }
        .fl-trust-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; color: rgba(255,255,255,0.35);
          font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;
        }

        .fl-footer-links {
          display: flex; gap: 20px; flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .fl-left { display: none !important; }
          .fl-right { width: 100% !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="fl-left">

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "44px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #7B6CF6, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTruck size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#7B6CF6" }}>IQ</span>
          </span>
        </div>

        {/* Dashboard mockup */}
        <div className="fl-mockup">
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Live Dashboard</div>
          <div className="fl-mockup-bar" />
          <div className="fl-mockup-stats">
            <div className="fl-mockup-stat">
              <div className="fl-mockup-stat-label">Active Drivers</div>
              <div className="fl-mockup-stat-val">24</div>
            </div>
            <div className="fl-mockup-stat">
              <div className="fl-mockup-stat-label">Payouts</div>
              <div className="fl-mockup-stat-val green">$18,430</div>
            </div>
            <div className="fl-mockup-stat">
              <div className="fl-mockup-stat-label">On-Road</div>
              <div className="fl-mockup-stat-val cyan">18</div>
            </div>
          </div>
          <div className="fl-mockup-divider" />
          {[
            { label: "Premier Choice Transport", val: "$4,200" },
            { label: "Oakville Logistics", val: "24 drivers" },
            { label: "GTA Transport Group", val: "On route" },
            { label: "Durham Express", val: "$1,083" },
          ].map((row) => (
            <div className="fl-mockup-row" key={row.label}>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{row.label}</span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(26px, 2.8vw, 36px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Everything your <span style={{ color: "#06B6D4" }}>fleet</span><br />needs, in one place.
          </h1>
        </div>

        {/* Features */}
        <div style={{ marginBottom: "auto" }}>
          {features.slice(0, 2).map((f, i) => (
            <div key={i} className="fl-feature">
              <div className="fl-feature-icon">{f.icon}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>{f.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="fl-footer-links">
            {["Privacy Policy", "Terms of Service", "Support"].map((link) => (
              <span key={link} style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", cursor: "pointer" }}>{link}</span>
            ))}
          </div>
          <div style={{ marginTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.15)" }}>© 2024 FleetIQ Systems. All rights reserved.</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="fl-right">

        {/* Top-right link */}
        <div style={{ position: "absolute", top: "28px", right: "32px" }}>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Don't have an account? </span>
          <button
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", color: "#7B6CF6", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Sign up →
          </button>
        </div>

        <div className="fl-card">

          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Welcome Back
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              Sign in to manage your fleet and operations.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Role toggle */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Sign in as
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" className={`fl-role-btn ${role === "admin" ? "active" : ""}`} onClick={() => setRole("admin")}>
                    Admin
                  </button>
                  <button type="button" className={`fl-role-btn ${role === "driver" ? "active" : ""}`} onClick={() => setRole("driver")}>
                    Driver
                  </button>
                </div>
              </div>

              {/* Error */}
              {loginError && (
                <div style={{ color: "#F87171", fontSize: "13px", padding: "10px 14px", backgroundColor: "rgba(248,113,113,0.08)", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.25)" }}>
                  {loginError}
                </div>
              )}

              {/* Email / Username */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  {role === "driver" ? "Username" : "Email"}
                </label>
                <div className="fl-input-wrap">
                  <span className="fl-input-icon">@</span>
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
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  Password
                </label>
                <div className="fl-input-wrap">
                  <span className="fl-input-icon">🔑</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("password")}
                  />
                </div>
              </div>

              <button type="submit" className="fl-submit-btn">
                <span>Sign In to FleetIQ</span>
                <FaArrowRight size={13} />
              </button>

              {/* Trust */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                  Secure Login
                </div>
                <div className="fl-badge-row">
                  <div className="fl-trust-badge">
                    <FaShieldAlt size={11} />
                    256-bit Encrypted
                  </div>
                  <div className="fl-trust-badge">
                    <FaCheckCircle size={11} />
                    SOC 2 Ready
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Below card links */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Don't have an account? </span>
          <button
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "underline" }}
          >
            Create Account
          </button>
        </div>

        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "12px", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            ← Back to homepage
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
