import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import imageCompression from "browser-image-compression";

import { API_BASE_URL } from "../utils/env";

const Timesheet: React.FC = () => {
  type TimesheetType = {
    date: string;
    startTime: string;
    endTime: string;
    driver: string;
    customer: string;
    startDate: string;
    category: string;
    tripNumber: string;
    loadID: string;
    preStartTime: string;
    gateOutTime: string;
    ewStartTimeMorning: string;
    ewEndTimeMorning: string;
    ewReasonMorning: string;
    gateInTime: string;
    postEndTime: string;
    endDate: string;
    ewStartTimeEvening: string;
    ewEndTimeEvening: string;
    ewReasonEvening: string;
    plannedHours: string;
    totalStops: string;
    plannedKM: string;
    startKM: string;
    endKM: string;
    comments: string;
    attachments: File[]; 
  };
  
  const getEmptyTimesheet = (driverEmail: string): TimesheetType => ({
    driver: driverEmail,
    date: "",
    startTime: "",
    endTime: "",
    customer: "",
    startDate: "",
    category: "",
    tripNumber: "",
    loadID: "",
    preStartTime: "",
    gateOutTime: "",
    ewStartTimeMorning: "",
    ewEndTimeMorning: "",
    ewReasonMorning: "",
    gateInTime: "",
    postEndTime: "",
    endDate: "",
    ewStartTimeEvening: "",
    ewEndTimeEvening: "",
    ewReasonEvening: "",
    plannedHours: "",
    totalStops: "",
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "driver") {
        setTimesheet(getEmptyTimesheet(user.email));
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setTimesheet((prev) => {
      const updatedTimesheet = { ...prev, [name]: value };
  
      // ✅ Get startTime and endTime directly from the updated state

  
      return updatedTimesheet;
    });
  
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

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
  
    let validationErrors: Partial<Record<keyof TimesheetType, string>> = {};
  
    const requiredFields: (keyof TimesheetType)[] = [
      "customer",
      "startDate",
      "category",
      "tripNumber",
      "loadID",
      "preStartTime",
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

  
    // Validate Start Date < End Date
    if (timesheet.startDate && timesheet.endDate) {
      const start = new Date(timesheet.startDate);
      const end = new Date(timesheet.endDate);
  
      if (end < start) {
        validationErrors["endDate"] = "End date must be later than or equal to the start date.";
      }
    }
  
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
  
        const payload = {
          ...timesheet,
          startKM: Number(timesheet.startKM),
          endKM: Number(timesheet.endKM),
          attachments: [], // No attachments
        };
  
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
          <label style={styles.label}>Driver:</label>
          <input type="text" name="driver" value={timesheet.driver} disabled style={styles.input} />
  
          {/* Customer */}
          <label style={styles.label}>Customer:</label>
          <select name="customer" value={timesheet.customer} onChange={handleChange} style={styles.input}>
            <option value="">Select Customer</option>
            {customerOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.customer && <span style={styles.error}>{errors.customer}</span>}
  
          {/* Start Date */}
          <label style={styles.label}>Start Date:</label>
          <input type="date" name="startDate" value={timesheet.startDate} onChange={handleChange} style={styles.input} />
          {errors.startDate && <span style={styles.error}>{errors.startDate}</span>}

          {/* End Date */}
          <label style={styles.label}>End Date:</label>
          <input type="date" name="endDate" value={timesheet.endDate} onChange={handleChange} style={styles.input} />
          {errors.endDate && <span style={styles.error}>{errors.endDate}</span>}
  
          {/* Date */}
          <label style={styles.label}>Date:</label>
          <input type="date" name="date" value={timesheet.date} onChange={handleChange} style={styles.input} />
  
          {/* Start & End Time */}
          <label style={styles.label}>Start Time:</label>
          <input type="time" name="startTime" value={timesheet.startTime} onChange={handleChange} style={styles.input} />
  
          {/* End Time */}
          <label style={styles.label}>End Time:</label>
          <input type="time" name="endTime" value={timesheet.endTime} onChange={handleChange} style={styles.input} />
  
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
  
          {/* Pre Start Time & Gate Times */}
          <label style={styles.label}>Pre Start Time:</label>
          <input type="time" name="preStartTime" value={timesheet.preStartTime} onChange={handleChange} style={styles.input} />
  
          <label style={styles.label}>Gate Out Time:</label>
          <input type="time" name="gateOutTime" value={timesheet.gateOutTime} onChange={handleChange} style={styles.input} />
          {errors.gateOutTime && <span style={styles.error}>{errors.gateOutTime}</span>}
  
          <label style={styles.label}>Gate In Time:</label>
          <input type="time" name="gateInTime" value={timesheet.gateInTime} onChange={handleChange} style={styles.input} />
          {errors.gateInTime && <span style={styles.error}>{errors.gateInTime}</span>}
  
          <label style={styles.label}>Post End Time:</label>
          <input type="time" name="postEndTime" value={timesheet.postEndTime} onChange={handleChange} style={styles.input} />
  
          {/* Early Work (Morning & Evening) */}
          <label style={styles.label}>Early Work - Morning:</label>
          <input type="time" name="ewStartTimeMorning" value={timesheet.ewStartTimeMorning} onChange={handleChange} style={styles.input} />
          <input type="time" name="ewEndTimeMorning" value={timesheet.ewEndTimeMorning} onChange={handleChange} style={styles.input} />
          <input type="text" name="ewReasonMorning" value={timesheet.ewReasonMorning} onChange={handleChange} style={styles.input} placeholder="Reason" />
  
          <label style={styles.label}>Early Work - Evening:</label>
          <input type="time" name="ewStartTimeEvening" value={timesheet.ewStartTimeEvening} onChange={handleChange} style={styles.input} />
          <input type="time" name="ewEndTimeEvening" value={timesheet.ewEndTimeEvening} onChange={handleChange} style={styles.input} />
          <input type="text" name="ewReasonEvening" value={timesheet.ewReasonEvening} onChange={handleChange} style={styles.input} placeholder="Reason" />
  
          {/* Planned Work */}
          <label style={styles.label}>Planned Hours:</label>
          <input type="text" name="plannedHours" value={timesheet.plannedHours} onChange={handleChange} style={styles.input} />

          {/* Comments */}
          <label style={styles.label}>Comments:</label>
          <textarea name="comments" value={timesheet.comments} onChange={handleChange} style={styles.textarea} placeholder="Enter comments..."></textarea>

          <label style={styles.label}>Total Stops:</label>
          <input type="text" name="totalStops" value={timesheet.totalStops} onChange={handleChange} style={styles.input} />

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
            <div key={i}>
              <label style={styles.label}>Attachment {i + 1}:</label>
              <input
                type="file"
                name="attachments"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleFileChange(i, e)}
                style={styles.fileInput}
              />
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

const styles = {
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
