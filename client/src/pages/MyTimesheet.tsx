import React, { useState, useEffect } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import axios from "axios";
import Navbar from "./Navbar";

const API_BASE_URL = "http://localhost:8000/api";

const MyTimesheet: React.FC = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

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
          const userTimesheets = allTimesheets.filter((timesheet: any) => timesheet.driver === user.email);
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
          const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
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
      <div style={{ textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {lines.map((line, idx) => (
          <div key={idx}>{line}</div>
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

  const table = useReactTable({
    data: timesheets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>My Timesheet</h1>
        <p>View and manage your timesheet here.</p>

        {loading && <p>Loading timesheets...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {!loading && !error && timesheets.length === 0 && <p>No timesheets found for {userEmail}.</p>}

        {!loading && !error && timesheets.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} style={styles.headerRow}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} style={styles.headerCell}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} style={styles.row}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={styles.cell}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  table: {
    width: "80%",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  headerRow: {
    backgroundColor: "#007bff",
    color: "white",
  },
  headerCell: {
    padding: "12px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  row: {
    backgroundColor: "#f9f9f9",
  },
  cell: {
    padding: "12px",
    borderBottom: "1px solid #ddd",
    textAlign: "center" as const,
  },
  error: {
    color: "red",
    fontSize: "1rem",
    fontWeight: "bold",
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