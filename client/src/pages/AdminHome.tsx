import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import {
  FaUsers, FaClipboardList, FaFileAlt, FaCreditCard, FaHistory,
  FaEnvelope, FaTruck, FaWrench, FaCheckSquare, FaGasPump,
  FaBox, FaShieldAlt, FaChartBar, FaCalendarAlt, FaTools,
  FaLock, FaCheckCircle, FaExternalLinkAlt, FaPlus,
  FaExclamationCircle,
} from "react-icons/fa";

const STATUS_CFG: Record<string, { bg: string; border: string; color: string; label: string }> = {
  trialing:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  color: "#34d399", label: "ACTIVE"    },
  active:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  color: "#34d399", label: "ACTIVE"    },
  past_due:  { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.3)",   color: "#fbbf24", label: "PAST DUE"  },
  cancelled: { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#f87171", label: "CANCELLED" },
  inactive:  { bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)", color: "#9ca3af", label: "NO PLAN"   },
};

const DRIVER_FEATURES = [
  { icon: FaUsers,         title: "Drivers",          desc: "View all drivers, filter by status and manage compliance.",             path: "/users",               accent: "#818CF8", badge: null         },
  { icon: FaClipboardList, title: "Applications",      desc: "Onboard new fleet operators and manage driver background checks.",      path: "/driver-applications", accent: "#818CF8", badge: null         },
  { icon: FaFileAlt,       title: "Timesheets",        desc: "Approve hours worked and manage shift rotations for the fleet.",        path: "/applications",        accent: "#f59e0b", badge: "pending"    },
  { icon: FaCreditCard,    title: "Payments",          desc: "Execute payroll, review expenses and track operator bonuses.",          path: "/payments",            accent: "#818CF8", badge: null         },
  { icon: FaHistory,       title: "Payment History",   desc: "Full audit trail of all driver payouts and transactions.",             path: "/payment-history",     accent: "#818CF8", badge: null         },
  { icon: FaFileAlt,       title: "Invoices",          desc: "Generate and export driver invoices as PDF documents.",               path: "/invoice",             accent: "#818CF8", badge: null         },
  { icon: FaEnvelope,      title: "Enquiries",         desc: "Read and respond to contact form submissions from drivers.",           path: "/enquiries",           accent: "#818CF8", badge: null         },
];

const VEHICLE_FEATURES = [
  { icon: FaTruck,       title: "Vehicles",          desc: "Full fleet registry — VIN, plates, insurance and real-time status.",  path: "/vehicles",               accent: "#22d3ee", badge: null },
  { icon: FaWrench,      title: "Maintenance",       desc: "Log preventive and corrective maintenance across all units.",         path: "/maintenance",            accent: "#22d3ee", badge: null },
  { icon: FaCheckSquare, title: "Inspections",       desc: "DVIR pre/post-trip and annual inspection management.",               path: "/inspections",            accent: "#22d3ee", badge: null },
  { icon: FaGasPump,     title: "Fuel Logs",         desc: "Track fuel fills and calculate L/100km per vehicle.",               path: "/fuel-logs",              accent: "#22d3ee", badge: null },
  { icon: FaBox,         title: "Parts Inventory",   desc: "Manage parts stock with low-stock alerts and reorder tracking.",    path: "/parts",                  accent: "#22d3ee", badge: null },
  { icon: FaShieldAlt,   title: "Warranties",        desc: "Track warranties, expiry dates and manage claims.",                path: "/warranties",             accent: "#22d3ee", badge: null },
  { icon: FaHistory,     title: "Service History",   desc: "Full service timeline and cost history per vehicle.",              path: "/service-history",        accent: "#22d3ee", badge: null },
  { icon: FaChartBar,    title: "Cost Tracking",     desc: "Fleet cost dashboard and 6-month expense trends.",                path: "/cost-tracking",          accent: "#22d3ee", badge: null },
  { icon: FaTools,       title: "Preventive Maint.", desc: "PM templates, schedules and overdue alert management.",            path: "/preventive-maintenance", accent: "#22d3ee", badge: null },
  { icon: FaCalendarAlt, title: "Scheduling",        desc: "Calendar view of all upcoming fleet maintenance events.",          path: "/scheduling",             accent: "#22d3ee", badge: null },
];

