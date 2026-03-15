import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaSignOutAlt,
  FaUser,
  FaUsers,
  FaFileInvoice,
  FaClipboardList,
  FaPhoneAlt,
  FaBell,
  FaLock,
  FaTruck,
  FaWrench,
  FaCheckSquare,
  FaGasPump,
  FaDollarSign,
  FaHistory,
  FaCreditCard,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";

const ADMIN_ROLES = ["admin", "company_admin", "super_admin", "dispatcher"];
import { API_BASE_URL } from "../utils/env";
import MenuImage from "../assets/logo.png";

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
      <header style={styles.header} data-nav-header>
        <div style={styles.rowDiv}>
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            style={styles.menuButton}
          >
            <img
              src={MenuImage}
              alt="Menu"
              style={{
                height: "32px",
                width: "32px",
                objectFit: "contain",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            />
          </button>
          <h1
            style={{ ...styles.title, cursor: "pointer" }}
            onClick={() => navigate(ADMIN_ROLES.includes(user?.role ?? "") ? "/users" : "/dashboard")}
            data-nav-title
          >
            Premier Choice
          </h1>
        </div>
        <div style={styles.authButtons} data-nav-auth>
          {ADMIN_ROLES.includes(user?.role ?? "") && (
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
                <div style={styles.notificationDropdown} ref={notificationRef} data-nav-dropdown>
                  <div style={styles.notificationHeader}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>Notifications</span>
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
                                  <span style={{ color: "#4F46E5", marginRight: "6px", fontSize: "10px" }}>●</span>
                                )}
                                {`${notification.message} on ${new Date(
                                  notification.createdAt
                                ).toLocaleString()}`}
                              </span>
                              <span
                                style={{ marginLeft: "12px", color: "#9ca3af", cursor: "pointer", fontSize: "13px" }}
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
            <FaLock size={20} /><span className="hide-on-mobile"> Change Password</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={styles.logoutButton}
          >
            <FaSignOutAlt size={20} /><span className="hide-on-mobile"> Logout</span>
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

          {ADMIN_ROLES.includes(user?.role ?? "") && (
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
                <Link to="/driver-applications" style={styles.navLink}>
                  <FaClipboardList size={20} /> Driver Applications
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/uploadDispatchDetails" style={styles.navLink}>
                  <MdDashboard size={20} /> Upload Dispatch Details
                </Link>
              </li>
              <li style={{ ...styles.navItem, borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: "8px", paddingTop: "8px" }}>
                <span style={{ ...styles.navLink, color: "#9ca3af", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.8px", cursor: "default", paddingBottom: "4px" }}>
                  Vehicle Management
                </span>
              </li>
              <li style={styles.navItem}>
                <Link to="/vehicles" style={styles.navLink}>
                  <FaTruck size={18} /> Vehicles
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/maintenance" style={styles.navLink}>
                  <FaWrench size={18} /> Maintenance
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/inspections" style={styles.navLink}>
                  <FaCheckSquare size={18} /> Inspections
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/fuel-logs" style={styles.navLink}>
                  <FaGasPump size={18} /> Fuel Logs
                </Link>
              </li>
              <li style={{ ...styles.navItem, borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: "8px", paddingTop: "8px" }}>
                <span style={{ ...styles.navLink, color: "#9ca3af", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.8px", cursor: "default", paddingBottom: "4px" }}>
                  Payments & Billing
                </span>
              </li>
              <li style={styles.navItem}>
                <Link to="/payments" style={styles.navLink}>
                  <FaDollarSign size={18} /> Driver Payments
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/payment-history" style={styles.navLink}>
                  <FaHistory size={18} /> Payment History
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/subscription" style={styles.navLink}>
                  <FaCreditCard size={18} /> Subscription
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#111827",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
  },
  rowDiv: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "nowrap",
  },
  title: {
    fontSize: "18px",
    margin: 0,
    padding: 0,
    lineHeight: "1",
    fontWeight: 700,
    letterSpacing: "-0.2px",
  },
  menuButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "background 0.2s ease-in-out",
  },
  notificationIconWrapper: {
    position: "relative",
    marginRight: "10px",
    marginTop: "4px",
  },
  notificationBell: {
    position: "relative",
    display: "inline-block",
  },
  unreadBadge: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    backgroundColor: "#dc2626",
    color: "white",
    borderRadius: "50%",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 5px",
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
    width: "380px",
    background: "#fff",
    color: "#374151",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
    zIndex: 1001,
    padding: "16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  notificationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "10px",
    borderBottom: "1px solid #f3f4f6",
    marginBottom: "8px",
  },
  markAllRead: {
    background: "none",
    border: "none",
    color: "#4F46E5",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  notificationTabs: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "10px",
  },
  tabButton: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "6px",
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
    fontSize: "13px",
  },
  notificationTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  notificationTableHeader: {
    borderBottom: "1px solid #e5e7eb",
    textAlign: "left",
    paddingBottom: "6px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  notificationTableCell: {
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.5",
  },
  acceptButton: {
    background: "#4F46E5",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    marginLeft: "5px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  declineButton: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  authButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  logoutButton: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  changePasswordButton: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  sidebar: {
    position: "fixed" as const,
    top: "0",
    left: "-250px",
    width: "250px",
    height: "100%",
    backgroundColor: "#1f2937",
    color: "#fff",
    paddingTop: "60px",
    transition: "left 0.3s ease",
    zIndex: 1000,
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
  },
  navList: {
    listStyleType: "none",
    padding: "0",
    margin: "0",
  },
  navItem: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    listStyle: "none",
  },
  navLink: {
    color: "#d1d5db",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: 500,
    padding: "14px 24px",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    transition: "color 0.2s, background 0.2s",
  },
};

export default Navbar;

// Responsive CSS for hiding labels on mobile
const style = document.createElement("style");
style.innerHTML = `
@media (max-width: 768px) {
  .hide-on-mobile {
    display: none;
  }
}

@media (max-width: 480px) {
  [data-nav-header] {
    padding: 10px 12px !important;
  }
  [data-nav-title] {
    font-size: 15px !important;
  }
  [data-nav-dropdown] {
    width: calc(100vw - 32px) !important;
    right: -60px !important;
  }
  [data-nav-auth] {
    gap: 4px !important;
  }
  [data-nav-auth] button {
    padding: 6px 8px !important;
    font-size: 12px !important;
  }
}

nav ul li:hover {
  background-color: rgba(255,255,255,0.06);
}

nav ul li a:hover {
  color: #fff !important;
  text-decoration: none;
}
`;
if (typeof document !== "undefined" && !document.getElementById("hide-on-mobile-style")) {
  style.id = "hide-on-mobile-style";
  document.head.appendChild(style);
}
