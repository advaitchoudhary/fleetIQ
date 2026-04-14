import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaExternalLinkAlt, FaArrowUp } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const PLANS = [
  {
    key: "driver",
    name: "Driver Management",
    monthlyPrice: 49,
    annualMonthlyEquivalent: 39,
    annualTotal: 468,
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
      "Contact inquiries inbox",
      "Admin notifications",
      "AI assistant included",
    ],
  },
  {
    key: "vehicle",
    name: "Vehicle & Fleet Operations",
    monthlyPrice: 49,
    annualMonthlyEquivalent: 39,
    annualTotal: 468,
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
      "AI assistant included",
    ],
  },
  {
    key: "bundle",
    name: "Fleet Bundle",
    monthlyPrice: 79,
    annualMonthlyEquivalent: 63,
    annualTotal: 756,
    description: "The complete platform — drivers, vehicles, and payments under one roof.",
    badge: "Best Value",
    features: [
      "Everything in Driver Management",
      "Everything in Vehicle Management",
      "Driver ↔ Vehicle assignment",
      "Unified fleet dashboard",
      "Live GPS tracking & real-time admin map",
      "Trip history with polyline replay",
      "AI assistant included",
      "14-day free trial included",
    ],
  },
];

const formatPrice = (amount: number) => `$${amount}`;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  trialing: { bg: "var(--t-indigo-bg)", color: "var(--t-indigo)" },
  active: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  past_due: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  cancelled: { bg: "var(--t-error-bg)", color: "var(--t-error)" },
  inactive: { bg: "rgba(107,114,128,0.12)", color: "var(--t-text-faint)" },
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
  // Trial is considered used when: (a) the server explicitly flagged it, or
  // (b) trialEndsAt exists AND the org is no longer actively trialing.
  // Actively-trialing orgs (status === "trialing") have trialEndsAt set but have
  // NOT consumed their trial yet — they should still see trial messaging.
  const trialAlreadyUsed = !!subscription?.trialUsed ||
    (!!subscription?.trialEndsAt && currentStatus !== "trialing");

  const trialDaysLeft = (() => {
    if (currentStatus !== "trialing" || !subscription?.trialEndsAt) return null;
    const msLeft = new Date(subscription.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  })();

  if (loading) {
    return (
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid var(--t-text-secondary)", borderTop: "4px solid var(--t-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "var(--t-text-dim)", fontSize: "14px" }}>Loading subscription details...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      <Navbar />
      <div style={styles.pageContainer}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>SUBSCRIPTION</div>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Subscription</h1>
            <p style={styles.pageDescription}>Manage your fleet platform plan.</p>
          </div>
        </div>

        {/* Current Plan Banner */}
        {!loading && (
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", boxShadow: "var(--t-shadow)" }}>
            <div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginBottom: "4px" }}>Current Plan</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--t-text)", textTransform: "capitalize" }}>
                  {currentPlan ? PLANS.find((p) => p.key === currentPlan)?.name || currentPlan : "No active plan"}
                </span>
                <span style={{ ...styles.badge, background: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                  {currentStatus}
                </span>
              </div>
              {subscription?.trialEndsAt && currentStatus === "trialing" && (
                <div style={{ fontSize: "13px", color: trialDaysLeft !== null && trialDaysLeft <= 3 ? "var(--t-warning)" : "var(--t-text-dim)", marginTop: "4px" }}>
                  {trialDaysLeft !== null && trialDaysLeft > 0
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in trial (ends ${new Date(subscription.trialEndsAt).toLocaleDateString()})`
                    : `Trial ended ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}
                </div>
              )}
              {subscription?.trialEndsAt && currentStatus === "inactive" && (
                <div style={{ fontSize: "13px", color: "var(--t-error)", marginTop: "4px" }}>
                  Your free trial expired on {new Date(subscription.trialEndsAt).toLocaleDateString()}. Subscribe to restore access.
                </div>
              )}
              {subscription?.currentPeriodEnd && currentStatus === "active" && (
                <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>
                  Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            {subscription?.stripeCustomerId && (
              <button onClick={handleBillingPortal} disabled={portalLoading} style={styles.portalBtn}>
                {portalLoading ? "Loading..." : <>Manage Billing <FaExternalLinkAlt size={12} /></>}
              </button>
            )}
          </div>
        )}

        {/* Past-due warning */}
        {currentStatus === "past_due" && (
          <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", fontSize: "14px", color: "var(--t-warning)" }}>
            Your last payment failed. Please update your payment method in the billing portal to restore access.
          </div>
        )}

        {/* Cancelled subscription notice */}
        {currentStatus === "cancelled" && (
          <div style={{ background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", fontSize: "14px", color: "var(--t-error)" }}>
            Your subscription has been cancelled. Choose a plan below to reactivate your account.
          </div>
        )}

        {/* Billing Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => setBilling("monthly")}
            style={{ ...styles.toggleBtn, background: billing === "monthly" ? "var(--t-accent)" : "var(--t-hover-bg)", color: billing === "monthly" ? "#fff" : "var(--t-text-faint)" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            style={{ ...styles.toggleBtn, background: billing === "annual" ? "var(--t-accent)" : "var(--t-hover-bg)", color: billing === "annual" ? "#fff" : "var(--t-text-faint)" }}
          >
            Annual <span style={{ marginLeft: "6px", fontSize: "11px", background: billing === "annual" ? "rgba(255,255,255,0.25)" : "rgba(16,185,129,0.15)", color: billing === "annual" ? "#fff" : "var(--t-success)", borderRadius: "10px", padding: "2px 7px" }}>Save 20%</span>
          </button>
        </div>

        {/* Plan Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key && isActive;
            const displayPrice = billing === "monthly"
              ? formatPrice(plan.monthlyPrice)
              : formatPrice(plan.annualTotal);
            return (
              <div
                key={plan.key}
                style={{
                  background: "var(--t-surface)",
                  borderRadius: "16px",
                  border: isCurrent ? "2px solid var(--t-accent)" : plan.key === "bundle" ? "2px solid var(--t-indigo-bg)" : "1px solid var(--t-border)",
                  padding: "24px",
                  position: "relative",
                  boxShadow: isCurrent ? "0 0 0 4px var(--t-indigo-bg)" : "none",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--t-accent)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 14px", borderRadius: "20px" }}>
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: "absolute", top: "16px", right: "16px" }}>
                    <FaCheckCircle style={{ color: "var(--t-indigo)" }} size={18} />
                  </div>
                )}
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>{plan.name}</h3>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--t-text-dim)" }}>{plan.description}</p>
                <div style={{ marginBottom: "20px" }}>
                  {billing === "annual" && (
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--t-text-faint)", textDecoration: "line-through" }}>
                        {formatPrice(plan.monthlyPrice)}/month
                      </span>
                    </div>
                  )}
                  <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--t-text)" }}>
                    {billing === "monthly" ? formatPrice(plan.monthlyPrice) : formatPrice(plan.annualMonthlyEquivalent)}
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--t-text-dim)" }}>/month</span>
                  {billing === "annual" && (
                    <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--t-text-dim)" }}>
                      {formatPrice(plan.annualTotal)} billed annually
                    </div>
                  )}
                </div>
                <ul style={{ margin: "0 0 24px", paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {plan.features.filter((f) => !(trialAlreadyUsed && f === "14-day free trial included")).map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--t-text-muted)" }}>
                      <FaCheckCircle style={{ color: "var(--t-indigo)", marginTop: "2px", flexShrink: 0 }} size={13} />
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
                      background: plan.key === "bundle" ? "var(--t-accent)" : "var(--t-bg)",
                    }}
                  >
                    {redirecting === plan.key ? "Redirecting..." : (
                      <>
                        {subscription?.stripeSubscriptionId
                          ? <><FaArrowUp size={12} /> Switch to {plan.name}</>
                          : currentStatus === "trialing"
                            ? <><FaArrowUp size={12} /> Upgrade Plan</>
                            : trialAlreadyUsed
                              ? "Subscribe Now"
                              : "Start Free Trial"}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--t-text-faint)" }}>
          {trialAlreadyUsed
            ? "Cancel anytime. Annual plans are charged once per year."
            : "All plans include a 14-day free trial. No credit card required to start. Annual plans are charged once per year."}
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { padding: "32px 40px", maxWidth: "1000px", margin: "0 auto" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" },
  pageDescription: { margin: 0, fontSize: "14px", color: "var(--t-text-dim)" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  portalBtn: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "var(--t-text-muted)" },
  toggleBtn: { padding: "8px 20px", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  selectBtn: { width: "100%", padding: "12px", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
  currentPlanBtn: { width: "100%", padding: "12px", background: "var(--t-indigo-bg)", color: "var(--t-indigo)", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" },
};

export default Subscription;
