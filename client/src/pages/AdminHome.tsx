import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import {
  FaUsers, FaClipboardList, FaFileAlt, FaCreditCard, FaHistory,
  FaEnvelope, FaTruck, FaWrench, FaCheckSquare, FaGasPump,
  FaBox, FaShieldAlt, FaChartBar, FaCalendarAlt, FaTools,
  FaLock, FaArrowRight, FaCheckCircle,
} from "react-icons/fa";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  trialing:  { bg: "#dbeafe", color: "#1d4ed8", label: "Free Trial" },
  active:    { bg: "#dcfce7", color: "#166534", label: "Active" },
  past_due:  { bg: "#fef9c3", color: "#854d0e", label: "Past Due" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
  inactive:  { bg: "#f3f4f6", color: "#6b7280", label: "No Plan" },
};

const DRIVER_FEATURES = [
  { icon: <FaUsers size={20} />,       title: "Drivers",             desc: "Manage driver profiles, rates & credentials",  path: "/users",               color: "#4F46E5" },
  { icon: <FaClipboardList size={20} />, title: "Driver Applications", desc: "Review & approve new driver applications",    path: "/driver-applications", color: "#4F46E5" },
  { icon: <FaFileAlt size={20} />,     title: "All Timesheets",      desc: "Review, approve & export driver timesheets",   path: "/applications",        color: "#4F46E5" },
  { icon: <FaCreditCard size={20} />,  title: "Driver Payments",     desc: "Calculate & send Stripe payouts to drivers",   path: "/payments",            color: "#4F46E5" },
  { icon: <FaHistory size={20} />,     title: "Payment History",     desc: "Full audit trail of all driver payments",      path: "/payment-history",     color: "#4F46E5" },
  { icon: <FaFileAlt size={20} />,     title: "Invoices",            desc: "Generate & export driver invoices as PDF",     path: "/invoice",             color: "#4F46E5" },
  { icon: <FaEnvelope size={20} />,    title: "Enquiries",           desc: "Read contact form submissions from drivers",   path: "/enquiries",           color: "#4F46E5" },
];

const VEHICLE_FEATURES = [
  { icon: <FaTruck size={20} />,       title: "Vehicles",            desc: "Full fleet registry — VIN, plates, insurance", path: "/vehicles",            color: "#0891b2" },
  { icon: <FaWrench size={20} />,      title: "Maintenance",         desc: "Log preventive & corrective maintenance",      path: "/maintenance",         color: "#0891b2" },
  { icon: <FaCheckSquare size={20} />, title: "Inspections",         desc: "DVIR pre/post-trip & annual inspections",      path: "/inspections",         color: "#0891b2" },
  { icon: <FaGasPump size={20} />,     title: "Fuel Logs",           desc: "Track fuel fills & calculate L/100km",         path: "/fuel-logs",           color: "#0891b2" },
  { icon: <FaBox size={20} />,         title: "Parts Inventory",     desc: "Manage parts stock with low-stock alerts",     path: "/parts",               color: "#0891b2" },
  { icon: <FaShieldAlt size={20} />,   title: "Warranties",          desc: "Track warranties & manage claims",             path: "/warranties",          color: "#0891b2" },
  { icon: <FaHistory size={20} />,     title: "Service History",     desc: "Full service timeline per vehicle",            path: "/service-history",     color: "#0891b2" },
  { icon: <FaChartBar size={20} />,    title: "Cost Tracking",       desc: "Fleet cost dashboard & 6-month trends",        path: "/cost-tracking",       color: "#0891b2" },
  { icon: <FaTools size={20} />,       title: "Preventive Maint.",   desc: "PM templates, schedules & overdue alerts",     path: "/preventive-maintenance", color: "#0891b2" },
  { icon: <FaCalendarAlt size={20} />, title: "Scheduling",          desc: "Calendar view of all upcoming fleet events",   path: "/scheduling",          color: "#0891b2" },
];

