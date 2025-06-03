import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import axios from "axios";
import Navbar from "./Navbar";
import { FILE_BASE_URL, API_BASE_URL } from "../utils/env";

const MyTimesheet: React.FC = () => {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserEmail(user.email); // Store user email for filtering

          const response = await axios.get(`${API_BASE_URL}/timesheets`);
          const allTimesheets = response.data;

          // Filter timesheets for the logged-in driver
          const userTimesheets = allTimesheets.filter(
            (timesheet: any) => timesheet.driver === user.email
          );
          setTimesheets(userTimesheets);
        } else {
          setError("User not found in localStorage.");
        }
      } catch (error) {
        console.error("❌ Error fetching timesheets:", error);
        setError("Failed to load timesheets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
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
      accessorKey: "totalHours",
      header: "Total Hours",
      cell: ({ row }: any) => {
        // Convert time format and calculate total hours dynamically
        const start = row.original.startTime;
        const end = row.original.endTime;
        if (start && end) {
          const startTime = new Date(`1970-01-01T${start}`);
          const endTime = new Date(`1970-01-01T${end}`);
          const diff =
            (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return diff.toFixed(2) + " hrs";
        }
        return "N/A";
      },
    },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }: any) => {
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
      cell: ({ row }: any) => {
        const attachments = row.original.attachments || [];
        if (attachments.length === 0) {
          return <span>No Attachments</span>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
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
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "4px",
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
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <span style={statusStyles[status] || styles.pending}>
            {status === "approved" ? "✔️" : status === "rejected" ? "❌" : "⏳"}
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

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>My Timesheets</h1>

        {loading && <p>Loading timesheets...</p>}
        {error && <p style={styles.error}>{error}</p>}

        <div style={{ marginTop: "20px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "200px" }}
          />
          <select value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
            <option value="All">All</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Custom">Custom Range</option>
          </select>
          {selectedFilter === "Custom" && (
            <>
              <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }} />
              <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }} />
            </>
          )}
        </div>

        {!loading && !error && timesheets.length === 0 && (
          <p>No timesheets found for {userEmail}.</p>
        )}

        {!loading && !error && timesheets.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} style={styles.headerRow}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} style={styles.headerCell}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} style={styles.row}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={styles.cell}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
    padding: "10px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    maxWidth: "1400px",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
    tableLayout: "auto" as const,
  },
  headerRow: {
    backgroundColor: "#f3f4f6",
    borderBottom: "2px solid #e2e8f0",
  },
  headerCell: {
    padding: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center" as const,
  },
  row: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    transition: "background-color 0.2s ease",
  },
  hoveredRow: {
    backgroundColor: "#f9fafb",
  },
  cell: {
    padding: "14px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#2d3748",
    verticalAlign: "middle",
  },
  error: {
    color: "#e53e3e",
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "10px",
  },
  pending: {
    color: "orange",
    fontSize: "20px",
  },
};

const statusStyles: { [key: string]: { color: string; fontSize: string } } = {
  approved: { color: "green", fontSize: "20px" }, // ✔️ Approved
  rejected: { color: "red", fontSize: "20px" }, // ❌ Rejected
  pending: { color: "orange", fontSize: "20px" }, // ⏳ Pending
};

export default MyTimesheet;
