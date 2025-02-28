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

const Applications: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const columns: ColumnDef<(typeof data)[0]>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Applicant Name" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "date", header: "Application Date" },
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
        <h1>Applications Page</h1>
        <p>View and manage trip details here.</p>
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
      </div>
    </div>
  );
};

const styles = {
  container: { textAlign: "center" as const },
  tableWrapper: { display: "flex", justifyContent: "center" },
  table: { width: "80%", borderCollapse: "collapse" as const },
  th: {
    borderBottom: "2px solid black",
    padding: "12px",
    fontSize: "16px",
    textAlign: "left" as const,
  },
  td: {
    borderBottom: "1px solid gray",
    padding: "12px",
    fontSize: "14px",
    textAlign: "left" as const,
  },
};

export default Applications;
