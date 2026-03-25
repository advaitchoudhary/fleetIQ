import React, { useState, useEffect, useCallback } from "react";
import { FaChartBar } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEMO_VEHICLES_COST = [
  { _id: "demo-v1", unitNumber: "U-101", make: "Kenworth", model: "T680" },
  { _id: "demo-v2", unitNumber: "U-102", make: "Freightliner", model: "Cascadia" },
  { _id: "demo-v3", unitNumber: "U-103", make: "Ford", model: "Transit 350" },
  { _id: "demo-v5", unitNumber: "U-105", make: "Ram", model: "1500 Classic" },
];

const DEMO_SUMMARY = {
  vehicleCount: 4,
  totals: { maintenanceCost: 1615, fuelCost: 3426.60, totalCost: 5041.60 },
  rows: [
    { vehicleId: "demo-v1", vehicle: { unitNumber: "U-101", make: "Kenworth", model: "T680" },    maintenanceCost: 1065, fuelCost: 1917.70, totalCost: 2982.70, jobCount: 3, litres: 1255.0 },
    { vehicleId: "demo-v2", vehicle: { unitNumber: "U-102", make: "Freightliner", model: "Cascadia" }, maintenanceCost: 540,  fuelCost: 1199.41, totalCost: 1739.41, jobCount: 2, litres: 795.0  },
    { vehicleId: "demo-v3", vehicle: { unitNumber: "U-103", make: "Ford", model: "Transit 350" },  maintenanceCost: 0,    fuelCost: 187.56,  totalCost: 187.56,  jobCount: 0, litres: 112.0  },
    { vehicleId: "demo-v5", vehicle: { unitNumber: "U-105", make: "Ram", model: "1500 Classic" },  maintenanceCost: 10,   fuelCost: 122.33,  totalCost: 132.33,  jobCount: 1, litres: 72.0   },
  ],
};

const DEMO_TREND = [
  { label: "Oct",  maintenanceCost: 320,  fuelCost: 1240.50, totalCost: 1560.50, jobCount: 2 },
  { label: "Nov",  maintenanceCost: 0,    fuelCost: 980.20,  totalCost: 980.20,  jobCount: 0 },
  { label: "Dec",  maintenanceCost: 185,  fuelCost: 1105.80, totalCost: 1290.80, jobCount: 1 },
  { label: "Jan",  maintenanceCost: 505,  fuelCost: 1380.00, totalCost: 1885.00, jobCount: 3 },
  { label: "Feb",  maintenanceCost: 185,  fuelCost: 1460.75, totalCost: 1645.75, jobCount: 2 },
  { label: "Mar",  maintenanceCost: 1065, fuelCost: 1610.40, totalCost: 2675.40, jobCount: 4 },
];

const DEMO_BY_CATEGORY = [
  { _id: "oil_change",  totalCost: 185,  count: 1 },
  { _id: "corrective",  totalCost: 540,  count: 1 },
  { _id: "preventive",  totalCost: 640,  count: 2 },
  { _id: "inspection",  totalCost: 250,  count: 1 },
];

