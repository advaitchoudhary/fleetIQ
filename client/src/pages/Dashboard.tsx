import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();

  // Sample dynamic table data
  const data = React.useMemo(
    () => [
      { id: 1, name: "John Doe", role: "Driver", status: "Active" },
      { id: 2, name: "Jane Smith", role: "Dispatcher", status: "Inactive" },
      { id: 3, name: "Michael Brown", role: "Supervisor", status: "Active" },
      { id: 4, name: "Alice Johnson", role: "Driver", status: "Active" },
      { id: 5, name: "Robert White", role: "Dispatcher", status: "Inactive" },
    ],
    []
  );

  // Define table columns
  const columns = React.useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "status", header: "Status" },
    ],
    []
  );

  // Use the new `useReactTable` API
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleLogout = () => {
    navigate("/logout"); // Redirect to Logout component
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => setIsNavOpen(!isNavOpen)} style={styles.menuButton}>
          {isNavOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <h1 style={styles.title}>Premier Choice</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <FaSignOutAlt size={20} /> Logout
        </button>
      </header>

      {/* Sidebar Navigation */}
      <nav style={{ ...styles.sidebar, left: isNavOpen ? "0px" : "-250px" }}>
        <ul style={styles.navList}>
            <li style={styles.navItem}><Link to="/dashboard" style={styles.navLink}>Home</Link></li>
            <li style={styles.navItem}><Link to="/drivers" style={styles.navLink}>Drivers</Link></li>
            <li style={styles.navItem}><Link to="/trips" style={styles.navLink}>Trips</Link></li>
            <li style={styles.navItem}><Link to="/accounts" style={styles.navLink}>Accounts</Link></li>
            <li style={styles.navItem}><Link to="/contact-us" style={styles.navLink}>Contact Us</Link></li>
            <li style={styles.navItem}><Link to="/reports" style={styles.navLink}>Reports</Link></li>
        </ul>
    </nav>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h2>User Details</h2>
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
    </div>
  );
};

// Define Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    backgroundColor: "#f4f4f4",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "linear-gradient(90deg, #4B0082, #6A0DAD)", 
    color: "#fff",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Soft shadow for depth
  },
  title: {
    fontSize: "1.5rem",
  },
  menuButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  logoutButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  sidebar: {
    position: "fixed" as const,
    top: "0",
    left: "-250px",
    width: "250px",
    height: "100%",
    backgroundColor: "#333",
    color: "#fff",
    paddingTop: "60px",
    transition: "0.3s",
  },
  navList: {
    listStyleType: "none",
    padding: "0",
  },
  navItem: {
    padding: "15px 20px",
    borderBottom: "1px solid #555",
    cursor: "pointer",
  },
  navLink: {
    color: "#fff",
    textDecoration: "none",
    display: "block",
    width: "100%",
    padding: "15px 20px",
  },
  mainContent: {
    marginLeft: "20px",
    marginTop: "20px",
  },
  table: {
    width: "90%",
    borderCollapse: "collapse" as const,
    marginTop: "20px",
  },
  th: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "10px",
    textAlign: "left" as const,
  },
  td: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left" as const,
  },
};

export default Dashboard;