import React from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import Navbar from "./Navbar";

const MyTimesheet: React.FC = () => {
  const columns = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "start_time",
      header: "Start Time",
    },
    {
      accessorKey: "end_time",
      header: "End Time",
    },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
    },
    {
      accessorKey: "location",
      header: "Location",
    },
  ];

  const data = [
    { date: "2025-02-26", start_time: "08:00 AM", end_time: "04:00 PM", total_hours: 8, location: "Toronto" },
    { date: "2025-02-27", start_time: "09:00 AM", end_time: "05:30 PM", total_hours: 8.5, location: "Mississauga" },
    { date: "2025-02-28", start_time: "07:30 AM", end_time: "03:45 PM", total_hours: 8.25, location: "Brampton" },
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
        <h1>My Timesheet</h1>
        <p>View and manage your timesheet here.</p>
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
};

export default MyTimesheet;