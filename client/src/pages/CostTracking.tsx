import React, { useState, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


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
      setSummary(s?.totals ? s : null);
      setTrend(Array.isArray(t) && t.length > 0 ? t : []);
      setByCategory(Array.isArray(c) && c.length > 0 ? c : []);
      setVehicles(Array.isArray(v) && v.length > 0 ? v : []);
    } catch (err) {
      console.error(err);
      setSummary(null);
      setTrend([]);
      setByCategory([]);
      setVehicles([]);
    } finally { setLoading(false); }
  }, [dateFrom, dateTo, selectedVehicle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = () => {
    exportCostData();
  };

  const exportCostData = async () => {
    const workbook = new ExcelJS.Workbook();

    if (activeTab === "overview") {
      const rows = summary?.rows || [];
      if (!rows.length) { alert("No overview data to export."); return; }
      const worksheet = workbook.addWorksheet("Cost Overview");
      worksheet.columns = [
        { header: "Vehicle", key: "vehicle" },
        { header: "Maintenance Cost ($)", key: "maintenanceCost" },
        { header: "Fuel Cost ($)", key: "fuelCost" },
        { header: "Total Cost ($)", key: "totalCost" },
        { header: "Jobs", key: "jobCount" },
        { header: "Litres Consumed", key: "litres" },
      ];
      worksheet.addRows(rows.map((r: any) => ({
        vehicle: r.vehicle ? `${r.vehicle.unitNumber} ${r.vehicle.make} ${r.vehicle.model}`.trim() : "",
        maintenanceCost: r.maintenanceCost?.toFixed(2) || "0.00",
        fuelCost: r.fuelCost?.toFixed(2) || "0.00",
        totalCost: r.totalCost?.toFixed(2) || "0.00",
        jobCount: r.jobCount || 0,
        litres: r.litres?.toFixed(1) || "0.0",
      })));
    } else if (activeTab === "trends") {
      if (!trend.length) { alert("No trend data to export."); return; }
      const worksheet = workbook.addWorksheet("Cost Trends");
      worksheet.columns = [
        { header: "Month", key: "label" },
        { header: "Maintenance Cost ($)", key: "maintenanceCost" },
        { header: "Fuel Cost ($)", key: "fuelCost" },
        { header: "Total Cost ($)", key: "totalCost" },
        { header: "Jobs", key: "jobCount" },
      ];
      worksheet.addRows(trend.map((t: any) => ({
        label: t.label || "",
        maintenanceCost: t.maintenanceCost?.toFixed(2) || "0.00",
        fuelCost: t.fuelCost?.toFixed(2) || "0.00",
        totalCost: t.totalCost?.toFixed(2) || "0.00",
        jobCount: t.jobCount || 0,
      })));
    } else {
      if (!byCategory.length) { alert("No category data to export."); return; }
      const TYPE_LABELS_LOCAL: Record<string, string> = {
        preventive: "Preventive", corrective: "Corrective", inspection: "Inspection",
        tire: "Tire", oil_change: "Oil Change", other: "Other",
      };
      const worksheet = workbook.addWorksheet("Cost By Category");
      worksheet.columns = [
        { header: "Category", key: "category" },
        { header: "Total Cost ($)", key: "totalCost" },
        { header: "Count", key: "count" },
      ];
      worksheet.addRows(byCategory.map((c: any) => ({
        category: TYPE_LABELS_LOCAL[c._id] || c._id || "",
        totalCost: c.totalCost?.toFixed(2) || "0.00",
        count: c.count || 0,
      })));
    }

    const fileNames: Record<string, string> = {
      overview: "cost_overview_export.xlsx",
      trends: "cost_trends_export.xlsx",
      category: "cost_category_export.xlsx",
    };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileNames[activeTab];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="var(--t-border)" strokeWidth={1} />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--t-text-faint)">
                  ${((f * maxCost) / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}
          {/* Month labels */}
          {trend.map((t, i) => (
            <text key={i} x={toX(i)} y={chartH - 6} textAnchor="middle" fontSize={10} fill="var(--t-text-dim)" style={{ fill: "var(--t-text-dim)" }}>{t.label}</text>
          ))}
          {/* Lines */}
          <polyline points={mPoints} fill="none" stroke="var(--t-accent)" strokeWidth={2.5} strokeLinejoin="round" />
          <polyline points={fPoints} fill="none" stroke="var(--t-info)" strokeWidth={2.5} strokeLinejoin="round" />
          {/* Dots */}
          {trend.map((t, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(t.maintenanceCost)} r={4} fill="var(--t-accent)" />
              <circle cx={toX(i)} cy={toY(t.fuelCost)} r={4} fill="var(--t-info)" />
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", gap: "20px", marginTop: "8px", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--t-text-muted)" }}>
            <div style={{ width: "14px", height: "3px", background: "var(--t-accent)", borderRadius: "2px" }} /> Maintenance
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--t-text-muted)" }}>
            <div style={{ width: "14px", height: "3px", background: "var(--t-info)", borderRadius: "2px" }} /> Fuel
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
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <span>FLEET OPERATIONS</span>
          <span style={{ color: "var(--t-text-ghost)" }}>›</span>
          <span style={{ color: "var(--t-text-faint)" }}>COST TRACKING</span>
        </div>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Cost Tracking</h1>
            <p style={styles.pageDescription}>Fleet-wide cost analysis across fuel and maintenance.</p>
          </div>
        </div>

        {/* Filters */}
        {(() => {
          const today = new Date(); today.setHours(23, 59, 59, 999);
          const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
          const to = dateTo ? new Date(dateTo + "T00:00:00") : null;
          const fromAfterTo = from && to && from > to;
          const toInFuture = to && to > today;
          const rangeYears = from && to ? (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
          const rangeTooLarge = rangeYears > 2;
          const hasError = !!(fromAfterTo || rangeTooLarge);
          return (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ ...styles.filtersRow, marginBottom: (fromAfterTo || toInFuture || rangeTooLarge) ? "8px" : "0" }}>
                <select style={styles.select} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>)}
                </select>
                <input
                  type="date"
                  style={{ ...styles.dateInput, ...(fromAfterTo || rangeTooLarge ? { borderColor: "var(--t-error)" } : {}) }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span style={{ color: "var(--t-text-faint)", fontSize: "14px" }}>to</span>
                <input
                  type="date"
                  style={{ ...styles.dateInput, ...(fromAfterTo || rangeTooLarge ? { borderColor: "var(--t-error)" } : toInFuture ? { borderColor: "var(--t-warning)" } : {}) }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <button style={{ ...styles.filterBtn, ...(hasError ? { opacity: 0.5, cursor: "not-allowed" } : {}) }} onClick={() => { if (!hasError) fetchAll(); }}>Apply</button>
                <button style={{ ...styles.filterBtn, background: "var(--t-hover-bg)", color: "var(--t-text-secondary)", border: "1px solid var(--t-border)" }} onClick={handleExport}>Export</button>
              </div>
              {fromAfterTo && <p style={{ margin: 0, fontSize: "12px", color: "var(--t-error)", fontWeight: 500 }}>⚠ "From" date cannot be after "To" date.</p>}
              {!fromAfterTo && rangeTooLarge && <p style={{ margin: 0, fontSize: "12px", color: "var(--t-error)", fontWeight: 500 }}>⚠ Date range cannot exceed 2 years.</p>}
              {!fromAfterTo && !rangeTooLarge && toInFuture && <p style={{ margin: 0, fontSize: "12px", color: "var(--t-warning)", fontWeight: 500 }}>⚠ "To" date is in the future — results will include all data up to today.</p>}
            </div>
          );
        })()}

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
                      <span style={{ color: "var(--t-text-faint)", marginLeft: "8px", fontSize: "13px" }}>{row.vehicle?.make} {row.vehicle?.model}</span>
                    </td>
                    <td style={styles.td}>${row.maintenanceCost.toFixed(2)}</td>
                    <td style={styles.td}>${row.fuelCost.toFixed(2)}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "var(--t-indigo)" }}>${row.totalCost.toFixed(2)}</td>
                    <td style={styles.td}>{row.jobCount}</td>
                    <td style={styles.td}>{row.litres.toFixed(1)} L</td>
                  </tr>
                ))}
                {(!summary?.rows || summary.rows.length === 0) && (
                  <tr><td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "var(--t-text-dim)", padding: "40px" }}>No cost data for selected period.</td></tr>
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
                        <span style={{ color: "var(--t-text-faint)" }}>${c.totalCost.toFixed(2)} · {c.count} job{c.count !== 1 ? "s" : ""} · {pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ background: "var(--t-border)", borderRadius: "100px", height: "8px" }}>
                        <div style={{ background: "var(--t-accent)", borderRadius: "100px", height: "8px", width: `${pct}%`, transition: "width 0.4s" }} />
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
  wrapper: { minHeight: "100vh", background: "var(--t-bg)", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" },
  breadcrumb: { fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" },
  pageDescription: { margin: 0, fontSize: "14px", color: "var(--t-text-dim)" },
  filtersRow: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" },
  select: { padding: "9px 14px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-select-bg)", color: "var(--t-text-secondary)" },
  dateInput: { padding: "9px 12px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" },
  filterBtn: { padding: "9px 18px", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "var(--t-surface)", borderRadius: "12px", padding: "20px", border: "1px solid var(--t-border)", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.3)" },
  statValue: { fontSize: "24px", fontWeight: 800, color: "var(--t-indigo)" },
  statLabel: { fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--t-border)", paddingBottom: "0" },
  tab: { padding: "10px 20px", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--t-text-dim)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "-1px" },
  activeTab: { color: "var(--t-indigo)", borderBottom: "2px solid var(--t-indigo)" },
  tableWrapper: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", overflowX: "auto", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  card: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "12px 16px", textAlign: "left", background: "var(--t-surface-alt)", borderBottom: "1px solid var(--t-border)", fontWeight: 700, color: "var(--t-indigo)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  emptyState: { textAlign: "center", padding: "60px 0", color: "var(--t-text-dim)", fontSize: "15px" },
};

export default CostTracking;
