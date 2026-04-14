import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import { API_BASE_URL } from "../utils/env";
import { useAuth } from "../contexts/AuthContext";

const PLAN_PRICES: Record<string, { monthly: number; annual: number; bundleMonthly: number; bundleAnnual: number }> = {
  driver:  { monthly: 49, annual: 39, bundleMonthly: 0, bundleAnnual: 0 },
  vehicle: { monthly: 49, annual: 39, bundleMonthly: 0, bundleAnnual: 0 },
  bundle:  { monthly: 79, annual: 63, bundleMonthly: 0, bundleAnnual: 0 },
};

const getPlanLabel = (plan: string, billing: string): string => {
  const isAnnual = billing === "annual";
  if (plan === "driver")  return isAnnual ? "Driver Management — $39/month" : "Driver Management — $49/month";
  if (plan === "vehicle") return isAnnual ? "Vehicle & Fleet Operations — $39/month" : "Vehicle & Fleet Operations — $49/month";
  if (plan === "bundle")  return isAnnual ? "Fleet Bundle — $63/month" : "Fleet Bundle — $79/month";
  return plan;
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
    if (!value.trim()) { setPhoneError("Phone number is required."); return false; }
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
    borderRadius: "9px",
    border: `1.5px solid ${focusedField === field ? "#7B6CF6" : "rgba(255,255,255,0.08)"}`,
    fontSize: "14px",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    background: "#1A2235",
    transition: "border-color 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  };

  const avatars = [
    { initial: "S", color: "#7B6CF6" },
    { initial: "R", color: "#06B6D4" },
    { initial: "M", color: "#34D399" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", display: "flex", background: "#090D18" }}>
      <style>{`
        * { box-sizing: border-box; }

        .reg-left {
          width: 42%; min-height: 100vh; padding: 48px;
          display: flex; flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
        }

        .reg-right {
          width: 58%; min-height: 100vh; overflow-y: auto;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 32px;
        }

        .reg-stat-box {
          flex: 1; background: #0F1629;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 18px 20px; text-align: center;
        }

        .reg-form-card {
          background: #0F1629;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 28px;
        }

        .reg-submit-btn {
          width: 100%; padding: 14px;
          background: #7B6CF6;
          color: #fff; border: none; border-radius: 50px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(123,108,246,0.35);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .reg-submit-btn:hover:not(:disabled) {
          background: #6D5EE8;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(123,108,246,0.5);
        }
        .reg-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        select.reg-select {
          appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg fill="%23ffffff50" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 18px;
          padding-right: 36px !important;
          cursor: pointer;
        }

        .reg-plan-badge {
          display: flex; align-items: center; gap: 10px;
          background: rgba(123,108,246,0.08);
          border: 1px solid rgba(123,108,246,0.2);
          border-radius: 10px; padding: 12px 16px;
          margin-bottom: 20px;
        }

        .reg-trust-row {
          display: flex; align-items: center; justify-content: center;
          gap: 18px; margin-top: 20px; flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .reg-left { display: none !important; }
          .reg-right { width: 100% !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="reg-left">

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "44px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #7B6CF6, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTruck size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#7B6CF6" }}>IQ</span>
          </span>
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: "100px",
          background: "rgba(123,108,246,0.12)", color: "#a78bfa",
          border: "1px solid rgba(123,108,246,0.25)",
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px",
          textTransform: "uppercase", marginBottom: "20px", width: "fit-content",
        }}>
          14-Day Free Trial
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(26px, 2.8vw, 38px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            The smartest way to<br />run your <span style={{ color: "#06B6D4" }}>fleet.</span>
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
            Replace spreadsheets and disconnected tools with one purpose-built platform for drivers, vehicles, timesheets, and payouts.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "36px" }}>
          <div className="reg-stat-box">
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#7B6CF6", lineHeight: 1 }}>34+</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.7px" }}>Features</div>
          </div>
          <div className="reg-stat-box">
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#06B6D4", lineHeight: 1 }}>100%</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.7px" }}>Paperless</div>
          </div>
          <div className="reg-stat-box">
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#34D399", lineHeight: 1 }}>3</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.7px" }}>Plans</div>
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          background: "#0F1629",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px", padding: "18px 20px",
          display: "flex", alignItems: "center", gap: "14px",
          marginBottom: "auto",
        }}>
          <div style={{ display: "flex" }}>
            {avatars.map((a, i) => (
              <div key={i} style={{
                width: "30px", height: "30px", borderRadius: "50%",
                background: a.color, border: "2px solid #0F1629",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#fff",
                marginLeft: i === 0 ? 0 : "-8px", zIndex: 3 - i,
                position: "relative",
              }}>
                {a.initial}
              </div>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Join <strong style={{ color: "#fff" }}>fleet operators</strong> who've replaced<br />spreadsheets with FleetIQ.
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "32px" }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Service", "Support"].map((link) => (
              <span key={link} style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", cursor: "pointer" }}>{link}</span>
            ))}
          </div>
          <div style={{ marginTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.15)" }}>© 2024 FleetIQ Systems. All rights reserved.</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="reg-right">
        <div style={{ width: "100%", maxWidth: "500px" }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <button
              onClick={() => navigate("/")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", gap: "5px" }}
            >
              ← Home
            </button>
            <div>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>Already have an account? </span>
              <button
                onClick={() => navigate("/login")}
                style={{ background: "none", border: "none", color: "#7B6CF6", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Sign in →
              </button>
            </div>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Create your workspace
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              Start your 14-day free trial — no credit card required.
            </p>
          </div>

          {/* Plan badge */}
          <div className="reg-plan-badge">
            <FaCheckCircle style={{ color: "#7B6CF6", flexShrink: 0 }} size={15} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Selected Plan</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", marginTop: "1px" }}>
                {getPlanLabel(form.plan, form.billing)}
              </div>
            </div>
            <button
              onClick={() => navigate(`/pricing?plan=${form.plan}&billing=${form.billing}`)}
              style={{ background: "none", border: "1px solid rgba(123,108,246,0.3)", borderRadius: "6px", color: "#a78bfa", fontSize: "11px", cursor: "pointer", fontWeight: 600, padding: "4px 10px", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Change
            </button>
          </div>

          {/* Form card */}
          <div className="reg-form-card">
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
                    <label style={labelStyle}>Phone *</label>
                    <input
                      style={{ ...inputStyle("phone"), borderColor: phoneError ? "#F87171" : focusedField === "phone" ? "#7B6CF6" : "rgba(255,255,255,0.08)" }}
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => { const formatted = formatPhone(e.target.value); setForm({ ...form, phone: formatted }); if (phoneError) validatePhone(formatted); }}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => { setFocusedField(null); validatePhone(form.phone); }}
                      placeholder="+1 (555) 000-0000"
                    />
                    {phoneError && (
                      <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#F87171" }}>{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Extension</label>
                    <input
                      style={inputStyle("dotNumber")}
                      value={form.dotNumber}
                      onChange={(e) => setForm({ ...form, dotNumber: e.target.value })}
                      onFocus={() => setFocusedField("dotNumber")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="123"
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
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />

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
                      <option value="driver">Driver Mgmt — {form.billing === "annual" ? "$39" : "$49"}/mo</option>
                      <option value="vehicle">Fleet Ops — {form.billing === "annual" ? "$39" : "$49"}/mo</option>
                      <option value="bundle">Fleet Bundle — {form.billing === "annual" ? "$63" : "$79"}/mo ✦</option>
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

                <p style={{ textAlign: "center", margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
                  By continuing, you agree to our{" "}
                  <span style={{ color: "#a78bfa", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/terms")}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: "#a78bfa", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/privacy")}>Privacy Policy</span>.
                </p>

              </div>
            </form>
          </div>

          {/* Trust indicators */}
          <div className="reg-trust-row">
            {["No credit card required", "Cancel anytime", "14-day free trial"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                <FaCheckCircle size={10} style={{ color: "#7B6CF6" }} />
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
