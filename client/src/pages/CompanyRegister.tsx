import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaCheckCircle, FaUsers, FaCar, FaCreditCard, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import { API_BASE_URL } from "../utils/env";
import { useAuth } from "../contexts/AuthContext";

const PLAN_NAMES: Record<string, string> = {
  driver: "Driver Management — $49/month",
  vehicle: "Vehicle & Fleet Operations — $49/month",
  bundle: "Fleet Bundle — $79/month",
};

const CompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const { loginDirect } = useAuth();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "bundle";
  const billingFromUrl = searchParams.get("billing") || "monthly";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    dotNumber: "",
    plan: planFromUrl,
    billing: billingFromUrl,
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");

  const extractDigits = (value: string) => {
    let digits = value.replace(/\D/g, "");
    // Always strip the leading "1" that comes from the +1 prefix
    if (digits.startsWith("1")) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  const formatPhone = (value: string) => {
    const digits = extractDigits(value);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `+1 (${digits}`;
    if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) { setPhoneError(""); return true; }
    if (extractDigits(value).length < 10) {
      setPhoneError("Enter a valid 10-digit phone number.");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (!validatePhone(form.phone)) return;

    setLoading(true);
    try {
      const regRes = await axios.post(`${API_BASE_URL}/organizations/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        dotNumber: form.dotNumber,
        plan: form.plan,
      });
      const { token, user } = regRes.data;
      await loginDirect(token, user);
      navigate("/admin-home");
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1.5px solid ${focusedField === field ? "var(--t-accent)" : "var(--t-input-border)"}`,
    fontSize: "14px",
    color: "var(--t-text-secondary)",
    outline: "none",
    boxSizing: "border-box",
    background: "var(--t-input-bg)",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--t-text-dim)",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  };

  const benefits = [
    { icon: <FaUsers size={15} />, text: "Manage unlimited drivers & applications" },
    { icon: <FaCar size={15} />, text: "Full vehicle & fleet operations" },
    { icon: <FaCreditCard size={15} />, text: "Stripe-powered driver payouts" },
    { icon: <FaShieldAlt size={15} />, text: "Compliance & document tracking" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }

        .reg-orb-1 {
          position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%);
          top: -80px; left: -80px; pointer-events: none;
        }
        .reg-orb-2 {
          position: absolute; width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%);
          bottom: 80px; right: -60px; pointer-events: none;
        }
        .reg-orb-3 {
          position: absolute; width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%);
          bottom: 260px; left: 60px; pointer-events: none;
        }

        .reg-submit-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #4F46E5, #7c3aed);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(79,70,229,0.4);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .reg-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(79,70,229,0.55);
        }
        .reg-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .reg-benefit-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500;
          transition: background 0.2s;
        }
        .reg-benefit-item:hover { background: rgba(255,255,255,0.1); }

        .reg-plan-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          background: rgba(129,140,248,0.18); color: #a5b4fc;
          border: 1px solid rgba(129,140,248,0.3);
          text-transform: uppercase;
        }

        .reg-stat-card {
          flex: 1; padding: 16px 20px; border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          text-align: center;
        }

        select.reg-select {
          appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg fill="%236b7280" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 36px !important;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .reg-left-panel { display: none !important; }
          .reg-right-panel { width: 100% !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div
        className="reg-left-panel"
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
        {/* Orbs */}
        <div className="reg-orb-1" />
        <div className="reg-orb-2" />
        <div className="reg-orb-3" />

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
            <div className="reg-plan-pill" style={{ marginBottom: "20px" }}>
              14-day free trial
            </div>
            <h1 style={{
              margin: "0 0 16px",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}>
              The smartest way to run your fleet.
            </h1>
            <p style={{ margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              Join fleet operators who've replaced spreadsheets and disconnected tools with one purpose-built platform.
            </p>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "48px" }}>
            {benefits.map((b, i) => (
              <div key={i} className="reg-benefit-item">
                <span style={{ color: "#818CF8", flexShrink: 0 }}>{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "auto" }}>
            <div className="reg-stat-card">
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#818CF8", lineHeight: 1 }}>34+</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Features</div>
            </div>
            <div className="reg-stat-card">
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#818CF8", lineHeight: 1 }}>100%</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Paperless</div>
            </div>
            <div className="reg-stat-card">
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#818CF8", lineHeight: 1 }}>3</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plans</div>
            </div>
          </div>

          {/* Testimonial */}
          <div style={{
            marginTop: "40px",
            padding: "20px 24px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, fontStyle: "italic" }}>
              "FleetIQ cut our timesheet processing from 2 days to 20 minutes."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>S</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Sarah M.</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Fleet Manager, Oakville Logistics</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="reg-right-panel"
        style={{
          width: "58%",
          minHeight: "100vh",
          background: "var(--t-bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <button
              onClick={() => navigate("/")}
              style={{ background: "none", border: "none", color: "var(--t-text-faint)", cursor: "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", gap: "5px" }}
            >
              ← Home
            </button>
            <div>
              <span style={{ fontSize: "13px", color: "var(--t-text-dim)", cursor: "pointer" }} onClick={() => navigate("/login")}>Already have an account? </span>
              <button
                onClick={() => navigate("/login")}
                style={{ background: "none", border: "none", color: "var(--t-accent)", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Sign in →
              </button>
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
              Create your account
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
              Start your 14-day free trial — no credit card required.
            </p>
          </div>

          {/* Selected plan badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "var(--t-indigo-bg)", border: "1px solid var(--t-border)",
            borderRadius: "10px", padding: "12px 16px", marginBottom: "24px",
          }}>
            <FaCheckCircle style={{ color: "var(--t-accent)", flexShrink: 0 }} size={16} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "var(--t-text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Selected Plan</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--t-accent)", marginTop: "1px" }}>
                {PLAN_NAMES[form.plan] || form.plan}
              </div>
            </div>
            <button
              onClick={() => navigate("/#pricing")}
              style={{ background: "none", border: "1px solid var(--t-border)", borderRadius: "6px", color: "var(--t-accent)", fontSize: "12px", cursor: "pointer", fontWeight: 600, padding: "4px 10px", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Change
            </button>
          </div>

          {/* Form card */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input
                    style={inputStyle("name")}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Premier Choice Transportation"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Company Email *</label>
                  <input
                    style={inputStyle("email")}
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="admin@yourcompany.com"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <input
                      style={inputStyle("password")}
                      type="password"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password *</label>
                    <input
                      style={inputStyle("confirmPassword")}
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      style={{ ...inputStyle("phone"), borderColor: phoneError ? "var(--t-error)" : focusedField === "phone" ? "var(--t-accent)" : "var(--t-input-border)" }}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => { const formatted = formatPhone(e.target.value); setForm({ ...form, phone: formatted }); if (phoneError) validatePhone(formatted); }}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => { setFocusedField(null); validatePhone(form.phone); }}
                      placeholder="+1 (555) 000-0000"
                    />
                    {phoneError && (
                      <p style={{ margin: "5px 0 0", fontSize: "12px", color: "var(--t-error)" }}>{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>DOT Number</label>
                    <input
                      style={inputStyle("dotNumber")}
                      value={form.dotNumber}
                      onChange={(e) => setForm({ ...form, dotNumber: e.target.value })}
                      onFocus={() => setFocusedField("dotNumber")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Address</label>
                  <input
                    style={inputStyle("address")}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    onFocus={() => setFocusedField("address")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="123 Fleet Street, Toronto, ON"
                  />
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #f3f4f6", margin: "4px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Plan</label>
                    <select
                      className="reg-select"
                      style={inputStyle("plan")}
                      value={form.plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                      onFocus={() => setFocusedField("plan")}
                      onBlur={() => setFocusedField(null)}
                    >
                      <option value="driver">Driver Mgmt — $49/mo</option>
                      <option value="vehicle">Fleet Ops — $49/mo</option>
                      <option value="bundle">Fleet Bundle — $79/mo ✦</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Billing Cycle</label>
                    <select
                      className="reg-select"
                      style={inputStyle("billing")}
                      value={form.billing}
                      onChange={(e) => setForm({ ...form, billing: e.target.value })}
                      onFocus={() => setFocusedField("billing")}
                      onBlur={() => setFocusedField(null)}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual (save 20%)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="reg-submit-btn" disabled={loading} style={{ marginTop: "4px" }}>
                  {loading ? "Setting up your account..." : (
                    <><span>Create Account & Start Free Trial</span> <FaArrowRight size={13} /></>
                  )}
                </button>

                <p style={{ textAlign: "center", margin: 0, fontSize: "11px", color: "var(--t-text-faint)", lineHeight: 1.6 }}>
                  By continuing, you agree to our{" "}
                  <span style={{ color: "var(--t-accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/terms")}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: "var(--t-accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/privacy")}>Privacy Policy</span>.
                </p>

              </div>
            </form>
          </div>

          {/* Trust indicators */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginTop: "24px", flexWrap: "wrap" }}>
            {["No credit card required", "Cancel anytime", "14-day free trial"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--t-text-faint)" }}>
                <FaCheckCircle size={10} style={{ color: "var(--t-accent)" }} />
                {t}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;
