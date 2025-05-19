import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaUserCircle } from "react-icons/fa";

const MyInfo: React.FC = () => {
  const [driver, setDriver] = useState<any>(null);
  const [, setTimesheets] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    transitNumber: '',
    institutionNumber: ''
  });



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
          const fullDriverRes = await axios.get(`${API_BASE_URL}/drivers/${matchedDriver._id}`);
          setDriver(fullDriverRes.data);
          setFormData(fullDriverRes.data);
          if (!fullDriverRes.data.bankDetails) {
            setShowBankForm(true);
          }
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
          <button onClick={() => setIsEditing(!isEditing)} style={{ ...styles.button, marginBottom: "20px" }}>
            {isEditing ? "Cancel" : "Edit My Info"}
            </button>
          <div style={styles.profileInfo}>
            {/* Email is not editable */}
            <p><strong>Email:</strong> {driver.email}</p>
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                  readOnly
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
                <span style={styles.labelText}>Licence Expiry Date:</span>
                <input
                    type="date"
                    value={formData?.licence_expiry_date?.substring(0, 10) || ''}
                    onChange={(e) => setFormData({ ...formData, licence_expiry_date: e.target.value })}
                    style={styles.inputField}
                />
                </label>
            ) : (
              <p><strong>Licence Expiry:</strong> {driver.licence_expiry_date?.substring(0, 10) || ''}</p>
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
                  // const res = await axios.put(`${API_BASE_URL}/update/driver/${driver._id}`, formData);
                  const res = await axios.put(`${API_BASE_URL}/drivers/${driver._id}`, formData);

                  setDriver(res.data);
                  setIsEditing(false);
                } catch (err) {
                  console.error("Error updating driver:", err);
                }
              }}
              style={{ ...styles.button, marginTop: "20px" }}
            >
              Submit
            </button>
          )}
          {showBankForm && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Add Direct Deposit Details</h3>
              <label style={styles.formField}>
                <span style={styles.labelText}>Bank Name:</span>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="Bank Name"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Account Number:</span>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="Account Number"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Transit Number:</span>
                <input
                  type="text"
                  value={bankDetails.transitNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, transitNumber: e.target.value })}
                  placeholder="Transit Number"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Institution Number:</span>
                <input
                  type="text"
                  value={bankDetails.institutionNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, institutionNumber: e.target.value })}
                  placeholder="Institution Number"
                  style={styles.inputField}
                />
              </label>
              <button
                onClick={async () => {
                  try {
                    // const res = await axios.put(`${API_BASE_URL}/update/driver/${driver._id}`, {
                      const res = await axios.put(`${API_BASE_URL}/drivers/${driver._id}`, {

                      ...driver,
                      bankDetails
                    });
                    setDriver(res.data);
                    setShowBankForm(false);
                  } catch (err) {
                    console.error("Error saving bank details:", err);
                  }
                }}
                style={{ ...styles.button, marginTop: "20px" }}
              >
                Save Bank Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "50px 20px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  loading: {
    textAlign: "center",
    padding: "100px 20px",
    fontSize: "22px",
    fontWeight: "500",
    color: "#4a5568",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    marginBottom: "40px",
    border: "1px solid #e2e8f0",
  },
  profileTitle: {
    margin: "20px 0",
    fontSize: "32px",
    color: "#2d3748",
    fontWeight: "bold",
  },
  profileInfo: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px 32px",
    fontSize: "16px",
    color: "#2a2a2a",
    textAlign: "left",
    padding: "0 12px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputField: {
    padding: "12px 14px",
    border: "1px solid #cbd5e0",
    borderRadius: "8px",
    fontSize: "15px",
    transition: "border-color 0.2s ease",
    outline: "none",
  },
  labelText: {
    fontWeight: 600,
    marginBottom: "4px",
    fontSize: "14px",
    color: "#374151",
  },
  section: {
    marginTop: "40px",
    textAlign: "left",
    padding: "0 12px",
  },
  sectionTitle: {
    fontSize: "24px",
    marginBottom: "20px",
    borderBottom: "2px solid #4a5568",
    paddingBottom: "8px",
    color: "#2d3748",
    fontWeight: "bold",
  },
  timesheetList: {
    listStyle: "none",
    padding: 0,
  },
  timesheetItem: {
    backgroundColor: "#f1f5f9",
    marginBottom: "16px",
    padding: "16px 20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    lineHeight: "1.6",
    fontSize: "15px",
  },
  timesheetLabel: {
    fontWeight: 600,
    marginRight: "6px",
  },
};

export default MyInfo;