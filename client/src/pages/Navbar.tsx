import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";

const ADMIN_ROLES = ["admin", "company_admin", "dispatcher"];
import { API_BASE_URL } from "../utils/env";

const Navbar: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return; // Silently skip if unauthorized or server error
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/notifications/markAllRead`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const getLinkStyle = (path: string, isDriver = false): React.CSSProperties => {
    const active = isActive(path);
    const base = active ? styles.navLinkActive : (isDriver ? styles.driverNavLink : styles.navLink);
    if (isSidebarCollapsed) {
      if (active) {
        return {
          color: "#fff",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "0",
          margin: "3px auto",
          width: "44px",
          height: "44px",
          cursor: "pointer",
          borderRadius: "13px",
          background: "linear-gradient(135deg, #4F46E5 0%, #6366f1 100%)",
          boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
          boxSizing: "border-box" as const,
        };
      }
      return { ...base, justifyContent: "center", padding: "10px 0", margin: "2px 8px", gap: 0 };
    }
    return base;
  };

  const renderNavItem = (to: string, icon: React.ReactNode, label: string, isDriver = false) => (
    <li style={{ ...styles.navItem, position: "relative" as const }}>
      <Link to={to} style={getLinkStyle(to, isDriver)}>
        {icon}{!isSidebarCollapsed && <span>{label}</span>}
      </Link>
      {isActive(to) && !isSidebarCollapsed && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "3px",
          height: "26px",
          background: "linear-gradient(180deg, #818CF8 0%, #4F46E5 100%)",
          borderRadius: "3px 0 0 3px",
        }} />
      )}
    </li>
  );
  const notificationRef = useRef<HTMLDivElement>(null);

  // CSS injection: push page content right and down to avoid sidebar/header overlap
  useEffect(() => {
    let styleEl = document.getElementById("fleetiq-sidebar-offset") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style") as HTMLStyleElement;
      styleEl.id = "fleetiq-sidebar-offset";
      document.head.appendChild(styleEl);
    }
    const w = isSidebarCollapsed ? 72 : 260;
    const topOffset = isInsideOrg ? 89 : 56;
    styleEl.textContent = `
      div:has(> header[data-nav-header]) {
        padding-left: ${w}px !important;
        padding-top: ${topOffset}px !important;
        transition: padding-left 0.3s ease;
        box-sizing: border-box;
      }
    `;
  }, [isSidebarCollapsed, isInsideOrg]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        <div style={{
          background: "#4F46E5", color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "7px 24px", fontSize: "13px", fontWeight: 500,
          position: "fixed", top: 0, zIndex: 950,
          left: isSidebarCollapsed ? "72px" : "260px",
          width: `calc(100% - ${isSidebarCollapsed ? 72 : 260}px)`,
          transition: "left 0.3s ease, width 0.3s ease",
        }}>
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
      <header style={{
        ...styles.header,
        top: isInsideOrg ? "33px" : "0",
        left: isSidebarCollapsed ? "72px" : "260px",
        width: `calc(100% - ${isSidebarCollapsed ? 72 : 260}px)`,
        transition: "left 0.3s ease, width 0.3s ease",
        position: "fixed",
      }} data-nav-header>
        <div style={styles.authButtons} data-nav-auth>
          {ADMIN_ROLES.includes(user?.role ?? "") && (
            <div style={styles.notificationIconWrapper}>
              <div style={styles.notificationBell}>
                <FaBell
                  size={16}
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
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#f3f4f6" }}>Notifications</span>
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
                                const token = localStorage.getItem("token");
                                const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                                await fetch(`${API_BASE_URL}/notifications/${notification._id}/markRead`, {
                                  method: "POST",
                                  headers: authHeaders,
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
                                    const token = localStorage.getItem("token");
                                    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
                                    await fetch(`${API_BASE_URL}/notifications/${notification._id}/markRead`, {
                                      method: "POST",
                                      headers: authHeaders,
                                    });
                                    await fetch(`${API_BASE_URL}/notifications/${notification._id}`, {
                                      method: "DELETE",
                                      headers: authHeaders,
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
            <FaKey size={16} /><span className="hide-on-mobile"> Change Password</span>
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
        style={{
          ...styles.sidebar,
          left: "0px",
          width: isSidebarCollapsed ? "72px" : "260px",
        }}
      >
        {/* Sidebar header: logo + collapse toggle — always 56px to align with page header */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: isSidebarCollapsed ? "center" : "space-between",
          padding: isSidebarCollapsed ? "0 14px" : "0 14px 0 20px",
          height: "56px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FaTruck size={18} style={{ color: "#818CF8" }} />
              <span style={{ fontSize: "17px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
                Fleet<span style={{ color: "#818CF8" }}>IQ</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "26px",
              height: "26px",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {isSidebarCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>
        </div>

        {/* Driver profile block */}
        {user?.role === "driver" && (
          <div style={{
            ...styles.driverProfile,
            ...(isSidebarCollapsed ? { justifyContent: "center", padding: "12px 0", margin: "4px 8px" } : {}),
          }}>
            <div style={styles.driverAvatar}>
              {(user.name || "D").charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div style={styles.driverProfileInfo}>
                <div style={styles.driverProfileName}>{user.name || "Driver"}</div>
                {(user as any).driverId && (
                  <div style={styles.driverIdBadge}>{(user as any).driverId}</div>
                )}
                {(user as any).orgName && (
                  <div style={styles.driverOrgBadge}>{(user as any).orgName}</div>
                )}
              </div>
            )}
          </div>
        )}

        <ul style={styles.navList}>
          {user?.role === "driver" && (
            <>
              {renderNavItem("/dashboard",          <MdDashboard size={18} />,    "Dashboard",          true)}
              {renderNavItem("/my-timesheet",        <FaClock size={18} />,         "My Timesheet",       true)}
              {renderNavItem("/my-info",             <FaUser size={18} />,          "My Info",            true)}
              {renderNavItem("/contact-us",          <FaPhoneAlt size={18} />,      "Contact Us",         true)}
            </>
          )}

          {ADMIN_ROLES.includes(user?.role ?? "") && (
            <>
              {renderNavItem("/admin-home",          <FaThLarge size={16} />,       "Home")}
              {renderNavItem("/users",               <FaUsers size={16} />,         "Users")}
              {renderNavItem("/invoice",             <FaFileInvoice size={16} />,   "Invoice")}
              {renderNavItem("/applications",        <FaClipboardList size={16} />, "All Timesheets")}
              {renderNavItem("/enquiries",           <FaPhoneAlt size={16} />,      "Enquiries")}
              {renderNavItem("/driver-applications", <FaClipboardList size={16} />, "Driver Applications")}

              <li style={{ ...styles.navItem, marginTop: "14px" }}>
                {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Vehicle Management</span> : <div style={styles.sectionDivider} />}
              </li>
              {renderNavItem("/vehicles",            <FaTruck size={16} />,         "Vehicles")}
              {renderNavItem("/maintenance",         <FaWrench size={16} />,        "Maintenance")}
              {renderNavItem("/inspections",         <FaCheckSquare size={16} />,   "Inspections")}
              {renderNavItem("/fuel-logs",           <FaGasPump size={16} />,       "Fuel Logs")}

              <li style={{ ...styles.navItem, marginTop: "14px" }}>
                {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Fleet Operations</span> : <div style={styles.sectionDivider} />}
              </li>
              {renderNavItem("/parts",               <FaBox size={16} />,           "Parts Inventory")}
              {renderNavItem("/warranties",          <FaShieldAlt size={16} />,     "Warranties")}
              {renderNavItem("/service-history",     <FaHistory size={16} />,       "Service History")}
              {renderNavItem("/cost-tracking",       <FaChartBar size={16} />,      "Cost Tracking")}
              {renderNavItem("/preventive-maintenance", <FaCheckSquareIcon size={16} />, "Preventive Maint.")}
              {renderNavItem("/scheduling",          <FaCalendarAlt size={16} />,   "Scheduling")}

              <li style={{ ...styles.navItem, marginTop: "14px" }}>
                {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Payments & Billing</span> : <div style={styles.sectionDivider} />}
              </li>
              {renderNavItem("/payments",            <FaDollarSign size={16} />,    "Driver Payments")}
              {renderNavItem("/payment-history",     <FaHistory size={16} />,       "Payment History")}
              {renderNavItem("/subscription",        <FaCreditCard size={16} />,    "Subscription")}
            </>
          )}
        </ul>

        {/* Admin profile block at bottom */}
        {ADMIN_ROLES.includes(user?.role ?? "") && (
          <div style={{
            ...styles.adminProfile,
            ...(isSidebarCollapsed ? { justifyContent: "center", padding: "12px 0", margin: "0 8px 14px" } : {}),
          }}>
            <div style={styles.adminAvatar}>
              {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={styles.adminName}>{user?.name || user?.email || "Admin"}</div>
                <div style={styles.adminRole}>
                  {user?.role === "company_admin" ? "Company Admin" : user?.role === "dispatcher" ? "Dispatcher" : "Admin"}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0 24px",
    height: "56px",
    background: "#0d1117",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "0 1px 16px rgba(0,0,0,0.4)",
    position: "fixed",
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
    background: "#161b22",
    color: "#e5e7eb",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    zIndex: 1001,
    padding: "16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  notificationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    marginBottom: "8px",
  },
  markAllRead: {
    background: "none",
    border: "none",
    color: "#818CF8",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  notificationTabs: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "10px",
  },
  tabButton: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    color: "#9ca3af",
    padding: "5px 10px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "Inter, system-ui, sans-serif",
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
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    textAlign: "left",
    paddingBottom: "6px",
    fontSize: "9px",
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  notificationTableCell: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "12px",
    color: "#d1d5db",
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
    fontFamily: "Inter, system-ui, sans-serif",
  },
  declineButton: {
    background: "rgba(255,255,255,0.06)",
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
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
    overflowX: "hidden",
    backgroundColor: "#0d1117",
    color: "#fff",
    transition: "left 0.3s ease, width 0.3s ease",
    zIndex: 1000,
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "4px 0 24px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
  },
  navList: {
    listStyleType: "none",
    padding: "0 0 8px",
    margin: "0",
    flex: 1,
  },
  navItem: {
    listStyle: "none",
  },
  navLink: {
    color: "#9ca3af",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13.5px",
    fontWeight: 500,
    padding: "9px 14px",
    margin: "1px 10px",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "color 0.15s, background 0.15s",
    boxSizing: "border-box",
  },
  navLinkActive: {
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13.5px",
    fontWeight: 600,
    padding: "9px 14px",
    margin: "1px 10px",
    cursor: "pointer",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4F46E5 0%, #6366f1 100%)",
    boxShadow: "0 3px 10px rgba(79,70,229,0.35)",
    boxSizing: "border-box",
  },
  sectionHeader: {
    display: "block",
    padding: "4px 24px",
    fontSize: "10px",
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase" as const,
    letterSpacing: "1.1px",
  },
  sectionDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "0 14px",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    margin: "auto 10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    flexShrink: 0,
  },
  adminAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4F46E5, #818CF8)",
    border: "2px solid rgba(129,140,248,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  adminName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#f3f4f6",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  adminRole: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#6b7280",
    marginTop: "1px",
  },
  driverProfile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px 20px",
    margin: "8px 12px 4px",
    background: "linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(99,102,241,0.15) 100%)",
    border: "1px solid rgba(129,140,248,0.25)",
    borderRadius: "12px",
  },
  driverAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4F46E5, #818CF8)",
    border: "2px solid rgba(129,140,248,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  driverProfileInfo: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  driverProfileName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#f9fafb",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "4px",
  },
  driverIdBadge: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#a5b4fc",
    background: "rgba(79,70,229,0.3)",
    borderRadius: "4px",
    padding: "2px 6px",
    display: "inline-block",
    marginBottom: "3px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  driverOrgBadge: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#6ee7b7",
    background: "rgba(16,185,129,0.15)",
    borderRadius: "4px",
    padding: "2px 6px",
    display: "inline-block",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  driverNavLink: {
    color: "#c7d2fe",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13.5px",
    fontWeight: 500,
    padding: "9px 14px",
    margin: "1px 10px",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "color 0.15s, background 0.15s",
    boxSizing: "border-box",
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
  color: #e5e7eb !important;
  text-decoration: none;
}

nav ul li a:hover svg {
  color: #a5b4fc !important;
}

/* Active links — keep gradient, don't let hover override */
nav ul li a[style*="linear-gradient"]:hover {
  background: linear-gradient(135deg, #4F46E5 0%, #6366f1 100%) !important;
  color: #fff !important;
}

/* Driver nav links get an indigo tinted hover */
nav ul li a[href="/dashboard"]:hover,
nav ul li a[href="/my-timesheet"]:hover,
nav ul li a[href="/my-info"]:hover,
nav ul li a[href="/contact-us"]:hover {
  background-color: rgba(99,102,241,0.18) !important;
  color: #e0e7ff !important;
}
`;
if (typeof document !== "undefined" && !document.getElementById("hide-on-mobile-style")) {
  style.id = "hide-on-mobile-style";
  document.head.appendChild(style);
}
