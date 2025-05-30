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
    bankName: "",
    accountNumber: "",
    transitNumber: "",
    institutionNumber: "",
  });

  useEffect(() => {
    if (driver?.email) {
      axios
        .get(
          `${API_BASE_URL}/timesheets?email=${encodeURIComponent(driver.email)}`
        )
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
          const fullDriverRes = await axios.get(
            `${API_BASE_URL}/drivers/${matchedDriver._id}`
          );
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
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{ ...styles.button, marginBottom: "20px" }}
          >
            {isEditing ? "Cancel" : "Edit My Info"}
          </button>
          <div style={styles.profileInfo}>
            {/* Email is not editable */}
            <p>
              <strong>Email:</strong> {driver.email}
            </p>
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Contact:</span>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  placeholder="Contact"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Contact:</strong> {driver.contact}
              </p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Address:</span>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Address"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Address:</strong> {driver.address}
              </p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>HST/GST:</span>
                <input
                  type="text"
                  value={formData.hst_gst}
                  onChange={(e) =>
                    setFormData({ ...formData, hst_gst: e.target.value })
                  }
                  placeholder="HST/GST"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>HST/GST:</strong> {driver.hst_gst}
              </p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Business Name:</span>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  placeholder="Business Name"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Business Name:</strong> {driver.business_name}
              </p>
            )}
            <p>
              <strong>Backhaul Rate:</strong> ${driver.backhaulRate}
            </p>
            <p>
              <strong>Combo Rate:</strong> ${driver.comboRate}
            </p>
            <p>
              <strong>Extra Sheet/E.W Rate:</strong> ${driver.extraSheetEWRate}
            </p>
            <p>
              <strong>Regular/Banner Rate:</strong> ${driver.regularBannerRate}
            </p>
            <p>
              <strong>Wholesale Rate:</strong> ${driver.wholesaleRate}
            </p>
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Licence:</span>
                <input
                  type="text"
                  value={formData.licence}
                  onChange={(e) =>
                    setFormData({ ...formData, licence: e.target.value })
                  }
                  placeholder="Licence"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Licence:</strong> {driver.licence}
              </p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Licence Expiry Date:</span>
                <input
                  type="date"
                  value={formData?.licence_expiry_date?.substring(0, 10) || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      licence_expiry_date: e.target.value,
                    })
                  }
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Licence Expiry:</strong>{" "}
                {driver.licence_expiry_date?.substring(0, 10) || ""}
              </p>
            )}
            <p>
              <strong>Status:</strong> {driver.status}
            </p>
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>SIN No.:</span>
                <input
                  type="text"
                  value={formData.sinNo}
                  onChange={(e) =>
                    setFormData({ ...formData, sinNo: e.target.value })
                  }
                  placeholder="SIN No."
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>SIN No.:</strong> {driver.sinNo}
              </p>
            )}
            {isEditing ? (
              <label style={styles.formField}>
                <span style={styles.labelText}>Work Status:</span>
                <input
                  type="text"
                  value={formData.workStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, workStatus: e.target.value })
                  }
                  placeholder="Work Status"
                  style={styles.inputField}
                />
              </label>
            ) : (
              <p>
                <strong>Work Status:</strong> {driver.workStatus}
              </p>
            )}
          </div>
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  const res = await axios.put(
                    `${API_BASE_URL}/drivers/${driver._id}`,
                    formData
                  );
                  setDriver(res.data);
                  await axios.post(`${API_BASE_URL}/notifications`, {
                    message: `${driver.name} updated personal details.`,
                    email: driver.email,
                    type: "info",
                  });
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
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bankName: e.target.value })
                  }
                  placeholder="Bank Name"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Account Number:</span>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="Account Number"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Transit Number:</span>
                <input
                  type="text"
                  value={bankDetails.transitNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      transitNumber: e.target.value,
                    })
                  }
                  placeholder="Transit Number"
                  style={styles.inputField}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.labelText}>Institution Number:</span>
                <input
                  type="text"
                  value={bankDetails.institutionNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      institutionNumber: e.target.value,
                    })
                  }
                  placeholder="Institution Number"
                  style={styles.inputField}
                />
              </label>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.put(
                      `${API_BASE_URL}/drivers/${driver._id}`,
                      {
                        ...driver,
                        bankDetails,
                      }
                    );
                    setDriver(res.data);
                    await axios.post(`${API_BASE_URL}/notifications`, {
                      message: `${driver.name} added direct deposit details.`,
                      email: driver.email,
                      type: "bank",
                    });
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
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  loading: {
    textAlign: "center",
    padding: "100px 20px",
    fontSize: "22px",
    fontWeight: "500",
    color: "#4a5568",
  },
  button: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    marginBottom: "40px",
    border: "1px solid #e2e8f0",
  },
  profileTitle: {
    margin: "20px 0",
    fontSize: "32px",
    color: "#1f2937",
    fontWeight: "bold",
  },
  profileInfo: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px 32px",
    fontSize: "16px",
    color: "#1f2937",
    textAlign: "left",
    padding: "0 12px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputField: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    backgroundColor: "#fff",
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
    backgroundColor: "#ffffff",
    paddingTop: "24px",
    paddingBottom: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "24px",
    marginBottom: "20px",
    borderBottom: "2px solid #4b5563",
    paddingBottom: "8px",
    color: "#1f2937",
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
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
    padding: "10px",
    overflowX: "auto",
  },
};

export default MyInfo;
