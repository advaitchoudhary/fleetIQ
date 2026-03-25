import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaRegCircle, FaUpload } from "react-icons/fa";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

const ALL_TRAININGS = [
  "Defensive Driving - Tractor-Trailer",
  "Distracted Driving",
  "Hours of Service: Canadian Regulations",
  "Transportation of Dangerous Goods",
  "Vehicle Inspections",
  "WHMIS",
  "Winter Driving",
  "Fall Protection for Drivers",
  "Pallet Trucks (Walkies and Riders)",
  "Practical Cargo Securement for Drivers (Cargo Van)",
  "Food Safety for Drivers",
  "Lift Truck Operator Skills",
];

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
    return <p style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontFamily: "Inter, system-ui, sans-serif" }}>No driver data available.</p>;
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0d1117", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 40px" }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#9ca3af", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "24px" }}>
          <FaArrowLeft size={11} /> Back
        </button>

        {/* Profile Header */}
        <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "flex-start", gap: "28px", marginBottom: "20px" }}>
          <div style={{ position: "relative" as const, flexShrink: 0 }}>
            {driver.image ? (
              <img src={driver.image} alt="Profile"
                style={{ width: "100px", height: "100px", borderRadius: "16px", objectFit: "cover" as const, border: "2px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: "100px", height: "100px", borderRadius: "16px", background: "linear-gradient(135deg,#4F46E5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", fontWeight: 800, color: "#fff" }}>
                {getInitials(driver.name)}
              </div>
            )}
            <div style={{ position: "absolute" as const, bottom: "-8px", right: "-8px", background: "#161b22", borderRadius: "50%", padding: "2px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <FaCheckCircle size={14} color="#10b981" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.3px" }}>{driver.name}</h1>
              <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)", letterSpacing: "0.5px" }}>
                {(driver.status || "ACTIVE").toUpperCase()}
              </span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#9ca3af", maxWidth: "520px" }}>
              {driver.workStatus ? `Work Authorization: ${driver.workStatus}` : "Professional Driver"}{driver.address ? ` · ${driver.address}` : ""}
            </p>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#4b5563" }}>Driver ID: #OP-{String(driver._id || "").slice(-6).toUpperCase()}</p>
            <div style={{ display: "flex", gap: "20px" }}>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>⭐ {driver.backhaulRate ? `$${driver.backhaulRate}/km backhaul` : "Rate configured"}</span>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>🚗 {driver.licence ? `Licence ${driver.licence}` : "Licence on file"}</span>
            </div>
          </div>
        </div>

        {/* Row 1: Driver Metadata + Rate & Compensation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px", marginBottom: "20px" }}>

          {/* Driver Metadata */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>DRIVER METADATA</p>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>ℹ</span>
            </div>
            {([
              ["EMAIL ADDRESS", driver.email],
              ["USERNAME", driver.username || "N/A"],
              ["PRIMARY CONTACT", driver.contact || "N/A"],
              ["HST / GST", driver.hst_gst || "N/A"],
              ["BUSINESS NAME", driver.business_name || "N/A"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ marginBottom: "18px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>{value}</p>
              </div>
            ))}
            <p style={{ margin: "0 0 8px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>SYSTEM STATUS</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: driver.status === "Active" ? "#10b981" : "#f59e0b", display: "inline-block" }} />
              <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>{driver.status === "Active" ? "Live Telemetry Connected" : `Status: ${driver.status || "Unknown"}`}</span>
            </div>
          </div>

          {/* Rate & Compensation */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>RATE &amp; COMPENSATION SCHEDULE</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {([
                ["STANDARD BACKHAUL", driver.backhaulRate, "/km"],
                ["EXTRA SHEET / E.W", driver.extraSheetEWRate, "/unit"],
                ["COMBO RATE", driver.comboRate, "/km"],
                ["REGULAR / BANNER", driver.regularBannerRate, "/km"],
                ["WHOLESALE", driver.wholesaleRate, "/km"],
                ["VOILA", driver.voilaRate, "/km"],
              ] as [string, number | undefined, string][]).map(([label, value, unit]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.6px" }}>{label}</p>
                  {value ? (
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#f9fafb" }}>
                      ${value}<span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>{unit}</span>
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", fontWeight: 500 }}>Not set</p>
                  )}
                </div>
              ))}
            </div>
            {driver.tcsLinehaulTrentonRate && (
              <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.6px" }}>TCS LINEHAUL TRENTON</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#f9fafb" }}>${driver.tcsLinehaulTrentonRate}<span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>/km</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Safety & Training + Financial Settlement */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Safety & Training Compliance */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            {(() => {
              const completedCount = ALL_TRAININGS.filter((name) => isCompleted(name)).length;
              const progress = Math.round((completedCount / ALL_TRAININGS.length) * 100);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>SAFETY &amp; TRAINING COMPLIANCE</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Progress</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#818CF8" }}>{progress}%</span>
                      <button onClick={saveTrainings} disabled={trainingSaving}
                        style={{ padding: "5px 12px", background: trainingSaved ? "rgba(16,185,129,0.15)" : "rgba(79,70,229,0.15)", border: `1px solid ${trainingSaved ? "rgba(16,185,129,0.3)" : "rgba(79,70,229,0.3)"}`, borderRadius: "6px", color: trainingSaved ? "#34d399" : "#818CF8", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                        {trainingSaved ? "Saved!" : trainingSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", marginBottom: "16px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius: "4px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {ALL_TRAININGS.map((name) => {
                      const entry = trainings.find((t) => t.name === name);
                      const done = !!entry?.proofDocument;
                      const marked = !!entry;
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(16,185,129,0.2)" : marked ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "10px" }}>
                          <button onClick={() => toggleTraining(name)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: done ? "#10b981" : marked ? "#4F46E5" : "#374151", flexShrink: 0 }}>
                            {done || marked ? <FaCheckCircle size={17} /> : <FaRegCircle size={17} />}
                          </button>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 1px", fontSize: "13px", fontWeight: 600, color: done ? "#d1fae5" : marked ? "#e5e7eb" : "#6b7280" }}>{name}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#4b5563" }}>{done ? "Completed" : marked ? "In progress" : "Not started"}</p>
                          </div>
                          {marked && !done && (
                            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#818CF8", background: "rgba(79,70,229,0.12)", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", border: "1px solid rgba(79,70,229,0.2)", whiteSpace: "nowrap" as const }}>
                              <FaUpload size={9} /> Upload
                              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleProofUpload(name, e.target.files[0]); }} />
                            </label>
                          )}
                          {done && entry?.proofDocument && (
                            <a href={`${API_BASE_URL.replace("/api", "")}/${entry.proofDocument}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "11px", fontWeight: 600, color: "#34d399", background: "rgba(16,185,129,0.1)", padding: "5px 10px", borderRadius: "6px", textDecoration: "none", border: "1px solid rgba(16,185,129,0.2)", whiteSpace: "nowrap" as const }}>
                              View Proof
                            </a>
                          )}
                          {!marked && (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#4b5563", background: "rgba(255,255,255,0.04)", padding: "4px 9px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap" as const }}>PENDING</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Financial Settlement */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>FINANCIAL SETTLEMENT</p>
              <span style={{ fontSize: "20px" }}>🏦</span>
            </div>
            {driver.bankDetails ? (
              <>
                <p style={{ margin: "0 0 12px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>DIRECT DEPOSIT ACCOUNT</p>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "16px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#6b7280" }}>Bank Name</p>
                  <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>{driver.bankDetails.bankName || "N/A"}</p>
                  <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#6b7280" }}>Account Number</p>
                  <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#f9fafb", letterSpacing: "2px" }}>
                    {driver.bankDetails.accountNumber ? `•••• •••• ${String(driver.bankDetails.accountNumber).slice(-4)}` : "N/A"}
                  </p>
                  {driver.bankDetails.transitNumber && (
                    <>
                      <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#6b7280" }}>Transit Number</p>
                      <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>{driver.bankDetails.transitNumber}</p>
                    </>
                  )}
                  {driver.bankDetails.institutionNumber && (
                    <>
                      <p style={{ margin: "0 0 3px", fontSize: "11px", color: "#6b7280" }}>Institution Number</p>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>{driver.bankDetails.institutionNumber}</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: "24px", textAlign: "center" as const, background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, color: "#4b5563", fontSize: "13px" }}>No direct deposit details on file.</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Compliance Documents + License Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Compliance Documents */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>COMPLIANCE DOCUMENTS</p>
              <FaUpload size={13} color="#6b7280" />
            </div>
            {([
              ["agencySignOff", "Agency Sign Off"],
              ["driverDeliveryExpectations", "Driver Delivery Expectations"],
              ["cellPhonePolicy", "Cell Phone Policy"],
              ["storeSurvey1", "Store Survey 1"],
              ["tobaccoAndLCPValidation", "Tobacco & LCP Validation"],
              ["driverSop", "Driver SOP"],
            ] as [string, string][]).map(([key, label]) => {
              const doc = driver.requiredOnboardingForms?.[key];
              const sc = doc
                ? { label: "VALID", bg: "rgba(16,185,129,0.12)", color: "#34d399", border: "rgba(16,185,129,0.25)" }
                : { label: "PENDING", bg: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "rgba(251,191,36,0.25)" };
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#e5e7eb" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#4b5563" }}>{doc ? "On file" : "Not submitted"}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {doc && (
                      <a href={`${API_BASE_URL.replace("/api", "")}/${doc}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "11px", color: "#818CF8", textDecoration: "none", fontWeight: 600 }}>View</a>
                    )}
                    <span style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, letterSpacing: "0.5px" }}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* License Details */}
          <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
            <p style={{ margin: "0 0 20px", fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>LICENSE DETAILS</p>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>COMMERCIAL DRIVER LICENSE</p>
                  <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.3px" }}>
                    {driver.licence ? `CLASS ${driver.licence.toUpperCase()} – UNRESTRICTED` : "N/A"}
                  </p>
                </div>
                <span style={{ fontSize: "22px" }}>🪪</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>LICENSE NUMBER</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>{driver.licence || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>WORK AUTHORIZATION</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>{driver.workStatus || "N/A"}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>ISSUE DATE</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>On file</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>EXPIRATION</p>
                  {driver.licence_expiry_date ? (() => {
                    const expiry = new Date(driver.licence_expiry_date);
                    const soon = new Date(); soon.setDate(soon.getDate() + 90);
                    const formatted = expiry.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
                    return <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: expiry <= soon ? "#f87171" : "#34d399" }}>{formatted}</p>;
                  })() : <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>N/A</p>}
                </div>
                {driver.workAuthExpiry && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>WORK AUTH EXPIRY</p>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#fbbf24" }}>
                      {new Date(driver.workAuthExpiry + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timesheets */}
        <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "1px" }}>TIMESHEETS</p>
          </div>
          {timesheets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" as const, color: "#4b5563", fontSize: "14px" }}>No timesheets available for this driver.</div>
          ) : (
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Date", "Start", "End", "Start KM", "End KM", "Total KM", "Category", "Planned KM", "Subtotal", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left" as const, fontSize: "9px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px", whiteSpace: "nowrap" as const }}>{h}</th>
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
                      approved: { color: "#34d399", label: "Approved" },
                      rejected: { color: "#f87171", label: "Rejected" },
                      pending:  { color: "#fbbf24", label: "Pending" },
                    };
                    const sc = statusCfg[t.status] || statusCfg.pending;
                    return (
                      <tr key={t._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: idx % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#e5e7eb" }}>{t.date}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{t.startTime}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{t.endTime}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{t.startKM}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{t.endKM}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>{totalKM !== null ? totalKM : "N/A"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>{t.category || "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#9ca3af" }}>{t.plannedKM || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#f9fafb" }}>{!isNaN(subtotal) ? `$${subtotal.toFixed(2)}` : "N/A"}</td>
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
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: "11px", color: "#374151", fontWeight: 500 }}>SYSTEM ID: FP-{String(driver._id || "ALPHA").slice(-9).toUpperCase()}</span>
          <div style={{ display: "flex", gap: "20px" }}>
<span style={{ fontSize: "11px", color: "#374151" }}>SECURE ENCRYPTION ACTIVE.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
