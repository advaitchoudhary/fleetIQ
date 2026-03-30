import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTruck, FaSearch, FaPowerOff } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";

interface Org {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  subscription: {
    status: "trialing" | "active" | "past_due" | "cancelled";
    plan: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  trialing:  { bg: "var(--t-indigo-bg)",    color: "var(--t-indigo)", label: "Trialing" },
  active:    { bg: "var(--t-success-bg)",   color: "var(--t-success)", label: "Active"   },
  past_due:  { bg: "var(--t-warning-bg)",    color: "var(--t-warning)", label: "Past Due" },
  cancelled: { bg: "var(--t-error-bg)",    color: "var(--t-error)", label: "Cancelled"},
};

const OrgSelector: React.FC = () => {
  const { user, logout, switchOrg } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/organizations`)
      .then((res) => {
        const data = res.data;
        // API may return { orgs: [...] } or a bare array — handle both
        setOrgs(Array.isArray(data) ? data : data.orgs ?? []);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data?.message || "Failed to load organisations";
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnter = async (org: Org) => {
    setEntering(org._id);
    try {
      await switchOrg(org._id, org.name);
    } catch {
      alert("Failed to switch organisation");
      setEntering(null);
    }
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "var(--t-bg)", borderBottom: "1px solid var(--t-hover-bg)", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaTruck style={{ color: "var(--t-indigo)" }} size={20} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "18px" }}>
            Fleet<span style={{ color: "var(--t-indigo)" }}>IQ</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>{user?.email}</span>
          <button
            onClick={logout}
            style={{ background: "var(--t-border)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px" }}
          >
            <FaPowerOff size={14} /> Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, color: "var(--t-text)" }}>Select Organisation</h1>
          <p style={{ margin: 0, color: "var(--t-text-dim)", fontSize: "14px" }}>
            {orgs.length} organisation{orgs.length !== 1 ? "s" : ""} registered
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: "380px", marginBottom: "28px" }}>
          <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} size={14} />
          <input
            type="text"
            placeholder="Search organisations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px", border: "1px solid var(--t-border-strong)", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}
          />
        </div>

        {/* Card grid */}
        {loading ? (
          <p style={{ color: "var(--t-text-dim)", fontSize: "14px" }}>Loading...</p>
        ) : loadError ? (
          <p style={{ color: "var(--t-error)", fontSize: "14px" }}>{loadError}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--t-text-dim)", fontSize: "14px" }}>No organisations found.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filtered.map((org) => {
              const sub = org.subscription ?? { status: "trialing" as const, plan: "bundle" };
              const status = STATUS_COLORS[sub.status] ?? STATUS_COLORS.trialing;
              const dateLabel =
                sub.status === "trialing" && sub.trialEndsAt
                  ? `Trial ends ${new Date(sub.trialEndsAt).toLocaleDateString()}`
                  : sub.currentPeriodEnd
                  ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                  : null;

              return (
                <div
                  key={org._id}
                  style={{ background: "var(--t-surface)", borderRadius: "12px", border: "1px solid var(--t-border)", padding: "20px 22px", boxShadow: "var(--t-shadow)", display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--t-text-secondary)" }}>{org.name}</div>
                      <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "2px" }}>{org.email}</div>
                    </div>
                    <span style={{ background: status.bg, color: status.color, padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--t-text-dim)" }}>
                    <span>Plan: <strong style={{ color: "var(--t-text-muted)" }}>{sub.plan}</strong></span>
                    {dateLabel && <span>{dateLabel}</span>}
                    <span>Joined {new Date(org.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Enter button */}
                  <button
                    onClick={() => handleEnter(org)}
                    disabled={entering === org._id}
                    style={{ marginTop: "4px", padding: "9px 0", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: entering === org._id ? "not-allowed" : "pointer", opacity: entering === org._id ? 0.7 : 1 }}
                  >
                    {entering === org._id ? "Entering..." : "Enter →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgSelector;
