import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaClock,
  FaTimes,
  FaSignOutAlt,
  FaUser,
  FaUsers,
  FaFileInvoice,
  FaClipboardList,
  FaPhoneAlt,
  FaBell,
  FaLock,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";

const Navbar: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`);
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications(); // Always fetch on mount

  }, []); // Only run on component mount

  const handleMarkAllRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/markAllRead`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read", error);
    }
  }, [notifications]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsNavOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header style={styles.header}>
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          style={styles.menuButton}
        >
          {isNavOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
        <h1 style={styles.title}>Premier Choice</h1>
        <div style={styles.authButtons}>
          {user?.role === "admin" && (
            <div style={styles.notificationIconWrapper}>
              <div style={styles.notificationBell}>
                <FaBell
                  size={20}
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowNotification(!showNotification)}
                />
                {/* Dynamic unread badge */}
                {unreadCount > 0 && (
                  <div style={styles.unreadBadge}>{unreadCount}</div>
                )}
              </div>
              {showNotification && (
                <div style={styles.notificationDropdown} ref={notificationRef}>
                  <div style={styles.notificationHeader}>
                    <span style={{ fontWeight: "600", fontSize: "15px" }}>Notification</span>
                    <button
                      style={styles.markAllRead}
                      onClick={handleMarkAllRead}
                    >
                      Mark as read ✓
                    </button>
                  </div>
                  <table style={styles.notificationTable}>
                    <thead>
                      <tr>
                        <th style={styles.notificationTableHeader}>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications
                        .filter((n) => !n.read)
                        .map((notification, index) => (
                          <tr
                            key={index}
                            onClick={async () => {
                              try {
                                await fetch(`${API_BASE_URL}/notifications/${notification._id}/markRead`, {
                                  method: "POST",
                                });
                                const updatedNotifications = notifications.map((n, i) =>
                                  i === index ? { ...n, read: true } : n
                                );
                                setNotifications(updatedNotifications);
                                setUnreadCount(unreadCount - 1);
                              } catch (err) {
                                console.error("Failed to mark notification as read", err);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ ...styles.notificationTableCell, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>
                                {!notification.read && (
                                  <span style={{ color: "green", marginRight: "6px" }}>●</span>
                                )}
                                {`${notification.message} on ${new Date(
                                  notification.createdAt
                                ).toLocaleString()}`}
                              </span>
                              <span
                                style={{ marginLeft: "12px", color: "#888", cursor: "pointer" }}
                                onClick={async (e) => {
                                  e.stopPropagation(); // Prevent row click from firing
                                  try {
                                    await fetch(`${API_BASE_URL}/notifications/${notification._id}/markRead`, {
                                      method: "POST",
                                    });
                                    await fetch(`${API_BASE_URL}/notifications/${notification._id}`, {
                                      method: "DELETE",
                                    });
                                    const filtered = notifications.filter((_, i) => i !== index);
                                    setNotifications(filtered);
                                    setUnreadCount((prev) => prev - (notification.read ? 0 : 1));
                                  } catch (err) {
                                    console.error("Failed to delete notification", err);
                                  }
                                }}
                              >
                                ✕
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => navigate("/change-password")}
            style={styles.changePasswordButton}
          >
            <FaLock size={20} /> Change Password
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={styles.logoutButton}
          >
            <FaSignOutAlt size={20} /> Logout
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <nav
        ref={sidebarRef}
        style={{ ...styles.sidebar, left: isNavOpen ? "0px" : "-250px" }}
      >
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
                <Link to="/my-info" style={styles.navLink}>
                  <FaUser size={20} /> My Info
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
                <Link to="/users" style={styles.navLink}>
                  <FaUsers size={20} /> Users
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/invoice" style={styles.navLink}>
                  <FaFileInvoice size={20} /> Invoice
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/applications" style={styles.navLink}>
                  <FaClipboardList size={20} /> All Timesheets
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/enquiries" style={styles.navLink}>
                  <FaPhoneAlt size={20} /> Enquiries
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/uploadDispatchDetails" style={styles.navLink}>
                  <MdDashboard size={20} /> Upload Dispatch Details
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
const styles: { [key: string]: React.CSSProperties } = {
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
  notificationIconWrapper: {
    position: "relative",
    marginRight: "15px",
    marginTop: "7px",
  },
  notificationBell: {
    position: "relative",
    display: "inline-block",
  },
  unreadBadge: {
    position: "absolute",
    top: "-14px",
    right: "-14px",
    backgroundColor: "red",
    color: "white",
    borderRadius: "50%",
    fontSize: "10px",
    padding: "2px 6px",
    minWidth: "7px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDropdown: {
    position: "absolute",
    top: "35px",
    right: "0",
    width: "350px",
    background: "#fff",
    color: "#000",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 1001,
    padding: "15px",
  },
  notificationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "8px",
  },
  markAllRead: {
    background: "none",
    border: "none",
    color: "#5b21b6",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  notificationTabs: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "10px",
  },
  tabButton: {
    background: "#eee",
    border: "none",
    borderRadius: "5px",
    padding: "5px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  notificationList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    maxHeight: "300px",
    overflowY: "auto",
  },
  notificationItem: {
    marginBottom: "10px",
    fontSize: "14px",
  },
  notificationTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  notificationTableHeader: {
    borderBottom: "1px solid #ccc",
    textAlign: "left",
    paddingBottom: "5px",
  },
  notificationTableCell: {
    padding: "5px 0",
    borderBottom: "1px solid #eee",
  },
  acceptButton: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    marginLeft: "5px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  declineButton: {
    background: "#eee",
    color: "#333",
    border: "none",
    padding: "5px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  authButtons: {
    display: "flex",
    gap: "15px",
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
  changePasswordButton: {
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
