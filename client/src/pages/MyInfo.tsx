import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaUserCircle } from "react-icons/fa";

const MyInfo: React.FC = () => {
  const [driver, setDriver] = useState<any>(null);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);



  useEffect(() => {
    if (driver?.email) {
      axios
        .get(`${API_BASE_URL}/timesheets?email=${encodeURIComponent(driver.email)}`)
        .then((res) => setTimesheets(res.data))
        .catch((err) => console.error("Error fetching timesheets", err));
    }
  }, [driver]);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      try {
        const allDriversRes = await axios.get(`${API_BASE_URL}/drivers`);
        const matchedDriver = allDriversRes.data.find(
          (drv: any) => drv.email === parsedUser.email
        );
        if (matchedDriver) {
          const fullDriverRes = await axios.get(`${API_BASE_URL}/driver/${matchedDriver._id}`);
          setDriver(fullDriverRes.data);
          setFormData(fullDriverRes.data);
        }
      } catch (error) {
        console.error("Error fetching driver details:", error);
      }
    };
    fetchDriverDetails();
  }, []);

  if (!driver || !formData) return <div style={styles.loading}>Loading...</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.profileCard}>
          <FaUserCircle size={80} color="#333" />
          <h2 style={styles.profileTitle}>Welcome, {driver.name}</h2>
          <button onClick={() => setIsEditing(!isEditing)} style={{ marginBottom: "20px" }}>
            {isEditing ? "Cancel" : "Edit My Info"}
          </button>
          <div style={styles.profileInfo}>
            {/* Email is not editable */}
            <div><strong>Email:</strong> {driver.email}</div>
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Contact:</span>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Contact"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Contact:</strong> {driver.contact}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Address:</span>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Address:</strong> {driver.address}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>HST/GST:</span>
                <input
                  type="text"
                  value={formData.hst_gst}
                  onChange={(e) => setFormData({ ...formData, hst_gst: e.target.value })}
                  placeholder="HST/GST"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>HST/GST:</strong> {driver.hst_gst}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Business Name:</span>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Business Name"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Business Name:</strong> {driver.business_name}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Backhaul Rate:</span>
                <input
                  type="number"
                  value={formData.backhaulRate}
                  onChange={(e) => setFormData({ ...formData, backhaulRate: e.target.value })}
                  placeholder="Backhaul Rate"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Backhaul Rate:</strong> ${driver.backhaulRate}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Combo Rate:</span>
                <input
                  type="number"
                  value={formData.comboRate}
                  onChange={(e) => setFormData({ ...formData, comboRate: e.target.value })}
                  placeholder="Combo Rate"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Combo Rate:</strong> ${driver.comboRate}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Extra Sheet/E.W Rate:</span>
                <input
                  type="number"
                  value={formData.extraSheetEWRate}
                  onChange={(e) => setFormData({ ...formData, extraSheetEWRate: e.target.value })}
                  placeholder="Extra Sheet/E.W Rate"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Extra Sheet/E.W Rate:</strong> ${driver.extraSheetEWRate}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Regular/Banner Rate:</span>
                <input
                  type="number"
                  value={formData.regularBannerRate}
                  onChange={(e) => setFormData({ ...formData, regularBannerRate: e.target.value })}
                  placeholder="Regular/Banner Rate"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Regular/Banner Rate:</strong> ${driver.regularBannerRate}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Wholesale Rate:</span>
                <input
                  type="number"
                  value={formData.wholesaleRate}
                  onChange={(e) => setFormData({ ...formData, wholesaleRate: e.target.value })}
                  placeholder="Wholesale Rate"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Wholesale Rate:</strong> ${driver.wholesaleRate}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Licence:</span>
                <input
                  type="text"
                  value={formData.licence}
                  onChange={(e) => setFormData({ ...formData, licence: e.target.value })}
                  placeholder="Licence"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Licence:</strong> {driver.licence}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Licence Expiry:</span>
                <input
                  type="text"
                  value={formData.licence_expiry_date}
                  onChange={(e) => setFormData({ ...formData, licence_expiry_date: e.target.value })}
                  placeholder="Licence Expiry"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Licence Expiry:</strong> {driver.licence_expiry_date}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Status:</span>
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  placeholder="Status"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Status:</strong> {driver.status}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>SIN No.:</span>
                <input
                  type="text"
                  value={formData.sinNo}
                  onChange={(e) => setFormData({ ...formData, sinNo: e.target.value })}
                  placeholder="SIN No."
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>SIN No.:</strong> {driver.sinNo}</p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Work Status:</span>
                <input
                  type="text"
                  value={formData.workStatus}
                  onChange={(e) => setFormData({ ...formData, workStatus: e.target.value })}
                  placeholder="Work Status"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p><strong>Work Status:</strong> {driver.workStatus}</p>
            )}
          </div>
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  const res = await axios.put(`${API_BASE_URL}/update/driver/${driver._id}`, formData);
                  setDriver(res.data);
                  setIsEditing(false);
                } catch (err) {
                  console.error("Error updating driver:", err);
                }
              }}
              style={{ marginTop: "20px" }}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "30px 20px",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', sans-serif",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
  },
  profileCard: {
    backgroundColor: "#fefefe",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    marginBottom: "50px",
    border: "1px solid #e0e0e0",
  },
  profileTitle: {
    margin: "15px 0",
    fontSize: "28px",
    color: "#2c3e50",
    fontWeight: "bold",
  },
  profileInfo: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px 25px",
    fontSize: "16px",
    color: "#444",
    textAlign: "left",
    padding: "0 10px",
    rowGap: "10px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  inputField: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px",
  },
  labelText: {
    fontWeight: "bold",
    marginBottom: "3px",
  },
  section: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "15px",
    borderBottom: "2px solid #444",
    paddingBottom: "5px",
    color: "#222",
  },
  timesheetList: {
    listStyle: "none",
    padding: 0,
  },
  timesheetItem: {
    backgroundColor: "#f8f8f8",
    marginBottom: "10px",
    padding: "12px 16px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    lineHeight: "1.6",
    fontSize: "15px",
  },
  timesheetLabel: {
    fontWeight: "bold",
    marginRight: "5px",
  },
};

export default MyInfo;