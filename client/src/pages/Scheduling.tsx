import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENT_COLORS: Record<string, string> = {
  maintenance: "#4F46E5",
  pm_due: "#f59e0b",
};

const emptyForm = {
  vehicleId: "", title: "", type: "preventive", scheduledDate: "", notes: "",
};

const Scheduling: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize headers so fetchCalendar's useCallback doesn't become stale when
  // a new render creates a new headers object reference.
  const headers = useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, []);

  const fetchCalendar = useCallback(async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const [calRes, upRes, vRes] = await Promise.all([
        fetch(`${API_BASE_URL}/scheduling/calendar?month=${month + 1}&year=${year}`, { headers }),
        fetch(`${API_BASE_URL}/scheduling/upcoming?days=30`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
      ]);
      if (!calRes.ok || !upRes.ok || !vRes.ok) {
        throw new Error("Failed to load scheduling data. Please try again.");
      }
      const [cal, up, v] = await Promise.all([calRes.json(), upRes.json(), vRes.json()]);
      setEvents(Array.isArray(cal) ? cal : []);
      setUpcomingEvents(Array.isArray(up) ? up : []);
      setVehicles(Array.isArray(v) ? v : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load scheduling data.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchCalendar(currentMonth, currentYear); }, [fetchCalendar, currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const handleSchedule = async () => {
    // Client-side validation before hitting the server
    if (!form.vehicleId) { alert("Please select a vehicle."); return; }
    if (!form.title.trim()) { alert("Please enter a title."); return; }
    if (!form.scheduledDate) { alert("Please select a scheduled date."); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/scheduling/events`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      fetchCalendar(currentMonth, currentYear);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to schedule maintenance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Build calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      // Use UTC accessors to avoid timezone-offset shifting the date by one day
      // when the server stores dates as UTC midnight (e.g. 2024-03-15T00:00:00.000Z).
      const d = new Date(e.date);
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth && d.getUTCDate() === day;
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;

  return (
    <div style={styles.wrapper}>
      <Navbar />
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaCalendarAlt style={{ color: "#4F46E5" }} /> Maintenance Schedule
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Calendar view of all scheduled maintenance and PM due dates</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => { setForm({ ...emptyForm }); setIsModalOpen(true); }}>
            <FaPlus size={13} /> Schedule Maintenance
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <div style={styles.layout}>
          {/* Calendar */}
          <div style={styles.calendarWrapper}>
            {/* Nav */}
            <div style={styles.calNav}>
              <button style={styles.navBtn} onClick={prevMonth}>‹</button>
              <span style={styles.monthLabel}>{MONTHS_LABELS[currentMonth]} {currentYear}</span>
              <button style={styles.navBtn} onClick={nextMonth}>›</button>
            </div>

            {/* Day headers */}
            <div style={styles.calGrid}>
              {DAYS.map((d) => (
                <div key={d} style={styles.dayHeader}>{d}</div>
              ))}
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayEvents = getEventsForDay(day);
                const selected = selectedDate === day;
                const todayDay = isToday(day);
                return (
                  <div
                    key={day}
                    style={{
                      ...styles.dayCell,
                      background: selected ? "#EEF2FF" : todayDay ? "#f0fdf4" : "#fff",
                      borderColor: selected ? "#4F46E5" : todayDay ? "#059669" : "#e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedDate(selected ? null : day)}
                  >
                    <span style={{ fontSize: "13px", fontWeight: todayDay ? 700 : 500, color: todayDay ? "#059669" : "#374151" }}>{day}</span>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: e.color || EVENT_COLORS[e.type] || "#6b7280",
                          borderRadius: "3px", padding: "2px 4px", fontSize: "10px",
                          marginTop: "2px", color: "#fff", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#4F46E5" }} /> Maintenance
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#f59e0b" }} /> PM Due
              </div>
            </div>

            {/* Selected day panel */}
            {selectedDate && (
              <div style={styles.dayPanel}>
                <strong style={{ fontSize: "14px", color: "#111827" }}>
                  {MONTHS_LABELS[currentMonth]} {selectedDate}, {currentYear}
                </strong>
                {selectedDayEvents.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "8px" }}>No events this day.</p>
                ) : (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDayEvents.map((e, i) => (
                      <div key={i} style={{ ...styles.eventChip, borderLeft: `4px solid ${e.color || "#6b7280"}` }}>
                        <strong style={{ fontSize: "13px" }}>{e.title}</strong>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          {e.type} · {e.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming sidebar */}
          <div style={styles.sidebar}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: "16px" }}>
              Upcoming (30 days)
            </h3>
            {loading ? (
              <p style={{ color: "#6b7280", fontSize: "13px" }}>Loading...</p>
            ) : upcomingEvents.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>No upcoming events.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcomingEvents.map((e, i) => (
                  <div key={i} style={{ ...styles.upcomingItem, borderLeft: `3px solid ${e.color || "#6b7280"}` }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{e.title}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                      {e.vehicle?.unitNumber && `${e.vehicle.unitNumber} · `}
                      {e.date ? new Date(e.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : ""}
                    </div>
                    <span style={{ fontSize: "11px", color: e.color || "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>
                      {e.type?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: "480px" }}>
            <h2 style={styles.modalTitle}>Schedule Maintenance</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vehicle *</label>
              <select style={styles.input} value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}>
                <option value="">— Select vehicle —</option>
                {vehicles.map((v) => <option key={v._id} value={v._id}>{v.unitNumber} — {v.make} {v.model}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input style={styles.input} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Oil Change" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type</label>
              <select style={styles.input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {["preventive", "corrective", "inspection", "tire", "oil_change", "other"].map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Scheduled Date *</label>
              <input type="date" style={styles.input} value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, height: "70px" }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSchedule} disabled={saving}>{saving ? "Saving..." : "Schedule"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "24px" },
  primaryBtn: { padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", fontFamily: "Inter, system-ui, sans-serif" },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" },
  calendarWrapper: { background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  calNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  navBtn: { background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "18px", color: "#374151", fontFamily: "Inter, system-ui, sans-serif" },
  monthLabel: { fontSize: "17px", fontWeight: 700, color: "#111827" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" },
  dayHeader: { textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#9ca3af", padding: "6px 0", textTransform: "uppercase" },
  dayCell: { minHeight: "72px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px", display: "flex", flexDirection: "column" },
  dayPanel: { marginTop: "16px", background: "#f9fafb", borderRadius: "10px", padding: "16px", border: "1px solid #e5e7eb" },
  eventChip: { background: "#fff", borderRadius: "6px", padding: "8px 12px", border: "1px solid #e5e7eb" },
  sidebar: { background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "20px", position: "sticky", top: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  upcomingItem: { background: "#f9fafb", borderRadius: "8px", padding: "10px 12px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modal: { background: "#fff", borderRadius: "16px", padding: "28px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: "#111827" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" },
};

export default Scheduling;
