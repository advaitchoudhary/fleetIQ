import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaRegCircle, FaUpload } from "react-icons/fa";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driver = location.state?.driver;
  const [timesheets, setTimesheets] = useState<any[]>([]);

  // trainings: array of { name: string, proofDocument?: string }
  const initTrainings = (): { name: string; proofDocument?: string }[] => {
    const raw = driver?.trainings;
    if (!Array.isArray(raw)) return [];
    return raw.map((t: any) => typeof t === "string" ? { name: t } : t);
  };
  const [trainings, setTrainings] = useState<{ name: string; proofDocument?: string }[]>(initTrainings);
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [trainingSaved, setTrainingSaved] = useState(false);

  // Org-level mandatory training list (dynamic — admin-configured)
  const [mandatoryTrainings, setMandatoryTrainings] = useState<string[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(true);

  // Configure trainings modal state
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [configDraft, setConfigDraft] = useState<string[]>([]);
  const [newTrainingInput, setNewTrainingInput] = useState("");
  const [configureSaving, setConfigureSaving] = useState(false);

  // Org-level mandatory compliance documents (dynamic — admin-configured)
  const [mandatoryDocuments, setMandatoryDocuments] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // Configure compliance documents modal state
  const [showDocsConfigModal, setShowDocsConfigModal] = useState(false);
  const [docsConfigDraft, setDocsConfigDraft] = useState<string[]>([]);
  const [newDocInput, setNewDocInput] = useState("");
  const [docsConfigSaving, setDocsConfigSaving] = useState(false);

  // Org-level timesheet categories (admin-configured)
  const [timesheetCategories, setTimesheetCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Configure timesheet categories modal state
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [categoriesDraft, setCategoriesDraft] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoriesSaving, setCategoriesSaving] = useState(false);

  const isCompleted = (name: string) => trainings.some((t) => t.name === name && t.proofDocument);

  const toggleTraining = (name: string) => {
    setTrainings((prev) => {
      const exists = prev.find((t) => t.name === name);
      if (exists) {
        // remove it entirely (uncomplete)
        return prev.filter((t) => t.name !== name);
      }
      return [...prev, { name }];
    });
  };

  const handleProofUpload = async (name: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const path = res.data.path || res.data.url || res.data.filePath;
      setTrainings((prev) =>
        prev.map((t) => t.name === name ? { ...t, proofDocument: path } : t)
      );
    } catch (err) {
      console.error("Proof upload failed:", err);
    }
  };

  const saveTrainings = async () => {
    try {
      setTrainingSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/drivers/${driver._id}`, { ...driver, trainings }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrainingSaved(true);
      setTimeout(() => setTrainingSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save trainings:", err);
    } finally {
      setTrainingSaving(false);
    }
  };

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

    const fetchTimesheetCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/organizations/timesheet-categories`, { headers });
        setTimesheetCategories(res.data.timesheetCategories || []);
      } catch (err) {
        console.error("Failed to fetch timesheet categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchMandatoryTrainings();
    fetchMandatoryDocuments();
    fetchTimesheetCategories();
  }, []);

  useEffect(() => {
    const fetchDriverTimesheets = async () => {
      if (!driver?.email) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/timesheets?noPagination=true`);
        const driverTimesheets = response.data.data.filter(
          (t: any) => t.driver === driver.email
        );
        setTimesheets(driverTimesheets);
      } catch (error) {
        console.error("Error fetching driver timesheets:", error);
      }
    };

    fetchDriverTimesheets();
  }, [driver]);

  if (!driver) {
    return <p style={{ padding: "40px", textAlign: "center", color: "var(--t-text-faint)", fontFamily: "Inter, system-ui, sans-serif" }}>No driver data available.</p>;
  }

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "N/A";
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          PROFILE
        </div>

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "24px" }}>
          <FaArrowLeft size={11} /> Back
        </button>

        {/* Profile Header */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "flex-start", gap: "28px", marginBottom: "20px" }}>
          <div style={{ position: "relative" as const, flexShrink: 0 }}>
            {driver.image ? (
              <img src={driver.image} alt="Profile"
                style={{ width: "100px", height: "100px", borderRadius: "16px", objectFit: "cover" as const, border: "2px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: "100px", height: "100px", borderRadius: "16px", background: "linear-gradient(135deg,#4F46E5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", fontWeight: 800, color: "#fff" }}>
                {getInitials(driver.name)}
              </div>
            )}
            <div style={{ position: "absolute" as const, bottom: "-8px", right: "-8px", background: "var(--t-surface)", borderRadius: "50%", padding: "2px", border: "1px solid var(--t-border)" }}>
              <FaCheckCircle size={14} color="var(--t-success)" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>{driver.name}</h1>
              <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(16,185,129,0.15)", color: "var(--t-success)", border: "1px solid rgba(16,185,129,0.25)", letterSpacing: "0.5px" }}>
                {(driver.status || "ACTIVE").toUpperCase()}
              </span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--t-text-faint)", maxWidth: "520px" }}>
              {driver.workStatus ? `Work Authorization: ${driver.workStatus}` : "Professional Driver"}{driver.address ? ` · ${driver.address}` : ""}
            </p>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--t-text-ghost)" }}>Driver ID: #OP-{String(driver._id || "").slice(-6).toUpperCase()}</p>
            <div style={{ display: "flex", gap: "20px" }}>
              <span style={{ fontSize: "13px", color: "var(--t-text-faint)" }}>⭐ {driver.backhaulRate ? `$${driver.backhaulRate}/km backhaul` : "Rate configured"}</span>
              <span style={{ fontSize: "13px", color: "var(--t-text-faint)" }}>🚗 {driver.licence ? `Licence ${driver.licence}` : "Licence on file"}</span>
            </div>
          </div>
        </div>

        {/* Row 1: Driver Metadata + Rate & Compensation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", marginBottom: "20px" }}>

          {/* Driver Metadata */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>DRIVER METADATA</p>
              <span style={{ fontSize: "14px", color: "var(--t-text-dim)" }}>ℹ</span>
            </div>
            {([
              ["EMAIL ADDRESS", driver.email],
              ["USERNAME", driver.username || "N/A"],
              ["PRIMARY CONTACT", driver.contact || "N/A"],
              ["HST / GST", driver.hst_gst || "N/A"],
              ["BUSINESS NAME", driver.business_name || "N/A"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ marginBottom: "18px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{value}</p>
              </div>
            ))}
            <p style={{ margin: "0 0 8px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>SYSTEM STATUS</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--t-hover-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: driver.status === "Active" ? "var(--t-success)" : "var(--t-warning)", display: "inline-block" }} />
              <span style={{ fontSize: "13px", color: "var(--t-text-faint)", fontWeight: 500 }}>{driver.status === "Active" ? "Live Telemetry Connected" : `Status: ${driver.status || "Unknown"}`}</span>
            </div>
          </div>

          {/* Rate & Compensation */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>RATE &amp; COMPENSATION SCHEDULE</p>
            </div>
            {(() => {
              const legacyMap: Record<string, string> = {
                "Backhaul": "backhaulRate", "Combo": "comboRate",
                "Extra Sheet/E.W": "extraSheetEWRate", "Regular/Banner": "regularBannerRate",
                "Wholesale": "wholesaleRate", "Wholesale DZ": "wholesaleRate",
              };
              const cats = timesheetCategories.length > 0
                ? timesheetCategories
                : ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale", "Wholesale DZ"];
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {cats.map((cat) => {
                    const fromMap = driver.categoryRates?.[cat];
                    const fromLegacy = legacyMap[cat] ? driver[legacyMap[cat]] : undefined;
                    const value = fromMap ?? fromLegacy;
                    return (
                      <div key={cat} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "14px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.6px" }}>{cat.toUpperCase()}</p>
                        {value ? (
                          <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>
                            ${value}<span style={{ fontSize: "12px", fontWeight: 500, color: "var(--t-text-dim)" }}>/km</span>
                          </p>
                        ) : (
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-ghost)", fontWeight: 500 }}>Not set</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Row 2: Safety & Training + Financial Settlement */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Safety & Training Compliance */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            {(() => {
              const completedCount = mandatoryTrainings.filter((name) => isCompleted(name)).length;
              const progress = mandatoryTrainings.length > 0 ? Math.round((completedCount / mandatoryTrainings.length) * 100) : 0;
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>SAFETY &amp; TRAINING COMPLIANCE</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {mandatoryTrainings.length > 0 && (
                        <>
                          <span style={{ fontSize: "12px", color: "var(--t-text-dim)" }}>Progress</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--t-indigo)" }}>{progress}%</span>
                          <button onClick={saveTrainings} disabled={trainingSaving}
                            style={{ padding: "5px 12px", background: trainingSaved ? "var(--t-success-bg)" : "var(--t-indigo-bg)", border: `1px solid ${trainingSaved ? "var(--t-success-bg)" : "var(--t-border-strong)"}`, borderRadius: "6px", color: trainingSaved ? "var(--t-success)" : "var(--t-indigo)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                            {trainingSaved ? "Saved!" : trainingSaving ? "Saving…" : "Save"}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { setConfigDraft([...mandatoryTrainings]); setNewTrainingInput(""); setShowConfigureModal(true); }}
                        style={{ padding: "5px 12px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text-faint)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                        ⚙ Configure
                      </button>
                    </div>
                  </div>

                  {trainingsLoading ? (
                    <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
                  ) : mandatoryTrainings.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                      <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No mandatory trainings configured</p>
                      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--t-text-ghost)" }}>Set up the required training list for your organization before tracking driver compliance.</p>
                      <button
                        onClick={() => { setConfigDraft([]); setNewTrainingInput(""); setShowConfigureModal(true); }}
                        style={{ padding: "9px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                        + Configure Mandatory Trainings
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ height: "4px", background: "var(--t-hover-bg)", borderRadius: "4px", marginBottom: "16px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,var(--t-accent),var(--t-accent-light))", borderRadius: "4px" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {mandatoryTrainings.map((name) => {
                          const entry = trainings.find((t) => t.name === name);
                          const done = !!entry?.proofDocument;
                          const marked = !!entry;
                          return (
                            <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "var(--t-surface-alt)", border: `1px solid ${done ? "var(--t-success-bg)" : marked ? "var(--t-indigo-bg)" : "var(--t-border)"}`, borderRadius: "10px" }}>
                              <button onClick={() => toggleTraining(name)}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: done ? "var(--t-success)" : marked ? "var(--t-indigo)" : "var(--t-text-muted)", flexShrink: 0 }}>
                                {done || marked ? <FaCheckCircle size={17} /> : <FaRegCircle size={17} />}
                              </button>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 1px", fontSize: "13px", fontWeight: 600, color: done ? "var(--t-success)" : marked ? "var(--t-text-secondary)" : "var(--t-text-dim)" }}>{name}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "var(--t-text-ghost)" }}>{done ? "Completed" : marked ? "In progress" : "Not started"}</p>
                              </div>
                              {marked && !done && (
                                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "var(--t-indigo)", background: "var(--t-indigo-bg)", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", border: "1px solid var(--t-indigo-bg)", whiteSpace: "nowrap" as const }}>
                                  <FaUpload size={9} /> Upload
                                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleProofUpload(name, e.target.files[0]); }} />
                                </label>
                              )}
                              {done && entry?.proofDocument && (
                                <a href={`${API_BASE_URL.replace("/api", "")}/${entry.proofDocument}`} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: "11px", fontWeight: 600, color: "var(--t-success)", background: "var(--t-success-bg)", padding: "5px 10px", borderRadius: "6px", textDecoration: "none", border: "1px solid var(--t-success-bg)", whiteSpace: "nowrap" as const }}>
                                  View Proof
                                </a>
                              )}
                              {!marked && (
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", background: "var(--t-hover-bg)", padding: "4px 9px", borderRadius: "20px", border: "1px solid var(--t-border)", whiteSpace: "nowrap" as const }}>PENDING</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* Financial Settlement */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>FINANCIAL SETTLEMENT</p>
              <span style={{ fontSize: "20px" }}>🏦</span>
            </div>
            {driver.bankDetails ? (
              <>
                <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>DIRECT DEPOSIT ACCOUNT</p>
                <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "16px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "11px", color: "var(--t-text-dim)" }}>Bank Name</p>
                  <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "var(--t-text)" }}>{driver.bankDetails.bankName || "N/A"}</p>
                  <p style={{ margin: "0 0 3px", fontSize: "11px", color: "var(--t-text-dim)" }}>Account Number</p>
                  <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "var(--t-text)", letterSpacing: "2px" }}>
                    {driver.bankDetails.accountNumber ? `•••• •••• ${String(driver.bankDetails.accountNumber).slice(-4)}` : "N/A"}
                  </p>
                  {driver.bankDetails.transitNumber && (
                    <>
                      <p style={{ margin: "0 0 3px", fontSize: "11px", color: "var(--t-text-dim)" }}>Transit Number</p>
                      <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "var(--t-text)" }}>{driver.bankDetails.transitNumber}</p>
                    </>
                  )}
                  {driver.bankDetails.institutionNumber && (
                    <>
                      <p style={{ margin: "0 0 3px", fontSize: "11px", color: "var(--t-text-dim)" }}>Institution Number</p>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--t-text)" }}>{driver.bankDetails.institutionNumber}</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: "24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, color: "var(--t-text-ghost)", fontSize: "13px" }}>No direct deposit details on file.</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Compliance Documents + License Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Compliance Documents */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>COMPLIANCE DOCUMENTS</p>
              <button
                onClick={() => { setDocsConfigDraft([...mandatoryDocuments]); setNewDocInput(""); setShowDocsConfigModal(true); }}
                style={{ padding: "5px 12px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text-faint)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                ⚙ Configure
              </button>
            </div>

            {docsLoading ? (
              <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
            ) : mandatoryDocuments.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No compliance documents configured</p>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--t-text-ghost)" }}>Define the required documents your drivers must submit.</p>
                <button
                  onClick={() => { setDocsConfigDraft([]); setNewDocInput(""); setShowDocsConfigModal(true); }}
                  style={{ padding: "9px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                  + Configure Compliance Documents
                </button>
              </div>
            ) : (
              mandatoryDocuments.map((name) => {
                const entry = (driver.complianceDocuments || []).find((d: any) => d.name === name);
                const doc = entry?.document;
                const sc = doc
                  ? { label: "VALID", bg: "var(--t-success-bg)", color: "var(--t-success)", border: "var(--t-success-bg)" }
                  : { label: "PENDING", bg: "var(--t-warning-bg)", color: "var(--t-warning)", border: "var(--t-warning-bg)" };
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--t-text-ghost)" }}>{doc ? "On file" : "Not submitted"}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {doc && (
                        <a href={`${API_BASE_URL.replace("/api", "")}/${doc}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: "11px", color: "var(--t-indigo)", textDecoration: "none", fontWeight: 600 }}>View</a>
                      )}
                      <span style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, letterSpacing: "0.5px" }}>{sc.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* License Details */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px" }}>
            <p style={{ margin: "0 0 20px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>LICENSE DETAILS</p>
            <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>COMMERCIAL DRIVER LICENSE</p>
                  <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
                    {driver.licence ? `CLASS ${driver.licence.toUpperCase()} – UNRESTRICTED` : "N/A"}
                  </p>
                </div>
                <span style={{ fontSize: "22px" }}>🪪</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>LICENSE NUMBER</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{driver.licence || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>WORK AUTHORIZATION</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{driver.workStatus || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>ISSUE DATE</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>On file</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>EXPIRATION</p>
                  {driver.licence_expiry_date ? (() => {
                    const expiry = new Date(driver.licence_expiry_date);
                    const soon = new Date(); soon.setDate(soon.getDate() + 90);
                    const formatted = expiry.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
                    return <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: expiry <= soon ? "var(--t-error)" : "var(--t-success)" }}>{formatted}</p>;
                  })() : <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-ghost)" }}>N/A</p>}
                </div>
                {driver.workAuthExpiry && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>WORK AUTH EXPIRY</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-warning)" }}>
                      {new Date(driver.workAuthExpiry + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timesheet Categories */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>TIMESHEET CATEGORIES</p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--t-text-ghost)" }}>Categories available to drivers when submitting timesheets</p>
            </div>
            <button
              onClick={() => { setCategoriesDraft([...timesheetCategories]); setNewCategoryInput(""); setShowCategoriesModal(true); }}
              style={{ padding: "5px 12px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text-faint)", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              ⚙ Configure
            </button>
          </div>

          {categoriesLoading ? (
            <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
          ) : timesheetCategories.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
              <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No categories configured</p>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--t-text-ghost)" }}>Drivers will see a default list. Add custom categories to match your operations.</p>
              <button
                onClick={() => { setCategoriesDraft([]); setNewCategoryInput(""); setShowCategoriesModal(true); }}
                style={{ padding: "9px 20px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                + Configure Categories
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
              {timesheetCategories.map((cat) => (
                <span key={cat} style={{ padding: "6px 14px", background: "var(--t-indigo-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "20px", fontSize: "12px", fontWeight: 600, color: "var(--t-accent)" }}>
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timesheets */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--t-border)" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>TIMESHEETS</p>
          </div>
          {timesheets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "14px" }}>No timesheets available for this driver.</div>
          ) : (
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
                    {["Date", "Start", "End", "Start KM", "End KM", "Total KM", "Category", "Planned KM", "Subtotal", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left" as const, fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", whiteSpace: "nowrap" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((t, idx) => {
                    const start = parseFloat(t.startKM);
                    const end = parseFloat(t.endKM);
                    const totalKM = !isNaN(start) && !isNaN(end) ? end - start : null;
                    const categoryToRateMap: Record<string, string> = {
                      "Backhaul": "backhaulRate", "Combo": "comboRate", "Extra Sheet/E.W": "extraSheetEWRate",
                      "Regular/Banner": "regularBannerRate", "Wholesale": "wholesaleRate", "Wholesale DZ": "wholesaleRate",
                      "voila": "voilaRate", "TCS linehaul trenton": "tcsLinehaulTrentonRate",
                    };
                    const rateField = categoryToRateMap[t.category || ""] || `${t.category?.toLowerCase().replace(/\/|\s+/g, "")}Rate`;
                    const rate = driver?.[rateField] || 0;
                    const subtotal = totalKM !== null && !isNaN(rate) ? totalKM * rate : NaN;
                    const statusCfg: Record<string, { color: string; label: string }> = {
                      approved: { color: "var(--t-success)", label: "Approved" },
                      rejected: { color: "var(--t-error)", label: "Rejected" },
                      pending:  { color: "var(--t-warning)", label: "Pending" },
                    };
                    const sc = statusCfg[t.status] || statusCfg.pending;
                    return (
                      <tr key={t._id} style={{ borderBottom: "1px solid var(--t-stripe)", background: idx % 2 === 1 ? "var(--t-stripe)" : "transparent" }}>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-secondary)" }}>{t.date}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>{t.startTime}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>{t.endTime}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>{t.startKM}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>{t.endKM}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--t-text)" }}>{totalKM !== null ? totalKM : "N/A"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: "var(--t-hover-bg)", color: "var(--t-text-faint)" }}>{t.category || "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>{t.plannedKM || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "var(--t-text)" }}>{!isNaN(subtotal) ? `$${subtotal.toFixed(2)}` : "N/A"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid var(--t-border)" }}>
          <span style={{ fontSize: "11px", color: "var(--t-text-muted)", fontWeight: 500 }}>SYSTEM ID: FP-{String(driver._id || "ALPHA").slice(-9).toUpperCase()}</span>
          <div style={{ display: "flex", gap: "20px" }}>
<span style={{ fontSize: "11px", color: "var(--t-text-muted)" }}>SECURE ENCRYPTION ACTIVE.</span>
          </div>
        </div>

      </div>

      {/* Configure Compliance Documents Modal */}
      {showDocsConfigModal && (
        <div style={{ position: "fixed" as const, inset: 0, background: "var(--t-modal-overlay)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDocsConfigModal(false); }}>
          <div style={{ background: "var(--t-modal-bg)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "80vh", display: "flex", flexDirection: "column" as const, boxShadow: "var(--t-shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Configure Compliance Documents</h2>
              <button onClick={() => setShowDocsConfigModal(false)} style={{ background: "none", border: "none", color: "var(--t-text-faint)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--t-text-ghost)" }}>These documents will be required from all drivers in your organization.</p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={newDocInput}
                onChange={(e) => setNewDocInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDocInput.trim() && !docsConfigDraft.includes(newDocInput.trim())) {
                    setDocsConfigDraft((prev) => [...prev, newDocInput.trim()]);
                    setNewDocInput("");
                  }
                }}
                placeholder="e.g. Agency Sign Off"
                style={{ flex: 1, padding: "9px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
              />
              <button
                onClick={() => {
                  const name = newDocInput.trim();
                  if (name && !docsConfigDraft.includes(name)) {
                    setDocsConfigDraft((prev) => [...prev, name]);
                    setNewDocInput("");
                  }
                }}
                style={{ padding: "9px 16px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" as const }}>
                + Add
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "6px", marginBottom: "20px" }}>
              {docsConfigDraft.length === 0 ? (
                <p style={{ textAlign: "center" as const, padding: "32px", color: "var(--t-text-ghost)", fontSize: "13px", margin: 0 }}>No documents added yet.</p>
              ) : docsConfigDraft.map((name, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{name}</span>
                  <button onClick={() => setDocsConfigDraft((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDocsConfigModal(false)}
                style={{ padding: "9px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Cancel
              </button>
              <button
                disabled={docsConfigSaving}
                onClick={async () => {
                  try {
                    setDocsConfigSaving(true);
                    const token = localStorage.getItem("token");
                    const res = await axios.put(`${API_BASE_URL}/organizations/mandatory-documents`, { mandatoryDocuments: docsConfigDraft }, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setMandatoryDocuments(res.data.mandatoryDocuments);
                    setShowDocsConfigModal(false);
                  } catch (err) {
                    console.error("Failed to save mandatory documents:", err);
                  } finally {
                    setDocsConfigSaving(false);
                  }
                }}
                style={{ padding: "9px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: docsConfigSaving ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: docsConfigSaving ? 0.7 : 1 }}>
                {docsConfigSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Timesheet Categories Modal */}
      {showCategoriesModal && (
        <div style={{ position: "fixed" as const, inset: 0, background: "var(--t-modal-overlay)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCategoriesModal(false); }}>
          <div style={{ background: "var(--t-modal-bg)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "80vh", display: "flex", flexDirection: "column" as const, boxShadow: "var(--t-shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Configure Timesheet Categories</h2>
              <button onClick={() => setShowCategoriesModal(false)} style={{ background: "none", border: "none", color: "var(--t-text-faint)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--t-text-ghost)" }}>These categories will be available to all drivers when submitting timesheets.</p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategoryInput.trim() && !categoriesDraft.includes(newCategoryInput.trim())) {
                    setCategoriesDraft((prev) => [...prev, newCategoryInput.trim()]);
                    setNewCategoryInput("");
                  }
                }}
                placeholder="e.g. Backhaul"
                style={{ flex: 1, padding: "9px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
              />
              <button
                onClick={() => {
                  const cat = newCategoryInput.trim();
                  if (cat && !categoriesDraft.includes(cat)) {
                    setCategoriesDraft((prev) => [...prev, cat]);
                    setNewCategoryInput("");
                  }
                }}
                style={{ padding: "9px 16px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" as const }}>
                + Add
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "6px", marginBottom: "20px" }}>
              {categoriesDraft.length === 0 ? (
                <p style={{ textAlign: "center" as const, padding: "32px", color: "var(--t-text-ghost)", fontSize: "13px", margin: 0 }}>No categories added yet. Type a name above and click Add.</p>
              ) : categoriesDraft.map((cat, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{cat}</span>
                  <button onClick={() => setCategoriesDraft((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCategoriesModal(false)}
                style={{ padding: "9px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Cancel
              </button>
              <button
                disabled={categoriesSaving}
                onClick={async () => {
                  try {
                    setCategoriesSaving(true);
                    const token = localStorage.getItem("token");
                    const res = await axios.put(`${API_BASE_URL}/organizations/timesheet-categories`, { timesheetCategories: categoriesDraft }, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setTimesheetCategories(res.data.timesheetCategories);
                    setShowCategoriesModal(false);
                  } catch (err) {
                    console.error("Failed to save timesheet categories:", err);
                  } finally {
                    setCategoriesSaving(false);
                  }
                }}
                style={{ padding: "9px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: categoriesSaving ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: categoriesSaving ? 0.7 : 1 }}>
                {categoriesSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Mandatory Trainings Modal */}
      {showConfigureModal && (
        <div style={{ position: "fixed" as const, inset: 0, background: "var(--t-modal-overlay)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfigureModal(false); }}>
          <div style={{ background: "var(--t-modal-bg)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "80vh", display: "flex", flexDirection: "column" as const, gap: "0", boxShadow: "var(--t-shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Configure Mandatory Trainings</h2>
              <button onClick={() => setShowConfigureModal(false)} style={{ background: "none", border: "none", color: "var(--t-text-faint)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--t-text-ghost)" }}>These trainings will be required for all drivers in your organization.</p>

            {/* Add new training */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                value={newTrainingInput}
                onChange={(e) => setNewTrainingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTrainingInput.trim() && !configDraft.includes(newTrainingInput.trim())) {
                    setConfigDraft((prev) => [...prev, newTrainingInput.trim()]);
                    setNewTrainingInput("");
                  }
                }}
                placeholder="e.g. Defensive Driving"
                style={{ flex: 1, padding: "9px 12px", background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)", borderRadius: "8px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", outline: "none" }}
              />
              <button
                onClick={() => {
                  const name = newTrainingInput.trim();
                  if (name && !configDraft.includes(name)) {
                    setConfigDraft((prev) => [...prev, name]);
                    setNewTrainingInput("");
                  }
                }}
                style={{ padding: "9px 16px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap" as const }}>
                + Add
              </button>
            </div>

            {/* Training list */}
            <div style={{ flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "6px", marginBottom: "20px" }}>
              {configDraft.length === 0 ? (
                <p style={{ textAlign: "center" as const, padding: "32px", color: "var(--t-text-ghost)", fontSize: "13px", margin: 0 }}>No trainings added yet. Type a name above and click Add.</p>
              ) : configDraft.map((name, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--t-text-secondary)", fontWeight: 500 }}>{name}</span>
                  <button
                    onClick={() => setConfigDraft((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ background: "none", border: "none", color: "var(--t-text-ghost)", fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfigureModal(false)}
                style={{ padding: "9px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Cancel
              </button>
              <button
                disabled={configureSaving}
                onClick={async () => {
                  try {
                    setConfigureSaving(true);
                    const token = localStorage.getItem("token");
                    const res = await axios.put(`${API_BASE_URL}/organizations/mandatory-trainings`, { mandatoryTrainings: configDraft }, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setMandatoryTrainings(res.data.mandatoryTrainings);
                    setShowConfigureModal(false);
                  } catch (err) {
                    console.error("Failed to save mandatory trainings:", err);
                  } finally {
                    setConfigureSaving(false);
                  }
                }}
                style={{ padding: "9px 18px", background: "var(--t-accent)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: configureSaving ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", opacity: configureSaving ? 0.7 : 1 }}>
                {configureSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
