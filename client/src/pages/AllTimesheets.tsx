import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Navbar from "./Navbar";

const API_BASE_URL = "http://localhost:8000/api";

const AllTimesheets: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

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
  
      const dateFormatted = new Date(timesheet.date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  
      csvRows.push([
        dateFormatted,
        start,
        end,
        totalHours,
        `"${(timesheet.comments || "").replace(/"/g, '""')}"`,
        timesheet.status
      ].join(","));
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

  const updateTimesheetStatus = async (id: string, status: "approved" | "rejected") => {
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
      await axios.put(`${API_BASE_URL}/update/timesheet/${selectedTimesheet._id}`, selectedTimesheet);
      setData((prev) =>
        prev.map((t) => (t._id === selectedTimesheet._id ? selectedTimesheet : t))
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
        <button onClick={() => openEditModal(row.original)} style={styles.editIcon}>
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
    { accessorKey: "plannedKM", header: "Planned KM" },
    { accessorKey: "totalStops", header: "Total Stops" },
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
                <button style={styles.approveButton} onClick={() => updateTimesheetStatus(_id, "approved")}>✔️ Approve</button>
                <button style={styles.rejectButton} onClick={() => updateTimesheetStatus(_id, "rejected")}>❌ Reject</button>
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
              <button onClick={() => exportTimesheets(7)} style={styles.optionButton}>Last 7 Days</button>
              <button onClick={() => exportTimesheets(15)} style={styles.optionButton}>Last 15 Days</button>
              <button onClick={() => exportTimesheets(30)} style={styles.optionButton}>Last Month</button>
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
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
              {Object.entries(selectedTimesheet).map(([key, value]) => (
                key !== "_id" && (
                  <div key={key} style={{ marginBottom: "10px", textAlign: "left" }}>
                    <label style={{ fontWeight: "bold" }}>{key}:</label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={styles.input}
                    />
                  </div>
                )
              ))}
              <div style={{ marginTop: "20px" }}>
                <button style={styles.approveButton} onClick={handleUpdate}>Save Changes</button>
                <button style={styles.rejectButton} onClick={() => setEditModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { textAlign: "center" as const, padding: "20px" },
  tableWrapper: { display: "flex", justifyContent: "center", marginTop: "20px" },
  table: { width: "90%", borderCollapse: "collapse" as const, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" },
  th: {
    borderBottom: "2px solid black",
    padding: "12px",
    fontSize: "16px",
    textAlign: "left" as const,
    backgroundColor: "#007bff",
    color: "white",
  },
  td: {
    borderBottom: "1px solid gray",
    padding: "12px",
    fontSize: "14px",
    textAlign: "left" as const,
    backgroundColor: "#f9f9f9",
  },
  actions: { display: "flex", gap: "8px" },
  approveButton: {
    backgroundColor: "green",
    color: "white",
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rejectButton: {
    backgroundColor: "red",
    color: "white",
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  readOnly: { color: "gray", fontStyle: "italic" },
  error: { color: "red", fontSize: "16px" },
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
    padding: "16px",
    borderRadius: "8px",
    width: "600px",         // wider modal
    maxHeight: "80vh",      // 80% of viewport height
    overflowY: "auto" as const,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  exportButton: { // New style for the export button
    padding: '10px 20px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  optionButton: {
    margin: '5px',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
