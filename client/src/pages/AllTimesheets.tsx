import React, { useEffect, useState } from "react";
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
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [categoryRates, setCategoryRates] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    fetchTimesheets();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
  }, []);

  const handleExport = () => {
    if (data.length === 0) {
      alert("No timesheets available to export.");
      return;
    }

    // Toggle visibility of export options
    setShowExportOptions(!showExportOptions);
  };

  const exportTimesheets = (days: number) => {
    setShowExportOptions(false); // Hide options after choosing an option

    const now = new Date();
    const pastDate = new Date(now.setDate(now.getDate() - days));
    const filteredData = data.filter((timesheet) => {
      const timesheetDate = new Date(timesheet.date);
      return timesheetDate >= pastDate;
    });

    if (filteredData.length === 0) {
      alert("No timesheets available to export for the selected period.");
      return;
    }

    const csvRows = ["Date,Start Time,End Time,Total Hours,Comments,Status"];
    filteredData.forEach((timesheet) => {
      const start = timesheet.startTime;
      const end = timesheet.endTime;
      const startDate = new Date(`1970-01-01T${start}`);
      const endDate = new Date(`1970-01-01T${end}`);
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1); // Adjust for crossing midnight
      }
      const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const totalHours = isNaN(diff) ? "N/A" : `${diff.toFixed(2)} hrs`;

      const dateFormatted = new Date(timesheet.date)
        .toISOString()
        .split("T")[0]; // Format date as YYYY-MM-DD

      csvRows.push(
        [
          dateFormatted,
          start,
          end,
          totalHours,
          `"${(timesheet.comments || "").replace(/"/g, '""')}"`,
          timesheet.status,
        ].join(",")
      );
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheets_last_${days}_days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchTimesheets();
    fetchCategoryRates();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
  }, []);

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
        `${API_BASE_URL}/update/timesheet/${selectedTimesheet._id}`,
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

  const handleChange = (field: string, value: string) => {
    setSelectedTimesheet((prev: any) => ({ ...prev, [field]: value }));
  };

  const columns: ColumnDef<(typeof data)[0]>[] = [
    {
      accessorKey: "edit",
      header: "Edit",
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
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "date", header: "Date" },
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
      header: "SubTotal",
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
        return (
          <span style={statusStyles[status as keyof typeof statusStyles]}>
            {status === "approved" ? "✔️" : status === "rejected" ? "❌" : ""}
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
                  ✔️ Approve
                </button>
                <button
                  style={styles.rejectButton}
                  onClick={() => updateTimesheetStatus(_id, "rejected")}
                >
                  ❌ Reject
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>All Timesheets</h1>
        <p>View and manage all uploaded timesheets here.</p>
        <button onClick={handleExport} style={styles.exportButton}>
          Export Timesheet
        </button>

        <div style={styles.exportOptions}>
          {showExportOptions && (
            <>
              <button
                onClick={() => exportTimesheets(7)}
                style={styles.optionButton}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => exportTimesheets(15)}
                style={styles.optionButton}
              >
                Last 15 Days
              </button>
              <button
                onClick={() => exportTimesheets(30)}
                style={styles.optionButton}
              >
                Last Month
              </button>
            </>
          )}
        </div>
        {loading ? (
          <p>Loading timesheets...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
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
                {table.getRowModel().rows.map((row) => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editModalOpen && selectedTimesheet && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2>Edit Timesheet</h2>
              {Object.entries(selectedTimesheet).map(
                ([key, value]) =>
                  key !== "_id" && (
                    <div
                      key={key}
                      style={{ marginBottom: "10px", textAlign: "left" }}
                    >
                      <label style={{ fontWeight: "bold" }}>{key}:</label>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleChange(key, e.target.value)}
                        style={styles.input}
                      />
                    </div>
                  )
              )}
              <div style={{ marginTop: "20px" }}>
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
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  table: {
    width: "100%",
    maxWidth: "1200px",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    borderBottom: "2px solid #dee2e6",
    padding: "14px",
    fontSize: "16px",
    textAlign: "left" as const,
    backgroundColor: "#007bff",
    color: "white",
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "12px",
    fontSize: "14px",
    textAlign: "left" as const,
    backgroundColor: "#ffffff",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  approveButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px",
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
};

const statusStyles = {
  approved: { color: "green", fontSize: "20px" },
  rejected: { color: "red", fontSize: "20px" },
};

export default AllTimesheets;
