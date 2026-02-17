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
  const [uploadingTraining, setUploadingTraining] = useState<string | null>(null);

  // List of available trainings
  const availableTrainings = [
    "Defensive Driving - Tractor-Trailer",
    "Distracted Driving",
    "Hours of Service: Canadian Regulations",
    "Transportation of Dangerous Goods",
    "Vehicle Inspections",
    "WHMIS",
    "Winter Driving",
    "Fall Protection for Drivers",
    "Pallet Trucks (Walkies and Riders)",
    "Practical Cargo Securement for Drivers (Cargo Van)",
    "Food Safety for Drivers",
    "Lift Truck Operator Skills"
  ];

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
  if (!driver.requiredOnboardingForms?.agencySignOff) missingForms.push("Agency Sign Off");
  if (!driver.requiredOnboardingForms?.driverDeliveryExpectations) missingForms.push("Driver Delivery Expectations");
  if (!driver.requiredOnboardingForms?.cellPhonePolicy) missingForms.push("Cell Phone Policy");
  if (!driver.requiredOnboardingForms?.storeSurvey1) missingForms.push("Store Survey 1");
  if (!driver.requiredOnboardingForms?.tobaccoAndLCPValidation) missingForms.push("Tobacco and LCP Validation");
  if (!driver.requiredOnboardingForms?.driverSop) missingForms.push("Driver SOP");
  const hasMissingForms = missingForms.length > 0;

  // Helper function to handle form download
  const handleDownloadForm = (formName: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = `/forms/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to render a form card
  const renderFormCard = (formKey: string, formTitle: string, fileName: string) => {
    const formValue = driver.requiredOnboardingForms?.[formKey];
    return (
      <div style={styles.formCard} key={formKey}>
        <h4 style={styles.formTitle}>{formTitle}</h4>
        {formValue ? (
          <div style={styles.formUploaded}>
            <p style={styles.formStatus}>✓ Uploaded</p>
            <a
              href={`${API_BASE_URL.replace("/api", "")}/${formValue}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.viewLink}
            >
              View Document
            </a>
            <button
              onClick={() => handleDownloadForm(formTitle, fileName)}
              style={styles.downloadButton}
            >
              Download Sample
            </button>
            <label 
              style={styles.uploadButton}
              onMouseEnter={(e) => {
                if (uploadingForm !== formKey) {
                  e.currentTarget.style.backgroundColor = "#4338ca";
                }
              }}
              onMouseLeave={(e) => {
                if (uploadingForm !== formKey) {
                  e.currentTarget.style.backgroundColor = "#4F46E5";
                }
              }}
            >
              {uploadingForm === formKey ? 'Uploading...' : 'Update'}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingForm(formKey);
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('driverId', driver._id);
                  formData.append('formType', formKey);
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
                    alert(`${formTitle} form updated successfully!`);
                  } catch (err: any) {
                    console.error(`Error uploading ${formTitle}:`, err);
                    alert(err.response?.data?.message || `Failed to upload ${formTitle} form`);
                  } finally {
                    setUploadingForm(null);
                  }
                }}
                disabled={uploadingForm === formKey}
              />
            </label>
          </div>
        ) : (
          <div style={styles.formNotUploaded}>
            <p style={styles.formStatusRequired}>⚠ Required</p>
            <button
              onClick={() => handleDownloadForm(formTitle, fileName)}
              style={styles.downloadButton}
            >
              Download Sample
            </button>
            <label style={styles.uploadButton}>
              {uploadingForm === formKey ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingForm(formKey);
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('driverId', driver._id);
                  formData.append('formType', formKey);
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
                    alert(`${formTitle} form uploaded successfully!`);
                  } catch (err: any) {
                    console.error(`Error uploading ${formTitle}:`, err);
                    alert(err.response?.data?.message || `Failed to upload ${formTitle} form`);
                  } finally {
                    setUploadingForm(null);
                  }
                }}
                disabled={uploadingForm === formKey}
              />
            </label>
          </div>
        )}
      </div>
    );
  };

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
              Please download the sample forms, fill them out, and upload them. You can update them at any time.
            </p>
            <div style={styles.formsGrid}>
              {renderFormCard('agencySignOff', 'Agency Sign Off', 'Agency Sign Off.pdf')}
              {renderFormCard('driverDeliveryExpectations', 'Driver Delivery Expectations', 'Driver Delivery Expectations.pdf')}
              {renderFormCard('cellPhonePolicy', 'Cell Phone Policy', 'Cell Phone Policy.pdf')}
              {renderFormCard('storeSurvey1', 'Store Survey 1', 'Store Survey 1.pdf')}
              {renderFormCard('tobaccoAndLCPValidation', 'Tobacco and LCP Validation', 'Tobacco and LCP Validation.pdf')}
              {renderFormCard('driverSop', 'Driver SOP', 'Driver SOP.pdf')}
            </div>
          </div>

          {/* Trainings Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📚 Trainings</h3>
            <p style={styles.sectionDescription}>
              Upload proof documents for trainings you have passed. You can update them at any time.
            </p>
            <div style={styles.trainingsGrid}>
              {availableTrainings.map((trainingName) => {
                const training = driver.trainings?.find((t: any) => t.name === trainingName);
                const hasProof = training && training.proofDocument;
                
                return (
                  <div key={trainingName} style={styles.trainingCard}>
                    <h4 style={styles.trainingTitle}>{trainingName}</h4>
                    {hasProof ? (
                      <div style={styles.trainingUploaded}>
                        <p style={styles.trainingStatus}>✓ Passed</p>
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/${training.proofDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.viewLink}
                        >
                          View Proof
                        </a>
                        <label 
                          style={styles.uploadButton}
                          onMouseEnter={(e) => {
                            if (uploadingTraining !== trainingName) {
                              e.currentTarget.style.backgroundColor = "#4338ca";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (uploadingTraining !== trainingName) {
                              e.currentTarget.style.backgroundColor = "#4F46E5";
                            }
                          }}
                        >
                          {uploadingTraining === trainingName ? 'Uploading...' : 'Update'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingTraining(trainingName);
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('driverId', driver._id);
                              formData.append('trainingName', trainingName);
                              try {
                                const token = localStorage.getItem("token");
                                const res = await axios.post(
                                  `${API_BASE_URL}/drivers/upload-training-proof`,
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
                                alert(`${trainingName} proof updated successfully!`);
                              } catch (err: any) {
                                console.error('Error uploading training proof:', err);
                                alert(err.response?.data?.message || `Failed to upload ${trainingName} proof`);
                              } finally {
                                setUploadingTraining(null);
                              }
                            }}
                            disabled={uploadingTraining === trainingName}
                          />
                        </label>
                      </div>
                    ) : (
                      <div style={styles.trainingNotUploaded}>
                        <p style={styles.trainingStatusPending}>Not Passed</p>
                        <label 
                          style={styles.uploadButton}
                          onMouseEnter={(e) => {
                            if (uploadingTraining !== trainingName) {
                              e.currentTarget.style.backgroundColor = "#4338ca";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (uploadingTraining !== trainingName) {
                              e.currentTarget.style.backgroundColor = "#4F46E5";
                            }
                          }}
                        >
                          {uploadingTraining === trainingName ? 'Uploading...' : 'Upload Proof'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingTraining(trainingName);
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('driverId', driver._id);
                              formData.append('trainingName', trainingName);
                              try {
                                const token = localStorage.getItem("token");
                                const res = await axios.post(
                                  `${API_BASE_URL}/drivers/upload-training-proof`,
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
                                alert(`${trainingName} proof uploaded successfully!`);
                              } catch (err: any) {
                                console.error('Error uploading training proof:', err);
                                alert(err.response?.data?.message || `Failed to upload ${trainingName} proof`);
                              } finally {
                                setUploadingTraining(null);
                              }
                            }}
                            disabled={uploadingTraining === trainingName}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
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
    gridTemplateColumns: "repeat(3, 1fr)",
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
  downloadButton: {
    backgroundColor: "#10b981",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    display: "inline-block",
    marginTop: "8px",
    marginBottom: "8px",
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
  trainingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  trainingCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  trainingTitle: {
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "15px",
    color: "#1f2937",
    lineHeight: "1.4",
  },
  trainingUploaded: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  trainingNotUploaded: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  trainingStatus: {
    color: "#10b981",
    fontWeight: 600,
    fontSize: "14px",
  },
  trainingStatusPending: {
    color: "#6b7280",
    fontWeight: 500,
    fontSize: "14px",
  },
};

export default MyInfo;
