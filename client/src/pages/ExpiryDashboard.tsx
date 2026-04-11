import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format, differenceInCalendarDays } from "date-fns";
import {
  FaIdCard, FaShieldAlt, FaExclamationTriangle,
  FaCheckCircle, FaExclamationCircle, FaClock,
} from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const EXPIRY_WORK_STATUSES = new Set([
  "Work Permit",
  "Open Work Permit",
  "Post-Graduate Work Permit (PGWP)",
  "Bridging Open Work Permit (BOWP)",
  "Study Permit (Work Authorization)",
  "International Mobility Program (IMP)",
  "Seasonal Agricultural Worker Program",
]);

interface ExpiryItem {
  driverId: string;
  driverName: string;
  type: "Licence" | "Work Authorization";
  expiryDate: Date;
  daysLeft: number;
}

type Filter = "all" | "expired" | "critical" | "warning";

const getUrgency = (days: number) => {
  if (days < 0)   return { label: "EXPIRED",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"   };
  if (days <= 30) return { label: "CRITICAL",  color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  };
  if (days <= 90) return { label: "WARNING",   color: "#eab308", bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.3)"   };
  return           { label: "OK",          color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  };
};

const ExpiryDashboard: React.FC = () => {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const drivers: any[] = Array.isArray(res.data) ? res.data : [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const flat: ExpiryItem[] = [];

        drivers.forEach((d) => {
          if (d.licence_expiry_date) {
            const exp = new Date(d.licence_expiry_date); exp.setHours(0, 0, 0, 0);
            flat.push({ driverId: d._id, driverName: d.name, type: "Licence", expiryDate: exp, daysLeft: differenceInCalendarDays(exp, today) });
          }
          if (d.workAuthExpiry && EXPIRY_WORK_STATUSES.has(d.workStatus)) {
            const exp = new Date(d.workAuthExpiry); exp.setHours(0, 0, 0, 0);
            flat.push({ driverId: d._id, driverName: d.name, type: "Work Authorization", expiryDate: exp, daysLeft: differenceInCalendarDays(exp, today) });
          }
        });

        flat.sort((a, b) => a.daysLeft - b.daysLeft);
        setItems(flat);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    expired:  items.filter((i) => i.daysLeft < 0).length,
    critical: items.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 30).length,
    warning:  items.filter((i) => i.daysLeft > 30 && i.daysLeft <= 90).length,
    ok:       items.filter((i) => i.daysLeft > 90).length,
  }), [items]);

  const filtered = useMemo(() => {
    if (filter === "expired")  return items.filter((i) => i.daysLeft < 0);
    if (filter === "critical") return items.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 30);
    if (filter === "warning")  return items.filter((i) => i.daysLeft > 30 && i.daysLeft <= 90);
    return items;
  }, [items, filter]);

  const summaryCards = [
    {
      key: "expired"  as Filter,
      label: "Expired",
      count: counts.expired,
      icon: <FaExclamationCircle size={18} />,
      activeColor: "#ef4444",
      activeBg: "rgba(239,68,68,0.1)",
      activeBorder: "rgba(239,68,68,0.3)",
    },
    {
      key: "critical" as Filter,
      label: "Within 30 days",
      count: counts.critical,
      icon: <FaExclamationTriangle size={18} />,
      activeColor: "#f97316",
      activeBg: "rgba(249,115,22,0.1)",
      activeBorder: "rgba(249,115,22,0.3)",
    },
    {
      key: "warning"  as Filter,
      label: "Within 90 days",
      count: counts.warning,
      icon: <FaClock size={18} />,
      activeColor: "#eab308",
      activeBg: "rgba(234,179,8,0.1)",
      activeBorder: "rgba(234,179,8,0.3)",
    },
    {
      key: "all"      as Filter,
      label: "All Clear",
      count: counts.ok,
      icon: <FaCheckCircle size={18} />,
      activeColor: "#10b981",
      activeBg: "rgba(16,185,129,0.1)",
      activeBorder: "rgba(16,185,129,0.3)",
    },
  ];

  return (
    <>
      <Navbar />
      <div style={{ padding: "32px 36px", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          DRIVER MANAGEMENT
        </div>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
              Document Expiry
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
              Licence and work authorization expiry across all drivers — sorted by urgency.
            </p>
          </div>
          {(counts.expired > 0 || counts.critical > 0) && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 16px", borderRadius: "10px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: "13px", fontWeight: 600,
            }}>
              <FaExclamationTriangle size={13} />
              {counts.expired + counts.critical} document{counts.expired + counts.critical !== 1 ? "s" : ""} need immediate attention
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
          {summaryCards.map((card) => {
            const isActive = filter === card.key;
            return (
              <div
                key={card.key}
                onClick={() => setFilter(card.key)}
                style={{
                  background: isActive ? card.activeBg : "var(--t-surface-alt)",
                  border: `1px solid ${isActive ? card.activeBorder : "var(--t-border)"}`,
                  borderRadius: "14px", padding: "20px 22px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ color: isActive ? card.activeColor : "var(--t-text-ghost)" }}>
                    {card.icon}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.8px", color: card.activeColor, textTransform: "uppercase" }}>
                      FILTERED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: isActive ? card.activeColor : "var(--t-text)", lineHeight: 1, marginBottom: "6px" }}>
                  {card.count}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--t-text-dim)" }}>
                  {card.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {(["all", "expired", "critical", "warning"] as Filter[]).map((f) => {
            const labels: Record<Filter, string> = {
              all: "All Documents",
              expired: "Expired",
              critical: "Within 30 days",
              warning: "Within 90 days",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                  background: filter === f ? "var(--t-accent)" : "var(--t-surface-alt)",
                  color: filter === f ? "#fff" : "var(--t-text-dim)",
                  border: filter === f ? "none" : "1px solid var(--t-border)",
                  transition: "all 0.15s",
                }}
              >
                {labels[f]}
                {f !== "all" && (
                  <span style={{ marginLeft: "6px", opacity: 0.75 }}>
                    ({f === "expired" ? counts.expired : f === "critical" ? counts.critical : counts.warning})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "14px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--t-text-ghost)", fontSize: "14px" }}>
              Loading documents…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <FaCheckCircle size={32} style={{ color: "#10b981", marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--t-text)" }}>
                {filter === "all" ? "No drivers found" : "No documents in this category"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--t-text-ghost)" }}>
                {filter === "all" ? "Add drivers to start tracking document expiry." : "All documents in this range are accounted for."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
                  {["DRIVER", "DOCUMENT TYPE", "EXPIRY DATE", "DAYS REMAINING", "STATUS"].map((h) => (
                    <th key={h} style={{
                      padding: "13px 18px", textAlign: "left", fontSize: "10px",
                      fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const u = getUrgency(item.daysLeft);
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr
                      key={`${item.driverId}-${item.type}`}
                      style={{
                        borderBottom: isLast ? "none" : "1px solid var(--t-border)",
                        background: i % 2 === 1 ? "var(--t-stripe)" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Driver name */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--t-text)" }}>
                          {item.driverName}
                        </div>
                      </td>

                      {/* Document type */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: item.type === "Licence" ? "#4F46E5" : "#0891b2" }}>
                            {item.type === "Licence"
                              ? <FaIdCard size={14} />
                              : <FaShieldAlt size={14} />
                            }
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--t-text-secondary)" }}>
                            {item.type}
                          </span>
                        </div>
                      </td>

                      {/* Expiry date */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "13px", color: "var(--t-text-dim)", fontVariantNumeric: "tabular-nums" }}>
                          {format(item.expiryDate, "MMM d, yyyy")}
                        </span>
                      </td>

                      {/* Days remaining */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px", borderRadius: "20px",
                          fontSize: "12px", fontWeight: 700,
                          background: u.bg, color: u.color,
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {item.daysLeft < 0
                            ? `${Math.abs(item.daysLeft)}d overdue`
                            : item.daysLeft === 0
                            ? "Today"
                            : `${item.daysLeft}d`
                          }
                        </span>
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 12px", borderRadius: "20px",
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px",
                          background: u.bg, color: u.color, border: `1px solid ${u.border}`,
                          textTransform: "uppercase",
                        }}>
                          {u.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--t-text-ghost)", textAlign: "right" }}>
            Showing {filtered.length} of {items.length} document{items.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
};

export default ExpiryDashboard;
