import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import {
  FaDollarSign, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
  FaChevronDown, FaChevronUp, FaFileInvoiceDollar, FaCalendarAlt,
} from "react-icons/fa";

interface Timesheet {
  _id: string;
  date: string;
  customer: string;
  category: string;
  totalHours: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: "paid" | "processing" | "pending" | "failed";
  periodFrom: string;
  periodTo: string;
  paidAt: string;
  createdAt: string;
  stripeTransferId: string;
  failureReason: string;
  notes: string;
  timesheetIds: Timesheet[];
}

const STATUS_CONFIG = {
  paid:       { label: "Paid",       color: "var(--t-success)", bg: "var(--t-success-bg)", icon: <FaCheckCircle size={11} /> },
  processing: { label: "Processing", color: "#0891b2",          bg: "#e0f2fe",             icon: <FaHourglassHalf size={11} /> },
  pending:    { label: "Pending",    color: "var(--t-warning)", bg: "var(--t-warning-bg)", icon: <FaHourglassHalf size={11} /> },
  failed:     { label: "Failed",     color: "var(--t-error)",   bg: "var(--t-error-bg)",   icon: <FaTimesCircle size={11} /> },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function fmtPeriod(from: string, to: string) {
  if (!from && !to) return "—";
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

const DriverPayStubs: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/payments/my-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const totalPaid   = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalCount  = payments.filter((p) => p.status === "paid").length;
  const lastPayment = payments.find((p) => p.status === "paid");

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <style>{`
        [data-ps-row] { transition: background 0.15s; cursor: pointer; }
        [data-ps-row]:hover { background: var(--t-hover-bg) !important; }
        [data-ps-pill]:hover { opacity: 0.85; }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          PAY STUBS
        </div>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
            Pay Stubs
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
            Your complete payment history and earnings breakdown.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {[
            {
              label: "Total Earned",
              value: fmt(totalPaid),
              sub: "all time",
              color: "var(--t-success)",
              icon: <FaDollarSign size={16} />,
            },
            {
              label: "Payments Received",
              value: String(totalCount),
              sub: "completed",
              color: "var(--t-accent)",
              icon: <FaCheckCircle size={16} />,
            },
            {
              label: "Last Payment",
              value: lastPayment ? fmt(lastPayment.amount) : "—",
              sub: lastPayment ? fmtDate(lastPayment.paidAt || lastPayment.createdAt) : "none yet",
              color: "var(--t-warning)",
              icon: <FaCalendarAlt size={16} />,
            },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", textTransform: "uppercase" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--t-text)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "var(--t-text-dim)", marginTop: "4px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {(["all", "paid", "pending", "failed"] as const).map((f) => {
            const count = f === "all" ? payments.length : payments.filter((p) => p.status === f).length;
            return (
              <button
                key={f}
                data-ps-pill
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: "20px", fontSize: "13px",
                  fontWeight: filter === f ? 700 : 500, cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  background: filter === f ? "var(--t-accent)" : "var(--t-hover-bg)",
                  color: filter === f ? "#fff" : "var(--t-text-dim)",
                  border: filter === f ? "none" : "1px solid var(--t-border)",
                  transition: "opacity 0.15s",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Payment list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--t-text-faint)", fontSize: "14px" }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px" }}>
            <FaFileInvoiceDollar size={40} style={{ color: "var(--t-text-ghost)", marginBottom: "16px" }} />
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "var(--t-text-dim)" }}>No payments yet</p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-ghost)" }}>Payments will appear here once your admin processes a payout.</p>
          </div>
        ) : (
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--t-shadow)" }}>
            {displayed.map((p, i) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              const isOpen = expanded === p._id;
              const timesheets = Array.isArray(p.timesheetIds) ? p.timesheetIds.filter((t) => typeof t === "object") as Timesheet[] : [];

              return (
                <div key={p._id}>
                  {/* Row */}
                  <div
                    data-ps-row
                    onClick={() => toggle(p._id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "16px",
                      padding: "18px 24px",
                      borderBottom: (isOpen || i < displayed.length - 1) ? "1px solid var(--t-border)" : "none",
                      background: isOpen ? "var(--t-hover-bg)" : "transparent",
                    }}
                  >
                    {/* Amount + period */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>{fmt(p.amount)}</span>
                        <span style={{ fontSize: "11px", color: "var(--t-text-ghost)", fontWeight: 500 }}>CAD</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px", color: cfg.color, background: cfg.bg }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--t-text-dim)" }}>
                        {p.periodFrom || p.periodTo ? fmtPeriod(p.periodFrom, p.periodTo) : fmtDate(p.createdAt)}
                        {timesheets.length > 0 && (
                          <span style={{ marginLeft: "10px", fontSize: "12px", color: "var(--t-text-ghost)" }}>
                            · {timesheets.length} timesheet{timesheets.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Paid date */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginBottom: "2px" }}>
                        {p.status === "paid" ? "Paid on" : "Created"}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text-dim)" }}>
                        {fmtDate(p.status === "paid" ? p.paidAt : p.createdAt)}
                      </div>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: "var(--t-text-ghost)", flexShrink: 0 }}>
                      {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ padding: "20px 24px", borderBottom: i < displayed.length - 1 ? "1px solid var(--t-border)" : "none", background: "var(--t-surface-alt)" }}>
                      {/* Meta row */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: timesheets.length > 0 ? "20px" : "0" }}>
                        {[
                          { label: "Payment ID", value: p._id.slice(-8).toUpperCase() },
                          { label: "Currency",   value: (p.currency || "CAD").toUpperCase() },
                          { label: "Period",     value: fmtPeriod(p.periodFrom, p.periodTo) },
                          ...(p.stripeTransferId ? [{ label: "Transfer Ref", value: p.stripeTransferId.slice(0, 20) + "…" }] : []),
                          ...(p.failureReason    ? [{ label: "Failure Reason", value: p.failureReason }] : []),
                          ...(p.notes           ? [{ label: "Notes",         value: p.notes }] : []),
                        ].map((m) => (
                          <div key={m.label}>
                            <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>{m.label}</div>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--t-text-secondary)", wordBreak: "break-all" }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Timesheets breakdown */}
                      {timesheets.length > 0 && (
                        <>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                            Timesheets Included
                          </div>
                          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "10px", overflow: "hidden" }}>
                            {timesheets.map((ts, ti) => (
                              <div
                                key={ts._id}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "10px 16px",
                                  borderBottom: ti < timesheets.length - 1 ? "1px solid var(--t-border)" : "none",
                                  fontSize: "13px",
                                }}
                              >
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                  <span style={{ fontWeight: 600, color: "var(--t-text)" }}>
                                    {ts.date ? new Date(ts.date.slice(0, 10) + "T00:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : "—"}
                                  </span>
                                  <span style={{ color: "var(--t-text-dim)" }}>{ts.customer || "—"}</span>
                                  {ts.category && (
                                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: "var(--t-indigo-bg)", color: "var(--t-accent)" }}>{ts.category}</span>
                                  )}
                                </div>
                                <span style={{ color: "var(--t-text-ghost)", fontWeight: 500 }}>{ts.totalHours || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPayStubs;
