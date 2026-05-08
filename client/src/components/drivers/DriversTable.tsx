import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

interface Props {
  drivers: any[];
  totalCount: number;
  orgNotesSummary: Record<string, { count: number; worstType: string }>;
  onEdit: (driver: any) => void;
  onDelete: (driver: any) => void;
  onRowClick: (driver: any) => void;
}

const DriversTable: React.FC<Props> = ({
  drivers,
  totalCount,
  orgNotesSummary,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  return (
    <div style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", overflow: "hidden", marginBottom: "24px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--t-hover-bg)" }}>
            {["S.NO", "DRIVER", "CONTACT INFORMATION", "STATUS", "HOURS (WK)", "WORK AUTHORIZATION", "NOTES", "ACTIONS"].map((h) => (
              <th key={h} style={{ padding: "14px 16px", textAlign: "left" as const, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", whiteSpace: "nowrap" as const }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: "48px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "14px" }}>No matching drivers found.</td>
            </tr>
          ) : (
            drivers.map((driver: any, idx: number) => {
              const isDemo = String(driver._id).startsWith("demo-");
              const statusCfg: Record<string, { bg: string; border: string; color: string }> = {
                active:     { bg: "var(--t-success-bg)", border: "rgba(16,185,129,0.3)",  color: "var(--t-success)" },
                inactive:   { bg: "var(--t-warning-bg)", border: "rgba(234,179,8,0.3)",   color: "var(--t-warning)" },
                suspended:  { bg: "var(--t-error-bg)",   border: "rgba(239,68,68,0.3)",   color: "var(--t-error)" },
                "on leave": { bg: "var(--t-warning-bg)", border: "rgba(234,179,8,0.3)",   color: "var(--t-warning)" },
              };
              const statusKey = (driver.status || "active").toLowerCase();
              const badge = statusCfg[statusKey] || statusCfg.active;
              const hours = parseFloat(driver.hoursThisWeek || "0");
              const avatarColors = ["#4F46E5", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
              const avatarColor = avatarColors[idx % avatarColors.length];
              const initials = (driver.name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
              const driverId = `OP-${String(driver._id || "").slice(-4).toUpperCase() || String(1000 + idx)}`;

              return (
                <tr
                  key={driver._id}
                  style={{ borderBottom: "1px solid var(--t-stripe)", cursor: isDemo ? "default" : "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-stripe)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { if (!isDemo) onRowClick(driver); }}
                >
                  {/* S.NO */}
                  <td style={{ padding: "18px 16px", fontSize: "13px", color: "var(--t-text-ghost)", fontWeight: 500, width: "60px" }}>
                    {String(idx + 1).padStart(2, "0")}
                  </td>

                  {/* DRIVER */}
                  <td style={{ padding: "18px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ position: "relative" as const, flexShrink: 0 }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                          {initials}
                        </div>
                        <div style={{ position: "absolute" as const, bottom: "1px", right: "1px", width: "9px", height: "9px", borderRadius: "50%", background: statusKey === "active" ? "var(--t-success)" : statusKey === "suspended" ? "var(--t-error)" : "var(--t-warning)", border: "1.5px solid var(--t-surface)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text)", borderLeft: "2px solid var(--t-accent)", paddingLeft: "8px" }}>{driver.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--t-text-ghost)", paddingLeft: "8px", marginTop: "2px" }}>ID: {driverId}</div>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT */}
                  <td style={{ padding: "18px 16px" }}>
                    <div style={{ fontSize: "13px", color: "var(--t-text-faint)" }}>{driver.email}</div>
                    <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "3px" }}>{driver.contact || "—"}</div>
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: "18px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" as const }}>
                      ● {(driver.status || "Active").toUpperCase()}
                    </span>
                  </td>

                  {/* HOURS */}
                  <td style={{ padding: "18px 16px", minWidth: "80px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>{hours.toFixed(1)}</div>
                    <div style={{ height: "2px", width: "56px", background: "var(--t-border)", borderRadius: "2px", marginTop: "5px" }}>
                      <div style={{ width: `${Math.min(100, hours / 60 * 100)}%`, height: "100%", background: statusKey === "suspended" ? "var(--t-error)" : "var(--t-accent)", borderRadius: "2px" }} />
                    </div>
                  </td>

                  {/* WORK AUTH */}
                  <td style={{ padding: "18px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>
                    {driver.workStatus || "—"}
                  </td>

                  {/* NOTES indicator */}
                  <td style={{ padding: "18px 16px" }}>
                    {(() => {
                      const ns = orgNotesSummary[String(driver._id)];
                      if (!ns) return <span style={{ color: "var(--t-text-faint)", fontSize: "12px" }}>—</span>;
                      const noteColors: Record<string, { color: string; bg: string; border: string }> = {
                        Incident:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
                        Warning:    { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)"  },
                        General:    { color: "#4f46e5", bg: "rgba(79,70,229,0.1)",   border: "rgba(79,70,229,0.25)"   },
                        Compliment: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
                      };
                      const c = noteColors[ns.worstType] || noteColors.General;
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                          background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                          whiteSpace: "nowrap" as const,
                        }}>
                          {ns.count} {ns.worstType}
                        </span>
                      );
                    })()}
                  </td>

                  {/* ACTIONS */}
                  <td style={{ padding: "18px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { if (!isDemo) onEdit(driver); }}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", color: "var(--t-indigo)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isDemo ? "not-allowed" : "pointer", opacity: isDemo ? 0.3 : 1 }}
                      >
                        <FaEdit size={11} />
                      </button>
                      <button
                        onClick={() => { if (!isDemo) onDelete(driver); }}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--t-error)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isDemo ? "not-allowed" : "pointer", opacity: isDemo ? 0.3 : 1 }}
                      >
                        <FaTrashAlt size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Table footer */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid var(--t-input-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", color: "var(--t-text-ghost)" }}>
          Showing <strong style={{ color: "var(--t-text-faint)" }}>1–{drivers.length}</strong> of <strong style={{ color: "var(--t-text-faint)" }}>{totalCount}</strong> drivers
        </span>
      </div>
    </div>
  );
};

export default DriversTable;
