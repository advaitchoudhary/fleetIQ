import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHistory, FaSearch, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: "#dcfce7", color: "#166534" },
  processing: { bg: "#dbeafe", color: "#1d4ed8" },
  pending: { bg: "#fef9c3", color: "#854d0e" },
  failed: { bg: "#fee2e2", color: "#991b1b" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid: <FaCheckCircle size={12} />,
  processing: <FaClock size={12} />,
  pending: <FaClock size={12} />,
  failed: <FaTimesCircle size={12} />,
};

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
        setPayments(payRes.data);
        setDrivers(drvRes.data);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaHistory style={{ color: "#4F46E5" }} /> Payment History
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>All driver payouts</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Payouts", value: payments.length, color: "#4F46E5" },
            { label: "Total Paid", value: `$${totalPaid.toFixed(2)}`, color: "#16a34a" },
            { label: "Paid", value: payments.filter((p) => p.status === "paid").length, color: "#16a34a" },
            { label: "Failed", value: totalFailed, color: "#dc2626" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
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
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading payment history...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
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
                      <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>{driverName}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: p.status === "paid" ? "#16a34a" : "#374151" }}>
                        ${amountCad.toFixed(2)} CAD
                      </td>
                      <td style={styles.td}>
                        {p.periodFrom && p.periodTo
                          ? `${new Date(p.periodFrom).toLocaleDateString()} — ${new Date(p.periodTo).toLocaleDateString()}`
                          : "—"}
                      </td>
                      <td style={styles.td}>{p.timesheetIds?.length || 0}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          {STATUS_ICONS[p.status]} {p.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "12px", color: "#6b7280" }}>
                        {p.stripeTransferId ? (
                          <span title={p.stripeTransferId}>
                            {p.stripeTransferId.slice(0, 20)}...
                          </span>
                        ) : (
                          p.failureReason ? (
                            <span style={{ color: "#dc2626" }}>{p.failureReason.slice(0, 30)}</span>
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
  statCard: { background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  tableContainer: { background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  tableHeaderRow: { background: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "14px 16px", color: "#374151", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" },
};

export default PaymentHistory;
