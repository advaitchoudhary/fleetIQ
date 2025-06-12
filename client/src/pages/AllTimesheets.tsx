import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Navbar from "./Navbar";

import { FILE_BASE_URL, API_BASE_URL } from "../utils/env";

const AllTimesheets: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any | null>(null);
  const [, setShowExportOptions] = useState(false);
  const [categoryRates, setCategoryRates] = useState<Record<string, number>>(
    {}
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("All");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchTimesheets();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
  }, []);

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert("No timesheets available to export.");
      return;
    }
    exportTimesheets();
  };

  const handleDeleteFilteredTimesheets = async () => {
    if (filteredData.length === 0) {
      alert("No timesheets available to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${filteredData.length} timesheets? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const ts of filteredData) {
        await axios.delete(`${API_BASE_URL}/timesheet/${ts._id}`);
      }
      fetchTimesheets();
      alert("Selected timesheets deleted successfully.");
    } catch (error) {
      console.error("Error deleting timesheets:", error);
      alert("Failed to delete selected timesheets.");
    }
  };

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const filteredData = useMemo(() => {
    let result;
    if (selectedFilter === "All") {
      result = data;
      // Filter by selectedUser before searchQuery
      if (selectedUser !== "All") {
        result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
      }
      // filtering by searchQuery
      if (searchQuery.trim()) {
        result = result.filter(ts =>
          Object.values(ts).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      return result;
    }

    const now = new Date();

    if (selectedFilter === "Today") {
      result = data.filter(ts => {
        const tsDate = normalizeDate(new Date(ts.date));
        return tsDate.getTime() === normalizeDate(now).getTime();
      });
      if (selectedUser !== "All") {
        result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
      }
      if (searchQuery.trim()) {
        result = result.filter(ts =>
          Object.values(ts).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      return result;
    }

    if (selectedFilter === "This Week") {
      const startOfWeek = normalizeDate(new Date(now));
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      result = data.filter(ts => {
        const tsDate = normalizeDate(new Date(ts.date));
        return tsDate >= startOfWeek && tsDate <= endOfWeek;
      });
      if (selectedUser !== "All") {
        result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
      }
      if (searchQuery.trim()) {
        result = result.filter(ts =>
          Object.values(ts).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      return result;
    }

    if (selectedFilter === "This Month") {
      result = data.filter(ts => {
        const tsDate = new Date(ts.date);
        return (
          tsDate.getMonth() === now.getMonth() &&
          tsDate.getFullYear() === now.getFullYear()
        );
      });
      if (selectedUser !== "All") {
        result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
      }
      if (searchQuery.trim()) {
        result = result.filter(ts =>
          Object.values(ts).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      return result;
    }

    if (selectedFilter === "Custom" && rangeStart && rangeEnd) {
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      end.setHours(23, 59, 59, 999); // include full end date
      result = data.filter(ts => {
        const tsDate = new Date(ts.date);
        return tsDate >= start && tsDate <= end;
      });
      if (selectedUser !== "All") {
        result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
      }
      if (searchQuery.trim()) {
        result = result.filter(ts =>
          Object.values(ts).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      return result;
    }

    result = data;
    if (selectedUser !== "All") {
      result = result.filter(ts => ts.driver?.email === selectedUser || ts.driver === selectedUser);
    }
    if (searchQuery.trim()) {
      result = result.filter(ts =>
        Object.values(ts).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    return result;
  }, [data, selectedFilter, rangeStart, rangeEnd, searchQuery, selectedUser]);
  
  const exportTimesheets = () => {
    setShowExportOptions(false);

    if (filteredData.length === 0) {
      alert("No timesheets available to export for the selected filter.");
      return;
    }

    // Export all visible columns as shown in the table UI
    const csvRows = [
      "Driver,Customer,Date,Start Time,End Time,Start KM,End KM,Total KM,Category,Planned KM,SubTotal,Comments,Status"
    ];

    filteredData.forEach((ts) => {
      const start = ts.startTime;
      const end = ts.endTime;
      const startDate = new Date(`1970-01-01T${start}`);
      const endDate = new Date(`1970-01-01T${end}`);
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      isNaN(endDate.getTime() - startDate.getTime())
        ? "N/A"
        : `${((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)).toFixed(2)} hrs`;

      const totalKM = ts.endKM - ts.startKM;
      const rate = categoryRates[ts.category] || 0;
      const subtotal = totalKM * rate;

      // Use createdAt timestamp for Date column in export
      const timestamp = new Date(ts.createdAt).toLocaleString();

      csvRows.push([
        ts.driver,
        ts.customer,
        timestamp,
        ts.startTime,
        ts.endTime,
        ts.startKM,
        ts.endKM,
        totalKM,
        ts.category,
        ts.plannedKM,
        `$${subtotal.toFixed(2)}`,
        `"${(ts.comments || "").replace(/"/g, '""')}"`,
        ts.status,
      ].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `filtered_timesheets_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchTimesheets();
    fetchCategoryRates();
    fetchUsers();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchCategoryRates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      const rates: Record<string, number> = {};

      response.data.forEach((driver: any) => {
        if (driver.backhaulRate) rates["Backhaul"] = driver.backhaulRate;
        if (driver.comboRate) rates["Combo"] = driver.comboRate;
        if (driver.extraSheetEWRate)
          rates["Extra Sheet/E.W"] = driver.extraSheetEWRate;
        if (driver.regularBannerRate)
          rates["Regular/Banner"] = driver.regularBannerRate;
        if (driver.wholesaleRate) rates["Wholesale"] = driver.wholesaleRate;
      });

      setCategoryRates(rates);
    } catch (error) {
      console.error("Failed to fetch category rates:", error);
    }
  };

  const fetchTimesheets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/timesheets`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      setError("Failed to load timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheetStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    try {
      await axios.put(`${API_BASE_URL}/timesheet/${id}/status`, { status });
      setData((prevData) =>
        prevData.map((timesheet) =>
          timesheet._id === id ? { ...timesheet, status } : timesheet
        )
      );
    } catch (error) {
      console.error(`Error updating timesheet to ${status}:`, error);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/timesheet/${selectedTimesheet._id}`,
        selectedTimesheet
      );
      setData((prev) =>
        prev.map((t) =>
          t._id === selectedTimesheet._id ? selectedTimesheet : t
        )
      );
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating timesheet:", error);
    }
  };

  const openEditModal = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setEditModalOpen(true);
  };

  const handleChange = (field: string, value: string | number) => {
    setSelectedTimesheet((prev: any) => ({ ...prev, [field]: value }));
  };

  const columns: ColumnDef<(typeof data)[0]>[] = [
    {
      accessorKey: "edit",
      header: "",
      cell: ({ row }: any) => (
        <button
          onClick={() => openEditModal(row.original)}
          style={styles.editIcon}
        >
          ✏️
        </button>
      ),
    },
    { accessorKey: "driver", header: "Driver" },
    // { accessorKey: "customer", header: "Customer" },
    { accessorKey: "loadID", header: "Load ID" },
    { accessorKey: "tripNumber", header: "Route No." },
    {
      accessorKey: "date",
      header: "Date/Time",
      cell: ({ row }: any) => {
        const tsCreatedAt = new Date(row.original.createdAt);
        return tsCreatedAt.toLocaleString();
      },
    },
    { accessorKey: "startTime", header: "Start Time" },
    { accessorKey: "endTime", header: "End Time" },
    { accessorKey: "startKM", header: "Start KM" },
    { accessorKey: "endKM", header: "End KM" },
    {
      header: "Total KM",
      cell: ({ row }: any) => {
        const start = parseFloat(row.original.startKM);
        const end = parseFloat(row.original.endKM);
        const total = !isNaN(start) && !isNaN(end) ? end - start : "N/A";
        return total;
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
    { accessorKey: "category", header: "Category" },
    { accessorKey: "plannedKM", header: "Planned KM" },
    {
      header: "Total",
      cell: ({ row }: any) => {
        const start = parseFloat(row.original.startKM);
        const end = parseFloat(row.original.endKM);
        const category = row.original.category;
        const rate = categoryRates[category] || 0;

        const totalKM = !isNaN(start) && !isNaN(end) ? end - start : 0;
        const subtotal = totalKM * rate;

        return !isNaN(subtotal) ? `$${subtotal.toFixed(2)}` : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status;
        const label =
          status === "approved"
            ? "Approved"
            : status === "rejected"
            ? "Rejected"
            : "Pending";

        return (
          <span style={statusStyles[status as keyof typeof statusStyles]}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const { _id, status } = row.original;
        return userRole === "admin" || userRole === "manager" ? (
          <div style={styles.actions}>
            {status === "pending" && (
              <>
                <button
                  style={styles.approveButton}
                  onClick={() => updateTimesheetStatus(_id, "approved")}
                >
                  Approve
                </button>
                <button
                  style={styles.rejectButton}
                  onClick={() => updateTimesheetStatus(_id, "rejected")}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        ) : (
          <span style={styles.readOnly}>No Action</span>
        );
      },
    },
  ];

  const filteredTable = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>All Timesheets</h1>
        <div style={{ ...styles.filterBar, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ ...styles.searchWrapper, position: "relative" }}>
              <span style={{ ...styles.searchIcon }}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={styles.filterGroup}>
              <label>User:</label>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} style={styles.selectInput}>
                <option value="All">All Users</option>
                {users.map((driver: any) => (
                  <option key={driver._id} value={driver.email}>{driver.name} ({driver.username})</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label>Filter:</label>
              <select value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)} style={styles.selectInput}>
                <option value="All">All</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Range</option>
              </select>
              {selectedFilter === "Custom" && (
                <>
                  <label>From:</label>
                  <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={styles.dateInput} />
                  <label>To:</label>
                  <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} style={styles.dateInput} />
                </>
              )}
            </div>
            <button onClick={handleExport} style={styles.exportButton}>
              Export Timesheet 📤
            </button>
            <button onClick={handleDeleteFilteredTimesheets} style={styles.rejectButton}>
              Delete Timesheet 🗑️
            </button>
          </div>
        </div>

        {/* Removed extra export button and exportOptions container */}
        {loading ? (
          <p>Loading timesheets...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  {filteredTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={styles.th}>
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
                  {filteredTable.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                        No data available for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTable.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} style={styles.td}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <style>
              {`
                table tr:hover td {
                  background-color: #f0f4ff;
                  transition: background-color 0.2s ease;
                  cursor: pointer;
                }
              `}
            </style>
          </>
        )}

        {editModalOpen && selectedTimesheet && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2>Edit Timesheet</h2>
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={{ fontWeight: "bold" }}>Start Time:</label>
                  <input
                    type="time"
                    value={selectedTimesheet.startTime}
                    onChange={(e) => handleChange("startTime", e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>End Time:</label>
                  <input
                    type="time"
                    value={selectedTimesheet.endTime}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>Start KM:</label>
                  <input
                    type="number"
                    value={selectedTimesheet.startKM}
                    onChange={(e) => handleChange("startKM", Number(e.target.value))}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>End KM:</label>
                  <input
                    type="number"
                    value={selectedTimesheet.endKM}
                    onChange={(e) => handleChange("endKM", Number(e.target.value))}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>Planned KM:</label>
                  <input
                    type="number"
                    value={selectedTimesheet.plannedKM}
                    onChange={(e) => handleChange("plannedKM", Number(e.target.value))}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>Comments:</label>
                  <textarea
                    value={selectedTimesheet.comments || ""}
                    onChange={(e) => handleChange("comments", e.target.value)}
                    style={{ ...styles.input, minHeight: "80px" }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: "bold" }}>Status:</label>
                  <select
                    value={selectedTimesheet.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                <button style={styles.approveButton} onClick={handleUpdate}>
                  Save Changes
                </button>
                <button
                  style={styles.rejectButton}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center" as const,
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
  } as React.CSSProperties,
  table: {
    width: "100%",
    maxWidth: "1400px",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
    tableLayout: "auto" as const,
  },
  th: {
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left" as const,
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    wordBreak: "break-word" as const,
    whiteSpace: "wrap" as const,
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "8px 8px",
    fontSize: "14px",
    textAlign: "left" as const,
    backgroundColor: "#ffffff",
    wordBreak: "break-word" as const,
  },
  actions: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "8px",
    minWidth: "150px",
  },
  approveButton: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    padding: "6px 14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #a7f3d0",
  },
  rejectButton: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "6px 14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #fecaca",
  },
  readOnly: {
    color: "gray",
    fontStyle: "italic",
  },
  error: {
    color: "red",
    fontSize: "16px",
    marginTop: "10px",
  },
  editIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
  },
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "10px",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto" as const,
    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  exportButton: {
    padding: "10px 20px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  optionButton: {
    margin: "5px",
    padding: "8px 18px",
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  exportOptions: {
    textAlign: "center" as const,
    padding: "10px 0",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    gap: "16px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
  dateInput: {
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  selectInput: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f9f9f9",
    fontSize: "14px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#888",
  },
  searchInput: {
    padding: "8px 14px 8px 32px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    fontSize: "14px",
    width: "250px",
  },
};

const statusStyles = {
  approved: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
  },
  rejected: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
  },
  pending: {
    backgroundColor: "#fff7ed",
    color: "#b45309",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
  },
};

export default AllTimesheets;