interface FleetStats {
  vehicles: number;
  drivers: number;
  pendingTimesheets: number;
}

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

    const fetchSubscription = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/subscriptions/current`, {
          headers: authHeader,
        });
        setSubscription(res.data);
      } catch {
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const [vehiclesRes, driversRes, timesheetsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/vehicles`, { headers: authHeader }),
          axios.get(`${API_BASE_URL}/drivers`, { headers: authHeader }),
          axios.get(`${API_BASE_URL}/timesheets?status=pending`, { headers: authHeader }),
        ]);

        const vehicles = vehiclesRes.status === "fulfilled"
          ? (Array.isArray(vehiclesRes.value.data) ? vehiclesRes.value.data.length : 0) : 0;
        const drivers = driversRes.status === "fulfilled"
          ? (Array.isArray(driversRes.value.data) ? driversRes.value.data.length : 0) : 0;
        const pendingTimesheets = timesheetsRes.status === "fulfilled"
          ? (Array.isArray(timesheetsRes.value.data) ? timesheetsRes.value.data.length : 0) : 0;

        setStats({ vehicles, drivers, pendingTimesheets });
      } catch {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSubscription();
    fetchStats();
  }, []);

  const plan   = subscription?.plan || "inactive";
  const status = subscription?.status || "inactive";
  const sc     = STATUS_COLORS[status] || STATUS_COLORS.inactive;

  // bundle or trialing → all features; driver plan → driver only; vehicle plan → vehicle only
  const showDriver  = ["bundle", "driver"].includes(plan) || status === "trialing";
  const showVehicle = ["bundle", "vehicle"].includes(plan) || status === "trialing";

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 100%)",
          borderRadius: "16px", padding: "32px 36px", marginBottom: "28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
              Welcome back
            </p>
            <h1 style={{ margin: "0 0 12px", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              {adminName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {!loading && (
                <span style={{ background: sc.bg, color: sc.color, fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", textTransform: "capitalize" }}>
                  {sc.label}
                </span>
              )}
              {!loading && plan !== "inactive" && (
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>
                  {plan === "bundle" ? "Fleet Bundle" : plan === "driver" ? "Driver Management" : "Vehicle & Fleet Operations"}
                </span>
              )}
              {trialDaysLeft !== null && status === "trialing" && (
                <span style={{ fontSize: "13px", color: "#fbbf24" }}>
                  · {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in trial
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/subscription")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 20px", background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
              color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Manage Subscription <FaArrowRight size={11} />
          </button>
        </div>

        {/* ── Fleet Stats Summary ── */}
        {!statsLoading && stats && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "28px",
          }}>
            {[
              { label: "Total Vehicles", value: stats.vehicles, icon: <FaTruck size={18} />, color: "#0891b2", bg: "#e0f2fe" },
              { label: "Total Drivers",  value: stats.drivers,  icon: <FaUsers size={18} />, color: "#4F46E5", bg: "#eef2ff" },
              { label: "Pending Timesheets", value: stats.pendingTimesheets, icon: <FaFileAlt size={18} />, color: "#d97706", bg: "#fef3c7" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Past-due warning ── */}
        {status === "past_due" && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", fontSize: "14px", color: "#92400e" }}>
            ⚠️ Your last payment failed. Please update your payment method to restore full access.
          </div>
        )}

        {/* ── Driver Management Section ── */}
        <Section
          title="Driver Management"
          accentColor="#4F46E5"
          features={DRIVER_FEATURES}
          unlocked={showDriver}
          loading={loading}
          navigate={navigate}
          upgradePlan="driver"
        />

        {/* ── Vehicle & Fleet Operations Section ── */}
        <Section
          title="Vehicle & Fleet Operations"
          accentColor="#0891b2"
          features={VEHICLE_FEATURES}
          unlocked={showVehicle}
          loading={loading}
          navigate={navigate}
          upgradePlan="vehicle"
        />

      </div>
    </div>
  );
};

/* ── Section Component ── */
interface SectionProps {
  title: string;
  accentColor: string;
  features: { icon: React.ReactNode; title: string; desc: string; path: string; color: string }[];
  unlocked: boolean;
  loading: boolean;
  navigate: (path: string) => void;
  upgradePlan: string;
}

const Section: React.FC<SectionProps> = ({ title, accentColor, features, unlocked, loading, navigate, upgradePlan }) => (
  <div style={{ marginBottom: "36px" }}>
    {/* Section header */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "4px", height: "20px", background: accentColor, borderRadius: "2px" }} />
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>{title}</h2>
        {!loading && (
          unlocked
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#059669", background: "#dcfce7", padding: "3px 10px", borderRadius: "20px" }}>
                <FaCheckCircle size={10} /> Included in your plan
              </span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "20px" }}>
                <FaLock size={10} /> Not in your plan
              </span>
        )}
      </div>
      {!loading && !unlocked && (
        <button
          onClick={() => navigate("/subscription")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: accentColor, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          Upgrade to unlock <FaArrowRight size={11} />
        </button>
      )}
    </div>

    {/* Feature grid */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
      {features.map((f) => (
        <div
          key={f.path}
          onClick={() => unlocked && navigate(f.path)}
          style={{
            background: "#fff",
            border: `1px solid ${unlocked ? "#e5e7eb" : "#f3f4f6"}`,
            borderRadius: "12px",
            padding: "20px",
            cursor: unlocked ? "pointer" : "default",
            opacity: unlocked ? 1 : 0.45,
            transition: "box-shadow 0.2s, transform 0.15s, border-color 0.2s",
            position: "relative",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => {
            if (!unlocked) return;
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = accentColor + "55";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = unlocked ? "#e5e7eb" : "#f3f4f6";
          }}
        >
          {/* Lock overlay icon */}
          {!unlocked && (
            <div style={{ position: "absolute", top: "14px", right: "14px", color: "#9ca3af" }}>
              <FaLock size={13} />
            </div>
          )}
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: unlocked ? (accentColor + "15") : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", color: unlocked ? accentColor : "#9ca3af" }}>
            {f.icon}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{f.title}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.5 }}>{f.desc}</div>
          {unlocked && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "14px", fontSize: "12px", fontWeight: 600, color: accentColor }}>
              Open <FaArrowRight size={10} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default AdminHome;
