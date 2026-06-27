import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaTruck, FaUsers, FaStar } from "react-icons/fa";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    icon: <FaUsers size={24} />,
    monthlyPrice: 79,
    annualMonthlyEquivalent: 63,
    annualTotal: 756,
    description: "Everything you need to run a small fleet — drivers and vehicles included.",
    limit: "Up to 10 vehicles & drivers",
    features: [
      "Up to 10 vehicles & drivers",
      "Driver profiles, timesheets & approvals",
      "Invoice generation & PDF export",
      "Driver onboarding & applications",
      "Vehicle registry & maintenance logs",
      "DVIR pre/post-trip inspections",
      "Fuel logging & L/100km analytics",
      "Document management",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    icon: <FaTruck size={24} />,
    monthlyPrice: 149,
    annualMonthlyEquivalent: 119,
    annualTotal: 1428,
    description: "Scale your operations with full fleet and driver management.",
    limit: "Up to 30 vehicles & drivers",
    features: [
      "Up to 30 vehicles & drivers",
      "Everything in Starter",
      "Driver ↔ Vehicle assignment",
      "Web-based location sharing & admin map",
      "Trip history with route replay",
      "Parts inventory & warranty tracking",
      "Fleet cost tracking & trend reports",
      "Preventive maintenance schedules",
      "Priority support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    icon: <FaStar size={24} />,
    monthlyPrice: 249,
    annualMonthlyEquivalent: 199,
    annualTotal: 2388,
    badge: "Best Value",
    description: "Unlimited scale for serious fleet operators.",
    limit: "Unlimited vehicles & drivers",
    features: [
      "Unlimited vehicles & drivers",
      "Everything in Growth",
      "Unified fleet dashboard",
      "Onboarding assistance",
      "Dedicated support",
      "7-day free trial",
      "AI assistant included",
    ],
  },
];

const formatPrice = (amount: number) => `$${amount}`;

const Pricing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const billingFromUrl = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const planFromUrl = searchParams.get("plan") || null;
  const [billing, setBilling] = useState<"monthly" | "annual">(billingFromUrl);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planFromUrl);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const goToRegister = (planKey: string) => {
    setSelectedPlan(planKey);
    navigate(`/register?plan=${planKey}&billing=${billing}`);
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#111827", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaTruck style={{ color: "#818CF8" }} size={22} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.3px" }}>Fleet<span style={{ color: "#818CF8" }}>IQ</span></span>
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
            Start with a 7-day free trial. No credit card required.
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
            const isBundle = plan.key === "pro";
            const isHovered = hoveredPlan === plan.key;
            const isSelected = selectedPlan === plan.key;
            return (
              <div
                key={plan.key}
                onClick={() => goToRegister(plan.key)}
                onMouseEnter={() => setHoveredPlan(plan.key)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  background: isBundle ? "#4F46E5" : "#fff",
                  borderRadius: "20px",
                  border: isBundle
                    ? `2px solid ${isSelected ? "rgba(255,255,255,0.5)" : "transparent"}`
                    : `2px solid ${isSelected ? "#4F46E5" : isHovered ? "#4F46E5" : "#e5e7eb"}`,
                  padding: "32px",
                  position: "relative",
                  boxShadow: isBundle
                    ? isHovered ? "0 28px 72px rgba(79,70,229,0.45)" : "0 20px 60px rgba(79,70,229,0.3)"
                    : isSelected ? "0 8px 32px rgba(79,70,229,0.18)" : isHovered ? "0 8px 32px rgba(79,70,229,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
                  transform: isBundle
                    ? isHovered ? "scale(1.04)" : "scale(1.02)"
                    : isSelected || isHovered ? "translateY(-4px)" : "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                  outline: isSelected && !isBundle ? "none" : undefined,
                }}
              >
                {isSelected && (
                  <div style={{ position: "absolute", top: "-14px", right: "20px", background: isBundle ? "#fff" : "#4F46E5", color: isBundle ? "#4F46E5" : "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                    ✓ Current Selection
                  </div>
                )}
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
                  {billing === "annual" && (
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px", fontWeight: 600, color: isBundle ? "rgba(255,255,255,0.4)" : "#9ca3af", textDecoration: "line-through" }}>
                        {formatPrice(plan.monthlyPrice)}/month
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: "44px", fontWeight: 800, color: isBundle ? "#fff" : "#111827" }}>
                    {billing === "monthly" ? formatPrice(plan.monthlyPrice) : formatPrice(plan.annualMonthlyEquivalent)}
                  </span>
                  <span style={{ fontSize: "14px", color: isBundle ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>/month</span>
                  {billing === "annual" && (
                    <div style={{ marginTop: "6px", fontSize: "13px", color: isBundle ? "rgba(255,255,255,0.8)" : "#6b7280" }}>
                      {formatPrice(plan.annualTotal)} billed annually
                    </div>
                  )}
                </div>
                <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: isBundle ? "rgba(255,255,255,0.9)" : "#374151" }}>
                      <FaCheckCircle style={{ color: isBundle ? "#a5b4fc" : "#4F46E5", marginTop: "2px", flexShrink: 0 }} size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 700,
                    textAlign: "center",
                    background: isBundle ? (isHovered ? "#f0f0ff" : "#fff") : (isHovered || isSelected ? "#4338ca" : "#4F46E5"),
                    color: isBundle ? "#4F46E5" : "#fff",
                    transition: "background 0.2s",
                  }}
                >
                  {isSelected ? "Continue with this Plan →" : "Start Free Trial →"}
                </div>
              </div>
            );
          })}
        </div>
        {billing === "annual" && (
          <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "8px", marginBottom: "48px" }}>
            Annual pricing is charged as one payment per year. Monthly-equivalent rates are shown for comparison.
          </p>
        )}

        {/* FAQ / Guarantee */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "40px", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#111827" }}>No risk. Cancel anytime.</h2>
          <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: "15px" }}>
            Start your 7-day free trial today. No credit card required. If you decide it's not for you, cancel with one click — no questions asked.
          </p>
          <button
            onClick={() => goToRegister("pro")}
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
