import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import axios from "axios";
import Navbar from "./Navbar";
import { FILE_BASE_URL, API_BASE_URL } from "../utils/env";

interface Driver {
  _id: string;
  name: string;
  email: string;
  hoursThisWeek: number;
}

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
  const [driverHours, setDriverHours] = useState<number>(0);
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

          // Fetch timesheets and driver info in parallel
          const [timesheetsResponse, driversResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/timesheets?noPagination=true`),
            axios.get(`${API_BASE_URL}/drivers`)
          ]);

          const allTimesheets = timesheetsResponse.data.data;
          const drivers = driversResponse.data;

          // Filter timesheets for the logged-in driver
          const userTimesheets = allTimesheets.filter(
            (timesheet: Timesheet) => timesheet.driver === user.email
          );
          setTimesheets(userTimesheets);

          // Find the current driver and get their hours
          const currentDriver = drivers.find((driver: Driver) => driver.email === user.email);
          if (currentDriver) {
            setDriverHours(currentDriver.hoursThisWeek || 0);
            setDriverName(currentDriver.name);
          }
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
      accessorKey: "totalHours",
      header: "Total Hours",
      cell: ({ row }: { row: { original: Timesheet } }) => {
        const start = row.original.startTime;
        const end = row.original.endTime;
        if (start && end) {
          const [startH, startM] = start.split(":").map(Number);
          const [endH, endM] = end.split(":").map(Number);

          const startDate = new Date();
          startDate.setHours(startH, startM, 0, 0);

          const endDate = new Date();
          endDate.setHours(endH, endM, 0, 0);

          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1); // handle overnight
          }

          const diffMs = endDate.getTime() - startDate.getTime();
          const totalMinutes = Math.floor(diffMs / (1000 * 60));
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

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 1024px) {
          [data-ts-container] { padding: 24px 20px !important; }
          [data-ts-controls] { flex-direction: column !important; align-items: stretch !important; }
          [data-ts-hours] { min-width: unset !important; }
          [data-ts-filters] { flex-wrap: wrap !important; }
          [data-ts-filters] input, [data-ts-filters] select { min-width: unset !important; flex: 1 1 140px !important; }
        }
        @media (max-width: 640px) {
          [data-ts-container] { padding: 16px 12px !important; }
          [data-ts-title] { font-size: 22px !important; }
          [data-ts-hours-number] { font-size: 22px !important; }
          [data-ts-driver-name] { font-size: 15px !important; }
          [data-ts-table-wrap] { margin-left: -12px !important; margin-right: -12px !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          [data-ts-filters] input, [data-ts-filters] select { flex: 1 1 100% !important; }
        }
      `}</style>
      <Navbar />
      <div style={styles.container} data-ts-container>
        <h1 style={styles.pageTitle} data-ts-title>My Timesheets</h1>

        {loading && <p style={{ color: "#6b7280", fontSize: "15px" }}>Loading timesheets...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && driverName && (
          <div style={styles.controlsContainer} data-ts-controls>
            <div style={styles.hoursCard} data-ts-hours>
              <div style={styles.hoursContent}>
                <div style={styles.hoursInfo}>
                  <h2 style={styles.hoursTitle}>Hours This Week</h2>
                  <p style={styles.driverName} data-ts-driver-name>{driverName}</p>
                </div>
                <div style={styles.hoursValue}>
                  <span style={styles.hoursNumber} data-ts-hours-number>{driverHours.toFixed(2)}</span>
                  <span style={styles.hoursUnit}>hours</span>
                </div>
              </div>
            </div>

            <div style={styles.searchFilterContainer} data-ts-filters>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <select 
                value={selectedFilter} 
                onChange={e => setSelectedFilter(e.target.value)} 
                style={styles.filterSelect}
              >
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Range</option>
              </select>
              {selectedFilter === "Custom" && (
                <>
                  <input 
                    type="date" 
                    value={rangeStart} 
                    onChange={e => setRangeStart(e.target.value)} 
                    style={styles.dateInput} 
                  />
                  <input 
                    type="date" 
                    value={rangeEnd} 
                    onChange={e => setRangeEnd(e.target.value)} 
                    style={styles.dateInput} 
                  />
                </>
              )}
            </div>
          </div>
        )}

        {!loading && !error && timesheets.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "15px" }}>No timesheets found for {userEmail}.</p>
        )}

        {!loading && !error && timesheets.length > 0 && (
          <div style={styles.tableWrapper} data-ts-table-wrap>
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
    padding: "32px 40px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "24px",
    letterSpacing: "-0.3px",
  },
  tableWrapper: {
    marginTop: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    backgroundColor: "#fff",
    padding: "4px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    borderRadius: "12px",
    overflow: "hidden",
    tableLayout: "fixed" as const,
    minWidth: "1200px",
  },
  headerRow: {
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  headerCell: {
    padding: "14px 16px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  row: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f3f4f6",
    transition: "background-color 0.2s ease",
  },
  hoveredRow: {
    backgroundColor: "#f9fafb",
  },
  cell: {
    padding: "14px 16px",
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#374151",
    verticalAlign: "middle",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: 600,
    marginTop: "10px",
    padding: "10px 16px",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    display: "inline-block",
  },
  hoursCard: {
    backgroundColor: "#ffffff",
    color: "#374151",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e5e7eb",
    minWidth: "25%",
  },
  hoursContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  hoursInfo: {
    textAlign: "left" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  hoursTitle: {
    fontSize: "12px",
    marginBottom: "0",
    fontWeight: 700,
    color: "#6b7280",
    lineHeight: "1.2",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  driverName: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    lineHeight: "1.3",
    marginTop: "4px",
  },
  hoursValue: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },
  hoursNumber: {
    fontSize: "28px",
    fontWeight: 700,
    lineHeight: "1",
    color: "#4F46E5",
  },
  hoursUnit: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#6b7280",
  },
  controlsContainer: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
  },
  searchFilterContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "10px",
    alignItems: "center",
  },
  searchInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    minWidth: "200px",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "border-color 0.2s",
  },
  filterSelect: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  dateInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
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
