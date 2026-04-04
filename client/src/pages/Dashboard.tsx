import React, { useState, useEffect, useRef, CSSProperties } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useAuth } from "../contexts/AuthContext";

import { API_BASE_URL } from "../utils/env";

const durationRegex = /^(\d+\s*hr)?\s*(\d+\s*min)?$/i;

const Timesheet: React.FC = () => {
  type TimesheetType = {
    date: string;
    startTime: string;
    endTime: string;
    driver: string;
    customer: string;
    category: string;
    tripNumber: string;
    loadID: string;
    gateOutTime: string;
    gateInTime: string;
    plannedHours: string;
    plannedKM: string;
    startKM: string;
    endKM: string;
    comments: string;
    attachments: (File | undefined)[];
  };

  const getEmptyTimesheet = (driverEmail: string): TimesheetType => ({
    driver: driverEmail,
    date: "",
    startTime: "",
    endTime: "",
    customer: "",
    category: "",
    tripNumber: "",
    loadID: "",
    gateOutTime: "",
    gateInTime: "",
    plannedHours: "",
    plannedKM: "",
    startKM: "",
    endKM: "",
    comments: "",
    attachments: [],
  });

  const [timesheet, setTimesheet] = useState<TimesheetType>(() => getEmptyTimesheet(""));
  const [errors, setErrors] = useState<Partial<Record<keyof TimesheetType, string>>>({});
  const [loading, setLoading] = useState(false);
  const categoryOptions = ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale", "Wholesale DZ", "voila", "TCS linehaul trenton"];
  const customerOptions = ["Sobeys Capital Inc."];
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessagesList, setErrorMessagesList] = useState<string[]>([]);
  const { user } = useAuth();
  const [driverName, setDriverName] = useState("");
  const [driverIdDisplay, setDriverIdDisplay] = useState("");
  const [orgName, setOrgName] = useState("");
  const [driverStatus, setDriverStatus] = useState("Active");
  const [totalHours, setTotalHours] = useState("0");
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ date: string; totalHours: string }>({ date: "", totalHours: "" });
  // Extra Work Sheet state
  const [extraWorkSheet, setExtraWorkSheet] = useState("");
  const [extraWorkSheetDuration, setExtraWorkSheetDuration] = useState({ duration: "", from: "", to: "" });
  const [extraWorkSheetComments, setExtraWorkSheetComments] = useState({ comments: "" });
  const [extraDelayYesNo, setExtraDelayYesNo] = useState(""); // "yes" | "no"

  const [hasDelay, setHasDelay] = useState<string[]>([]);
  const [storeDelay, setStoreDelay] = useState({ duration: "", from: "", to: "", reason: "" });
  const [roadDelay, setRoadDelay] = useState({ duration: "", from: "", to: "", reason: "" });
  const [otherDelay, setOtherDelay] = useState({ duration: "", from: "", to: "", reason: "" });

  // Vehicle Tracking state
  const [trackingActive, setTrackingActive] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<{ _id: string; unitNumber: string } | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [tripStart, setTripStart] = useState<Date | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pingFailCount, setPingFailCount] = useState(0);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function for duration calculation
  function calculateDuration(from: string, to: string): string {
    if (!from || !to) return "";
    const [fromH, fromM] = from.split(":").map(Number);
    const [toH, toM] = to.split(":").map(Number);
    let start = new Date();
    start.setHours(fromH, fromM, 0);
    let end = new Date();
    end.setHours(toH, toM, 0);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours} hr ${minutes} min`;
  }
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const stored = JSON.parse(storedUser);
      if (stored.role === "driver") {
        setTimesheet(getEmptyTimesheet(stored.email));
        setDriverName(stored.name);
        // Use cached driverId/orgName from login; refresh from API if we have the driver id
        if (stored.driverId) setDriverIdDisplay(stored.driverId);
        if (stored.orgName) setOrgName(stored.orgName);
      }
    }
    // Fetch full driver record to get up-to-date driverId, org, status
    const fetchDriverInfo = async () => {
      const driverId = user?.id;
      if (!driverId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/drivers/${driverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data;
        if (d.driverId) setDriverIdDisplay(d.driverId);
        if (d.organizationId?.name) setOrgName(d.organizationId.name);
        if (d.status) setDriverStatus(d.status);
      } catch {
        // non-critical — cached values already set above
      }
    };
    fetchDriverInfo();
  }, [user?.id]);

  useEffect(() => {
    const fetchAssignedVehicle = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tracking/my-vehicle`);
        const vehicle = { _id: res.data._id, unitNumber: res.data.unitNumber };
        setAssignedVehicle(vehicle);
        // Resume active trip if driver refreshed mid-trip
        const saved = localStorage.getItem("activeTrip");
        if (saved) {
          try {
            const { tripId: savedTripId, tripStart: savedTripStart } = JSON.parse(saved);
            setTripId(savedTripId);
            setTrackingActive(true);
            setTripStart(new Date(savedTripStart));
            trackingIntervalRef.current = setInterval(() => {
              sendLocationPing(savedTripId, vehicle._id);
            }, 30000);
          } catch {
            localStorage.removeItem("activeTrip");
          }
        }
      } catch (e) {
        // 404 = no vehicle assigned — card stays hidden
      }
    };
    fetchAssignedVehicle();
  }, [user]);

  useEffect(() => {
    return () => { if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current); };
  }, []);

  const sendLocationPing = async (currentTripId: string, vehicleId: string) => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(`${API_BASE_URL}/tracking/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? pos.coords.speed * 3.6 : 0,
            vehicleId,
            tripId: currentTripId,
          });
          setLastPing(new Date());
          setGeoError(null);
          setPingFailCount(0);
        } catch (e) {
          console.error("Location ping failed:", e);
          setPingFailCount((c) => c + 1);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGeoError("Location access denied. Enable location permission in your browser to share your position.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleStartTrip = async () => {
    if (!assignedVehicle) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/tracking/trips/start`, { vehicleId: assignedVehicle._id });
      const newTripId = res.data.tripId;
      const now = new Date();
      setTripId(newTripId);
      setTrackingActive(true);
      setTripStart(now);
      setGeoError(null);
      setPingFailCount(0);
      localStorage.setItem("activeTrip", JSON.stringify({ tripId: newTripId, vehicleId: assignedVehicle._id, tripStart: now }));
      sendLocationPing(newTripId, assignedVehicle._id);
      trackingIntervalRef.current = setInterval(() => {
        sendLocationPing(newTripId, assignedVehicle._id);
      }, 30000);
    } catch (e) {
      console.error("Start trip failed:", e);
    }
  };

  const handleEndTrip = async () => {
    if (!tripId || !assignedVehicle) return;
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    try {
      await axios.post(`${API_BASE_URL}/tracking/trips/${tripId}/end`, { vehicleId: assignedVehicle._id });
      setTrackingActive(false);
      setTripId(null);
      setTripStart(null);
      setLastPing(null);
      setGeoError(null);
      setPingFailCount(0);
      localStorage.removeItem("activeTrip");
    } catch (e) {
      console.error("End trip failed:", e);
      // Restore ping interval so trip continues being tracked if end call fails
      trackingIntervalRef.current = setInterval(() => {
        sendLocationPing(tripId, assignedVehicle._id);
      }, 30000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setTimesheet((prev) => {
      const updatedTimesheet = { ...prev, [name]: value };
  
      // ✅ Get startTime and endTime directly from the updated state
      if (updatedTimesheet.startTime && updatedTimesheet.endTime) {
        const [startH, startM] = updatedTimesheet.startTime.split(":").map(Number);
        const [endH, endM] = updatedTimesheet.endTime.split(":").map(Number);

        const start = new Date();
        start.setHours(startH, startM, 0, 0);
        const end = new Date();
        end.setHours(endH, endM, 0, 0);
        if (end < start) {
          end.setDate(end.getDate() + 1); // handle overnight
        }

        const diffMs = end.getTime() - start.getTime();
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hr = Math.floor(totalMinutes / 60);
        const min = totalMinutes % 60;
        setTotalHours(`${hr} hr ${min} min`);
      } else {
        setTotalHours("0");
      }

  
      return updatedTimesheet;
    });
  
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Reject files larger than 6MB
      if (file.size > 6 * 1024 * 1024) {
        alert("File size should not exceed 6MB.");
        return;
      }
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);
        const newAttachments = [...timesheet.attachments];
        newAttachments[index] = compressedFile;
        setTimesheet((prev) => ({ ...prev, attachments: newAttachments }));
      } catch (err) {
        console.error("❌ Compression failed:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("🔵 Submitting timesheet:", timesheet);
    e.preventDefault();
    setLoading(true);

    // Delay duration regex validation
    if (hasDelay.includes("store") && storeDelay.duration && !durationRegex.test(storeDelay.duration.trim())) {
      alert("Please enter Store Delay duration in correct format (e.g., '2 hr 30 min', '45 min')");
      setLoading(false);
      return;
    }

    if (hasDelay.includes("road") && roadDelay.duration && !durationRegex.test(roadDelay.duration.trim())) {
      alert("Please enter Road Delay duration in correct format (e.g., '2 hr', '45 min')");
      setLoading(false);
      return;
    }

    if (hasDelay.includes("other") && otherDelay.duration && !durationRegex.test(otherDelay.duration.trim())) {
      alert("Please enter Other Delay duration in correct format (e.g., '1 hr', '30 min')");
      setLoading(false);
      return;
    }

    let validationErrors: Partial<Record<keyof TimesheetType, string>> = {};

    const requiredFields: (keyof TimesheetType)[] = [
      "customer",
      "category",
      "tripNumber",
      "loadID",
      "gateOutTime",
      "gateInTime",
      "startKM",
      "endKM",
    ];

    requiredFields.forEach((field) => {
      if (!timesheet[field] || (typeof timesheet[field] === "string" && timesheet[field].trim() === "")) {
        validationErrors[field] = `${field.replace(/([A-Z])/g, " $1")} is required.`;
      }
    });

    // Validate Start KM and End KM
    if (timesheet.startKM !== "" && Number(timesheet.startKM) < 0) {
      validationErrors["startKM"] = "Start KM cannot be negative.";
    }
    if (timesheet.endKM !== "" && Number(timesheet.endKM) < 0) {
      validationErrors["endKM"] = "End KM cannot be negative.";
    }
    if (timesheet.startKM !== "" && timesheet.endKM !== "" && Number(timesheet.endKM) < Number(timesheet.startKM)) {
      validationErrors["endKM"] = "End KM must be greater than Start KM.";
    }

    // Removed validation for Start Date < End Date

    if (Object.keys(validationErrors).length > 0) {
      console.warn("🟠 Validation errors found:", validationErrors);
      setErrors(validationErrors);
      setErrorMessagesList(Object.values(validationErrors));
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    console.log("✅ Validation passed. Preparing to submit...");

    try {
      let response;

      if (timesheet.attachments.length === 0 || timesheet.attachments.every(file => !file)) {
        console.log("📤 No attachments detected. Sending JSON payload...");

        // Construct payload conditionally for delay fields and extraWorkSheet fields
        const payload: any = {
          ...timesheet,
          totalHours: totalHours,
          startKM: Number(timesheet.startKM),
          endKM: Number(timesheet.endKM),
          attachments: [],
        };
        payload.extraDelay = extraDelayYesNo;

        // Only include delay fields if valid
        if (extraDelayYesNo === 'yes') {
          if (storeDelay.duration && storeDelay.from && storeDelay.to) {
            payload.storeDelay = storeDelay;
          }
          if (roadDelay.duration && roadDelay.from && roadDelay.to) {
            payload.roadDelay = roadDelay;
          }
          if (otherDelay.duration && otherDelay.from && otherDelay.to) {
            payload.otherDelay = otherDelay;
          }
        }

        // Only include extraWorkSheet fields if selected as 'yes'
        if (extraWorkSheet === 'yes') {
          payload.extraWorkSheet = extraWorkSheet;
          payload.extraWorkSheetDetails = extraWorkSheetDuration;
          payload.extraWorkSheetComments = extraWorkSheetComments.comments;
        }

        console.log("📄 Payload to send:", payload);

        response = await axios.post(`${API_BASE_URL}/timesheet`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        console.log("📤 Attachments detected. Sending FormData payload...");

        const formData = new FormData();

        Object.entries(timesheet).forEach(([key, value]) => {
          if (key !== "attachments" && value) {
            if (key === "startKM" || key === "endKM") {
              formData.append(key, String(Number(value)));
            } else {
              formData.append(key, value as string);
            }
          }
        });
        // Always append extraDelay after constructing formData
        formData.append("extraDelay", extraDelayYesNo?.toLowerCase?.() || "no");

        formData.append("totalHours", totalHours);

        // Only include delay fields if valid
        if (storeDelay.duration && storeDelay.from && storeDelay.to) {
          formData.append("storeDelay", JSON.stringify(storeDelay));
        }
        if (roadDelay.duration && roadDelay.from && roadDelay.to) {
          formData.append("roadDelay", JSON.stringify(roadDelay));
        }
        if (otherDelay.duration && otherDelay.from && otherDelay.to) {
          formData.append("otherDelay", JSON.stringify(otherDelay));
        }

        // Only include extraWorkSheet fields if selected as 'yes'
        if (extraWorkSheet === 'yes') {
          formData.append("extraWorkSheet", extraWorkSheet);
          formData.append("extraWorkSheetDetails", JSON.stringify(extraWorkSheetDuration));
          formData.append("extraWorkSheetComments", extraWorkSheetComments.comments);
        }

        timesheet.attachments.forEach((file, idx) => {
          if (file) {
            formData.append("attachments", file);
            console.log(`📎 Attached file[${idx}]:`, file.name);
          }
        });

        console.log("📄 FormData ready to submit.");

        response = await axios.post(`${API_BASE_URL}/timesheet`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      console.log("🟢 Timesheet submitted successfully. Server response:", response.data);
      setSubmittedData({ date: timesheet.date, totalHours: totalHours });
      setShowSuccess(true);

      setTimesheet(getEmptyTimesheet(timesheet.driver));
      // Reset delay and extra worksheet fields
      setExtraWorkSheet("");
      setExtraWorkSheetDuration({ duration: "", from: "", to: "" });
      setExtraWorkSheetComments({ comments: "" });
      setExtraDelayYesNo("");
      setHasDelay([]);
      setStoreDelay({ duration: "", from: "", to: "", reason: "" });
      setRoadDelay({ duration: "", from: "", to: "", reason: "" });
      setOtherDelay({ duration: "", from: "", to: "", reason: "" });
      setTotalHours("0");
      setErrors({});
    } catch (error) {
      const err = (error as any).response?.data || (error as any).message;
      console.error("🔴 Error submitting timesheet:", err);
      alert("Failed to submit timesheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (showSuccess) {
    const tsId = `TS-${Math.random().toString(36).slice(2, 8).toUpperCase()}-X`;
    const formattedDate = submittedData.date
      ? new Date(submittedData.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "Today";
    return (
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" as const }}>
            {/* Checkmark */}
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "rgba(79,70,229,0.2)", border: "2px solid rgba(79,70,229,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: "36px" }}>
              ✓
            </div>
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 900, color: "var(--t-text)", letterSpacing: "-0.8px", lineHeight: 1.15 }}>
              Timesheet Submitted<br />Successfully
            </h1>
            <p style={{ margin: "0 0 40px", fontSize: "16px", color: "var(--t-text-dim)", lineHeight: 1.6 }}>
              Your records for <strong style={{ color: "var(--t-text-secondary)" }}>{formattedDate}</strong>, have been encrypted<br />and queued for review.
            </p>
            {/* Summary Card */}
            <div style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px", textAlign: "left" as const, marginBottom: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", marginBottom: "24px" }}>
                {[
                  ["TIMESHEET ID", tsId],
                  ["TOTAL DURATION", submittedData.totalHours || "—"],
                  ["DRIVER", driverName || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--t-text)" }}>{value}</p>
                  </div>
                ))}
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>STATUS</p>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--t-warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--t-warning)", display: "inline-block" }} />
                    Pending Review
                  </p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--t-border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--t-text-ghost)", display: "flex", alignItems: "center", gap: "6px" }}>🔒 End-to-end encryption active</span>
                <span style={{ fontSize: "11px", color: "var(--t-text-muted)" }}>Ref: FleetIQ-Core-v2.4</span>
              </div>
            </div>
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" as const, justifyContent: "center" }}>
              <button
                onClick={() => { setShowSuccess(false); setTimesheet(getEmptyTimesheet(timesheet.driver)); }}
                style={{ flex: "1 1 200px", padding: "14px 28px", background: "linear-gradient(135deg, #4F46E5, #6366f1)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 20px rgba(79,70,229,0.4)" }}
              >
                Return to Dashboard →
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                style={{ flex: "1 1 180px", padding: "14px 28px", background: "var(--t-input-bg)", border: "1px solid var(--t-border)", borderRadius: "12px", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                👁 View Detailed Log
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          .db-two-col { grid-template-columns: 1fr !important; }
          .db-section-card { padding: 16px !important; }
          .db-main { padding: 0 12px 80px !important; margin-top: 12px !important; }
          .db-hero { padding: 20px 16px !important; }
          .db-hero-inner { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
        }
        @media (min-width: 769px) {
          .db-two-col { grid-template-columns: 1fr 1fr; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.4);
        }
        select option { background: var(--t-select-bg); color: var(--t-text-secondary); }
      `}</style>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px", padding: "14px 40px 0" }}>
        DASHBOARD
      </div>

      {/* ── Driver Hero ─────────────────────────────────────────────────── */}
      <div style={heroOuter} className="db-hero">
        <div style={heroInner} className="db-hero-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <div style={avatarCircle}>{(driverName || "D").charAt(0).toUpperCase()}</div>
            <div>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Senior Logistics Op</p>
              <h1 style={{ margin: "3px 0 0", fontSize: "22px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.4px", lineHeight: 1 }}>
                {driverName || "Driver"}
              </h1>
              {driverIdDisplay && (
                <p style={{ margin: "5px 0 0", fontSize: "12px", color: "var(--t-text-ghost)", fontWeight: 500, fontFamily: "monospace" }}>
                  • {driverIdDisplay}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const, alignItems: "center" }}>
            {orgName && <span style={orgBadge}>🏢 {orgName}</span>}
            <span style={driverStatus === "Active" ? activeBadge : inactiveBadge}>● {driverStatus}</span>
          </div>
        </div>
      </div>

      <div style={styles.mainContent} data-db-content>
        <h2 style={styles.pageTitle} data-db-title>Enter Your Timesheet</h2>

        {assignedVehicle && (
          <div style={{
            background: trackingActive ? "#f0fdf4" : "#f9fafb",
            border: `1px solid ${trackingActive ? "#86efac" : "#e5e7eb"}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
                {trackingActive ? "Trip Active" : "Start Trip"} — {assignedVehicle.unitNumber}
              </div>
              {trackingActive && tripStart && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  Started: {tripStart.toLocaleTimeString()} &nbsp;|&nbsp;
                  Last ping: {lastPing ? lastPing.toLocaleTimeString() : "pending..."}
                </div>
              )}
              {!trackingActive && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Share your location with dispatch</div>
              )}
              {geoError && (
                <div style={{ fontSize: 12, color: "#b91c1c", background: "#fee2e2", borderRadius: 6, padding: "4px 8px", marginTop: 6 }}>
                  {geoError}
                </div>
              )}
              {!geoError && pingFailCount >= 3 && (
                <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 6, padding: "4px 8px", marginTop: 6 }}>
                  Location sync failed. Check your connection.
                </div>
              )}
            </div>
            <button
              onClick={trackingActive ? handleEndTrip : handleStartTrip}
              style={{
                background: trackingActive ? "#ef4444" : "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {trackingActive ? "End Trip" : "Start Trip"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* ── TRIP INFORMATION ──────────────────────────────────────── */}
          <div style={formSectionCard} className="db-section-card">
            <p style={sectionDivider}>Trip Information</p>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px", marginBottom: "14px" }}>
              <p style={fieldLabel}>Organization ID</p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--t-text-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {driverIdDisplay ? `GLO-${driverIdDisplay.slice(-7).toUpperCase()}` : "GLO-LOG-2024"}
                <span style={{ fontSize: "14px", color: "var(--t-text-ghost)" }}>🔒</span>
              </p>
            </div>
            <div style={twoCol} className="db-two-col">
              <div>
                <p style={fieldLabel}>Vehicle ID</p>
                <input type="text" name="vehicleID" placeholder="VK-409" style={styles.input} onChange={handleChange} />
              </div>
              <div>
                <p style={fieldLabel}>Load ID</p>
                <input type="text" name="loadID" value={timesheet.loadID} onChange={handleChange} placeholder="Enter ID" style={errors.loadID ? { ...styles.input, borderColor: "var(--t-error)" } : styles.input} />
                {errors.loadID && <span style={styles.error}>{errors.loadID}</span>}
              </div>
            </div>
            <div>
              <p style={fieldLabel}>Customer Selection</p>
              <select name="customer" value={timesheet.customer} onChange={handleChange} style={errors.customer ? { ...styles.input, borderColor: "var(--t-error)" } : styles.input}>
                <option value="">Select Customer</option>
                {customerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.customer && <span style={styles.error}>{errors.customer}</span>}
            </div>
            <div style={{ marginTop: "14px" }}>
              <p style={fieldLabel}>Category</p>
              <select name="category" value={timesheet.category} onChange={handleChange} style={errors.category ? { ...styles.input, borderColor: "var(--t-error)" } : styles.input}>
                <option value="">Select Category</option>
                {categoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.category && <span style={styles.error}>{errors.category}</span>}
            </div>
          </div>

          {/* ── TIMING & GATE ACCESS ──────────────────────────────────── */}
          <div style={formSectionCard} className="db-section-card">
            <p style={sectionDivider}>Timing &amp; Gate Access</p>
            {/* Trip Date */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px 16px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>📅</span>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>TRIP DATE</p>
                  <input type="date" name="date" value={timesheet.date} onChange={handleChange}
                    style={{ background: "none", border: "none", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer", padding: 0 }} />
                </div>
              </div>
              <button type="button" style={{ background: "none", border: "1px solid var(--t-border)", color: "var(--t-text-faint)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>EDIT</button>
            </div>
            <div style={twoCol} className="db-two-col">
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>⏱</span> START TIME
                </p>
                <input type="time" name="startTime" value={timesheet.startTime} onChange={handleChange}
                  style={{ background: "none", border: "none", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", padding: 0, width: "100%" }} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>⏱</span> END TIME
                </p>
                <input type="time" name="endTime" value={timesheet.endTime} onChange={handleChange}
                  style={{ background: "none", border: "none", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", padding: 0, width: "100%" }} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>🚪</span> GATE OUT
                </p>
                <input type="time" name="gateOutTime" value={timesheet.gateOutTime} onChange={handleChange}
                  style={{ background: "none", border: "none", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", padding: 0, width: "100%" }} />
                {errors.gateOutTime && <span style={styles.error}>{errors.gateOutTime}</span>}
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>🚪</span> GATE IN
                </p>
                <input type="time" name="gateInTime" value={timesheet.gateInTime} onChange={handleChange}
                  style={{ background: "none", border: "none", color: "var(--t-text-secondary)", fontSize: "15px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", padding: 0, width: "100%" }} />
                {errors.gateInTime && <span style={styles.error}>{errors.gateInTime}</span>}
              </div>
            </div>
            {/* Extra Work Sheet */}
            <div style={{ ...styles.extraWorkWrapper, marginTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>Extra Work Sheet?</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {["yes", "no"].map(v => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: extraWorkSheet === v ? "var(--t-indigo)" : "var(--t-text-dim)", cursor: "pointer", fontWeight: extraWorkSheet === v ? 700 : 500 }}>
                      <input type="radio" name="extraWorkSheet" value={v} checked={extraWorkSheet === v} onChange={e => setExtraWorkSheet(e.target.value)} style={{ accentColor: "var(--t-indigo)" }} />
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              {extraWorkSheet === "yes" && (
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                  <div style={twoCol} className="db-two-col">
                    <div>
                      <p style={fieldLabel}>From</p>
                      <input type="time" style={styles.input} value={extraWorkSheetDuration.from} onChange={e => { const v = e.target.value; setExtraWorkSheetDuration(p => { const n = { ...p, from: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} />
                    </div>
                    <div>
                      <p style={fieldLabel}>To</p>
                      <input type="time" style={styles.input} value={extraWorkSheetDuration.to} onChange={e => { const v = e.target.value; setExtraWorkSheetDuration(p => { const n = { ...p, to: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} />
                    </div>
                  </div>
                  <div>
                    <p style={fieldLabel}>Duration</p>
                    <input type="text" style={{ ...styles.input, color: "var(--t-text-ghost)" }} value={extraWorkSheetDuration.duration} readOnly />
                  </div>
                  <div>
                    <p style={fieldLabel}>Comments</p>
                    <input type="text" style={styles.input} value={extraWorkSheetComments.comments} onChange={e => setExtraWorkSheetComments({ comments: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── METRICS & DISTANCE ───────────────────────────────────── */}
          <div style={formSectionCard} className="db-section-card">
            <p style={sectionDivider}>Metrics &amp; Distance</p>
            <div style={twoCol} className="db-two-col">
              <div style={{ background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.3)", borderRadius: "12px", padding: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-indigo)", letterSpacing: "0.8px" }}>TOTAL HOURS</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>{totalHours}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>TRIP NUMBER</p>
                <input type="text" name="tripNumber" value={timesheet.tripNumber} onChange={handleChange} placeholder="#TX-000"
                  style={{ background: "none", border: "none", color: "var(--t-text)", fontSize: "22px", fontWeight: 800, fontFamily: "Inter, system-ui, sans-serif", padding: 0, width: "100%" }} />
                {errors.tripNumber && <span style={styles.error}>{errors.tripNumber}</span>}
              </div>
            </div>
            <div style={{ ...twoCol, marginTop: "14px" }} className="db-two-col">
              <div>
                <p style={fieldLabel}>KM Start</p>
                <input type="number" name="startKM" value={timesheet.startKM} onChange={handleChange} placeholder="45230" style={errors.startKM ? { ...styles.input, borderColor: "var(--t-error)" } : styles.input} />
                {errors.startKM && <span style={styles.error}>{errors.startKM}</span>}
              </div>
              <div>
                <p style={fieldLabel}>KM End</p>
                <input type="number" name="endKM" value={timesheet.endKM} onChange={handleChange} placeholder="45412" style={errors.endKM ? { ...styles.input, borderColor: "var(--t-error)" } : styles.input} />
                {errors.endKM && <span style={styles.error}>{errors.endKM}</span>}
              </div>
              <div>
                <p style={fieldLabel}>Planned Hours</p>
                <input type="text" name="plannedHours" value={timesheet.plannedHours} onChange={handleChange} style={styles.input} />
              </div>
              <div>
                <p style={fieldLabel}>Planned KM</p>
                <input type="text" name="plannedKM" value={timesheet.plannedKM} onChange={handleChange} style={styles.input} />
              </div>
            </div>
          </div>

          {/* ── CONDITIONS & DELAYS ──────────────────────────────────── */}
          <div style={formSectionCard} className="db-section-card">
            <p style={sectionDivider}>Conditions &amp; Delays</p>
            {/* Extra Delay toggle */}
            {[
              { key: "traffic", icon: "⚠️", label: "Traffic Delay", color: "var(--t-warning)" },
              { key: "store", icon: "🔧", label: "Extra Labor / Store Delay", color: "var(--t-indigo)" },
              { key: "road", icon: "🚫", label: "Road Delay", color: "var(--t-error)" },
              { key: "other", icon: "📋", label: "Other Delay", color: "var(--t-success)" },
            ].map(({ key, icon, label, color }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--t-surface-alt)", border: `1px solid ${hasDelay.includes(key) ? color + "33" : "var(--t-hover-bg)"}`, borderRadius: "12px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{label}</span>
                </div>
                <label style={{ position: "relative" as const, display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                  <input type="checkbox" checked={hasDelay.includes(key)}
                    onChange={e => {
                      if (key === "traffic") {
                        setExtraDelayYesNo(e.target.checked ? "yes" : "no");
                      }
                      setHasDelay(prev => e.target.checked ? [...prev, key] : prev.filter(d => d !== key));
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: "absolute" as const, inset: 0, borderRadius: "24px", background: hasDelay.includes(key) ? color : "var(--t-border-strong)", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute" as const, width: "18px", height: "18px", borderRadius: "50%", background: "var(--t-surface)", top: "3px", left: hasDelay.includes(key) ? "23px" : "3px", transition: "left 0.2s" }} />
                  </span>
                </label>
              </div>
            ))}
            {/* Delay Detail Fields */}
            {(hasDelay.includes("store") || hasDelay.includes("road") || hasDelay.includes("other")) && (
              <div style={{ marginTop: "4px" }}>
                {hasDelay.includes("store") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Store / Extra Labor Delay</h4>
                    <div style={twoCol} className="db-two-col">
                      <div><p style={fieldLabel}>From</p><input type="time" style={styles.delayInput} value={storeDelay.from} onChange={e => { const v = e.target.value; setStoreDelay(p => { const n = { ...p, from: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                      <div><p style={fieldLabel}>To</p><input type="time" style={styles.delayInput} value={storeDelay.to} onChange={e => { const v = e.target.value; setStoreDelay(p => { const n = { ...p, to: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                    </div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Duration (auto)</p><input type="text" style={{ ...styles.delayInput, color: "var(--t-text-ghost)" }} value={storeDelay.duration} readOnly /></div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Reason</p><input type="text" style={styles.delayInput} value={storeDelay.reason} onChange={e => setStoreDelay({ ...storeDelay, reason: e.target.value })} /></div>
                  </div>
                )}
                {hasDelay.includes("road") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Road Delay</h4>
                    <div style={twoCol} className="db-two-col">
                      <div><p style={fieldLabel}>From</p><input type="time" style={styles.delayInput} value={roadDelay.from} onChange={e => { const v = e.target.value; setRoadDelay(p => { const n = { ...p, from: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                      <div><p style={fieldLabel}>To</p><input type="time" style={styles.delayInput} value={roadDelay.to} onChange={e => { const v = e.target.value; setRoadDelay(p => { const n = { ...p, to: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                    </div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Duration (auto)</p><input type="text" style={{ ...styles.delayInput, color: "var(--t-text-ghost)" }} value={roadDelay.duration} readOnly /></div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Reason</p><input type="text" style={styles.delayInput} value={roadDelay.reason} onChange={e => setRoadDelay({ ...roadDelay, reason: e.target.value })} /></div>
                  </div>
                )}
                {hasDelay.includes("other") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Other Delay</h4>
                    <div style={twoCol} className="db-two-col">
                      <div><p style={fieldLabel}>From</p><input type="time" style={styles.delayInput} value={otherDelay.from} onChange={e => { const v = e.target.value; setOtherDelay(p => { const n = { ...p, from: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                      <div><p style={fieldLabel}>To</p><input type="time" style={styles.delayInput} value={otherDelay.to} onChange={e => { const v = e.target.value; setOtherDelay(p => { const n = { ...p, to: v }; if (n.from && n.to) n.duration = calculateDuration(n.from, n.to); return n; }); }} /></div>
                    </div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Duration (auto)</p><input type="text" style={{ ...styles.delayInput, color: "var(--t-text-ghost)" }} value={otherDelay.duration} readOnly /></div>
                    <div style={{ marginTop: "10px" }}><p style={fieldLabel}>Reason</p><input type="text" style={styles.delayInput} value={otherDelay.reason} onChange={e => setOtherDelay({ ...otherDelay, reason: e.target.value })} /></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── NOTES & PROOF ─────────────────────────────────────────── */}
          <div style={formSectionCard} className="db-section-card">
            <p style={sectionDivider}>Notes &amp; Proof</p>
            <p style={fieldLabel}>Comments</p>
            <textarea name="comments" value={timesheet.comments} onChange={handleChange} style={styles.textarea} placeholder="Add details about your trip or any incidents..." />
            <p style={{ ...fieldLabel, marginTop: "16px" }}>Attachments</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "1", position: "relative" as const }}>
                  {timesheet.attachments[i] ? (
                    <>
                      <img src={URL.createObjectURL(timesheet.attachments[i]!)} alt={`Attachment ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
                      <button type="button" onClick={() => { const a = [...timesheet.attachments]; a[i] = undefined; setTimesheet(p => ({ ...p, attachments: a })); }}
                        style={{ position: "absolute" as const, top: "6px", right: "6px", width: "22px", height: "22px", borderRadius: "50%", background: "var(--t-error)", border: "none", color: "#fff", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
                    </>
                  ) : (
                    <label style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", height: "100%", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "10px", cursor: "pointer", gap: "6px", minHeight: "100px" }}>
                      <span style={{ fontSize: "22px", color: "var(--t-text-ghost)" }}>📷</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.5px" }}>ADD PROOF</span>
                      <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={e => handleFileChange(i, e)} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Submitting..." : "Save Timesheet"}
          </button>
        </form>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowErrorModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--t-text)", marginTop: 0, marginBottom: "16px" }}>Validation Errors</h3>
            <ul style={{ paddingLeft: "20px", margin: 0 }}>
              {errorMessagesList.map((msg, i) => (
                <li key={i} style={{ color: "var(--t-error)", fontSize: "14px", marginBottom: "6px" }}>{msg}</li>
              ))}
            </ul>
            <button onClick={() => setShowErrorModal(false)} style={styles.modalCloseBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Style constants ───────────────────────────────────────────────────────────
const heroOuter: CSSProperties = {
  background: "var(--t-surface-alt)",
  padding: "28px 40px",
  borderBottom: "1px solid var(--t-border)",
};
const heroInner: CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap" as const,
};
const avatarCircle: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #4F46E5, #7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 800,
  color: "var(--t-surface)",
  flexShrink: 0,
};
const orgBadge: CSSProperties = {
  background: "var(--t-border)",
  color: "var(--t-text-faint)",
  border: "1px solid var(--t-border)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const activeBadge: CSSProperties = {
  background: "rgba(16,185,129,0.15)",
  color: "var(--t-success)",
  border: "1px solid rgba(16,185,129,0.3)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const inactiveBadge: CSSProperties = {
  background: "var(--t-error-bg)",
  color: "var(--t-error)",
  border: "1px solid var(--t-border)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const sectionDivider: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--t-text-ghost)",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  borderBottom: "1px solid var(--t-border)",
  paddingBottom: "10px",
  marginTop: 0,
  marginBottom: "16px",
};
const fieldLabel: CSSProperties = {
  margin: "0 0 6px",
  fontSize: "9px",
  fontWeight: 700,
  color: "var(--t-text-ghost)",
  letterSpacing: "0.8px",
  textTransform: "uppercase" as const,
};
const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  alignItems: "start",
};
const formSectionCard: CSSProperties = {
  background: "var(--t-surface)",
  borderRadius: "16px",
  border: "1px solid var(--t-border)",
  padding: "20px",
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "var(--t-bg)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  mainContent: {
    margin: "20px auto 60px",
    padding: "0 16px",
    width: "100%",
    maxWidth: "680px",
    boxSizing: "border-box" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--t-text-dim)",
    marginBottom: "6px",
  },
  sectionLabel: {
    fontWeight: 700,
    fontSize: "14px",
    color: "var(--t-text-secondary)",
    marginBottom: "4px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "var(--t-text-faint)",
    cursor: "pointer",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid var(--t-input-border)",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  textarea: {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: "1px solid var(--t-border)",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-faint)",
    height: "100px",
    resize: "vertical" as const,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  extraWorkWrapper: {
    border: "1px solid var(--t-border)",
    borderRadius: "12px",
    padding: "14px 16px",
    backgroundColor: "var(--t-stripe)",
  },
  delaySection: {
    border: "1px solid var(--t-border)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
    backgroundColor: "var(--t-stripe)",
    marginTop: "8px",
  },
  delaySectionTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--t-text-faint)",
    marginTop: 0,
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  delayField: {
    display: "flex",
    flexDirection: "column" as const,
    flex: "1 1 45%",
    minWidth: "140px",
  },
  delayInput: {
    padding: "10px 12px",
    border: "1px solid var(--t-input-border)",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  submitButton: {
    background: "linear-gradient(135deg, #4F46E5 0%, #6366f1 100%)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
    letterSpacing: "0.2px",
    marginTop: "4px",
    width: "100%",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  error: {
    color: "var(--t-error)",
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  },
  modalBackdrop: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "var(--t-modal-overlay)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "var(--t-surface)",
    border: "1px solid var(--t-border)",
    padding: "28px",
    borderRadius: "16px",
    width: "80%",
    maxWidth: "460px",
    boxShadow: "var(--t-shadow-lg)",
  },
  modalCloseBtn: {
    marginTop: "20px",
    padding: "10px 24px",
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default Timesheet;
