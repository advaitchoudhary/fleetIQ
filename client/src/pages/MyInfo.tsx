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
  const [uploadingForm, setUploadingForm] = useState<string | null>(null);

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

  // Check for missing required forms
  const missingForms = [];
  if (!driver.requiredOnboardingForms?.sop) missingForms.push("SOP");
  if (!driver.requiredOnboardingForms?.tobocaoSop) missingForms.push("TOBOCAO SOP");
  if (!driver.requiredOnboardingForms?.phonePolicy) missingForms.push("PHONE POLICY");
  const hasMissingForms = missingForms.length > 0;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        {hasMissingForms && (
          <div style={styles.warningBanner}>
            <p style={styles.warningText}>
              ⚠️ <strong>Required Documents Pending:</strong> Please upload the following required onboarding forms: {missingForms.join(", ")}
            </p>
          </div>
        )}
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
            <p>
              <strong>Voila Rate:</strong> ${driver.voilaRate}
            </p>
            <p>
              <strong>TCS Linehaul Trenton Rate:</strong> ${driver.tcsLinehaulTrentonRate}
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

                  // Detect changed fields, excluding auto-updated fields
                  const excludedKeys = ["updatedAt", "bankDetails", "trainings", "__v", "_id"];
                  const changedFields = Object.keys(formData).filter(
                    (key) =>
                      !excludedKeys.includes(key) &&
                      formData[key] !== driver[key]
                  );

                  await axios.post(`${API_BASE_URL}/notifications`, {
                    message: `${driver.name} updated ${changedFields.join(", ")} details`,
                    email: driver.email,
                    field: changedFields.join(", ") || "Unknown",
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
          {/* Required Onboarding Forms Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📋 Required Onboarding Forms</h3>
            <p style={styles.sectionDescription}>
              Please upload the following required documents. You can update them at any time.
            </p>
            <div style={styles.formsGrid}>
              {/* SOP Form */}
              <div style={styles.formCard}>
                <h4 style={styles.formTitle}>SOP</h4>
                {driver.requiredOnboardingForms?.sop ? (
                  <div style={styles.formUploaded}>
                    <p style={styles.formStatus}>✓ Uploaded</p>
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.sop}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewLink}
                    >
                      View Document
                    </a>
                    <label 
                      style={styles.uploadButton}
                      onMouseEnter={(e) => {
                        if (uploadingForm !== 'sop') {
                          e.currentTarget.style.backgroundColor = "#4338ca";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (uploadingForm !== 'sop') {
                          e.currentTarget.style.backgroundColor = "#4F46E5";
                        }
                      }}
                    >
                      {uploadingForm === 'sop' ? 'Uploading...' : 'Update'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('sop');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'sop');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('SOP form updated successfully!');
                          } catch (err: any) {
                            console.error('Error uploading SOP:', err);
                            alert(err.response?.data?.message || 'Failed to upload SOP form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'sop'}
                      />
                    </label>
                  </div>
                ) : (
                  <div style={styles.formNotUploaded}>
                    <p style={styles.formStatusRequired}>⚠ Required</p>
                    <label style={styles.uploadButton}>
                      {uploadingForm === 'sop' ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('sop');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'sop');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('SOP form uploaded successfully!');
                          } catch (err: any) {
                            console.error('Error uploading SOP:', err);
                            alert(err.response?.data?.message || 'Failed to upload SOP form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'sop'}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* TOBOCAO SOP Form */}
              <div style={styles.formCard}>
                <h4 style={styles.formTitle}>TOBOCAO SOP</h4>
                {driver.requiredOnboardingForms?.tobocaoSop ? (
                  <div style={styles.formUploaded}>
                    <p style={styles.formStatus}>✓ Uploaded</p>
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.tobocaoSop}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewLink}
                    >
                      View Document
                    </a>
                    <label style={styles.uploadButton}>
                      {uploadingForm === 'tobocaoSop' ? 'Uploading...' : 'Update'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('tobocaoSop');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'tobocaoSop');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('TOBOCAO SOP form updated successfully!');
                          } catch (err: any) {
                            console.error('Error uploading TOBOCAO SOP:', err);
                            alert(err.response?.data?.message || 'Failed to upload TOBOCAO SOP form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'tobocaoSop'}
                      />
                    </label>
                  </div>
                ) : (
                  <div style={styles.formNotUploaded}>
                    <p style={styles.formStatusRequired}>⚠ Required</p>
                    <label style={styles.uploadButton}>
                      {uploadingForm === 'tobocaoSop' ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('tobocaoSop');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'tobocaoSop');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('TOBOCAO SOP form uploaded successfully!');
                          } catch (err: any) {
                            console.error('Error uploading TOBOCAO SOP:', err);
                            alert(err.response?.data?.message || 'Failed to upload TOBOCAO SOP form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'tobocaoSop'}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* PHONE POLICY Form */}
              <div style={styles.formCard}>
                <h4 style={styles.formTitle}>PHONE POLICY</h4>
                {driver.requiredOnboardingForms?.phonePolicy ? (
                  <div style={styles.formUploaded}>
                    <p style={styles.formStatus}>✓ Uploaded</p>
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.phonePolicy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewLink}
                    >
                      View Document
                    </a>
                    <label style={styles.uploadButton}>
                      {uploadingForm === 'phonePolicy' ? 'Uploading...' : 'Update'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('phonePolicy');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'phonePolicy');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('PHONE POLICY form updated successfully!');
                          } catch (err: any) {
                            console.error('Error uploading PHONE POLICY:', err);
                            alert(err.response?.data?.message || 'Failed to upload PHONE POLICY form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'phonePolicy'}
                      />
                    </label>
                  </div>
                ) : (
                  <div style={styles.formNotUploaded}>
                    <p style={styles.formStatusRequired}>⚠ Required</p>
                    <label style={styles.uploadButton}>
                      {uploadingForm === 'phonePolicy' ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingForm('phonePolicy');
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('driverId', driver._id);
                          formData.append('formType', 'phonePolicy');
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.post(
                              `${API_BASE_URL}/drivers/upload-required-form`,
                              formData,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'multipart/form-data',
                                },
                              }
                            );
                            setDriver(res.data.driver);
                            setFormData(res.data.driver);
                            alert('PHONE POLICY form uploaded successfully!');
                          } catch (err: any) {
                            console.error('Error uploading PHONE POLICY:', err);
                            alert(err.response?.data?.message || 'Failed to upload PHONE POLICY form');
                          } finally {
                            setUploadingForm(null);
                          }
                        }}
                        disabled={uploadingForm === 'phonePolicy'}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                    const changedBankFields = (Object.keys(bankDetails) as (keyof typeof bankDetails)[]).filter(
                      (key) => bankDetails[key] !== driver.bankDetails?.[key]
                    );
                    
                    if (changedBankFields.length > 0) {
                      await axios.post(`${API_BASE_URL}/notifications`, {
                        message: `${driver.name} updated ${changedBankFields.join(", ")} in direct deposit details.`,
                        email: driver.email,
                        field: changedBankFields.join(", "),
                      });
                    }
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
  sectionDescription: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "20px",
    textAlign: "left",
  },
  formsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  formCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "15px",
    color: "#1f2937",
  },
  formUploaded: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  formNotUploaded: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  formStatus: {
    color: "#10b981",
    fontWeight: 600,
    fontSize: "14px",
  },
  formStatusRequired: {
    color: "#f59e0b",
    fontWeight: 600,
    fontSize: "14px",
  },
  viewLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
  },
  uploadButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    display: "inline-block",
  },
  uploadButtonHover: {
    backgroundColor: "#4338ca",
  },
  warningBanner: {
    backgroundColor: "#fef3c7",
    border: "2px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "20px",
    textAlign: "center",
  },
  warningText: {
    color: "#92400e",
    fontSize: "15px",
    margin: 0,
  },
};

export default MyInfo;
