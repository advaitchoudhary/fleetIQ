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

  if (!driver || !formData) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: "#6b7280", fontSize: "15px" }}>Loading...</div>;

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
  const handleDownloadForm = (fileName: string) => {
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
              onClick={() => handleDownloadForm(fileName)}
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
              onClick={() => handleDownloadForm(fileName)}
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 1024px) {
          [data-mi-container] { padding: 24px 20px !important; }
          [data-mi-card] { padding: 28px 20px !important; }
          [data-mi-forms-grid] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          [data-mi-container] { padding: 16px 12px !important; }
          [data-mi-card] { padding: 24px 16px !important; }
          [data-mi-title] { font-size: 22px !important; }
          [data-mi-info-grid] { grid-template-columns: 1fr !important; gap: 8px !important; }
          [data-mi-forms-grid] { grid-template-columns: 1fr !important; }
          [data-mi-training-grid] { grid-template-columns: 1fr !important; }
          [data-mi-section] { padding: 16px !important; margin-top: 20px !important; }
          [data-mi-icon] { width: 60px !important; height: 60px !important; }
        }
        @media (max-width: 480px) {
          [data-mi-container] { padding: 12px 8px !important; }
          [data-mi-card] { padding: 20px 12px !important; border-radius: 12px !important; }
          [data-mi-title] { font-size: 20px !important; }
          [data-mi-section] { padding: 12px !important; border-radius: 12px !important; }
        }
      `}</style>
      <Navbar />
      <div style={styles.container} data-mi-container>
        {hasMissingForms && (
          <div style={styles.warningBanner}>
            <p style={styles.warningText}>
              <strong>Required Documents Pending:</strong> Please upload the following required onboarding forms: {missingForms.join(", ")}
            </p>
          </div>
        )}
        <div style={styles.profileCard} data-mi-card>
          <FaUserCircle size={80} color="#4F46E5" data-mi-icon />
          <h2 style={styles.profileTitle} data-mi-title>Welcome, {driver.name}</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{ ...styles.button, marginBottom: "20px" }}
          >
            {isEditing ? "Cancel" : "Edit My Info"}
          </button>
          <div style={styles.profileInfo} data-mi-info-grid>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{driver.email}</span>
            </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Contact</span>
                <span style={styles.infoValue}>{driver.contact}</span>
              </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Address</span>
                <span style={styles.infoValue}>{driver.address}</span>
              </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>HST/GST</span>
                <span style={styles.infoValue}>{driver.hst_gst}</span>
              </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Business Name</span>
                <span style={styles.infoValue}>{driver.business_name}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Backhaul Rate</span>
              <span style={styles.infoValue}>${driver.backhaulRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Combo Rate</span>
              <span style={styles.infoValue}>${driver.comboRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Extra Sheet/E.W Rate</span>
              <span style={styles.infoValue}>${driver.extraSheetEWRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Regular/Banner Rate</span>
              <span style={styles.infoValue}>${driver.regularBannerRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Wholesale Rate</span>
              <span style={styles.infoValue}>${driver.wholesaleRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Voila Rate</span>
              <span style={styles.infoValue}>${driver.voilaRate}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>TCS Linehaul Trenton Rate</span>
              <span style={styles.infoValue}>${driver.tcsLinehaulTrentonRate}</span>
            </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Licence</span>
                <span style={styles.infoValue}>{driver.licence}</span>
              </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Licence Expiry</span>
                <span style={styles.infoValue}>
                  {driver.licence_expiry_date
                    ? new Date(driver.licence_expiry_date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
                    : ""}
                </span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Status</span>
              <span style={styles.infoValue}>{driver.status}</span>
            </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>SIN No.</span>
                <span style={styles.infoValue}>{driver.sinNo}</span>
              </div>
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
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Work Status</span>
                <span style={styles.infoValue}>{driver.workStatus}</span>
              </div>
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
          <div style={styles.section} data-mi-section>
            <h3 style={styles.sectionTitle}>📋 Required Onboarding Forms</h3>
            <p style={styles.sectionDescription}>
              Please download the sample forms, fill them out, and upload them. You can update them at any time.
            </p>
            <div style={styles.formsGrid} data-mi-forms-grid>
              {renderFormCard('agencySignOff', 'Agency Sign Off', 'Agency Sign Off.pdf')}
              {renderFormCard('driverDeliveryExpectations', 'Driver Delivery Expectations', 'Driver Delivery Expectations.pdf')}
              {renderFormCard('cellPhonePolicy', 'Cell Phone Policy', 'Cell Phone Policy.pdf')}
              {renderFormCard('storeSurvey1', 'Store Survey 1', 'Store Survey 1.pdf')}
              {renderFormCard('tobaccoAndLCPValidation', 'Tobacco and LCP Validation', 'Tobacco and LCP Validation.pdf')}
              {renderFormCard('driverSop', 'Driver SOP', 'Driver SOP.pdf')}
            </div>
          </div>

          {/* Trainings Section */}
          <div style={styles.section} data-mi-section>
            <h3 style={styles.sectionTitle}>📚 Trainings</h3>
            <p style={styles.sectionDescription}>
              Upload proof documents for trainings you have passed. You can update them at any time.
            </p>
            <div style={styles.trainingsGrid} data-mi-training-grid>
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
            <div style={styles.section} data-mi-section>
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
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  button: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    textAlign: "center",
    marginBottom: "40px",
  },
  profileTitle: {
    margin: "16px 0",
    fontSize: "26px",
    color: "#111827",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  profileInfo: {
    marginTop: "28px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px 32px",
    fontSize: "14px",
    color: "#374151",
    textAlign: "left",
    padding: "0 12px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  infoValue: {
    fontSize: "15px",
    color: "#111827",
    fontWeight: 500,
  },
  formField: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  inputField: {
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "border-color 0.2s",
  },
  labelText: {
    fontWeight: 600,
    marginBottom: "2px",
    fontSize: "13px",
    color: "#374151",
  },
  section: {
    marginTop: "32px",
    textAlign: "left" as const,
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sectionTitle: {
    fontSize: "15px",
    marginBottom: "8px",
    marginTop: 0,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "12px",
    color: "#111827",
    fontWeight: 700,
  },
  sectionDescription: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "20px",
    marginTop: "8px",
    textAlign: "left" as const,
  },
  formsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginTop: "16px",
  },
  formCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center" as const,
  },
  formTitle: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "14px",
    marginTop: 0,
    color: "#111827",
  },
  formUploaded: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    alignItems: "center",
  },
  formNotUploaded: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    alignItems: "center",
  },
  formStatus: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
  },
  formStatusRequired: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#fffbeb",
    color: "#d97706",
    border: "1px solid #fde68a",
  },
  viewLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
  },
  downloadButton: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    padding: "7px 14px",
    borderRadius: "8px",
    border: "1px solid #a7f3d0",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    display: "inline-block",
  },
  uploadButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    display: "inline-block",
  },
  warningBanner: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "12px",
    padding: "14px 20px",
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  warningText: {
    color: "#92400e",
    fontSize: "14px",
    margin: 0,
  },
  trainingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  trainingCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    textAlign: "center" as const,
  },
  trainingTitle: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "14px",
    marginTop: 0,
    color: "#111827",
    lineHeight: "1.4",
  },
  trainingUploaded: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    alignItems: "center",
  },
  trainingNotUploaded: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    alignItems: "center",
  },
  trainingStatus: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
  },
  trainingStatusPending: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #d1d5db",
  },
};

export default MyInfo;
