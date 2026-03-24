import React, { useState, useEffect, CSSProperties } from "react";
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
  // Extra Work Sheet state
  const [extraWorkSheet, setExtraWorkSheet] = useState("");
  const [extraWorkSheetDuration, setExtraWorkSheetDuration] = useState({ duration: "", from: "", to: "" });
  const [extraWorkSheetComments, setExtraWorkSheetComments] = useState({ comments: "" });
  const [extraDelayYesNo, setExtraDelayYesNo] = useState(""); // "yes" | "no"

  const [hasDelay, setHasDelay] = useState<string[]>([]);
  const [storeDelay, setStoreDelay] = useState({ duration: "", from: "", to: "", reason: "" });
  const [roadDelay, setRoadDelay] = useState({ duration: "", from: "", to: "", reason: "" });
  const [otherDelay, setOtherDelay] = useState({ duration: "", from: "", to: "", reason: "" });

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
      alert("Timesheet submitted successfully!");

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

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          [data-db-content] { padding: 24px 16px !important; margin: 20px 12px !important; width: auto !important; }
          [data-db-title] { font-size: 20px !important; }
          [data-db-duration-row] { flex-direction: column !important; }
          [data-db-attach] { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          [data-db-content] { padding: 20px 12px !important; margin: 12px 8px !important; border-radius: 12px !important; }
          [data-db-title] { font-size: 18px !important; }
          [data-db-delay-row] { flex-direction: column !important; }
          [data-db-checkbox-row] { flex-direction: column !important; gap: 10px !important; }
        }
      `}</style>
      <Navbar />

      {/* ── Driver Hero ─────────────────────────────────────────────────── */}
      <div style={heroOuter}>
        <div style={heroInner}>
          {/* Left: avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
            <div style={avatarCircle}>
              {(driverName || "D").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1.2px" }}>Driver Portal</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {driverName || "Driver"}
              </h1>
              {driverIdDisplay && (
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500, fontFamily: "monospace" }}>
                  {driverIdDisplay}
                </p>
              )}
            </div>
          </div>
          {/* Right: org + status chips */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, alignItems: "center" }}>
            {orgName && (
              <span style={orgBadge}>🏢 {orgName}</span>
            )}
            <span style={driverStatus === "Active" ? activeBadge : inactiveBadge}>
              ● {driverStatus}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.mainContent} data-db-content>
        <h2 style={styles.pageTitle} data-db-title>Enter Your Timesheet</h2>
        <form onSubmit={handleSubmit} style={styles.form}>

          {/* ── Trip Info Section ──────────────────────────────────────── */}
          <div style={formSectionCard}>
          <div style={sectionDivider}>Trip Information</div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Driver Name</label>
              <input type="text" name="driver" value={driverName || timesheet.driver} disabled style={{ ...styles.input, backgroundColor: "#f9fafb" }} />
            </div>
            <div>
              <label style={styles.label}>Driver ID</label>
              <input type="text" value={driverIdDisplay || "—"} disabled style={{ ...styles.input, backgroundColor: "#f9fafb", fontFamily: "monospace", fontSize: "13px" }} />
            </div>
          </div>
  
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Customer</label>
              <select name="customer" value={timesheet.customer} onChange={handleChange} style={styles.input}>
                <option value="">Select Customer</option>
                {customerOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.customer && <span style={styles.error}>{errors.customer}</span>}
            </div>
            <div>
              <label style={styles.label}>Category</label>
              <select name="category" value={timesheet.category} onChange={handleChange} style={styles.input}>
                <option value="">Select Category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.category && <span style={styles.error}>{errors.category}</span>}
            </div>
          </div>

          <div style={twoCol}>
            <div>
              <label style={styles.label}>Trip Number</label>
              <input type="text" name="tripNumber" value={timesheet.tripNumber} onChange={handleChange} style={styles.input} />
              {errors.tripNumber && <span style={styles.error}>{errors.tripNumber}</span>}
            </div>
            <div>
              <label style={styles.label}>Load ID</label>
              <input type="text" name="loadID" value={timesheet.loadID} onChange={handleChange} style={styles.input} />
              {errors.loadID && <span style={styles.error}>{errors.loadID}</span>}
            </div>
          </div>

          </div>{/* end Trip Info card */}

          {/* ── Timing Section ────────────────────────────────────────── */}
          <div style={formSectionCard}>
          <div style={sectionDivider}>Timing</div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Trip Date</label>
              <input type="date" name="date" value={timesheet.date} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Total Hours</label>
              <input type="text" value={totalHours} disabled style={{ ...styles.input, backgroundColor: "#f9fafb", fontWeight: 600, color: "#4F46E5" }} />
            </div>
          </div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Start Time</label>
              <input type="time" name="startTime" value={timesheet.startTime} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>End Time</label>
              <input type="time" name="endTime" value={timesheet.endTime} onChange={handleChange} style={styles.input} />
            </div>
          </div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Gate Out Time</label>
              <input type="time" name="gateOutTime" value={timesheet.gateOutTime} onChange={handleChange} style={styles.input} />
              {errors.gateOutTime && <span style={styles.error}>{errors.gateOutTime}</span>}
            </div>
            <div>
              <label style={styles.label}>Gate In Time</label>
              <input type="time" name="gateInTime" value={timesheet.gateInTime} onChange={handleChange} style={styles.input} />
              {errors.gateInTime && <span style={styles.error}>{errors.gateInTime}</span>}
            </div>
          </div>
  
          {/* Extra Work Sheet radio and conditional duration */}
          <div style={styles.extraWorkWrapper}>
            <label style={styles.sectionLabel}>Extra Work Sheet?</label>
            <div style={{ display: "flex", gap: "24px", marginBottom: "10px", marginTop: "6px" }}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="extraWorkSheet"
                  value="yes"
                  checked={extraWorkSheet === "yes"}
                  onChange={(e) => setExtraWorkSheet(e.target.value)}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                Yes
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="extraWorkSheet"
                  value="no"
                  checked={extraWorkSheet === "no"}
                  onChange={(e) => setExtraWorkSheet(e.target.value)}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                No
              </label>
            </div>
            {extraWorkSheet === "yes" && (
              <>
                <div style={styles.durationContainer} data-db-duration-row>
                  <div style={styles.durationField}>
                    <label style={styles.label}>From</label>
                    <input
                      type="time"
                      name="durationFrom"
                      style={styles.input}
                      value={extraWorkSheetDuration.from}
                      onChange={e => {
                        const newFrom = e.target.value;
                        setExtraWorkSheetDuration((prev) => {
                          const newState = { ...prev, from: newFrom };
                          if (newState.from && newState.to) {
                            newState.duration = calculateDuration(newState.from, newState.to);
                          }
                          return newState;
                        });
                      }}
                    />
                  </div>
                  <div style={styles.durationField}>
                    <label style={styles.label}>To</label>
                    <input
                      type="time"
                      name="durationTo"
                      style={styles.input}
                      value={extraWorkSheetDuration.to}
                      onChange={e => {
                        const newTo = e.target.value;
                        setExtraWorkSheetDuration((prev) => {
                          const newState = { ...prev, to: newTo };
                          if (newState.from && newState.to) {
                            newState.duration = calculateDuration(newState.from, newState.to);
                          }
                          return newState;
                        });
                      }}
                    />
                  </div>
                </div>
                <div style={styles.durationTotal}>
                  <label style={styles.label}>Duration:</label>
                  <input
                    type="text"
                    name="extraDuration"
                    style={styles.input}
                    value={extraWorkSheetDuration.duration}
                    onChange={e => setExtraWorkSheetDuration((prev) => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div style={styles.durationTotal}>
                  <label style={styles.label}>Comments:</label>
                  <input
                    type="text"
                    name="extraWorkSheetComments"
                    style={styles.input}
                    value={extraWorkSheetComments.comments}
                    onChange={e => setExtraWorkSheetComments({ comments: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div style={styles.extraWorkWrapper}>
            <label style={styles.sectionLabel}>Was there an extra Delay?</label>
            <div style={{ display: "flex", gap: "24px", marginBottom: "10px", marginTop: "6px" }}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="extraDelay"
                  value="yes"
                  checked={extraDelayYesNo === "yes"}
                  onChange={(e) => setExtraDelayYesNo(e.target.value)}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                Yes
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="extraDelay"
                  value="no"
                  checked={extraDelayYesNo === "no"}
                  onChange={(e) => setExtraDelayYesNo(e.target.value)}
                  style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                />{" "}
                No
              </label>
            </div>
            {extraDelayYesNo === "yes" && (
              <>
                <label style={styles.label}>Select Delay Types:</label>
                <div style={{ display: "flex", flexDirection: "row", gap: "24px", marginBottom: "12px", marginTop: "4px", flexWrap: "wrap" as const }} data-db-checkbox-row>
                  <label style={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("store")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "store"] : prev.filter((d) => d !== "store")
                        )
                      }
                      style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                    />{" "}
                    Store Delay
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("road")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "road"] : prev.filter((d) => d !== "road")
                        )
                      }
                      style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                    />{" "}
                    Road Delay
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("other")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "other"] : prev.filter((d) => d !== "other")
                        )
                      }
                      style={{ accentColor: "#4F46E5", width: "16px", height: "16px" }}
                    />{" "}
                    Other Delay
                  </label>
                </div>

                {hasDelay.includes("store") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Store Delay</h4>
                    <div style={styles.delayRow} data-db-delay-row>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>From:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={storeDelay.from}
                          onChange={(e) => {
                            const newFrom = e.target.value;
                            setStoreDelay((prev) => {
                              const newState = { ...prev, from: newFrom };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>To:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={storeDelay.to}
                          onChange={(e) => {
                            const newTo = e.target.value;
                            setStoreDelay((prev) => {
                              const newState = { ...prev, to: newTo };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Duration:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={storeDelay.duration}
                        onChange={(e) => setStoreDelay({ ...storeDelay, duration: e.target.value })}
                      />
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Reason:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={storeDelay.reason}
                        onChange={(e) => setStoreDelay({ ...storeDelay, reason: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {hasDelay.includes("road") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Road Delay</h4>
                    <div style={styles.delayRow} data-db-delay-row>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>From:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={roadDelay.from}
                          onChange={(e) => {
                            const newFrom = e.target.value;
                            setRoadDelay((prev) => {
                              const newState = { ...prev, from: newFrom };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>To:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={roadDelay.to}
                          onChange={(e) => {
                            const newTo = e.target.value;
                            setRoadDelay((prev) => {
                              const newState = { ...prev, to: newTo };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Duration:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={roadDelay.duration}
                        onChange={(e) => setRoadDelay({ ...roadDelay, duration: e.target.value })}
                      />
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Reason:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={roadDelay.reason}
                        onChange={(e) => setRoadDelay({ ...roadDelay, reason: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {hasDelay.includes("other") && (
                  <div style={styles.delaySection}>
                    <h4 style={styles.delaySectionTitle}>Other Delay</h4>
                    <div style={styles.delayRow} data-db-delay-row>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>From:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={otherDelay.from}
                          onChange={(e) => {
                            const newFrom = e.target.value;
                            setOtherDelay((prev) => {
                              const newState = { ...prev, from: newFrom };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                      <div style={styles.delayField}>
                        <label style={styles.delayLabel}>To:</label>
                        <input
                          type="time"
                          style={styles.delayInput}
                          value={otherDelay.to}
                          onChange={(e) => {
                            const newTo = e.target.value;
                            setOtherDelay((prev) => {
                              const newState = { ...prev, to: newTo };
                              if (newState.from && newState.to) {
                                newState.duration = calculateDuration(newState.from, newState.to);
                              }
                              return newState;
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Duration:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={otherDelay.duration}
                        onChange={(e) => setOtherDelay({ ...otherDelay, duration: e.target.value })}
                      />
                    </div>
                    <div style={styles.delayField}>
                      <label style={styles.delayLabel}>Reason:</label>
                      <input
                        type="text"
                        style={styles.delayInput}
                        value={otherDelay.reason}
                        onChange={(e) => setOtherDelay({ ...otherDelay, reason: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          </div>{/* end Timing card */}

          {/* ── Distance Section ─────────────────────────────────────── */}
          <div style={formSectionCard}>
          <div style={sectionDivider}>Distance & Planning</div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Start KM</label>
              <input type="number" name="startKM" value={timesheet.startKM} onChange={handleChange} style={styles.input} />
              {errors.startKM && <span style={styles.error}>{errors.startKM}</span>}
            </div>
            <div>
              <label style={styles.label}>End KM</label>
              <input type="number" name="endKM" value={timesheet.endKM} onChange={handleChange} style={styles.input} />
              {errors.endKM && <span style={styles.error}>{errors.endKM}</span>}
            </div>
          </div>
          <div style={twoCol}>
            <div>
              <label style={styles.label}>Planned Hours</label>
              <input type="text" name="plannedHours" value={timesheet.plannedHours} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Planned KM</label>
              <input type="text" name="plannedKM" value={timesheet.plannedKM} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          </div>{/* end Distance card */}

          {/* ── Notes & Attachments Section ───────────────────────────── */}
          <div style={formSectionCard}>
          <div style={sectionDivider}>Notes</div>
          <label style={styles.label}>Comments</label>
          <textarea name="comments" value={timesheet.comments} onChange={handleChange} style={styles.textarea} placeholder="Enter comments..."></textarea>

          {/* Attachments */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ border: "1px solid #e0e7ff", borderRadius: "10px", padding: "12px 14px", background: "#f8f9ff", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>
                  Attachment {i + 1}
                </span>
                {timesheet.attachments[i] ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={URL.createObjectURL(timesheet.attachments[i])}
                      alt={`Attachment ${i + 1}`}
                      style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb", flexShrink: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedAttachments = [...timesheet.attachments];
                        updatedAttachments[i] = undefined;
                        setTimesheet((prev) => ({ ...prev, attachments: updatedAttachments }));
                      }}
                      style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", backgroundColor: "#4F46E5", color: "#fff", borderRadius: "7px", cursor: "pointer", fontSize: "13px", fontWeight: 600, alignSelf: "flex-start", fontFamily: "Inter, system-ui, sans-serif" }}>
                    Choose File
                    <input type="file" name="attachments" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleFileChange(i, e)} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            ))}
          </div>

          </div>{/* end Notes card */}

          {/* Submit Button */}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Submitting..." : "Submit Timesheet"}
          </button>
        </form>
      </div>
      {showErrorModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowErrorModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: "16px" }}>Validation Errors</h3>
            <ul style={{ paddingLeft: "20px", margin: 0 }}>
              {errorMessagesList.map((msg, index) => (
                <li key={index} style={{ color: "#dc2626", fontSize: "14px", marginBottom: "6px" }}>{msg}</li>
              ))}
            </ul>
            <button onClick={() => setShowErrorModal(false)} style={styles.modalCloseBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Hero styles ──────────────────────────────────────────────────────────────
const heroOuter: CSSProperties = {
  background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)",
  padding: "36px 40px",
};
const heroInner: CSSProperties = {
  maxWidth: "820px",
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "28px",
  flexWrap: "wrap" as const,
};
const avatarCircle: CSSProperties = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  border: "2px solid rgba(255,255,255,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
  fontWeight: 700,
  color: "#fff",
  flexShrink: 0,
};
const orgBadge: CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const activeBadge: CSSProperties = {
  background: "rgba(52,211,153,0.25)",
  color: "#6ee7b7",
  border: "1px solid rgba(52,211,153,0.4)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const inactiveBadge: CSSProperties = {
  background: "rgba(239,68,68,0.2)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.3)",
  borderRadius: "20px",
  padding: "3px 12px",
  fontSize: "12px",
  fontWeight: 600,
};
const sectionDivider: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "8px",
  marginTop: 0,
  marginBottom: "16px",
};
const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  alignItems: "start",
  marginBottom: "14px",
};

const formSectionCard: CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #e0e7ff",
  padding: "20px 24px",
  boxShadow: "0 1px 6px rgba(79,70,229,0.05)",
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f0f4ff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  mainContent: {
    margin: "16px auto 40px",
    padding: "0",
    width: "90%",
    maxWidth: "820px",
    backgroundColor: "transparent",
    borderRadius: "0",
    border: "none",
    boxShadow: "none",
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1e1b4b",
    marginBottom: "16px",
    marginTop: "4px",
    letterSpacing: "-0.4px",
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
    color: "#374151",
    marginBottom: "6px",
  },
  sectionLabel: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#111827",
    marginBottom: "4px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    transition: "border-color 0.2s ease",
  },
  textarea: {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    height: "100px",
    resize: "vertical" as const,
    transition: "border-color 0.2s ease",
    marginBottom: "4px",
  },
  fileInput: {
    padding: "6px 0",
  },
  customFileInputWrapper: {
    position: "relative" as const,
    display: "inline-block",
  },
  customFileLabel: {
    display: "inline-block",
    padding: "8px 16px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    marginTop: "0px",
    border: "none",
    boxShadow: "none",
    transition: "background 0.2s",
  },
  attachmentWrapper: {
    marginBottom: "4px",
    display: "inline-flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "12px",
  },
  customFileInput: {
    position: "absolute" as const,
    left: 0,
    top: 0,
    opacity: 0,
    width: "100%",
    height: "80%",
    cursor: "pointer",
  },
  extraWorkWrapper: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px 20px",
    backgroundColor: "#f9fafb",
    marginBottom: "16px",
  },
  durationContainer: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    gap: "16px",
    marginTop: "8px",
  },
  durationField: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  durationTotal: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    marginTop: "8px",
  },
  delaySection: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    backgroundColor: "#fff",
  },
  delaySectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
    marginTop: 0,
    marginBottom: "12px",
  },
  delayRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    marginBottom: "12px",
    marginTop: "8px",
  },
  delayField: {
    display: "flex",
    flexDirection: "column" as const,
    flex: "1 1 45%",
    minWidth: "140px",
  },
  delayInput: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  delayLabel: {
    fontWeight: 600,
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "4px",
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
    boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
    letterSpacing: "0.2px",
    marginTop: "4px",
    width: "100%",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    marginTop: "2px",
    display: "block",
  },
  modalBackdrop: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    width: "80%",
    maxWidth: "500px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  },
  modalCloseBtn: {
    marginTop: "20px",
    padding: "10px 24px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
};

export default Timesheet;
