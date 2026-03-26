import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENT_COLORS: Record<string, string> = {
  maintenance: "var(--t-accent)",
  pm_due: "var(--t-warning)",
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
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaCalendarAlt size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Fleet</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Maintenance Schedule</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Calendar view of all scheduled maintenance and PM due dates</p>
            </div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }} onClick={() => { setForm({ ...emptyForm }); setIsModalOpen(true); }}>
            <FaPlus size={13} /> Schedule Maintenance
          </button>
        </div>
      </div>
      <div style={styles.container}>

        {error && (
          <div style={{ background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "var(--t-error)", fontSize: "14px" }}>
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
                      background: selected ? "var(--t-indigo-bg)" : todayDay ? "var(--t-success-bg)" : "var(--t-select-bg)",
                      borderColor: selected ? "var(--t-accent)" : todayDay ? "var(--t-success)" : "var(--t-border)",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedDate(selected ? null : day)}
                  >
                    <span style={{ fontSize: "13px", fontWeight: todayDay ? 700 : 500, color: todayDay ? "var(--t-success)" : "var(--t-text-muted)" }}>{day}</span>
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: e.color || EVENT_COLORS[e.type] || "var(--t-text-dim)",
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
                      <div style={{ fontSize: "10px", color: "var(--t-text-dim)", marginTop: "2px" }}>+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "12px", color: "var(--t-text-faint)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--t-accent)" }} /> Maintenance
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--t-warning)" }} /> PM Due
              </div>
            </div>

            {/* Selected day panel */}
            {selectedDate && (
              <div style={styles.dayPanel}>
                <strong style={{ fontSize: "14px", color: "var(--t-text-secondary)" }}>
                  {MONTHS_LABELS[currentMonth]} {selectedDate}, {currentYear}
                </strong>
                {selectedDayEvents.length === 0 ? (
                  <p style={{ color: "var(--t-text-faint)", fontSize: "13px", marginTop: "8px" }}>No events this day.</p>
                ) : (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDayEvents.map((e, i) => (
                      <div key={i} style={{ ...styles.eventChip, borderLeft: `4px solid ${e.color || "var(--t-text-dim)"}` }}>
                        <strong style={{ fontSize: "13px" }}>{e.title}</strong>
                        <div style={{ fontSize: "12px", color: "var(--t-text-faint)", marginTop: "2px" }}>
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
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--t-text)", marginTop: 0, marginBottom: "16px" }}>
              Upcoming (30 days)
            </h3>
            {loading ? (
              <p style={{ color: "var(--t-text-dim)", fontSize: "13px" }}>Loading...</p>
            ) : upcomingEvents.length === 0 ? (
              <p style={{ color: "var(--t-text-faint)", fontSize: "13px" }}>No upcoming events.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcomingEvents.map((e, i) => (
                  <div key={i} style={{ ...styles.upcomingItem, borderLeft: `3px solid ${e.color || "var(--t-text-dim)"}` }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{e.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--t-text-faint)", marginTop: "3px" }}>
                      {e.vehicle?.unitNumber && `${e.vehicle.unitNumber} · `}
                      {e.date ? new Date(e.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : ""}
                    </div>
                    <span style={{ fontSize: "11px", color: e.color || "var(--t-text-dim)", fontWeight: 600, textTransform: "uppercase" }}>
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
  wrapper: { minHeight: "100vh", background: "var(--t-bg)", fontFamily: "Inter, system-ui, sans-serif" },
  container: { maxWidth: "1300px", margin: "0 auto", padding: "28px 40px" },
  primaryBtn: { padding: "10px 18px", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", fontFamily: "Inter, system-ui, sans-serif" },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" },
  calendarWrapper: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  calNav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  navBtn: { background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "18px", color: "var(--t-text-faint)", fontFamily: "Inter, system-ui, sans-serif" },
  monthLabel: { fontSize: "17px", fontWeight: 700, color: "var(--t-text)" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" },
  dayHeader: { textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", padding: "6px 0", textTransform: "uppercase" },
  dayCell: { minHeight: "72px", border: "1px solid var(--t-border)", borderRadius: "8px", padding: "6px", display: "flex", flexDirection: "column" },
  dayPanel: { marginTop: "16px", background: "var(--t-surface-alt)", borderRadius: "10px", padding: "16px", border: "1px solid var(--t-border)" },
  eventChip: { background: "var(--t-select-bg)", borderRadius: "6px", padding: "8px 12px", border: "1px solid var(--t-border)" },
  sidebar: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", padding: "20px", position: "sticky", top: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" },
  upcomingItem: { background: "var(--t-surface-alt)", borderRadius: "8px", padding: "10px 12px" },
  modalOverlay: { position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modal: { background: "var(--t-surface)", borderRadius: "16px", padding: "28px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--t-shadow-lg)", border: "1px solid var(--t-border)" },
  modalTitle: { margin: "0 0 20px", fontSize: "20px", fontWeight: 700, color: "var(--t-text)" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.8px" },
  input: { width: "100%", padding: "9px 12px", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", color: "var(--t-text-secondary)", background: "var(--t-input-bg)", outline: "none", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 20px", background: "var(--t-hover-bg)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" },
};

export default Scheduling;
