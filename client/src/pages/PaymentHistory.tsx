import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHistory, FaSearch, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: "var(--t-success-bg)", color: "var(--t-success)" },
  processing: { bg: "var(--t-info-bg)", color: "var(--t-info)" },
  pending: { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
  failed: { bg: "var(--t-error-bg)", color: "var(--t-error)" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid: <FaCheckCircle size={12} />,
  processing: <FaClock size={12} />,
  pending: <FaClock size={12} />,
  failed: <FaTimesCircle size={12} />,
};

const DEMO_DRIVERS_PH = [
  { _id: "demo-d1", name: "Marcus Webb" },
  { _id: "demo-d3", name: "Tyler Osei" },
  { _id: "demo-d5", name: "James Kowalski" },
  { _id: "demo-d2", name: "Priya Sehgal" },
];

const DEMO_PAYMENTS = [
  { _id: "demo-pay1", driverId: { _id: "demo-d1", name: "Marcus Webb" },   amount: 243000, status: "paid",       periodFrom: "2026-03-01", periodTo: "2026-03-15", timesheetIds: ["ts1","ts2","ts3"], stripeTransferId: "tr_3Px1Demo1MarcusWebb001", createdAt: "2026-03-17T14:32:00Z" },
  { _id: "demo-pay2", driverId: { _id: "demo-d3", name: "Tyler Osei" },    amount: 285000, status: "paid",       periodFrom: "2026-03-01", periodTo: "2026-03-15", timesheetIds: ["ts4","ts5","ts6"], stripeTransferId: "tr_3Px2Demo2TylerOsei0001", createdAt: "2026-03-17T14:45:00Z" },
  { _id: "demo-pay3", driverId: { _id: "demo-d5", name: "James Kowalski" }, amount: 265000, status: "paid",       periodFrom: "2026-03-01", periodTo: "2026-03-15", timesheetIds: ["ts7","ts8"],       stripeTransferId: "tr_3Px3Demo3JamesKowal001", createdAt: "2026-03-17T15:10:00Z" },
  { _id: "demo-pay4", driverId: { _id: "demo-d2", name: "Priya Sehgal" },  amount: 190000, status: "failed",     periodFrom: "2026-03-01", periodTo: "2026-03-15", timesheetIds: ["ts9"],             stripeTransferId: null, failureReason: "Bank account not linked — Stripe onboarding incomplete.", createdAt: "2026-03-17T15:22:00Z" },
  { _id: "demo-pay5", driverId: { _id: "demo-d1", name: "Marcus Webb" },   amount: 220000, status: "paid",       periodFrom: "2026-02-14", periodTo: "2026-02-28", timesheetIds: ["ts10","ts11"],     stripeTransferId: "tr_3Px4Demo4MarcusWebb002", createdAt: "2026-03-01T09:15:00Z" },
  { _id: "demo-pay6", driverId: { _id: "demo-d3", name: "Tyler Osei" },    amount: 230000, status: "paid",       periodFrom: "2026-02-14", periodTo: "2026-02-28", timesheetIds: ["ts12","ts13"],     stripeTransferId: "tr_3Px5Demo5TylerOsei0002", createdAt: "2026-03-01T09:30:00Z" },
  { _id: "demo-pay7", driverId: { _id: "demo-d5", name: "James Kowalski" }, amount: 215000, status: "processing", periodFrom: "2026-03-16", periodTo: "2026-03-31", timesheetIds: ["ts14","ts15"],     stripeTransferId: null, createdAt: "2026-04-01T10:05:00Z" },
  { _id: "demo-pay8", driverId: { _id: "demo-d1", name: "Marcus Webb" },   amount: 270000, status: "paid",       periodFrom: "2026-02-01", periodTo: "2026-02-13", timesheetIds: ["ts16","ts17","ts18"], stripeTransferId: "tr_3Px6Demo6MarcusWebb003", createdAt: "2026-02-14T08:50:00Z" },
];

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [payRes, drvRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/payments`, { headers }),
          axios.get(`${API_BASE_URL}/drivers`, { headers }),
        ]);
        setPayments(payRes.data.length > 0 ? payRes.data : DEMO_PAYMENTS);
        setDrivers(drvRes.data.length > 0 ? drvRes.data : DEMO_DRIVERS_PH);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
        setPayments(DEMO_PAYMENTS);
        setDrivers(DEMO_DRIVERS_PH);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const driverMap: Record<string, string> = {};
  drivers.forEach((d) => { driverMap[d._id] = d.name; });

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
  const totalFailed = payments.filter((p) => p.status === "failed").length;

  const filtered = payments.filter((p) => {
    const driverName = p.driverId?.name || driverMap[p.driverId] || "";
    const q = searchText.toLowerCase();
    const matchSearch = driverName.toLowerCase().includes(q) || p.stripeTransferId?.toLowerCase().includes(q);
    const matchDriver = filterDriver === "all" || (p.driverId?._id || p.driverId) === filterDriver;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchDriver && matchStatus;
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "var(--t-text)", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaHistory style={{ color: "var(--t-indigo)" }} /> Payment History
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--t-text-dim)", fontSize: "14px" }}>All driver payouts</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Payouts", value: payments.length, color: "var(--t-indigo)" },
            { label: "Total Paid", value: `$${totalPaid.toFixed(2)}`, color: "var(--t-success)" },
            { label: "Paid", value: payments.filter((p) => p.status === "paid").length, color: "var(--t-success)" },
            { label: "Failed", value: totalFailed, color: "var(--t-error)" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
            <input
              placeholder="Search by driver or transfer ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ ...styles.input, paddingLeft: "36px" }}
            />
          </div>
          <select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} style={{ ...styles.input, maxWidth: "200px" }}>
            <option value="all">All Drivers</option>
            {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...styles.input, maxWidth: "150px" }}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>Loading payment history...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--t-text-dim)" }}>
              {payments.length === 0 ? "No payments yet. Initiate your first payout from the Driver Payments page." : "No payments match your filters."}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {["Date", "Driver", "Amount", "Period", "Timesheets", "Status", "Transfer ID"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                  const driverName = p.driverId?.name || driverMap[p.driverId?._id || p.driverId] || "—";
                  const amountCad = (p.amount || 0) / 100;
                  return (
                    <tr key={p._id} style={styles.tr}>
                      <td style={styles.td}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: "var(--t-text-secondary)" }}>{driverName}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: p.status === "paid" ? "var(--t-success)" : "var(--t-text-muted)" }}>
                        ${amountCad.toFixed(2)} CAD
                      </td>
                      <td style={styles.td}>
                        {p.periodFrom && p.periodTo
                          ? `${new Date(p.periodFrom).toLocaleDateString(undefined, { timeZone: "UTC" })} — ${new Date(p.periodTo).toLocaleDateString(undefined, { timeZone: "UTC" })}`
                          : "—"}
                      </td>
                      <td style={styles.td}>{p.timesheetIds?.length || 0}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          {STATUS_ICONS[p.status]} {p.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "12px", color: "var(--t-text-dim)" }}>
                        {p.stripeTransferId ? (
                          <span title={p.stripeTransferId}>
                            {p.stripeTransferId.slice(0, 20)}...
                          </span>
                        ) : (
                          p.failureReason ? (
                            <span style={{ color: "var(--t-error)" }}>{p.failureReason.slice(0, 30)}</span>
                          ) : "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  statCard: { background: "var(--t-surface)", borderRadius: "12px", border: "1px solid var(--t-border)", padding: "20px" },
  tableContainer: { background: "var(--t-surface)", borderRadius: "12px", border: "1px solid var(--t-border)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "var(--t-surface-alt)", borderBottom: "1px solid var(--t-border)" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid var(--t-stripe)" },
  td: { padding: "14px 16px", color: "var(--t-text-muted)", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--t-border-strong)", fontSize: "14px", color: "var(--t-text-secondary)", background: "var(--t-input-bg)", outline: "none", boxSizing: "border-box" as const },
};

export default PaymentHistory;
