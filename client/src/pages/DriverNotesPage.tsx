import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  FaStickyNote, FaTrashAlt, FaExclamationTriangle,
  FaInfoCircle, FaStar, FaFilter,
} from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

type NoteType = "General" | "Warning" | "Incident" | "Compliment";
type FilterType = "All" | NoteType;

interface OrgNote {
  _id: string;
  driverId: { _id: string; name: string } | null;
  authorName: string;
  type: NoteType;
  body: string;
  createdAt: string;
}

const TYPE_CFG: Record<NoteType, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  General:    { color: "#4f46e5", bg: "rgba(79,70,229,0.1)",   border: "rgba(79,70,229,0.25)",  icon: <FaInfoCircle size={11} /> },
  Warning:    { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)", icon: <FaExclamationTriangle size={11} /> },
  Incident:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",  icon: <FaExclamationTriangle size={11} /> },
  Compliment: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", icon: <FaStar size={11} /> },
};

const FILTERS: FilterType[] = ["All", "General", "Warning", "Incident", "Compliment"];

const DriverNotesPage: React.FC = () => {
  const [notes, setNotes] = useState<OrgNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("All");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/driver-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setNotes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filter === "All" ? notes : notes.filter((n) => n.type === filter),
    [notes, filter]
  );

  const counts = useMemo(() => ({
    General:    notes.filter((n) => n.type === "General").length,
    Warning:    notes.filter((n) => n.type === "Warning").length,
    Incident:   notes.filter((n) => n.type === "Incident").length,
    Compliment: notes.filter((n) => n.type === "Compliment").length,
  }), [notes]);

  const handleDelete = async (note: OrgNote) => {
    if (!note.driverId) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${API_BASE_URL}/drivers/${note.driverId._id}/notes/${note._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch {
      // silent
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: "32px 36px", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          DRIVER MANAGEMENT
        </div>

        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
            Driver Notes &amp; Incidents
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
            Fleet-wide log of all driver notes, warnings, incidents and compliments — newest first.
          </p>
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          {(["All", "General", "Warning", "Incident", "Compliment"] as FilterType[]).map((f) => {
            const active = filter === f;
            const cfg = f !== "All" ? TYPE_CFG[f as NoteType] : null;
            const count = f === "All" ? notes.length : counts[f as NoteType];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                  background: active ? (cfg ? cfg.bg : "var(--t-accent)") : "var(--t-surface-alt)",
                  color: active ? (cfg ? cfg.color : "#fff") : "var(--t-text-dim)",
                  border: active
                    ? `1px solid ${cfg ? cfg.border : "transparent"}`
                    : "1px solid var(--t-border)",
                  transition: "all 0.15s",
                }}
              >
                {f !== "All" && <span style={{ opacity: 0.85 }}>{TYPE_CFG[f as NoteType].icon}</span>}
                {f !== "All" && <FaFilter size={9} style={{ opacity: 0.5 }} />}
                {f}
                <span style={{ opacity: 0.65, fontSize: "12px" }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "14px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--t-text-ghost)", fontSize: "14px" }}>
              Loading notes…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <FaStickyNote size={32} style={{ color: "var(--t-text-ghost)", marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--t-text)" }}>
                {filter === "All" ? "No notes yet" : `No ${filter.toLowerCase()} notes`}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--t-text-ghost)" }}>
                {filter === "All"
                  ? "Open a driver's edit modal to add the first note."
                  : "Switch to a different filter to see other notes."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
                  {["DRIVER", "TYPE", "NOTE", "AUTHOR", "DATE", ""].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "13px 18px", textAlign: "left", fontSize: "10px",
                        fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px",
                        width: i === 5 ? "60px" : undefined,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((note, i) => {
                  const cfg = TYPE_CFG[note.type] || TYPE_CFG.General;
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr
                      key={note._id}
                      style={{
                        borderBottom: isLast ? "none" : "1px solid var(--t-border)",
                        background: i % 2 === 1 ? "var(--t-stripe)" : "transparent",
                      }}
                    >
                      {/* Driver */}
                      <td style={{ padding: "14px 18px", minWidth: "140px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--t-text)" }}>
                          {note.driverId?.name || "—"}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px", borderRadius: "20px",
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.4px",
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          textTransform: "uppercase",
                        }}>
                          {cfg.icon} {note.type}
                        </span>
                      </td>

                      {/* Note body */}
                      <td style={{ padding: "14px 18px", maxWidth: "380px" }}>
                        <div style={{
                          fontSize: "13px", color: "var(--t-text-secondary)",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          lineHeight: 1.55,
                        }}>
                          {note.body}
                        </div>
                      </td>

                      {/* Author */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "13px", color: "var(--t-text-dim)" }}>
                          {note.authorName}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", fontVariantNumeric: "tabular-nums" }}>
                          {format(new Date(note.createdAt), "MMM d, yyyy")}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--t-text-faint)", marginTop: "2px" }}>
                          {format(new Date(note.createdAt), "h:mm a")}
                        </div>
                      </td>

                      {/* Delete */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDelete(note)}
                          title="Delete note"
                          style={{
                            width: "28px", height: "28px", borderRadius: "7px",
                            background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "var(--t-error)", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer",
                          }}
                        >
                          <FaTrashAlt size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--t-text-ghost)", textAlign: "right" }}>
            Showing {filtered.length} of {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
};

export default DriverNotesPage;