const CostTracking: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "category">("overview");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0, 10); });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      if (selectedVehicle) params.append("vehicleId", selectedVehicle);

      const [summaryRes, trendRes, catRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/costs/summary?${params}`, { headers: headers as Record<string, string> }),
        fetch(`${API_BASE_URL}/costs/trend?${new URLSearchParams({ ...(selectedVehicle ? { vehicleId: selectedVehicle } : {}), months: "6" })}`, { headers: headers as Record<string, string> }),
        fetch(`${API_BASE_URL}/costs/by-category?${params}`, { headers: headers as Record<string, string> }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: headers as Record<string, string> }),
      ]);
      if (!summaryRes.ok || !trendRes.ok || !catRes.ok || !vehiclesRes.ok) {
        throw new Error(`HTTP error fetching cost data`);
      }
      const [s, t, c, v] = await Promise.all([summaryRes.json(), trendRes.json(), catRes.json(), vehiclesRes.json()]);
      setSummary(s?.totals ? s : DEMO_SUMMARY);
      setTrend(Array.isArray(t) && t.length > 0 ? t : DEMO_TREND);
      setByCategory(Array.isArray(c) && c.length > 0 ? c : DEMO_BY_CATEGORY);
      setVehicles(Array.isArray(v) && v.length > 0 ? v : DEMO_VEHICLES_COST);
    } catch (err) {
      console.error(err);
      setSummary(DEMO_SUMMARY);
      setTrend(DEMO_TREND);
      setByCategory(DEMO_BY_CATEGORY);
      setVehicles(DEMO_VEHICLES_COST);
    } finally { setLoading(false); }
  }, [dateFrom, dateTo, selectedVehicle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // SVG trend chart
  const TrendChart = () => {
    if (!trend.length) return <div style={styles.emptyState}>No trend data</div>;
    const chartW = 600, chartH = 180, padL = 50, padB = 30, padT = 10, padR = 20;
    const innerW = chartW - padL - padR;
    const innerH = chartH - padB - padT;
    const maxCost = Math.max(...trend.map((t) => t.totalCost), 1);

    const toX = (i: number) => padL + (i / (trend.length - 1 || 1)) * innerW;
    const toY = (val: number) => padT + innerH - (val / maxCost) * innerH;

    const mPoints = trend.map((t, i) => `${toX(i)},${toY(t.maintenanceCost)}`).join(" ");
    const fPoints = trend.map((t, i) => `${toX(i)},${toY(t.fuelCost)}`).join(" ");

    return (
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", maxWidth: chartW, height: chartH }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = padT + innerH - f * innerH;
            return (
              <g key={f}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                  ${((f * maxCost) / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}
          {/* Month labels */}
          {trend.map((t, i) => (
            <text key={i} x={toX(i)} y={chartH - 6} textAnchor="middle" fontSize={10} fill="#6b7280" style={{ fill: "#6b7280" }}>{t.label}</text>
          ))}
          {/* Lines */}
          <polyline points={mPoints} fill="none" stroke="#4F46E5" strokeWidth={2.5} strokeLinejoin="round" />
          <polyline points={fPoints} fill="none" stroke="#0891b2" strokeWidth={2.5} strokeLinejoin="round" />
          {/* Dots */}
          {trend.map((t, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(t.maintenanceCost)} r={4} fill="#4F46E5" />
              <circle cx={toX(i)} cy={toY(t.fuelCost)} r={4} fill="#0891b2" />
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", gap: "20px", marginTop: "8px", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#d1d5db" }}>
            <div style={{ width: "14px", height: "3px", background: "#4F46E5", borderRadius: "2px" }} /> Maintenance
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#d1d5db" }}>
            <div style={{ width: "14px", height: "3px", background: "#0891b2", borderRadius: "2px" }} /> Fuel
          </div>
        </div>
      </div>
    );
  };

  const TYPE_LABELS: Record<string, string> = {
    preventive: "Preventive", corrective: "Corrective", inspection: "Inspection",
    tire: "Tire", oil_change: "Oil Change", other: "Other",
  };

  return (
    <div style={styles.wrapper}>
      <Navbar />
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FaChartBar size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Cost Tracking</h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Fleet-wide cost analysis across fuel and maintenance</p>
          </div>
        </div>
      </div>
      <div style={styles.container}>

        {/* Filters */}
        <div style={styles.filtersRow}>
          <select style={styles.select} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
            <option value="">All Vehicles</option>
            {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>)}
          </select>
          <input type="date" style={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: "#9ca3af", fontSize: "14px" }}>to</span>
          <input type="date" style={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button style={styles.filterBtn} onClick={fetchAll}>Apply</button>
        </div>

        {/* Stats */}
        {summary?.totals && (
          <div style={styles.statsRow}>
            {[
              { label: "Total Spend", value: `$${summary.totals.totalCost.toFixed(2)}` },
              { label: "Maintenance Cost", value: `$${summary.totals.maintenanceCost.toFixed(2)}` },
              { label: "Fuel Cost", value: `$${summary.totals.fuelCost.toFixed(2)}` },
              { label: "Vehicles Tracked", value: summary.vehicleCount },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <div style={styles.statValue}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabRow}>
          {([["overview", "Fleet Overview"], ["trends", "Cost Trends"], ["category", "By Category"]] as const).map(([key, label]) => (
            <button key={key} style={{ ...styles.tab, ...(activeTab === key ? styles.activeTab : {}) }} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : activeTab === "overview" ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Vehicle", "Maintenance Cost", "Fuel Cost", "Total Cost", "Jobs", "Litres Consumed"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary?.rows || []).map((row: any) => (
                  <tr key={row.vehicleId} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{row.vehicle?.unitNumber || "—"}</strong>
                      <span style={{ color: "#9ca3af", marginLeft: "8px", fontSize: "13px" }}>{row.vehicle?.make} {row.vehicle?.model}</span>
                    </td>
                    <td style={styles.td}>${row.maintenanceCost.toFixed(2)}</td>
                    <td style={styles.td}>${row.fuelCost.toFixed(2)}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#818CF8" }}>${row.totalCost.toFixed(2)}</td>
                    <td style={styles.td}>{row.jobCount}</td>
                    <td style={styles.td}>{row.litres.toFixed(1)} L</td>
                  </tr>
                ))}
                {(!summary?.rows || summary.rows.length === 0) && (
                  <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#6b7280", padding: "40px" }}>No cost data for selected period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === "trends" ? (
          <div style={styles.card}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", marginTop: 0 }}>Cost Trend — Last 6 Months</h3>
            <TrendChart />
            <div style={{ marginTop: "24px" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Month", "Maintenance", "Fuel", "Total", "Jobs"].map((h) => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{t.label}</td>
                      <td style={styles.td}>${t.maintenanceCost.toFixed(2)}</td>
                      <td style={styles.td}>${t.fuelCost.toFixed(2)}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>${t.totalCost.toFixed(2)}</td>
                      <td style={styles.td}>{t.jobCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", marginTop: 0 }}>Maintenance Cost by Category</h3>
            {byCategory.length === 0 ? (
              <div style={styles.emptyState}>No maintenance cost data for this period.</div>
            ) : (
              <>
                {byCategory.map((c) => {
                  const total = byCategory.reduce((s, x) => s + x.totalCost, 0);
                  const pct = total > 0 ? (c.totalCost / total) * 100 : 0;
                  return (
                    <div key={c._id} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
                        <span style={{ fontWeight: 600 }}>{TYPE_LABELS[c._id] || c._id}</span>
                        <span style={{ color: "#9ca3af" }}>${c.totalCost.toFixed(2)} · {c.count} job{c.count !== 1 ? "s" : ""} · {pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "100px", height: "8px" }}>
                        <div style={{ background: "#4F46E5", borderRadius: "100px", height: "8px", width: `${pct}%`, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#0d1117", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" },
  filtersRow: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" },
  select: { padding: "9px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "#1c2128", color: "#e5e7eb" },
  dateInput: { padding: "9px 12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "rgba(255,255,255,0.05)", color: "#e5e7eb" },
  filterBtn: { padding: "9px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#161b22", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  statValue: { fontSize: "24px", fontWeight: 800, color: "#818CF8" },
  statLabel: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0" },
  tab: { padding: "10px 20px", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#6b7280", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "-1px" },
  activeTab: { color: "#818CF8", borderBottom: "2px solid #818CF8" },
  tableWrapper: { background: "#161b22", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", overflowX: "auto", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  card: { background: "#161b22", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "12px 16px", textAlign: "left", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, color: "#818CF8", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.05)" },
  td: { padding: "14px 16px", color: "#d1d5db", verticalAlign: "middle" },
  emptyState: { textAlign: "center", padding: "60px 0", color: "#6b7280", fontSize: "15px" },
};

export default CostTracking;
