import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaCog, FaShieldAlt, FaGraduationCap, FaRedo } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import { useAuth } from "../contexts/AuthContext";

const OrganizationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { resetAllTours } = useAuth();
  const [resettingTours, setResettingTours] = useState(false);
  const [toursReset, setToursReset] = useState(false);

  const handleReplayTours = async () => {
    if (!window.confirm("Reset all onboarding tours? You'll see them again the next time you visit each module.")) return;
    setResettingTours(true);
    try {
      await resetAllTours();
      setToursReset(true);
      setTimeout(() => setToursReset(false), 3000);
    } finally {
      setResettingTours(false);
    }
  };

  // Mandatory trainings
  const [mandatoryTrainings, setMandatoryTrainings] = useState<string[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(true);
  const [newTrainingInput, setNewTrainingInput] = useState("");
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [trainingSaveError, setTrainingSaveError] = useState<string | null>(null);

  // Mandatory compliance documents
  const [mandatoryDocuments, setMandatoryDocuments] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [newDocInput, setNewDocInput] = useState("");
  const [docsSaving, setDocsSaving] = useState(false);
  const [docsSaveError, setDocsSaveError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchMandatoryTrainings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/organizations/mandatory-trainings`, { headers });
        setMandatoryTrainings(res.data.mandatoryTrainings || []);
      } catch (err) {
        console.error("Failed to fetch mandatory trainings:", err);
      } finally {
        setTrainingsLoading(false);
      }
    };

    const fetchMandatoryDocuments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/organizations/mandatory-documents`, { headers });
        setMandatoryDocuments(res.data.mandatoryDocuments || []);
      } catch (err) {
        console.error("Failed to fetch mandatory documents:", err);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchMandatoryTrainings();
    fetchMandatoryDocuments();
  }, []);

  const persistTrainings = async (next: string[]) => {
    try {
      setTrainingSaving(true);
      setTrainingSaveError(null);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/organizations/mandatory-trainings`,
        { mandatoryTrainings: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMandatoryTrainings(res.data.mandatoryTrainings);
    } catch (err) {
      console.error("Failed to save mandatory trainings:", err);
      setTrainingSaveError("Couldn't save. Please try again.");
    } finally {
      setTrainingSaving(false);
    }
  };

  const persistDocuments = async (next: string[]) => {
    try {
      setDocsSaving(true);
      setDocsSaveError(null);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/organizations/mandatory-documents`,
        { mandatoryDocuments: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMandatoryDocuments(res.data.mandatoryDocuments);
    } catch (err) {
      console.error("Failed to save mandatory documents:", err);
      setDocsSaveError("Couldn't save. Please try again.");
    } finally {
      setDocsSaving(false);
    }
  };

  const addTraining = () => {
    const name = newTrainingInput.trim();
    if (!name || mandatoryTrainings.includes(name)) return;
    const next = [...mandatoryTrainings, name];
    setNewTrainingInput("");
    persistTrainings(next);
  };

  const removeTraining = (name: string) => {
    if (!window.confirm(`Remove "${name}" from mandatory trainings? Drivers will no longer see this in their list.`)) return;
    persistTrainings(mandatoryTrainings.filter((t) => t !== name));
  };

  const addDocument = () => {
    const name = newDocInput.trim();
    if (!name || mandatoryDocuments.includes(name)) return;
    const next = [...mandatoryDocuments, name];
    setNewDocInput("");
    persistDocuments(next);
  };

  const removeDocument = (name: string) => {
    if (!window.confirm(`Remove "${name}" from required documents? Drivers will no longer see this in their list.`)) return;
    persistDocuments(mandatoryDocuments.filter((d) => d !== name));
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <style>{`
        @media (max-width: 900px) {
          [data-orgsettings-grid] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          ORGANIZATION SETTINGS
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "24px" }}
        >
          <FaArrowLeft size={11} /> Back
        </button>

        {/* Header */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px 32px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg,#4F46E5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FaCog size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
              Organization Settings
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-faint)", maxWidth: "620px" }}>
              Configure the compliance documents and mandatory trainings that apply to every driver in your organization. Changes take effect immediately for all drivers.
            </p>
          </div>
        </div>

        {/* Two-column grid */}
        <div data-orgsettings-grid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Mandatory Trainings */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-indigo-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaGraduationCap size={14} color="var(--t-indigo)" />
                </div>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>MANDATORY TRAININGS</p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", background: "var(--t-hover-bg)", padding: "3px 9px", borderRadius: "12px", border: "1px solid var(--t-border)" }}>
                {mandatoryTrainings.length}
              </span>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--t-text-ghost)" }}>
              Trainings every driver must complete and upload proof for.
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                type="text"
                value={newTrainingInput}
                onChange={(e) => setNewTrainingInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTraining(); }}
                placeholder="e.g. Defensive Driving"
                disabled={trainingSaving}
                style={{ flex: 1, padding: "10px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
              />
              <button
                onClick={addTraining}
                disabled={trainingSaving || !newTrainingInput.trim()}
                style={{ padding: "10px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: trainingSaving || !newTrainingInput.trim() ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: trainingSaving || !newTrainingInput.trim() ? 0.5 : 1, whiteSpace: "nowrap" as const }}
              >
                {trainingSaving ? "Saving…" : "+ Add"}
              </button>
            </div>

            {trainingSaveError && (
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--t-error)" }}>{trainingSaveError}</p>
            )}

            {trainingsLoading ? (
              <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
            ) : mandatoryTrainings.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No mandatory trainings yet</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--t-text-ghost)" }}>Add your first training above. Drivers will see it in their "My Info" page.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                {mandatoryTrainings.map((name) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
                    <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{name}</span>
                    <button
                      onClick={() => removeTraining(name)}
                      disabled={trainingSaving}
                      title="Remove"
                      style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "18px", cursor: trainingSaving ? "not-allowed" : "pointer", lineHeight: 1, padding: "0 6px", opacity: trainingSaving ? 0.5 : 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory Compliance Documents */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-success-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaShieldAlt size={14} color="var(--t-success)" />
                </div>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>COMPLIANCE DOCUMENTS</p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", background: "var(--t-hover-bg)", padding: "3px 9px", borderRadius: "12px", border: "1px solid var(--t-border)" }}>
                {mandatoryDocuments.length}
              </span>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--t-text-ghost)" }}>
              Documents every driver must submit (e.g., medical card, drug test, certifications).
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                type="text"
                value={newDocInput}
                onChange={(e) => setNewDocInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addDocument(); }}
                placeholder="e.g. Medical Card"
                disabled={docsSaving}
                style={{ flex: 1, padding: "10px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
              />
              <button
                onClick={addDocument}
                disabled={docsSaving || !newDocInput.trim()}
                style={{ padding: "10px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: docsSaving || !newDocInput.trim() ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: docsSaving || !newDocInput.trim() ? 0.5 : 1, whiteSpace: "nowrap" as const }}
              >
                {docsSaving ? "Saving…" : "+ Add"}
              </button>
            </div>

            {docsSaveError && (
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--t-error)" }}>{docsSaveError}</p>
            )}

            {docsLoading ? (
              <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
            ) : mandatoryDocuments.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No compliance documents yet</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--t-text-ghost)" }}>Add your first document above. Drivers will see it in their "My Info" page.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                {mandatoryDocuments.map((name) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
                    <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{name}</span>
                    <button
                      onClick={() => removeDocument(name)}
                      disabled={docsSaving}
                      title="Remove"
                      style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "18px", cursor: docsSaving ? "not-allowed" : "pointer", lineHeight: 1, padding: "0 6px", opacity: docsSaving ? 0.5 : 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Replay tours — per-user, not org-wide */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "260px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "var(--t-indigo-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FaRedo size={14} color="var(--t-indigo)" />
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 700, color: "var(--t-text)" }}>Replay onboarding tours</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--t-text-ghost)" }}>
                Resets your personal tour history. The walkthrough will play again the next time you visit each module.
              </p>
            </div>
          </div>
          <button
            onClick={handleReplayTours}
            disabled={resettingTours}
            style={{ padding: "9px 16px", background: toursReset ? "var(--t-success-bg)" : "var(--t-accent)", border: toursReset ? "1px solid rgba(16,185,129,0.3)" : "none", borderRadius: "8px", color: toursReset ? "var(--t-success)" : "#fff", fontSize: "12.5px", fontWeight: 700, cursor: resettingTours ? "wait" : "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" as const, opacity: resettingTours ? 0.6 : 1 }}
          >
            {toursReset ? "✓ Reset" : resettingTours ? "Resetting…" : "Reset Tours"}
          </button>
        </div>

        {/* Helper footer */}
        <div style={{ padding: "16px 20px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "12px", fontSize: "12px", color: "var(--t-text-ghost)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--t-text-faint)" }}>Tip:</strong> Lists save automatically as you add or remove items. Drivers will see updates next time they open their "My Info" page. Removing an item does not delete existing uploads — drivers keep any proof they've already submitted.
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
