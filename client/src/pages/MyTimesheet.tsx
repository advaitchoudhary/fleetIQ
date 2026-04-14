import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import axios from "axios";
import Navbar from "./Navbar";
import { FILE_BASE_URL, API_BASE_URL } from "../utils/env";

interface Timesheet {
  _id: string;
  driver: string;
  date: string;
  startTime: string;
  endTime: string;
  customer: string;
  category: string;
  tripNumber: string;
  loadID: string;
  plannedHours: string;
  plannedKM: string;
  startKM: number;
  endKM: number;
  comments: string;
  attachments: string[];
  status: string;
  totalHours: string;
}

const MyTimesheet: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [driverName, setDriverName] = useState<string>("");

  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserEmail(user.email);
          setDriverName(user.name || "");

          const timesheetsResponse = await axios.get(`${API_BASE_URL}/timesheets?noPagination=true`);
          const allTimesheets = timesheetsResponse.data.data || timesheetsResponse.data;
          setTimesheets(Array.isArray(allTimesheets) ? allTimesheets : []);
        } else {
          setError("User not found in localStorage.");
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
    },
    {
      accessorKey: "endTime",
      header: "End Time",
    },
    {
      // Bug fix: use `id` instead of `accessorKey` to avoid returning raw DB value
      // when a custom cell renderer is provided. The cell recalculates hours from
      // startTime/endTime so overnight shifts are handled correctly.
      id: "totalHours",
      header: "Total Hours",
      cell: ({ row }: { row: { original: Timesheet } }) => {
        // Prefer the DB-stored totalHours value; fall back to computing from times
        if (row.original.totalHours) {
          return row.original.totalHours;
        }
        const start = row.original.startTime;
        const end = row.original.endTime;
        if (start && end) {
          const [startH, startM] = start.split(":").map(Number);
          const [endH, endM] = end.split(":").map(Number);

          if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return "N/A";

          let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight shift

          const hr = Math.floor(totalMinutes / 60);
          const min = totalMinutes % 60;

          return `${hr} hr ${min} min`;
        }
        return "N/A";
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "tripNumber",
      header: "Trip #",
    },
    {
      accessorKey: "loadID",
      header: "Load ID",
    },
    {
      accessorKey: "plannedHours",
      header: "Planned Hours",
    },
    {
      accessorKey: "plannedKM",
      header: "Planned KM",
    },
    {
      accessorKey: "startKM",
      header: "Start KM",
    },
    {
      accessorKey: "endKM",
      header: "End KM",
    },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }: { row: { original: Timesheet } }) => {
        const comment = row.original.comments || "";

        // Split into groups of 59 words
        const words = comment.split(" ");
        const lines: string[] = [];
        for (let i = 0; i < words.length; i += 59) {
          lines.push(words.slice(i, i + 59).join(" "));
        }

        return (
          <div
            style={{
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {lines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        );
      },
    },
    {
      header: "Attachments",
      cell: ({ row }: { row: { original: Timesheet } }) => {
        const attachments = row.original.attachments || [];
        if (attachments.length === 0) {
          return <span style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>No Attachments</span>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {attachments.map((path: string, index: number) => (
              <a
                key={index}
                href={`${FILE_BASE_URL}/${path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`${FILE_BASE_URL}/${path}`}
                  alt={`attachment-${index}`}
                  style={{
                    width: "44px",
                    height: "44px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid var(--t-border)",
                  }}
                />
              </a>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Timesheet } }) => {
        const status = row.original.status;
        return (
          <span style={statusStyles[status] || statusStyles.pending}>
            {status === "approved"
              ? "Approved"
              : status === "rejected"
              ? "Rejected"
              : "Pending"}
          </span>
        );
      },
    },
  ];

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const filteredData = useMemo(() => {
    let result;
    if (selectedFilter === "All") {
      result = timesheets;
    } else {
      const now = new Date();

      if (selectedFilter === "Today") {
        result = timesheets.filter(ts => {
          const tsDate = normalizeDate(new Date(ts.date + "T00:00:00"));
          return tsDate.getTime() === normalizeDate(now).getTime();
        });
      } else if (selectedFilter === "This Week") {
        const startOfWeek = normalizeDate(new Date(now));
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        result = timesheets.filter(ts => {
          const tsDate = normalizeDate(new Date(ts.date + "T00:00:00"));
          return tsDate >= startOfWeek && tsDate <= endOfWeek;
        });
      } else if (selectedFilter === "This Month") {
        result = timesheets.filter(ts => {
          const tsDate = new Date(ts.date + "T00:00:00");
          return (
            tsDate.getMonth() === now.getMonth() &&
            tsDate.getFullYear() === now.getFullYear()
          );
        });
      } else if (selectedFilter === "Custom" && rangeStart && rangeEnd) {
        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);
        end.setHours(23, 59, 59, 999); // include full end date
        result = timesheets.filter(ts => {
          const tsDate = new Date(ts.date);
          return tsDate >= start && tsDate <= end;
        });
      } else {
        result = timesheets;
      }
    }

    if (searchQuery.trim()) {
      result = result.filter(ts =>
        Object.values(ts).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return result;
  }, [timesheets, selectedFilter, rangeStart, rangeEnd, searchQuery]);

  const approvedCount = useMemo(() => timesheets.filter(t => t.status === "approved").length, [timesheets]);
  const pendingCount  = useMemo(() => timesheets.filter(t => !t.status || t.status === "pending").length, [timesheets]);

  const driverHours = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return timesheets
      .filter(ts => {
        const d = new Date(ts.date + "T00:00:00");
        return d >= startOfWeek && d <= endOfWeek;
      })
      .reduce((sum, ts) => {
        if (ts.startTime && ts.endTime) {
          const [sh, sm] = ts.startTime.split(":").map(Number);
          const [eh, em] = ts.endTime.split(":").map(Number);
          if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
            let mins = (eh * 60 + em) - (sh * 60 + sm);
            if (mins < 0) mins += 24 * 60;
            return sum + mins / 60;
          }
        }
        return sum;
      }, 0);
  }, [timesheets]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--t-bg)", minHeight: "100vh" }}>
      <style>{`
        [data-ts-stat] { transition: transform 0.18s ease; cursor: default; }
        [data-ts-stat]:hover { transform: translateY(-3px); }
        [data-ts-row]:hover td { background: rgba(79,70,229,0.06) !important; }
        [data-ts-pill] { transition: all 0.15s ease; }
        [data-ts-pill]:hover { background: rgba(79,70,229,0.2) !important; color: var(--t-indigo) !important; border-color: rgba(79,70,229,0.4) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
        @media (max-width: 640px) {
          [data-ts-filter-bar] { flex-direction: column !important; align-items: stretch !important; }
          [data-ts-pills] { flex-wrap: wrap !important; }
        }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          MY TIMESHEETS
        </div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "linear-gradient(135deg, #4F46E5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {(driverName || "D").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ margin: "0 0 6px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>My Timesheets</h1>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>{driverName}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { value: driverHours.toFixed(1), label: "Hrs This Week", color: "var(--t-indigo)" },
            { value: String(timesheets.length), label: "Total Entries", color: "var(--t-indigo)" },
            { value: String(approvedCount), label: "Approved", color: "var(--t-success)" },
            { value: String(pendingCount), label: "Pending", color: "var(--t-warning)" },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "12px", padding: "20px 24px", boxShadow: "var(--t-shadow)" }} data-ts-stat>
              <div style={{ fontSize: "28px", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div>
        {loading && (
          <div style={{ textAlign: "center" as const, padding: "60px", color: "var(--t-text-ghost)", fontSize: "15px" }}>Loading timesheets…</div>
        )}
        {error && (
          <div style={{ marginBottom: "20px", padding: "12px 16px", background: "var(--t-error-bg)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.25)", color: "var(--t-error)", fontSize: "14px", fontWeight: 600 }}>{error}</div>
        )}

        {!loading && !error && (
          <div style={tsFilterBar} data-ts-filter-bar>
            <div style={tsSearchBox}>
              <svg width="15" height="15" fill="none" stroke="var(--t-text-ghost)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search trips, load IDs, comments…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "14px", width: "100%", color: "var(--t-text-secondary)", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }} data-ts-pills>
              {["All", "Today", "This Week", "This Month", "Custom"].map(f => (
                <button key={f} onClick={() => setSelectedFilter(f)} style={selectedFilter === f ? tsActivePill : tsPill} data-ts-pill>{f}</button>
              ))}
            </div>
            {selectedFilter === "Custom" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={tsDateInput} />
                <span style={{ color: "var(--t-text-ghost)", fontSize: "13px", fontWeight: 600 }}>→</span>
                <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} style={tsDateInput} />
              </div>
            )}
          </div>
        )}

        {!loading && !error && timesheets.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "80px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <p style={{ color: "var(--t-text-ghost)", fontSize: "15px", fontWeight: 500, margin: 0 }}>No timesheets found yet.</p>
          </div>
        )}

        {!loading && !error && timesheets.length > 0 && (
          <div style={tsTableCard}>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: "1200px", tableLayout: "fixed" as const }}>
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} style={{ borderBottom: "1px solid var(--t-border)" }}>
                      {hg.headers.map((h) => (
                        <th key={h.id} style={{ padding: "13px 16px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textAlign: "left" as const, textTransform: "uppercase" as const, letterSpacing: "0.8px", whiteSpace: "nowrap" as const, background: "var(--t-surface)", ...(h.column.getSize() !== 150 ? { width: `${h.column.getSize()}px` } : {}) }}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr key={row.id} data-ts-row style={{ borderBottom: "1px solid var(--t-border)", background: i % 2 === 1 ? "var(--t-stripe)" : "transparent" }}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: "12px 16px", textAlign: "left" as const, fontSize: "13px", color: "var(--t-text-faint)", verticalAlign: "middle" }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "12px", color: "var(--t-text-muted)", fontWeight: 500 }}>
              Showing {filteredData.length} of {timesheets.length} entries
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

// ── MyTimesheet style constants ───────────────────────────────────────
const tsFilterBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
  flexWrap: "wrap" as const,
};
const tsSearchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "var(--t-surface)",
  border: "1px solid var(--t-border)",
  borderRadius: "10px",
  padding: "10px 14px",
  flex: 1,
  minWidth: "220px",
};
const tsPill: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "20px",
  border: "1px solid var(--t-border)",
  background: "var(--t-hover-bg)",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--t-text-dim)",
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};
const tsActivePill: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "20px",
  border: "1px solid rgba(79,70,229,0.5)",
  background: "rgba(79,70,229,0.2)",
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--t-indigo)",
  cursor: "pointer",
  fontFamily: "Inter, system-ui, sans-serif",
};
const tsDateInput: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid var(--t-border)",
  fontSize: "13px",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
  fontFamily: "Inter, system-ui, sans-serif",
};
const tsTableCard: React.CSSProperties = {
  background: "var(--t-surface)",
  borderRadius: "16px",
  border: "1px solid var(--t-border)",
  overflow: "hidden",
};

const statusStyles: { [key: string]: React.CSSProperties } = {
  approved: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    background: "var(--t-success-bg)",
    color: "var(--t-success)",
    border: "1px solid rgba(16,185,129,0.25)",
  },
  rejected: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    background: "var(--t-error-bg)",
    color: "var(--t-error)",
    border: "1px solid rgba(239,68,68,0.25)",
  },
  pending: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    background: "rgba(245,158,11,0.12)",
    color: "var(--t-warning)",
    border: "1px solid rgba(245,158,11,0.25)",
  },
};

export default MyTimesheet;