interface FleetStats { vehicles: number; drivers: number; pendingTimesheets: number; }

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = user?.name || user?.email?.split("@")[0] || "Admin";

  useEffect(() => {
    const authHeader = { Authorization: `Bearer ${token}` };

    axios.get(`${API_BASE_URL}/subscriptions/current`, { headers: authHeader })
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));

    Promise.allSettled([
      axios.get(`${API_BASE_URL}/vehicles`,                        { headers: authHeader }),
      axios.get(`${API_BASE_URL}/drivers`,                         { headers: authHeader }),
      axios.get(`${API_BASE_URL}/timesheets?status=pending`,       { headers: authHeader }),
    ]).then(([vr, dr, tr]) => {
      setStats({
        vehicles:         vr.status === "fulfilled" && Array.isArray(vr.value.data) ? vr.value.data.length : 0,
        drivers:          dr.status === "fulfilled" && Array.isArray(dr.value.data) ? dr.value.data.length : 0,
        pendingTimesheets: tr.status === "fulfilled" && Array.isArray(tr.value.data) ? tr.value.data.length : 0,
      });
    }).catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const plan   = subscription?.plan   || "inactive";
  const status = subscription?.status || "inactive";
  const sc     = STATUS_CFG[status]   || STATUS_CFG.inactive;
  const showDriver  = ["bundle", "driver"].includes(plan)  || status === "trialing";
  const showVehicle = ["bundle", "vehicle"].includes(plan) || status === "trialing";
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const planLabel = plan === "bundle" ? "Fleet Bundle" : plan === "driver" ? "Driver Management" : plan === "vehicle" ? "Vehicle & Fleet Operations" : null;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0d1117", minHeight: "100vh", color: "#fff" }}>
      <Navbar />

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "36px 40px" }}>

        {/* ── Welcome Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "36px" }}>
          <div>
            <h1 style={{ margin: "0 0 10px", fontSize: "30px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
              Welcome back, {adminName}
            </h1>
            {!loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  {status === "trialing" ? "Trial Status:" : "Plan Status:"}
                </span>
                <span style={{
                  background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                  fontSize: "11px", fontWeight: 700, padding: "3px 12px", borderRadius: "20px",
                  letterSpacing: "0.5px",
                }}>
                  {sc.label}{trialDaysLeft !== null && status === "trialing" ? ` • ${trialDaysLeft} DAYS REMAINING` : ""}
                </span>
                {planLabel && <span style={{ fontSize: "13px", color: "#4b5563" }}>·</span>}
                {planLabel && <span style={{ fontSize: "13px", color: "#6b7280" }}>{planLabel}</span>}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/vehicles")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 22px", background: "#4F46E5", border: "none",
              borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
              boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
            }}
          >
            <FaPlus size={11} /> New Vehicle
          </button>
        </div>

        {/* ── Stats Row ── */}
        {!statsLoading && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
            {[
              {
                label: "TOTAL VEHICLES",
                value: stats.vehicles,
                accent: "#4F46E5",
                sub: "Total registered",
                subColor: "#6b7280",
              },
              {
                label: "TOTAL DRIVERS",
                value: stats.drivers,
                accent: "#4F46E5",
                sub: "Active fleet drivers",
                subColor: "#6b7280",
              },
              {
                label: "PENDING TIMESHEETS",
                value: stats.pendingTimesheets,
                accent: stats.pendingTimesheets > 0 ? "#f59e0b" : "#22c55e",
                sub: stats.pendingTimesheets > 0 ? "Requires Attention" : "All clear",
                subColor: stats.pendingTimesheets > 0 ? "#f59e0b" : "#34d399",
              },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `3px solid ${s.accent}`,
                borderRadius: "12px",
                padding: "24px 28px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
                  {s.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 800, color: "#f9fafb", lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: "12px", color: s.subColor, fontWeight: 500 }}>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past-due warning */}
        {status === "past_due" && (
          <div style={{
            background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: "10px", padding: "14px 18px", marginBottom: "32px",
            fontSize: "13px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <FaExclamationCircle size={14} /> Your last payment failed. Please update your payment method to restore full access.
          </div>
        )}

        {/* ── Driver Management ── */}
        <FeatureSection
          title="Driver Management"
          features={DRIVER_FEATURES}
          unlocked={showDriver}
          loading={loading}
          navigate={navigate}
          accentColor="#4F46E5"
          pendingTimesheets={stats?.pendingTimesheets ?? 0}
          upgradePlan="driver"
        />

        {/* ── Vehicle & Fleet Operations ── */}
        <FeatureSection
          title="Vehicle & Fleet Operations"
          features={VEHICLE_FEATURES}
          unlocked={showVehicle}
          loading={loading}
          navigate={navigate}
          accentColor="#0891b2"
          pendingTimesheets={0}
          upgradePlan="vehicle"
        />

      </div>
    </div>
  );
};

/* ── Feature Section Component ── */
interface FeatureSectionProps {
  title: string;
  features: { icon: any; title: string; desc: string; path: string; accent: string; badge: string | null }[];
  unlocked: boolean;
  loading: boolean;
  navigate: (path: string) => void;
  accentColor: string;
  pendingTimesheets: number;
  upgradePlan: string;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title, features, unlocked, loading, navigate, accentColor, pendingTimesheets, upgradePlan,
}) => (
  <div style={{ marginBottom: "52px" }}>
    {/* Section header */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#f3f4f6", letterSpacing: "-0.2px" }}>{title}</h2>
        {!loading && (
          unlocked
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 10px", borderRadius: "20px" }}>
                <FaCheckCircle size={9} /> Included
              </span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#6b7280", background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.15)", padding: "2px 10px", borderRadius: "20px" }}>
                <FaLock size={9} /> Not in your plan
              </span>
        )}
      </div>
      {!loading && !unlocked && (
        <button
          onClick={() => navigate("/subscription")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: accentColor, color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Upgrade to unlock
        </button>
      )}
    </div>

    {/* Cards grid */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "14px" }}>
      {features.map((f) => {
        const showBadge = f.badge === "pending" && pendingTimesheets > 0;
        const Icon = f.icon;
        return (
          <div
            key={f.path}
            onClick={() => unlocked && navigate(f.path)}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${unlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
              borderRadius: "14px",
              padding: "22px",
              cursor: unlocked ? "pointer" : "default",
              opacity: unlocked ? 1 : 0.38,
              transition: "border-color 0.2s, background 0.2s",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!unlocked) return;
              e.currentTarget.style.borderColor = `${f.accent}44`;
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!unlocked) return;
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: unlocked ? `${f.accent}1a` : "rgba(107,114,128,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: unlocked ? f.accent : "#6b7280",
                flexShrink: 0,
              }}>
                <Icon size={20} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {showBadge && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, color: "#f59e0b",
                    background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                    padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap",
                  }}>
                    {pendingTimesheets} ACTION ITEMS
                  </span>
                )}
                {!unlocked
                  ? <FaLock size={12} style={{ color: "#374151" }} />
                  : <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563" }}>
                      <FaExternalLinkAlt size={11} />
                    </div>
                }
              </div>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: unlocked ? "#f3f4f6" : "#374151", marginBottom: "6px" }}>
              {f.title}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.65 }}>
              {f.desc}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default AdminHome;
