import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTruck, FaUsers, FaStar } from "react-icons/fa";

const PLANS = [
  {
    key: "driver",
    name: "Driver Management",
    icon: <FaUsers size={24} />,
    monthlyPrice: 49,
    annualPrice: 39,
    description: "Perfect for fleet operators who want to streamline driver workflows.",
    features: [
      "Unlimited drivers",
      "Digital timesheets & approvals",
      "Driver onboarding & applications",
      "Document management",
      "Driver payouts via Stripe",
      "Dispatcher portal",
      "Email notifications",
    ],
  },
  {
    key: "vehicle",
    name: "Vehicle Management",
    icon: <FaTruck size={24} />,
    monthlyPrice: 49,
    annualPrice: 39,
    description: "Full vehicle fleet tracking, maintenance, and compliance.",
    features: [
      "Vehicle registry (unlimited vehicles)",
      "Maintenance scheduling & work orders",
      "DVIR pre/post-trip inspections",
      "Fuel logging & L/100km analytics",
      "Maintenance due alerts",
      "Cost per kilometre reporting",
      "Document uploads",
    ],
  },
  {
    key: "bundle",
    name: "Fleet Bundle",
    icon: <FaStar size={24} />,
    monthlyPrice: 79,
    annualPrice: 63,
    badge: "Best Value",
    description: "The complete solution for serious fleet operators.",
    features: [
      "Everything in Driver Management",
      "Everything in Vehicle Management",
      "Driver ↔ Vehicle assignment",
      "Unified fleet dashboard",
      "Priority support",
      "Onboarding assistance",
      "14-day free trial",
    ],
  },
];

const Pricing: React.FC = () => {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#111827", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaTruck style={{ color: "#4F46E5" }} size={22} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>FleetIQ</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}>
            Sign In
          </button>
          <button onClick={() => navigate("/register")} style={{ background: "#4F46E5", border: "none", color: "#fff", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Get Started
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "42px", fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: "18px", color: "#6b7280", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            Start with a 14-day free trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: "inline-flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", gap: "4px" }}>
            <button
              onClick={() => setBilling("monthly")}
              style={{ padding: "8px 20px", border: "none", borderRadius: "7px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: billing === "monthly" ? "#fff" : "transparent", color: billing === "monthly" ? "#111827" : "#6b7280", boxShadow: billing === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              style={{ padding: "8px 20px", border: "none", borderRadius: "7px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: billing === "annual" ? "#fff" : "transparent", color: billing === "annual" ? "#111827" : "#6b7280", boxShadow: billing === "annual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", gap: "6px" }}
            >
              Annual
              <span style={{ fontSize: "11px", background: "#dcfce7", color: "#16a34a", borderRadius: "10px", padding: "2px 7px", fontWeight: 700 }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "64px" }}>
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const isBundle = plan.key === "bundle";
            return (
              <div
                key={plan.key}
                style={{
                  background: isBundle ? "#4F46E5" : "#fff",
                  borderRadius: "20px",
                  border: isBundle ? "none" : "1px solid #e5e7eb",
                  padding: "32px",
                  position: "relative",
                  boxShadow: isBundle ? "0 20px 60px rgba(79,70,229,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
                  transform: isBundle ? "scale(1.02)" : "none",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 16px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                    ⭐ {plan.badge}
                  </div>
                )}
                <div style={{ color: isBundle ? "rgba(255,255,255,0.8)" : "#4F46E5", marginBottom: "12px" }}>
                  {plan.icon}
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: isBundle ? "#fff" : "#111827" }}>{plan.name}</h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: isBundle ? "rgba(255,255,255,0.7)" : "#6b7280", lineHeight: "1.5" }}>{plan.description}</p>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{ fontSize: "44px", fontWeight: 800, color: isBundle ? "#fff" : "#111827" }}>${price}</span>
                  <span style={{ fontSize: "14px", color: isBundle ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>/month{billing === "annual" ? "*" : ""}</span>
                </div>
                <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: isBundle ? "rgba(255,255,255,0.9)" : "#374151" }}>
                      <FaCheckCircle style={{ color: isBundle ? "#a5b4fc" : "#4F46E5", marginTop: "2px", flexShrink: 0 }} size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(`/register?plan=${plan.key}&billing=${billing}`)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: isBundle ? "#fff" : "#4F46E5",
                    color: isBundle ? "#4F46E5" : "#fff",
                  }}
                >
                  Start Free Trial
                </button>
              </div>
            );
          })}
        </div>
        {billing === "annual" && (
          <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "8px", marginBottom: "48px" }}>
            *Annual pricing billed as one payment. Monthly rates shown for comparison.
          </p>
        )}

        {/* FAQ / Guarantee */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "40px", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#111827" }}>No risk. Cancel anytime.</h2>
          <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: "15px" }}>
            Start your 14-day free trial today. No credit card required. If you decide it's not for you, cancel with one click — no questions asked.
          </p>
          <button
            onClick={() => navigate("/register")}
            style={{ padding: "14px 36px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
          >
            Get started for free →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
