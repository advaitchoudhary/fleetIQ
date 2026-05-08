import React from "react";

interface Props {
  data: any[];
}

const DriverStatsCards: React.FC<Props> = ({ data }) => {
  const totalFleet = data.length;
  const compliantCount = data.filter((d: any) => (d.status || "").toLowerCase() === "active").length;
  const today = new Date();
  const renewalCount = data.filter((d: any) => {
    if (!d.licence_expiry_date) return false;
    const exp = new Date(d.licence_expiry_date + "T00:00:00");
    const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 15;
  }).length;
  const avgHrs = totalFleet > 0 ? data.reduce((s: number, d: any) => s + parseFloat(d.hoursThisWeek || "0"), 0) / totalFleet : 0;
  const compliantPct = totalFleet > 0 ? (compliantCount / totalFleet) * 100 : 0;

  const statCards = [
    { icon: "👥", badge: null as string | null, label: "TOTAL FLEET", value: String(totalFleet), sub: "Active personnel across all regions", subColor: "var(--t-text-dim)", accentRgb: "79,70,229", progress: null as number | null },
    { icon: "✅", badge: null, label: "COMPLIANT", value: String(compliantCount), sub: null as string | null, subColor: "var(--t-text-dim)", accentRgb: "16,185,129", progress: compliantPct },
    { icon: "📋", badge: null, label: "LICENSE RENEWAL", value: String(renewalCount).padStart(2, "0"), sub: "Action required within 15 days", subColor: "var(--t-warning)", accentRgb: "245,158,11", progress: null },
    { icon: "⏱", badge: null, label: "AVG. WEEKLY HRS", value: avgHrs.toFixed(1), sub: "Optimal fatigue management score", subColor: "var(--t-text-dim)", accentRgb: "129,140,248", progress: null },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
      {statCards.map((c) => (
        <div key={c.label} style={{ background: "var(--t-surface)", borderRadius: "14px", border: "1px solid var(--t-hover-bg)", padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `rgba(${c.accentRgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
              {c.icon}
            </div>
            {c.badge && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-success)", background: "var(--t-success-bg)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "2px 8px" }}>{c.badge}</span>
            )}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "6px" }}>{c.label}</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px", marginBottom: "6px" }}>{c.value}</div>
          {c.progress !== null && (
            <div style={{ height: "3px", borderRadius: "3px", background: "var(--t-border)", marginBottom: "6px" }}>
              <div style={{ width: `${c.progress}%`, height: "100%", borderRadius: "3px", background: "var(--t-success)" }} />
            </div>
          )}
          {c.sub && (
            <div style={{ fontSize: "11px", color: c.subColor, fontWeight: 500 }}>{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DriverStatsCards;
