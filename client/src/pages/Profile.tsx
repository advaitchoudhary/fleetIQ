import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useEffect } from "react";
import axios from "axios";

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driver = location.state?.driver;

  const [showTrainingsModal, setShowTrainingsModal] = useState(false);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  useEffect(() => {
    const fetchDriverTimesheets = async () => {
      if (!driver?.email) return;
  
      try {
        const response = await axios.get("http://localhost:8000/api/timesheets");
        const driverTimesheets = response.data.filter(
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
    return <p style={styles.noData}>No driver data available.</p>;
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
    <div>
      <Navbar />
      <div style={styles.container}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.leftSection}>
            {driver.image ? (
              <img src={driver.image} alt="Profile" style={styles.profileImage} />
            ) : (
              <div style={styles.initialsContainer}>{getInitials(driver.name)}</div>
            )}
            <div style={styles.driverInfo}>
              <h2 style={styles.driverName}>{driver.name}</h2>
              <p style={styles.driverRole}>Professional Driver</p>
              <p style={styles.driverLocation}>{driver.address}</p>
            </div>
          </div>
        </div>

        {/* Driver Details */}
        <div style={styles.driverDetails}>
          <h3 style={styles.sectionTitle}>🚗 Driver Details</h3>
          <p><strong>Email:</strong> {driver.email}</p>
          <p><strong>Contact:</strong> {driver.contact}</p>
          <p><strong>HST/GST:</strong> {driver.hst_gst || "N/A"}</p>
          <p><strong>Business Name:</strong> {driver.business_name || "N/A"}</p>
          <p><strong>Rate:</strong> ${driver.rate || "N/A"}</p>
        </div>

        {/* License Details */}
        <div style={styles.licenseSection}>
          <h3 style={styles.sectionTitle}>🚘 License Details</h3>
          <p><strong>Licence No.:</strong> {driver.licence || "N/A"}</p>
          <p><strong>Licence Expiry Date:</strong> {driver.licence_expiry_date || "N/A"}</p>
        </div>

        {/* Status */}
        <div style={styles.statusSection}>
          <h3 style={styles.sectionTitle}>📌 Status</h3>
          <p><strong>Current Status:</strong> {driver.status || "N/A"}</p>
        </div>

        {/* Trainings Section */}
        <div style={styles.trainingsSection}>
          <h3 style={styles.sectionTitle}>📚 Trainings</h3>
          <p>{driver.trainings ? driver.trainings : "No Trainings Available"}</p>
          <button style={styles.seeAllButton} onClick={() => setShowTrainingsModal(true)}>
            See All
          </button>
        </div>

        <div style={styles.timesheetsSection}>
          <h3 style={styles.sectionTitle}>📚 Timesheets</h3>
          {timesheets.length === 0 ? (
            <p>No timesheets available for this driver.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Start</th>
                  <th style={styles.th}>End</th>
                  <th style={styles.th}>Start KM</th>
                  <th style={styles.th}>End KM</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t) => (
                  <tr key={t._id}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.startTime}</td>
                    <td style={styles.td}>{t.endTime}</td>
                    <td style={styles.td}>{t.startKM}</td>
                    <td style={styles.td}>{t.endKM}</td>
                    <td style={styles.td}>
                      {t.status === "approved" ? "✔️" : t.status === "rejected" ? "❌" : "⏳"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Go Back Button */}
        <button style={styles.button} onClick={() => navigate(-1)}>⬅ Go Back</button>
      </div>

      {/* Trainings Modal */}
      {showTrainingsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>All Trainings</h2>
            <ul style={styles.modalList}>
              <li>{driver.trainings || "No Trainings Available"}</li>
            </ul>
            <button style={styles.modalCloseButton} onClick={() => setShowTrainingsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: "100%",
      margin: "60px auto",
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      fontFamily: "'Arial', sans-serif",
    },
    profileHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "15px",
      marginBottom: "20px",
      borderBottom: "2px solid #ddd",
    },
    leftSection: {
      display: "flex",
      alignItems: "center",
    },
    profileImage: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      border: "3px solid #007bff",
      marginRight: "20px",
    },
    initialsContainer: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      color: "white",
      fontSize: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "bold",
      marginRight: "20px",
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
    },
    driverInfo: {
      textAlign: "left" as const,
    },
    driverName: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "5px",
    },
    driverRole: {
      fontSize: "14px",
      color: "#777",
    },
    driverLocation: {
      fontSize: "14px",
      color: "#555",
    },
    driverDetails: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    licenseSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    statusSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    timesheetsSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    trainingsSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#333",
    },
    seeAllButton: {
      marginTop: "10px",
      padding: "6px 12px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    button: {
      padding: "12px 20px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      marginTop: "20px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      width: "50%",
      maxWidth: "400px",
    },
    modalList: {
      listStyleType: "none",
      padding: 0,
      textAlign: "left",
      marginLeft: "20px",
    },
    modalCloseButton: {
      marginTop: "10px",
      padding: "8px 14px",
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    noData: {
      textAlign: "center",
      fontSize: "18px",
      marginTop: "50px",
    },
    th: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px",
      textAlign: "left" as const,
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #ccc",
      fontSize: "14px",
    },
};

export default Profile;