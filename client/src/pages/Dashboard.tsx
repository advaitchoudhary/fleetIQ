import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

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
  
  const [timesheet, setTimesheet] = useState<TimesheetType>({
    date: "",
    startTime: "",
    endTime: "",
    driver: "",
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
  
  const [errors, setErrors] = useState<Partial<Record<keyof TimesheetType, string>>>({});
  const [loading, setLoading] = useState(false);
  const categoryOptions = ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale"];
  const customerOptions = ["Sobeys Capital Inc."];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "driver") {
        setTimesheet((prev) => ({ ...prev, driver: user.email }));
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

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newAttachments = [...timesheet.attachments];
      newAttachments[index] = e.target.files[0];
      setTimesheet((prev) => ({ ...prev, attachments: newAttachments }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
  
    // ✅ Validate Start KM and End KM
    if (timesheet.startKM !== "" && Number(timesheet.startKM) < 0) {
      validationErrors["startKM"] = "Start KM cannot be negative.";
    }
    if (timesheet.endKM !== "" && Number(timesheet.endKM) < 0) {
      validationErrors["endKM"] = "End KM cannot be negative.";
    }
    if (timesheet.startKM !== "" && timesheet.endKM !== "" && Number(timesheet.endKM) < Number(timesheet.startKM)) {
      validationErrors["endKM"] = "End KM must be greater than Start KM.";
    }
  
    // ✅ Validate Start Time < End Time
    if (timesheet.startTime && timesheet.endTime) {
      const start = new Date(`1970-01-01T${timesheet.startTime}`);
      const end = new Date(`1970-01-01T${timesheet.endTime}`);
  
      if (start >= end) {
        validationErrors["endTime"] = "End time must be later than Start time.";
      }
    }
  
    // ✅ Validate Start Date < End Date (if endDate exists)
    if (timesheet.startDate && timesheet.endDate) {
      const start = new Date(timesheet.startDate);
      const end = new Date(timesheet.endDate);
  
      if (end < start) {
        validationErrors["endDate"] = "End date must be later than or equal to the start date.";
      }
    }
  
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
  
    try {
      let response;
  
      if (timesheet.attachments.length === 0 || timesheet.attachments.every(file => !file)) {
        // ✅ Send JSON if no attachments
        const payload = {
          ...timesheet,
          startKM: Number(timesheet.startKM),
          endKM: Number(timesheet.endKM),
          attachments: [], // No attachments
        };
  
        response = await axios.post(`${API_BASE_URL}/timesheet`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // ✅ Use `FormData` if attachments exist
        const formData = new FormData();
  
        Object.entries(timesheet).forEach(([key, value]) => {
          if (key !== "attachments" && value) {
            if (key === "startKM" || key === "endKM") {
              formData.append(key, String(Number(value))); // Convert to number as string
            } else {
              formData.append(key, value as string);
            }
          }
        });
  
        timesheet.attachments.forEach((file) => {
          if (file) formData.append("attachments", file);
        });
  
        response = await axios.post(`${API_BASE_URL}/timesheet`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
  
      alert("Timesheet submitted successfully!");
      console.log("Response:", response.data);
  
      // ✅ Reset form (preserve `driver`)
      setTimesheet((prev) => ({
        ...prev,
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
      }));
  
      setErrors({});
    } catch (error) {
      console.error("Error submitting timesheet:", (error as any).response?.data || (error as any).message);
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
  
          {/* Comments */}
          <label style={styles.label}>Comments:</label>
          <textarea name="comments" value={timesheet.comments} onChange={handleChange} style={styles.textarea} placeholder="Enter comments..."></textarea>
  
          {/* Attachments */}
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <label style={styles.label}>Attachment {i + 1}:</label>
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleFileChange(i, e)} style={styles.fileInput} />
            </div>
          ))}
  
          {/* Submit Button */}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? "Submitting..." : "Submit Timesheet"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "#f4f4f4",
  },
  mainContent: {
    margin: "20px auto",
    padding: "20px",
    width: "50%",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "1rem",
  },
  input: {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  textarea: {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "1px solid #ddd",
    height: "100px",
  },
  fileInput: {
    padding: "5px",
  },
  submitButton: {
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "1rem",
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "0.9rem",
    marginTop: "5px",
    display: "block",
  },
};

export default Timesheet;
