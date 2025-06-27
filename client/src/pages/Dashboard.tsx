import React, { useState, useEffect, CSSProperties } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import imageCompression from "browser-image-compression";

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
  const categoryOptions = ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale", "Wholesale DZ"];
  const customerOptions = ["Sobeys Capital Inc."];
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessagesList, setErrorMessagesList] = useState<string[]>([]);
  const [driverName, setDriverName] = useState("");
  const [driverUsername, setDriverUsername] = useState("");
  const [totalHours, setTotalHours] = useState("0");
  // Extra Work Sheet state
  const [extraWorkSheet, setExtraWorkSheet] = useState("");
  const [extraWorkSheetDuration, setExtraWorkSheetDuration] = useState({ duration: "", from: "", to: "" });
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
      const user = JSON.parse(storedUser);
      if (user.role === "driver") {
        setTimesheet(getEmptyTimesheet(user.email));
        setDriverName(user.name); 
        setDriverUsername(user.username); 
      }
    }
  }, []);

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

        // Only include delay fields if valid
        if (storeDelay.duration && storeDelay.from && storeDelay.to) {
          payload.storeDelay = storeDelay;
        }
        if (roadDelay.duration && roadDelay.from && roadDelay.to) {
          payload.roadDelay = roadDelay;
        }
        if (otherDelay.duration && otherDelay.from && otherDelay.to) {
          payload.otherDelay = otherDelay;
        }

        // Only include extraWorkSheet fields if selected as 'yes'
        if (extraWorkSheet === 'yes') {
          payload.extraWorkSheet = extraWorkSheet;
          payload.extraWorkSheetDetails = extraWorkSheetDuration;
        }

        console.log("📄 Payload to send:", payload);

        response = await axios.post(`${API_BASE_URL}/timesheet`, payload, {
          headers: { "Content-Type": "application/json" },
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
        }

        timesheet.attachments.forEach((file, idx) => {
          if (file) {
            formData.append("attachments", file);
            console.log(`📎 Attached file[${idx}]:`, file.name);
          }
        });

        console.log("📄 FormData ready to submit.");

        response = await axios.post(`${API_BASE_URL}/timesheet`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      console.log("🟢 Timesheet submitted successfully. Server response:", response.data);
      alert("Timesheet submitted successfully!");

      setTimesheet(getEmptyTimesheet(timesheet.driver));
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
      <Navbar />
      <div style={styles.mainContent}>
        <h2>Enter Your Timesheet</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Driver */}
          <label style={styles.label}>Driver Name:</label>
          <input
            type="text"
            name="driver"
            value={driverName || timesheet.driver}
            disabled
            style={styles.input}
          />

          {/* Driver Username */}
          <label style={styles.label}>ID:</label>
          <input
            type="text"
            name="driverUsername"
            value={driverUsername || ""}
            disabled
            style={styles.input}
          />
  
          {/* Customer */}
          <label style={styles.label}>Customer:</label>
          <select name="customer" value={timesheet.customer} onChange={handleChange} style={styles.input}>
            <option value="">Select Customer</option>
            {customerOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.customer && <span style={styles.error}>{errors.customer}</span>}
  
          {/* Start Date and End Date inputs removed */}
  
          {/* Date */}
          <label style={styles.label}>Trip Date:</label>
          <input type="date" name="date" value={timesheet.date} onChange={handleChange} style={styles.input} />
  
          {/* Start & End Time */}
          <label style={styles.label}>Start Time:</label>
          <input type="time" name="startTime" value={timesheet.startTime} onChange={handleChange} style={styles.input} />
  
          {/* End Time */}
          <label style={styles.label}>End Time:</label>
          <input type="time" name="endTime" value={timesheet.endTime} onChange={handleChange} style={styles.input} />
  
          <label style={styles.label}>Total Hours:</label>
          <input
            type="text"
            name="totalHours"
            value={totalHours}
            disabled
            style={styles.input}
          />
          {/* Category */}
          <label style={styles.label}>Category:</label>
          <select name="category" value={timesheet.category} onChange={handleChange} style={styles.input}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.category && <span style={styles.error}>{errors.category}</span>}
  
          {/* Trip Number & Load ID */}
          <label style={styles.label}>Trip Number:</label>
          <input type="text" name="tripNumber" value={timesheet.tripNumber} onChange={handleChange} style={styles.input} />
          {errors.tripNumber && <span style={styles.error}>{errors.tripNumber}</span>}
  
          <label style={styles.label}>Load ID:</label>
          <input type="text" name="loadID" value={timesheet.loadID} onChange={handleChange} style={styles.input} />
          {errors.loadID && <span style={styles.error}>{errors.loadID}</span>}
  
          <label style={styles.label}>Gate Out Time:</label>
          <input type="time" name="gateOutTime" value={timesheet.gateOutTime} onChange={handleChange} style={styles.input} />
          {errors.gateOutTime && <span style={styles.error}>{errors.gateOutTime}</span>}
  
          <label style={styles.label}>Gate In Time:</label>
          <input type="time" name="gateInTime" value={timesheet.gateInTime} onChange={handleChange} style={styles.input} />
          {errors.gateInTime && <span style={styles.error}>{errors.gateInTime}</span>}
  
          {/* Extra Work Sheet radio and conditional duration */}
          <div style={styles.extraWorkWrapper}>
            <label style={styles.label}>Extra Work Sheet?</label>
            <div style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
              <label>
                <input
                  type="radio"
                  name="extraWorkSheet"
                  value="yes"
                  checked={extraWorkSheet === "yes"}
                  onChange={(e) => setExtraWorkSheet(e.target.value)}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="extraWorkSheet"
                  value="no"
                  checked={extraWorkSheet === "no"}
                  onChange={(e) => setExtraWorkSheet(e.target.value)}
                />{" "}
                No
              </label>
            </div>
            {extraWorkSheet === "yes" && (
              <>
                <div style={styles.durationContainer}>
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
              </>
            )}
          </div>

          <div style={styles.extraWorkWrapper}>
            <label style={styles.label}>Was there an extra Delay?</label>
            <div style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
              <label>
                <input
                  type="radio"
                  name="extraDelay"
                  value="yes"
                  checked={extraDelayYesNo === "yes"}
                  onChange={(e) => setExtraDelayYesNo(e.target.value)}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="extraDelay"
                  value="no"
                  checked={extraDelayYesNo === "no"}
                  onChange={(e) => setExtraDelayYesNo(e.target.value)}
                />{" "}
                No
              </label>
            </div>
            {extraDelayYesNo === "yes" && (
              <>
                <label style={styles.label}>Select Delay Types:</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("store")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "store"] : prev.filter((d) => d !== "store")
                        )
                      }
                    />{" "}
                    Store Delay
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("road")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "road"] : prev.filter((d) => d !== "road")
                        )
                      }
                    />{" "}
                    Road Delay
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={hasDelay.includes("other")}
                      onChange={(e) =>
                        setHasDelay((prev) =>
                          e.target.checked ? [...prev, "other"] : prev.filter((d) => d !== "other")
                        )
                      }
                    />{" "}
                    Other Delay
                  </label>
                </div>

                {hasDelay.includes("store") && (
                  <div style={styles.delaySection}>
                    <h4>Store Delay</h4>
                    <div style={styles.delayRow}>
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
                    <h4>Road Delay</h4>
                    <div style={styles.delayRow}>
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
                    <h4>Other Delay</h4>
                    <div style={styles.delayRow}>
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

          {/* Planned Work */}
          <label style={styles.label}>Planned Hours:</label>
          <input type="text" name="plannedHours" value={timesheet.plannedHours} onChange={handleChange} style={styles.input} />

          {/* Comments */}
          <label style={styles.label}>Comments:</label>
          <textarea name="comments" value={timesheet.comments} onChange={handleChange} style={styles.textarea} placeholder="Enter comments..."></textarea>

          <label style={styles.label}>Planned KM:</label>
          <input type="text" name="plannedKM" value={timesheet.plannedKM} onChange={handleChange} style={styles.input} />

          {/* Start & End KM */}
          <label style={styles.label}>Start KM:</label>
          <input type="number" name="startKM" value={timesheet.startKM} onChange={handleChange} style={styles.input} />
          {errors.startKM && <span style={styles.error}>{errors.startKM}</span>}

          <label style={styles.label}>End KM:</label>
          <input type="number" name="endKM" value={timesheet.endKM} onChange={handleChange} style={styles.input} />
          {errors.endKM && <span style={styles.error}>{errors.endKM}</span>}

          {/* Attachments */}
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ ...styles.attachmentWrapper, flexDirection: 'row' }}>
              <label style={styles.label}>Attachment {i + 1}:</label>
              <div style={{ ...styles.customFileInputWrapper, position: 'relative' }}>
                <label style={styles.customFileLabel}>
                  Choose File
                  <input
                    type="file"
                    name="attachments"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => handleFileChange(i, e)}
                    style={{ 
                      ...styles.customFileInput, 
                    }}
                  />
                </label>
              </div>
              {timesheet.attachments[i] && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <img
                    src={URL.createObjectURL(timesheet.attachments[i])}
                    alt={`Attachment ${i + 1}`}
                    style={{ maxHeight: '80px', marginRight: '10px', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updatedAttachments = [...timesheet.attachments];
                      updatedAttachments[i] = undefined;
                      setTimesheet((prev) => ({ ...prev, attachments: updatedAttachments }));
                    }}
                    style={{
                      backgroundColor: '#e53e3e',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
  
          {/* Submit Button */}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Submitting..." : "Submit Timesheet"}
          </button>
        </form>
      </div>
      {showErrorModal && (
        <div style={{ ...styles.modalBackdrop, position: 'fixed' }}>
          <div style={styles.modalContent}>
            <h3>Validation Errors</h3>
            <ul>
              {errorMessagesList.map((msg, index) => (
                <li key={index} style={{ color: "red" }}>{msg}</li>
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

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  mainContent: {
    margin: "30px auto",
    padding: "40px",
    width: "90%",
    maxWidth: "800px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },
  label: {
    fontWeight: 600,
    fontSize: "1rem",
    color: "#2d3748",
  },
  input: {
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    transition: "border-color 0.2s ease",
  },
  textarea: {
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    height: "100px",
    transition: "border-color 0.2s ease",
  },
  fileInput: {
    padding: "6px 0",
  },
  customFileInputWrapper: {
    position: "relative",
    display: "inline-block",
  },
  customFileLabel: {
    display: "inline-block",
    padding: "6px 14px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    marginTop: "0px",
    border: "none",
    boxShadow: "none",
    transition: "background 0.2s",
  },
  attachmentWrapper: {
    marginBottom: "4px",
    display: "inline-flex",
    flexDirection: "row",
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
    border: "1px solid #CBD5E0",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#f9f9f9",
  },
  durationContainer: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    gap: "24px",
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
  },
  delaySection: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    backgroundColor: "#fafafa",
  },
  delayRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "12px",
    marginTop: "12px",
  },
  delayField: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 45%",
    minWidth: "140px",
  },
  delayInput: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
  },
  delayLabel: {
    fontWeight: "bold",
    marginBottom: "4px",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    fontSize: "1rem",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  error: {
    color: "#e53e3e",
    fontSize: "0.875rem",
    marginTop: "5px",
    display: "block",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "80%",
    maxWidth: "500px",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  },
  modalCloseBtn: {
    marginTop: "15px",
    padding: "10px 20px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Timesheet;
