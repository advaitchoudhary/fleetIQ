import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCreditCard, FaCheckCircle, FaExternalLinkAlt, FaArrowUp } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const PLANS = [
  {
    key: "driver",
    name: "Driver Management",
    monthlyPrice: "$49",
    annualPrice: "$39",
    description: "Everything you need to manage your driver workforce end-to-end.",
    features: [
      "Unlimited driver profiles & onboarding",
      "Digital driver applications & approvals",
      "Timesheet submission, review & approval",
      "7 per-category payment rate management",
      "Stripe-powered direct driver payouts",
      "Payment history & audit trail",
      "Required document & compliance tracking",
      "Training certificate management (12 types)",
      "Licence expiry alerts",
      "Invoice generation & PDF export",
      "Contact enquiries inbox",
      "Admin notifications",
    ],
  },
  {
    key: "vehicle",
    name: "Vehicle & Fleet Operations",
    monthlyPrice: "$49",
    annualPrice: "$39",
    description: "Full vehicle management and fleet operations — from inspections to cost tracking.",
    features: [
      "Full vehicle registry (VIN, plates, insurance)",
      "Preventive & corrective maintenance logs",
      "DVIR pre/post-trip & annual inspections",
      "Fuel logging & L/100km analytics",
      "Parts inventory with low-stock alerts",
      "Warranty tracking & claim management",
      "Service history timeline per vehicle",
      "Fleet cost tracking & trend analysis",
      "Preventive maintenance templates & schedules",
      "Scheduling calendar",
      "Maintenance due & overdue alerts",
      "Admin notifications",
    ],
  },
  {
    key: "bundle",
    name: "Fleet Bundle",
    monthlyPrice: "$79",
    annualPrice: "$63",
    description: "The complete platform — drivers, vehicles, and payments under one roof.",
    badge: "Best Value",
    features: [
      "Everything in Driver Management",
      "Everything in Vehicle Management",
      "Multi-company support",
      "14-day free trial included",
    ],
  },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  trialing: { bg: "#dbeafe", color: "#1d4ed8" },
  active: { bg: "#dcfce7", color: "#166534" },
  past_due: { bg: "#fef9c3", color: "#854d0e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  inactive: { bg: "#f3f4f6", color: "#6b7280" },
};

const Subscription: React.FC = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Small delay to let webhook process
      setTimeout(fetchSubscription, 2000);
    } else {
      fetchSubscription();
    }
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/subscriptions/current`, { headers });
      setSubscription(res.data);
    } catch (err) {
      console.error("Failed to fetch subscription", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: string) => {
    setRedirecting(plan);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/subscriptions/create-checkout`,
        { plan, billing },
        { headers }
      );
      window.location.href = res.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start checkout");
      setRedirecting(null);
    }
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/subscriptions/create-portal`, {}, { headers });
      window.location.href = res.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = subscription?.plan;
  const currentStatus = subscription?.status || "inactive";
  const sc = STATUS_COLORS[currentStatus] || STATUS_COLORS.inactive;
  const isActive = ["trialing", "active"].includes(currentStatus);

  const trialDaysLeft = (() => {
    if (currentStatus !== "trialing" || !subscription?.trialEndsAt) return null;
    const msLeft = new Date(subscription.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  })();

  if (loading) {
    return (
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #e5e7eb", borderTop: "4px solid #4F46E5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading subscription details...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FaCreditCard size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Billing</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Subscription</h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Manage your fleet platform plan</p>
          </div>
        </div>
      </div>
      <div style={{ padding: "28px 40px", maxWidth: "1000px", margin: "0 auto" }}>

        {/* Current Plan Banner */}
        {!loading && (
          <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Current Plan</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>
                  {currentPlan ? PLANS.find((p) => p.key === currentPlan)?.name || currentPlan : "No active plan"}
                </span>
                <span style={{ ...styles.badge, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                  {currentStatus}
                </span>
              </div>
              {subscription?.trialEndsAt && currentStatus === "trialing" && (
                <div style={{ fontSize: "13px", color: trialDaysLeft !== null && trialDaysLeft <= 3 ? "#b45309" : "#6b7280", marginTop: "4px" }}>
                  {trialDaysLeft !== null && trialDaysLeft > 0
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in trial (ends ${new Date(subscription.trialEndsAt).toLocaleDateString()})`
                    : `Trial ended ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}
                </div>
              )}
              {subscription?.currentPeriodEnd && currentStatus === "active" && (
                <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                  Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            {subscription?.stripeSubscriptionId && (
              <button onClick={handleBillingPortal} disabled={portalLoading} style={styles.portalBtn}>
                {portalLoading ? "Loading..." : <>Manage Billing <FaExternalLinkAlt size={12} /></>}
              </button>
            )}
          </div>
        )}

        {/* Past-due warning */}
        {currentStatus === "past_due" && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", fontSize: "14px", color: "#92400e" }}>
            ⚠️ Your last payment failed. Please update your payment method in the billing portal to restore access.
          </div>
        )}

        {/* Billing Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => setBilling("monthly")}
            style={{ ...styles.toggleBtn, background: billing === "monthly" ? "#4F46E5" : "#f3f4f6", color: billing === "monthly" ? "#fff" : "#374151" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            style={{ ...styles.toggleBtn, background: billing === "annual" ? "#4F46E5" : "#f3f4f6", color: billing === "annual" ? "#fff" : "#374151" }}
          >
            Annual <span style={{ marginLeft: "6px", fontSize: "11px", background: billing === "annual" ? "rgba(255,255,255,0.25)" : "#dcfce7", color: billing === "annual" ? "#fff" : "#16a34a", borderRadius: "10px", padding: "2px 7px" }}>Save 20%</span>
          </button>
        </div>

        {/* Plan Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key && isActive;
            const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            return (
              <div
                key={plan.key}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  border: isCurrent ? "2px solid #4F46E5" : plan.key === "bundle" ? "2px solid #e0e7ff" : "1px solid #e5e7eb",
                  padding: "24px",
                  position: "relative",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(79,70,229,0.1)" : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#4F46E5", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 14px", borderRadius: "20px" }}>
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: "absolute", top: "16px", right: "16px" }}>
                    <FaCheckCircle style={{ color: "#4F46E5" }} size={18} />
                  </div>
                )}
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#111827" }}>{plan.name}</h3>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>{plan.description}</p>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ fontSize: "36px", fontWeight: 800, color: "#111827" }}>{price}</span>
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>/month{billing === "annual" ? " (billed annually)" : ""}</span>
                </div>
                <ul style={{ margin: "0 0 24px", paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#374151" }}>
                      <FaCheckCircle style={{ color: "#4F46E5", marginTop: "2px", flexShrink: 0 }} size={13} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div style={{ ...styles.currentPlanBtn }}>
                    <FaCheckCircle size={14} /> Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={redirecting === plan.key}
                    style={{
                      ...styles.selectBtn,
                      background: plan.key === "bundle" ? "#4F46E5" : "#111827",
                    }}
                  >
                    {redirecting === plan.key ? "Redirecting..." : (
                      <>
                        {subscription?.stripeSubscriptionId
                          ? <><FaArrowUp size={12} /> Switch to {plan.name}</>
                          : `Start Free Trial`}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#9ca3af" }}>
          All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  portalBtn: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" },
  toggleBtn: { padding: "8px 20px", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  selectBtn: { width: "100%", padding: "12px", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
  currentPlanBtn: { width: "100%", padding: "12px", background: "#eef2ff", color: "#4F46E5", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
};

export default Subscription;
