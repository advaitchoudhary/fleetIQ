import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/env";

interface Props {
  isOpen: boolean;
  initialCategories: string[];
  onSaved: (categories: string[], configured: boolean) => void;
  onClose: () => void;
}

const CategoryModal: React.FC<Props> = ({ isOpen, initialCategories, onSaved, onClose }) => {
  const [catDraft, setCatDraft] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCatDraft([...initialCategories]);
      setNewCatInput("");
    }
  }, [isOpen, initialCategories]);

  const addCategory = () => {
    const v = newCatInput.trim();
    if (v && !catDraft.includes(v)) {
      setCatDraft((p) => [...p, v]);
      setNewCatInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--t-modal-bg)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Configure Timesheet Categories</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t-text-faint)", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--t-text-ghost)" }}>
          These categories will appear in the rate grid and in the driver timesheet submission form.
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            type="text"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
            placeholder="e.g. Backhaul"
            style={{ flex: 1, padding: "9px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
          />
          <button
            onClick={addCategory}
            style={{ padding: "9px 16px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" }}>
            + Add
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          {catDraft.length === 0 ? (
            <p style={{ textAlign: "center", padding: "32px", color: "var(--t-text-ghost)", fontSize: "13px", margin: 0 }}>No categories yet. Add one above.</p>
          ) : catDraft.map((cat, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
              <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{cat}</span>
              <button
                onClick={() => setCatDraft((p) => p.filter((_, i) => i !== idx))}
                style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
            Cancel
          </button>
          <button
            disabled={catSaving}
            onClick={async () => {
              try {
                setCatSaving(true);
                const token = localStorage.getItem("token");
                const res = await axios.put(`${API_BASE_URL}/organizations/timesheet-categories`, { timesheetCategories: catDraft }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const saved: string[] = res.data.timesheetCategories || [];
                onSaved(saved, saved.length > 0);
                onClose();
              } catch (err) {
                console.error("Failed to save categories:", err);
              } finally {
                setCatSaving(false);
              }
            }}
            style={{ padding: "9px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: catSaving ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: catSaving ? 0.7 : 1 }}>
            {catSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
