import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaTruck, FaCheckCircle } from "react-icons/fa";
import { API_BASE_URL } from "../utils/env";
import { useAuth } from "../contexts/AuthContext";

const PLAN_NAMES: Record<string, string> = {
  driver: "Driver Management — $49/month",
  vehicle: "Vehicle Management — $49/month",
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

    setLoading(true);
    try {
      // Step 1: Register the organization + admin user
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "5px",
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#111827", padding: "16px 32px", display: "flex", alignItems: "center", gap: "10px" }}>
        <FaTruck style={{ color: "#4F46E5" }} size={22} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>FleetIQ</span>
      </header>

      <div style={{ maxWidth: "520px", margin: "48px auto", padding: "0 16px" }}>
        {/* Plan indicator */}
        <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaCheckCircle style={{ color: "#4F46E5" }} size={18} />
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Selected Plan</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#4F46E5" }}>{PLAN_NAMES[form.plan] || form.plan}</div>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#4F46E5", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
          >
            Change
          </button>
        </div>

        {/* Form */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: "#111827" }}>Create your fleet account</h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>Start your 14-day free trial — no credit card required to register.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input style={inputStyle} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premier Choice Transportation" />
              </div>

              <div>
                <label style={labelStyle}>Company Email *</label>
                <input style={inputStyle} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@yourcompany.com" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input style={inputStyle} type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input style={inputStyle} type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label style={labelStyle}>DOT Number</label>
                  <input style={inputStyle} value={form.dotNumber} onChange={(e) => setForm({ ...form, dotNumber: e.target.value })} placeholder="Optional" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Fleet Street, Toronto, ON" />
              </div>

              {/* Plan selector */}
              <div>
                <label style={labelStyle}>Plan</label>
                <select style={inputStyle} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  <option value="driver">Driver Management — $49/month</option>
                  <option value="vehicle">Vehicle Management — $49/month</option>
                  <option value="bundle">Fleet Bundle — $79/month (Best Value)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Billing Cycle</label>
                <select style={inputStyle} value={form.billing} onChange={(e) => setForm({ ...form, billing: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual (save 20%)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: "8px", padding: "14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer", width: "100%" }}
              >
                {loading ? "Setting up your account..." : "Create Account & Start Free Trial →"}
              </button>

              <p style={{ textAlign: "center", margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#6b7280" }}>
          Already have an account?{" "}
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default CompanyRegister;
