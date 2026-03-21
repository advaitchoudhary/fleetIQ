import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaUser,
  FaUsers,
  FaThLarge,
  FaFileInvoice,
  FaClipboardList,
  FaPhoneAlt,
  FaBell,
  FaKey,
  FaPowerOff,
  FaTruck,
  FaWrench,
  FaCheckSquare,
  FaGasPump,
  FaDollarSign,
  FaHistory,
  FaCreditCard,
  FaBox,
  FaShieldAlt,
  FaCalendarAlt,
  FaChartBar,
  FaCheckSquare as FaCheckSquareIcon,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";

const ADMIN_ROLES = ["admin", "company_admin", "dispatcher"];
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
  const { user, logout, isInsideOrg, activeOrgName, exitOrg } = useAuth();
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
      {/* Super-admin org context banner */}
      {isInsideOrg && (
        <div style={{ background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 24px", fontSize: "13px", fontWeight: 500, position: "sticky", top: 0, zIndex: 950 }}>
          <span>Viewing: <strong>{activeOrgName}</strong></span>
          <button
            onClick={exitOrg}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
          >
            ← Back to Org List
          </button>
        </div>
      )}

      {/* Header */}
      <header style={styles.header} data-nav-header>
        <div style={styles.rowDiv}>

          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => setIsNavOpen(!isNavOpen)}
            data-nav-title
          >
            <FaTruck size={20} style={{ color: "#818CF8" }} />
            <span style={styles.title}>
              Fleet<span style={{ color: "#818CF8" }}>IQ</span>
            </span>
          </div>
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
            <FaKey size={18} /><span className="hide-on-mobile"> Change Password</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={styles.logoutButton}
          >
            <FaPowerOff size={16} /><span className="hide-on-mobile"> Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <nav
        ref={sidebarRef}
        style={{ ...styles.sidebar, left: isNavOpen ? "0px" : "-260px" }}
      >
        {/* Sidebar logo */}
        <div style={styles.sidebarLogo}>
          <FaTruck size={20} style={{ color: "#818CF8" }} />
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>
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
                <Link to="/admin-home" style={styles.navLink}>
                  <FaThLarge size={18} /> Home
                </Link>
              </li>
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
              <li style={{ ...styles.navItem, marginTop: "12px" }}>
                <span style={{ display: "block", padding: "6px 24px 4px", fontSize: "10px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase" as const, letterSpacing: "1px" }}>
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
              <li style={{ ...styles.navItem, marginTop: "12px" }}>
                <span style={{ display: "block", padding: "6px 24px 4px", fontSize: "10px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase" as const, letterSpacing: "1px" }}>
                  Fleet Operations
                </span>
              </li>
              <li style={styles.navItem}>
                <Link to="/parts" style={styles.navLink}>
                  <FaBox size={18} /> Parts Inventory
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/warranties" style={styles.navLink}>
                  <FaShieldAlt size={18} /> Warranties
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/service-history" style={styles.navLink}>
                  <FaHistory size={18} /> Service History
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/cost-tracking" style={styles.navLink}>
                  <FaChartBar size={18} /> Cost Tracking
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/preventive-maintenance" style={styles.navLink}>
                  <FaCheckSquareIcon size={18} /> Preventive Maint.
                </Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/scheduling" style={styles.navLink}>
                  <FaCalendarAlt size={18} /> Scheduling
                </Link>
              </li>
              <li style={{ ...styles.navItem, marginTop: "12px" }}>
                <span style={{ display: "block", padding: "6px 24px 4px", fontSize: "10px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase" as const, letterSpacing: "1px" }}>
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
    padding: "0 24px",
    height: "56px",
    background: "#111827",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    position: "sticky",
    top: 0,
    zIndex: 900,
  },
  rowDiv: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "nowrap",
  },
  title: {
    fontSize: "18px",
    margin: 0,
    padding: 0,
    lineHeight: "1",
    fontWeight: 800,
    letterSpacing: "-0.3px",
    color: "#fff",
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
    left: "-260px",
    width: "260px",
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#111827",
    color: "#fff",
    transition: "left 0.3s ease",
    zIndex: 1000,
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "4px 0 16px rgba(0,0,0,0.3)",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px 24px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "8px",
  },
  navList: {
    listStyleType: "none",
    padding: "0 0 24px",
    margin: "0",
  },
  navItem: {
    listStyle: "none",
  },
  navLink: {
    color: "#9ca3af",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    fontWeight: 500,
    padding: "11px 24px",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    transition: "color 0.15s, background 0.15s",
    borderRadius: "0",
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
    padding: 0 12px !important;
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

nav ul li a:hover {
  background-color: rgba(255,255,255,0.07) !important;
  color: #fff !important;
  text-decoration: none;
}

nav ul li a:hover svg {
  color: #818CF8 !important;
}
`;
if (typeof document !== "undefined" && !document.getElementById("hide-on-mobile-style")) {
  style.id = "hide-on-mobile-style";
  document.head.appendChild(style);
}
