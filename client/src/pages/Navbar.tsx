import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaClock, FaTimes, FaSignOutAlt, FaUser, FaUsers, FaFileInvoice, FaClipboardList, FaPhoneAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";

const Navbar: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsNavOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNavOpen]);

  return (
    <>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => setIsNavOpen(!isNavOpen)} style={styles.menuButton}>
          {isNavOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <h1 style={styles.title}>Premier Choice</h1>
        <button onClick={() => { logout(); navigate("/"); }} style={styles.logoutButton}>
          <FaSignOutAlt size={20} /> Logout
        </button>
      </header>

      {/* Sidebar Navigation */}
      <nav ref={sidebarRef} style={{ ...styles.sidebar, left: isNavOpen ? "0px" : "-250px" }}>
        <ul style={styles.navList}>
          {user?.role === "driver" && (
            <>
                <li style={styles.navItem}>
                <Link to="/dashboard" style={styles.navLink}>
                    <MdDashboard size={20} /> Dashboard
                </Link>
                </li>

                <li style={styles.navItem}>
                <Link to="/my-timesheet" style={styles.navLink}>
                    <FaClock size={20} /> My Timesheet
                </Link>
                </li>
                <li style={styles.navItem}>
                    <Link to="/contact-us" style={styles.navLink}>
                    <FaPhoneAlt size={20} /> Contact Us
                    </Link>
                </li>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <li style={styles.navItem}>
                <Link to="/drivers" style={styles.navLink}>
                  <FaUsers size={20} /> Drivers
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/invoice" style={styles.navLink}>
                  <FaFileInvoice size={20} /> Invoice
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/applications" style={styles.navLink}>
                  <FaClipboardList size={20} /> Applications
                </Link>
              </li>
            </>
          )}

         
        </ul>
      </nav>
    </>
  );
};

// Define Styles
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "black",
    color: "#fff",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
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
    zIndex: 1000, // Ensure sidebar is above other content
  },
  navList: {
    listStyleType: "none",
    padding: "0",
  },
  navItem: {
    padding: "15px 20px",
    borderBottom: "1px solid #555",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navLink: {
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
  },
};

export default Navbar;