import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import { useAuth } from "../contexts/AuthContext";
import { FaBell, FaCheckDouble, FaTrash, FaCheck } from "react-icons/fa";

interface Notification {
  _id: string;
  message: string;
  field: string;
  read: boolean;
  createdAt: string;
}

const FIELD_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  timesheet_status: { label: "Timesheet", color: "var(--t-accent)",  bg: "var(--t-indigo-bg)" },
  payment:          { label: "Payment",   color: "var(--t-success)", bg: "var(--t-success-bg)" },
  default:          { label: "Update",    color: "var(--t-text-dim)", bg: "var(--t-hover-bg)" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA");
}

const DriverNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/notifications?email=${encodeURIComponent(user.email)}`,
        { headers }
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/markRead`, { method: "POST", headers });
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const deleteOne = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: "DELETE", headers });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/markAllRead`, { method: "POST", headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <style>{`
        [data-n-row] { transition: background 0.15s; }
        [data-n-row]:hover { background: var(--t-hover-bg) !important; }
        [data-n-action]:hover { opacity: 1 !important; }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          NOTIFICATIONS
        </div>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
              Notifications
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "var(--t-text-secondary)", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <FaCheckDouble size={13} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: filter === f ? 700 : 500,
                cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                background: filter === f ? "var(--t-accent)" : "var(--t-hover-bg)",
                color: filter === f ? "#fff" : "var(--t-text-dim)",
                border: filter === f ? "none" : "1px solid var(--t-border)",
              }}
            >
              {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--t-text-faint)", fontSize: "14px" }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px" }}>
            <FaBell size={36} style={{ color: "var(--t-text-ghost)", marginBottom: "16px" }} />
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--t-text-dim)" }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--t-text-ghost)" }}>
              You'll be notified when your timesheets are reviewed or payments are sent.
            </p>
          </div>
        ) : (
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--t-shadow)" }}>
            {displayed.map((n, i) => {
              const cfg = FIELD_CONFIG[n.field] || FIELD_CONFIG.default;
              return (
                <div
                  key={n._id}
                  data-n-row
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "16px 20px",
                    borderBottom: i < displayed.length - 1 ? "1px solid var(--t-border)" : "none",
                    background: n.read ? "transparent" : "var(--t-indigo-bg)",
                    cursor: n.read ? "default" : "pointer",
                  }}
                  onClick={() => { if (!n.read) markRead(n._id); }}
                >
                  {/* Unread dot */}
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.read ? "transparent" : "var(--t-accent)", flexShrink: 0 }} />

                  {/* Tag + message */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: cfg.bg, color: cfg.color, letterSpacing: "0.3px" }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--t-text-ghost)" }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: n.read ? 400 : 600, color: n.read ? "var(--t-text-dim)" : "var(--t-text)" }}>
                      {n.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {!n.read && (
                      <button
                        data-n-action
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--t-border)", background: "var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t-accent)", opacity: 0.7 }}
                      >
                        <FaCheck size={11} />
                      </button>
                    )}
                    <button
                      data-n-action
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); deleteOne(n._id); }}
                      style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--t-border)", background: "var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t-error)", opacity: 0.7 }}
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverNotifications;
