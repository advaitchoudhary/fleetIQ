import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaUserCircle } from "react-icons/fa";

const MyInfo: React.FC = () => {
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      fetchDriverDetails(parsedUser.email);
    }
  }, []);

  const fetchDriverDetails = async (email: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      const driverDetails = response.data.find((drv: any) => drv.email === email);
      if (!driverDetails) {
        console.warn("No driver details found for email:", email);
        return;
      }
      setDriver(driverDetails);
    } catch (error) {
      console.error("Error fetching driver details:", error);
    }
  };

  if (!driver) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.profileCard}>
          <FaUserCircle size={80} color="#333" />
          <h2 style={styles.profileTitle}>{driver.name}</h2>
          <div style={styles.profileGrid}>
            <p><strong>Email:</strong> {driver.email}</p>
            <p><strong>Contact:</strong> {driver.contact}</p>
            <p><strong>Address:</strong> {driver.address}</p>
            <p><strong>HST/GST:</strong> {driver.hst_gst}</p>
            <p><strong>Business Name:</strong> {driver.business_name}</p>
            <p><strong>SIN No.:</strong> {driver.sinNo}</p>
            <p><strong>Work Status:</strong> {driver.workStatus}</p>
            <p><strong>Licence:</strong> {driver.licence}</p>
            <p><strong>Licence Expiry:</strong> {driver.licence_expiry_date}</p>
            <p><strong>Status:</strong> {driver.status}</p>
            <p><strong>Trainings:</strong> {driver.trainings}</p>
            <p><strong>Backhaul Rate:</strong> {driver.backhaulRate}</p>
            <p><strong>Combo Rate:</strong> {driver.comboRate}</p>
            <p><strong>Extra Sheet/E.W Rate:</strong> {driver.extraSheetEWRate}</p>
            <p><strong>Regular/Banner Rate:</strong> {driver.regularBannerRate}</p>
            <p><strong>Wholesale Rate:</strong> {driver.wholesaleRate}</p>
            <p><strong>Username:</strong> {driver.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "30px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
  },
  profileCard: {
    padding: "25px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  profileTitle: {
    fontSize: "24px",
    margin: "10px 0",
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "15px",
    marginTop: "20px",
    textAlign: "left",
    color: "#444",
  },
};

export default MyInfo;
