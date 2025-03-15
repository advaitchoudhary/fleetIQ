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

  useEffect(() => {
    fetchTimesheets();
  }, []);

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

  const columns: ColumnDef<(typeof data)[0]>[] = [
    { accessorKey: "_id", header: "ID" },
    { accessorKey: "driver", header: "Driver" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "startTime", header: "Start Time" },
    { accessorKey: "endTime", header: "End Time" },
    { accessorKey: "startKM", header: "Start KM" },
    { accessorKey: "endKM", header: "End KM" },
    { accessorKey: "plannedKM", header: "Planned KM" },
    { accessorKey: "totalStops", header: "Total Stops" },
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
  error: {
    color: "red",
    fontSize: "16px",
  },
};

export default AllTimesheets;