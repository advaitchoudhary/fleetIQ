import React, { useState } from "react";
import Navbar from "./Navbar";

const Dashboard: React.FC = () => {
  const [timesheet, setTimesheet] = useState({
    date: "",
    startTime: "",
    endTime: "",
    comments: "",
    image: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTimesheet((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTimesheet((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Timesheet Submitted:", timesheet);
    alert("Timesheet submitted successfully!");
    // You can send the timesheet data to an API or store it in a database
  };

  return (
    <div style={styles.container}>
      <Navbar /> {/* Navbar Component */}

      <div style={styles.mainContent}>
        <h2>Enter Your Timesheet</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Date Input */}
          <label style={styles.label}>Date:</label>
          <input
            type="date"
            name="date"
            value={timesheet.date}
            onChange={handleChange}
            required
            style={styles.input}
          />

          {/* Start Time Input */}
          <label style={styles.label}>Start Time:</label>
          <input
            type="time"
            name="startTime"
            value={timesheet.startTime}
            onChange={handleChange}
            required
            style={styles.input}
          />

          {/* End Time Input */}
          <label style={styles.label}>End Time:</label>
          <input
            type="time"
            name="endTime"
            value={timesheet.endTime}
            onChange={handleChange}
            required
            style={styles.input}
          />

          {/* Comments Input */}
          <label style={styles.label}>Comments:</label>
          <textarea
            name="comments"
            value={timesheet.comments}
            onChange={handleChange}
            required
            style={styles.textarea}
            placeholder="Describe your work..."
          />

          {/* File Upload Input */}
          <label style={styles.label}>Upload Picture (Optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />

          {/* Submit Button */}
          <button type="submit" style={styles.submitButton}>Submit Timesheet</button>
        </form>
      </div>
    </div>
  );
};

// Define Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
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
};

export default Dashboard;