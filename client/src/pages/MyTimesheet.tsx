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
          return <span style={{ color: "#9ca3af", fontSize: "13px" }}>No Attachments</span>;
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
                    border: "1px solid #e5e7eb",
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
          const tsDate = normalizeDate(new Date(ts.date));
          return tsDate.getTime() === normalizeDate(now).getTime();
        });
      } else if (selectedFilter === "This Week") {
        const startOfWeek = normalizeDate(new Date(now));
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        result = timesheets.filter(ts => {
          const tsDate = normalizeDate(new Date(ts.date));
          return tsDate >= startOfWeek && tsDate <= endOfWeek;
        });
      } else if (selectedFilter === "This Month") {
        result = timesheets.filter(ts => {
          const tsDate = new Date(ts.date);
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
        const d = new Date(ts.date);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f0f4ff", minHeight: "100vh" }}>
      <style>{`
        [data-ts-stat] { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
        [data-ts-stat]:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.25) !important; }
        [data-ts-row]:hover td { background-color: #f5f3ff !important; }
        [data-ts-pill] { transition: all 0.15s ease; }
        [data-ts-pill]:hover { background: #4F46E5 !important; color: #fff !important; border-color: #4F46E5 !important; }
        @media (max-width: 1024px) {
          [data-ts-hero-inner] { flex-direction: column !important; gap: 24px !important; }
          [data-ts-stats] { grid-template-columns: repeat(2,1fr) !important; }
          [data-ts-content] { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          [data-ts-hero] { padding: 24px 16px !important; }
          [data-ts-stats] { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          [data-ts-filter-bar] { flex-direction: column !important; align-items: stretch !important; }
          [data-ts-pills] { flex-wrap: wrap !important; }
          [data-ts-content] { padding: 16px 12px !important; }
        }
      `}</style>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={tsHero} data-ts-hero>
        <div style={tsHeroInner} data-ts-hero-inner>
          {/* Left: avatar + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            <div style={tsAvatar}>{(driverName || "D").charAt(0).toUpperCase()}</div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1.2px" }}>Driver Portal</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>My Timesheets</h1>
              {driverName && <p style={{ margin: "6px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{driverName}</p>}
            </div>
          </div>
          {/* Right: stat cards */}
          <div style={tsStatsGrid} data-ts-stats>
            <div style={tsStatCard} data-ts-stat>
              <div style={tsStatNum}>{driverHours.toFixed(1)}</div>
              <div style={tsStatLbl}>Hrs This Week</div>
            </div>
            <div style={tsStatCard} data-ts-stat>
              <div style={{ ...tsStatNum, color: "#a5b4fc" }}>{timesheets.length}</div>
              <div style={tsStatLbl}>Total Entries</div>
            </div>
            <div style={{ ...tsStatCard, borderTop: "3px solid #10b981" }} data-ts-stat>
              <div style={{ ...tsStatNum, color: "#6ee7b7" }}>{approvedCount}</div>
              <div style={tsStatLbl}>Approved</div>
            </div>
            <div style={{ ...tsStatCard, borderTop: "3px solid #f59e0b" }} data-ts-stat>
              <div style={{ ...tsStatNum, color: "#fde68a" }}>{pendingCount}</div>
              <div style={tsStatLbl}>Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div style={tsContent} data-ts-content>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px", color: "#6b7280", fontSize: "15px" }}>Loading timesheets…</div>
        )}
        {error && (
          <div style={{ marginBottom: "20px", padding: "12px 16px", backgroundColor: "#fef2f2", borderRadius: "10px", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px", fontWeight: 600 }}>{error}</div>
        )}

        {!loading && !error && (
          /* ── Filter Bar ──────────────────────────────────────────── */
          <div style={tsFilterBar} data-ts-filter-bar>
            <div style={tsSearchBox}>
              <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search trips, load IDs, comments…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "14px", width: "100%", color: "#374151", background: "transparent" }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }} data-ts-pills>
              {["All", "Today", "This Week", "This Month", "Custom"].map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  style={selectedFilter === f ? tsActivePill : tsPill}
                  data-ts-pill
                >{f}</button>
              ))}
            </div>
            {selectedFilter === "Custom" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={tsDateInput} />
                <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: 600 }}>→</span>
                <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} style={tsDateInput} />
              </div>
            )}
          </div>
        )}

        {!loading && !error && timesheets.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>📋</div>
            <p style={{ color: "#6b7280", fontSize: "15px", fontWeight: 500, margin: 0 }}>No timesheets found yet.</p>
          </div>
        )}

        {!loading && !error && timesheets.length > 0 && (
          <div style={tsTableCard}>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px", tableLayout: "fixed" as const }}>
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} style={{ background: "#f5f3ff", borderBottom: "2px solid #e0e7ff" }}>
                      {hg.headers.map((h) => (
                        <th key={h.id} style={{ padding: "13px 16px", fontSize: "10px", fontWeight: 700, color: "#6366f1", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.7px", whiteSpace: "nowrap" }}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr key={row.id} data-ts-row style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafbff", borderBottom: "1px solid #f0f0ff" }}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: "13px 16px", textAlign: "center", fontSize: "13px", color: "#374151", verticalAlign: "middle" }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e0e7ff", fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
              Showing {filteredData.length} of {timesheets.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── MyTimesheet style constants ───────────────────────────────────────
const tsHero: React.CSSProperties = {
  background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)",
  padding: "36px 40px",
};
const tsHeroInner: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "28px",
};
const tsAvatar: React.CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.15)",
  border: "2px solid rgba(255,255,255,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 800,
  color: "#fff",
  flexShrink: 0,
};
const tsStatsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: "12px",
};
const tsStatCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  padding: "14px 18px",
  minWidth: "90px",
};
const tsStatNum: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 800,
  color: "#fff",
  lineHeight: 1,
  marginBottom: "4px",
};
const tsStatLbl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};
const tsContent: React.CSSProperties = {
  maxWidth: "1300px",
  margin: "0 auto",
  padding: "28px 40px",
};
const tsFilterBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};
const tsSearchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#fff",
  border: "1px solid #e0e7ff",
  borderRadius: "10px",
  padding: "10px 14px",
  flex: 1,
  minWidth: "220px",
  boxShadow: "0 1px 4px rgba(79,70,229,0.06)",
};
const tsPill: React.CSSProperties = {
  padding: "8px 15px",
  borderRadius: "20px",
  border: "1px solid #e0e7ff",
  background: "#fff",
  fontSize: "13px",
  fontWeight: 500,
  color: "#6b7280",
  cursor: "pointer",
};
const tsActivePill: React.CSSProperties = {
  padding: "8px 15px",
  borderRadius: "20px",
  border: "1px solid #4F46E5",
  background: "#4F46E5",
  fontSize: "13px",
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
};
const tsDateInput: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid #e0e7ff",
  fontSize: "13px",
  background: "#fff",
  color: "#374151",
};
const tsTableCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid #e0e7ff",
  boxShadow: "0 2px 16px rgba(79,70,229,0.07)",
  overflow: "hidden",
};

const statusStyles: { [key: string]: React.CSSProperties } = {
  approved: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    backgroundColor: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
  },
  rejected: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  pending: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    backgroundColor: "#fffbeb",
    color: "#d97706",
    border: "1px solid #fde68a",
  },
};

export default MyTimesheet;
