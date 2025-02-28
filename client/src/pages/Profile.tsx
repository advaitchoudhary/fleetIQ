import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driver = location.state?.driver;

  const [showTripsModal, setShowTripsModal] = useState(false);
  const [showTrainingsModal, setShowTrainingsModal] = useState(false);

  if (!driver) {
    return <p style={styles.noData}>No driver data available.</p>;
  }

  // Generate Initials from Name
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

          {/* Trainings Section */}
          <div style={styles.rightSection}>
            <h3 style={styles.sectionTitle}>📚 Trainings</h3>
            <div style={styles.trainingsList}>
              <p>✔ Defensive Driving</p>
              <p>✔ Hazardous Materials Handling</p>
              <p>✔ First Aid Certification</p>
            </div>
            <button style={styles.seeAllButton} onClick={() => setShowTrainingsModal(true)}>
                See All
            </button>
          </div>
        </div>

        {showTrainingsModal && (
            <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                <h2>All Trainings</h2>
                <ul style={styles.modalList}>
                    <li>✔ Defensive Driving</li>
                    <li>✔ Hazardous Materials Handling</li>
                    <li>✔ First Aid Certification</li>
                    <li>✔ Vehicle Maintenance</li>
                    <li>✔ Route Optimization</li>
                </ul>
                <button style={styles.modalCloseButton} onClick={() => setShowTrainingsModal(false)}>Close</button>
                </div>
            </div>
        )}

        {/* Contact & License Details */}
        <div style={styles.contactSection}>
          <div style={styles.contactDetails}>
            <h3 style={styles.sectionTitle}>📞 Contact Information</h3>
            <p><strong>Email:</strong> {driver.email}</p>
            <p><strong>ID:</strong> {driver._id}</p>
          </div>
          <div style={styles.licenseDetails}>
            <h3 style={styles.sectionTitle}>🚘 Driver's License</h3>
            <p><strong>SIN No.:</strong> 123-456-789</p>
            <p><strong>License No.:</strong> DL-123456789</p>
            <p><strong>Expiry Date:</strong> 12/31/2025</p>
          </div>
        </div>

        {/* Incident Reports */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🚨 Incident Reports</h3>
          <div style={styles.incidentReports}>
            <img src="https://via.placeholder.com/100" alt="Incident 1" />
            <img src="https://via.placeholder.com/100" alt="Incident 2" />
            <img src="https://via.placeholder.com/100" alt="Incident 3" />
          </div>
        </div>

        {/* Trips Section with Modal */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🚗 Trips</h3>
          <p>✔ Trip to Warehouse A</p>
          <p>✔ Trip to Depot B</p>
          <p>✔ Trip to Customer C</p>
          <button style={styles.seeAllButton} onClick={() => setShowTripsModal(true)}>
            See All
          </button>
        </div>

        {/* Go Back Button */}
        <button style={styles.button} onClick={() => navigate(-1)}>⬅ Go Back</button>
      </div>

      {/* Trips Modal */}
      {showTripsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>All Trips</h2>
            <ul style={styles.modalList}>
              <li>✔ Trip to Warehouse A</li>
              <li>✔ Trip to Depot B</li>
              <li>✔ Trip to Customer C</li>
              <li>✔ Trip to Distribution Center</li>
              <li>✔ Trip to Delivery Hub</li>
            </ul>
            <button style={styles.modalCloseButton} onClick={() => setShowTripsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    container: {
      maxWidth: "900px",
      margin: "60px auto",
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      fontFamily: "'Arial', sans-serif",
    },
    goBackButton: {
      padding: "8px 16px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      marginBottom: "10px",
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
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random Color
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
    rightSection: {
      textAlign: "left" as const, // Ensures left-aligned text in Trainings
    },
    contactSection: {
      display: "flex",
      justifyContent: "space-between",
    },
    contactDetails: {
      flex: 1,
      paddingRight: "20px",
    },
    licenseDetails: {
      flex: 1,
      textAlign: "right" as const,
    },
    section: {
      marginBottom: "20px",
      padding: "15px",
      borderBottom: "2px solid #eee",
      backgroundColor: "#f9f9f9",
      borderRadius: "5px",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#333",
    },
    trainingsList: {
      textAlign: "left" as const,
      fontSize: "14px",
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
    incidentReports: {
      display: "flex",
      justifyContent: "center",
      gap: "15px",
      marginTop: "10px",
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
      position: "fixed" as const,
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
      textAlign: "center" as const,
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      width: "50%",
      maxWidth: "400px",
    },
    modalList: {
      listStyleType: "none",
      padding: 0,
      textAlign: "left" as const,
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
      textAlign: "center" as const,
      fontSize: "18px",
      marginTop: "50px",
    },
};

export default Profile;