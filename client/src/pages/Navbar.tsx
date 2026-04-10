import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
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
  FaMapMarkerAlt,
  FaLock,
  FaFileAlt,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md"; // Material Dashboard Icon
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const ADMIN_ROLES = ["admin", "company_admin", "dispatcher"];
import { API_BASE_URL } from "../utils/env";

const Navbar: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [headerOrgName, setHeaderOrgName] = useState<string>("");
  const [driverUnreadCount, setDriverUnreadCount] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarScrollRef = useRef<number>(0);

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

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/subscriptions/current`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setSubscriptionPlan(data.plan || null);
      } catch {
        // silently ignore — gate defaults to open if fetch fails
      }
    };
    fetchSubscription();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE_URL}/organizations/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.name) setHeaderOrgName(data.name); })
      .catch(() => {});
  }, []);

  const { user, logout, isInsideOrg, activeOrgName, exitOrg } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser?.role !== "driver" || !parsedUser?.email) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/notifications?email=${encodeURIComponent(parsedUser.email)}&read=false`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setDriverUnreadCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [location.pathname]);

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

  const renderNavItem = (to: string, icon: React.ReactNode, label: string, isDriver = false, locked = false) => {
    if (locked) {
      return (
        <li key={to} style={{ ...styles.navItem, position: "relative" as const }}>
          <div
            title={`Upgrade your plan to access ${label}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: isSidebarCollapsed ? "10px 0" : "9px 14px",
              margin: isSidebarCollapsed ? "2px 8px" : "2px 8px",
              borderRadius: "10px",
              cursor: "not-allowed",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              color: "var(--t-text-ghost)",
              fontSize: "13px",
              fontWeight: 500,
              userSelect: "none" as const,
            }}
          >
            <span style={{ opacity: 0.45, flexShrink: 0, display: "flex" }}>{icon}</span>
            {!isSidebarCollapsed && (
              <>
                <span style={{ flex: 1, opacity: 0.45 }}>{label}</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "9px", fontWeight: 700, letterSpacing: "0.4px",
                  color: "var(--t-accent)", opacity: 0.7,
                  background: "var(--t-indigo-bg)",
                  border: "1px solid rgba(79,70,229,0.2)",
                  borderRadius: "4px", padding: "2px 5px", flexShrink: 0,
                }}>
                  <FaLock size={7} />UPGRADE
                </span>
              </>
            )}
            {isSidebarCollapsed && (
              <FaLock size={8} style={{ position: "absolute", bottom: "6px", right: "6px", color: "var(--t-accent)", opacity: 0.7 }} />
            )}
          </div>
        </li>
      );
    }
    return (
      <li style={{ ...styles.navItem, position: "relative" as const }}>
        <Link to={to} style={getLinkStyle(to, isDriver)} {...(isDriver ? { "data-driver": "true" } : {})}>
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
  };
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

  // Restore sidebar scroll position after every re-render (e.g. route change)
  useLayoutEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = sidebarScrollRef.current;
    }
  });

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
          background: "var(--t-accent)", color: "#fff", display: "flex", alignItems: "center",
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
        {/* Left: org / company name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {(() => {
            const name = headerOrgName || (user?.role === "driver" ? (user as any).orgName : "");
            if (!name) return null;
            return (
              <>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--t-accent)", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px" }}>
                  {name}
                </span>
              </>
            );
          })()}
        </div>

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
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--t-text)" }}>Notifications</span>
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
                                const updatedNotifications = notifications.map((n) =>
                                  n._id === notification._id ? { ...n, read: true } : n
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
                                  <span style={{ color: "var(--t-accent)", marginRight: "6px", fontSize: "10px" }}>●</span>
                                )}
                                {`${notification.message} on ${new Date(
                                  notification.createdAt
                                ).toLocaleString()}`}
                              </span>
                              <span
                                style={{ marginLeft: "12px", color: "var(--t-text-faint)", cursor: "pointer", fontSize: "13px" }}
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
                                    const filtered = notifications.filter((n) => n._id !== notification._id);
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
        ref={sidebarRef}
        onScroll={(e) => { sidebarScrollRef.current = (e.currentTarget as HTMLElement).scrollTop; }}
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
          borderBottom: "1px solid var(--t-border)",
          flexShrink: 0,
        }}>
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FaTruck size={18} style={{ color: "var(--t-accent-light)" }} />
              <span style={{ fontSize: "17px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
                Fleet<span style={{ color: "var(--t-accent-light)" }}>IQ</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: "var(--t-hover-bg)",
              border: "1px solid var(--t-border-strong)",
              borderRadius: "8px",
              color: "var(--t-text-faint)",
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

        <ul style={styles.navList}>
          {user?.role === "driver" && (
            <>
              {renderNavItem("/dashboard",             <MdDashboard size={18} />,   "Home",               true)}
              {renderNavItem("/my-timesheet-submit", <FaFileAlt size={18} />,       "Submit Timesheet",   true)}
              {renderNavItem("/my-timesheet",        <FaClock size={18} />,         "My Timesheets",      true)}
              {renderNavItem("/my-pay-stubs",        <FaDollarSign size={18} />,    "Pay Stubs",          true)}
              {renderNavItem("/my-info",             <FaUser size={18} />,          "My Info",            true)}
              {renderNavItem("/my-notifications",
                <div style={{ position: "relative", display: "flex" }}>
                  <FaBell size={18} />
                  {driverUnreadCount > 0 && (
                    <span style={{ position: "absolute", top: "-5px", right: "-6px", background: "var(--t-error)", color: "#fff", fontSize: "9px", fontWeight: 700, minWidth: "14px", height: "14px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", lineHeight: 1 }}>
                      {driverUnreadCount > 9 ? "9+" : driverUnreadCount}
                    </span>
                  )}
                </div>,
                "Notifications", true
              )}
              {renderNavItem("/contact-us",          <FaPhoneAlt size={18} />,      "Contact Us",         true)}
            </>
          )}

          {ADMIN_ROLES.includes(user?.role ?? "") && (
            <>
              {(() => {
                const isSuperAdmin = user?.role === "admin";
                const hasDriver = isSuperAdmin || subscriptionPlan === "driver" || subscriptionPlan === "bundle";
                const hasVehicle = isSuperAdmin || subscriptionPlan === "vehicle" || subscriptionPlan === "bundle";

                return (
                  <>
                    {renderNavItem("/admin-home",          <FaThLarge size={16} />,       "Home")}

                    <li style={{ ...styles.navItem, marginTop: "14px" }}>
                      {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Driver Management</span> : <div style={styles.sectionDivider} />}
                    </li>
                    {renderNavItem("/users",               <FaUsers size={16} />,         "Drivers",             false, !hasDriver)}
                    {renderNavItem("/invoice",             <FaFileInvoice size={16} />,   "Invoice",             false, !hasDriver)}
                    {renderNavItem("/applications",        <FaClipboardList size={16} />, "All Timesheets",      false, !hasDriver)}
                    {renderNavItem("/inquiries",           <FaPhoneAlt size={16} />,      "Inquiries",           false, !hasDriver)}
                    {renderNavItem("/driver-applications", <FaClipboardList size={16} />, "Driver Applications", false, !hasDriver)}

                    <li style={{ ...styles.navItem, marginTop: "14px" }}>
                      {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Vehicle Management</span> : <div style={styles.sectionDivider} />}
                    </li>
                    {renderNavItem("/vehicles",               <FaTruck size={16} />,            "Vehicles",           false, !hasVehicle)}
                    {renderNavItem("/tracking",               <FaMapMarkerAlt size={16} />,     "Live Tracking",      false, !hasVehicle)}
                    {renderNavItem("/ifta",                   <FaFileAlt size={16} />,          "IFTA Reports",       false, !hasVehicle)}
                    {renderNavItem("/maintenance",            <FaWrench size={16} />,           "Maintenance",        false, !hasVehicle)}
                    {renderNavItem("/inspections",            <FaCheckSquare size={16} />,      "Inspections",        false, !hasVehicle)}
                    {renderNavItem("/fuel-logs",              <FaGasPump size={16} />,          "Fuel Logs",          false, !hasVehicle)}

                    <li style={{ ...styles.navItem, marginTop: "14px" }}>
                      {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Fleet Operations</span> : <div style={styles.sectionDivider} />}
                    </li>
                    {renderNavItem("/parts",                  <FaBox size={16} />,              "Parts Inventory",    false, !hasVehicle)}
                    {renderNavItem("/warranties",             <FaShieldAlt size={16} />,        "Warranties",         false, !hasVehicle)}
                    {renderNavItem("/service-history",        <FaHistory size={16} />,          "Service History",    false, !hasVehicle)}
                    {renderNavItem("/cost-tracking",          <FaChartBar size={16} />,         "Cost Tracking",      false, !hasVehicle)}
                    {renderNavItem("/preventive-maintenance", <FaCheckSquareIcon size={16} />,  "Preventive Maint.",  false, !hasVehicle)}
                    {renderNavItem("/scheduling",             <FaCalendarAlt size={16} />,      "Scheduling",         false, !hasVehicle)}

                    <li style={{ ...styles.navItem, marginTop: "14px" }}>
                      {!isSidebarCollapsed ? <span style={styles.sectionHeader}>Payments & Billing</span> : <div style={styles.sectionDivider} />}
                    </li>
                    {renderNavItem("/payments",               <FaDollarSign size={16} />,       "Driver Payments",    false, !hasDriver)}
                    {renderNavItem("/payment-history",        <FaHistory size={16} />,          "Payment History",    false, !hasDriver)}
                    {renderNavItem("/subscription",           <FaCreditCard size={16} />,       "Subscription")}
                  </>
                );
              })()}
            </>
          )}
        </ul>

        {/* Theme toggle */}
        <div style={{
          padding: isSidebarCollapsed ? "8px" : "8px 10px",
          margin: "0 0 6px",
          display: "flex",
          justifyContent: isSidebarCollapsed ? "center" : "stretch",
        }}>
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: isSidebarCollapsed ? "9px 0" : "9px 14px",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              background: "var(--t-input-bg)",
              border: "1px solid var(--t-border)",
              borderRadius: "10px",
              cursor: "pointer",
              color: "var(--t-text-faint)",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>
              {isDark ? "☀️" : "🌙"}
            </span>
            {!isSidebarCollapsed && (
              <span style={{ color: "var(--t-text-faint)" }}>
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>
        </div>

        {/* Driver profile block at bottom */}
        {user?.role === "driver" && (
          <div style={{
            ...styles.adminProfile,
            ...(isSidebarCollapsed ? { justifyContent: "center", padding: "12px 0", margin: "0 8px 14px" } : {}),
          }}>
            <div style={styles.driverAvatar}>
              {((user as any).name || "D").charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={styles.adminName}>{(user as any).name || "Driver"}</div>
                <div style={styles.adminRole}>
                  {(user as any).driverId || "Driver"}
                </div>
              </div>
            )}
          </div>
        )}

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
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    height: "56px",
    background: "var(--t-bg)",
    borderBottom: "1px solid var(--t-border)",
    color: "var(--t-text)",
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "var(--t-shadow)",
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
    color: "var(--t-text)",
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
    backgroundColor: "var(--t-error)",
    color: "var(--t-text)",
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
    background: "var(--t-modal-bg)",
    color: "var(--t-text-secondary)",
    borderRadius: "12px",
    border: "1px solid var(--t-border)",
    boxShadow: "var(--t-shadow-lg)",
    zIndex: 1001,
    padding: "16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  notificationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "10px",
    borderBottom: "1px solid var(--t-border)",
    marginBottom: "8px",
  },
  markAllRead: {
    background: "none",
    border: "none",
    color: "var(--t-accent-light)",
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
    background: "var(--t-hover-bg)",
    border: "1px solid var(--t-border)",
    borderRadius: "6px",
    color: "var(--t-text-faint)",
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
    borderBottom: "1px solid var(--t-border)",
    textAlign: "left",
    paddingBottom: "6px",
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  notificationTableCell: {
    padding: "10px 0",
    borderBottom: "1px solid var(--t-stripe)",
    fontSize: "12px",
    color: "var(--t-text-muted)",
    lineHeight: "1.5",
  },
  acceptButton: {
    background: "var(--t-accent)",
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
    background: "var(--t-hover-bg)",
    color: "var(--t-text-faint)",
    border: "1px solid var(--t-border-strong)",
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
    background: "var(--t-hover-bg)",
    border: "1px solid var(--t-border-strong)",
    color: "var(--t-text)",
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
    background: "var(--t-hover-bg)",
    border: "1px solid var(--t-border-strong)",
    color: "var(--t-text)",
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
    backgroundColor: "var(--t-surface)",
    color: "var(--t-text)",
    transition: "left 0.3s ease, width 0.3s ease",
    zIndex: 1000,
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "var(--t-shadow)",
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
    color: "var(--t-text-faint)",
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
    color: "var(--t-text-ghost)",
    textTransform: "uppercase" as const,
    letterSpacing: "1.1px",
  },
  sectionDivider: {
    height: "1px",
    background: "var(--t-border)",
    margin: "0 14px",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    margin: "auto 10px 14px",
    background: "var(--t-surface-alt)",
    border: "1px solid var(--t-border)",
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
    color: "var(--t-text)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  adminRole: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--t-text-dim)",
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
    color: "var(--t-text)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "4px",
  },
  driverIdBadge: {
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--t-accent-light)",
    background: "var(--t-indigo-bg)",
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
    color: "var(--t-success)",
    background: "var(--t-success-bg)",
    borderRadius: "4px",
    padding: "2px 6px",
    display: "inline-block",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  driverNavLink: {
    color: "var(--t-text-faint)",
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
  background-color: var(--t-hover-bg) !important;
  color: var(--t-text-secondary) !important;
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
nav ul li a[data-driver="true"]:hover {
  background-color: rgba(99,102,241,0.12) !important;
  color: var(--t-accent) !important;
}
`;
if (typeof document !== "undefined" && !document.getElementById("hide-on-mobile-style")) {
  style.id = "hide-on-mobile-style";
  document.head.appendChild(style);
}
