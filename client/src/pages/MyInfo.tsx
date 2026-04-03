import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

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
  const [uploadingTraining, setUploadingTraining] = useState<string | null>(null);

  // Org-level mandatory training list — fetched dynamically
  const [mandatoryTrainings, setMandatoryTrainings] = useState<string[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(true);

  // Org-level mandatory compliance documents — fetched dynamically
  const [mandatoryDocuments, setMandatoryDocuments] = useState<string[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (driver?.email) {
      const token = localStorage.getItem("token");
      axios
        .get(
          `${API_BASE_URL}/timesheets?email=${encodeURIComponent(driver.email)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => setTimesheets(res.data))
        .catch((err) => console.error("Error fetching timesheets", err));
    }
  }, [driver]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchMandatoryTrainings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/organizations/mandatory-trainings`, { headers });
        setMandatoryTrainings(res.data.mandatoryTrainings || []);
      } catch (err) {
        console.error("Failed to fetch mandatory trainings:", err);
      } finally {
        setTrainingsLoading(false);
      }
    };

    const fetchMandatoryDocuments = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/organizations/mandatory-documents`, { headers });
        setMandatoryDocuments(res.data.mandatoryDocuments || []);
      } catch (err) {
        console.error("Failed to fetch mandatory documents:", err);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchMandatoryTrainings();
    fetchMandatoryDocuments();
  }, []);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const token = localStorage.getItem("token");
      const authHeaders = { Authorization: `Bearer ${token}` };
      try {
        const allDriversRes = await axios.get(`${API_BASE_URL}/drivers`, { headers: authHeaders });
        const matchedDriver = allDriversRes.data.find(
          (drv: any) => drv.email === parsedUser.email
        );
        if (matchedDriver) {
          const fullDriverRes = await axios.get(
            `${API_BASE_URL}/drivers/${matchedDriver._id}`,
            { headers: authHeaders }
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

  if (!driver || !formData) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", color: "var(--t-text-faint)", fontSize: "15px" }}>Loading...</div>;

  // Dynamic missing forms — based on org's mandatory documents vs driver's uploaded compliance documents
  const missingForms = mandatoryDocuments.filter(
    (name) => !(driver.complianceDocuments || []).some((d: any) => d.name === name && d.document)
  );
  const hasMissingForms = mandatoryDocuments.length > 0 && missingForms.length > 0;

  const formsUploaded = (driver.complianceDocuments || []).filter((d: any) => d.document).length;
  const totalForms = mandatoryDocuments.length;
  const trainingsCompleted = (driver.trainings || []).filter((t: any) => t.proofDocument).length;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
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
          [data-mi-hero-stats] { flex-wrap: wrap !important; gap: 8px !important; }
        }
        @media (max-width: 480px) {
          [data-mi-container] { padding: 12px 8px !important; }
          [data-mi-card] { padding: 20px 12px !important; border-radius: 12px !important; }
          [data-mi-title] { font-size: 20px !important; }
          [data-mi-section] { padding: 12px !important; border-radius: 12px !important; }
        }
        [data-mi-edit-btn]:hover { background: rgba(255,255,255,0.2) !important; }
        [data-mi-save-btn]:hover { background: #4338ca !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45) !important; }
        [data-mi-form-card-inner]:hover { box-shadow: var(--t-shadow) !important; transform: translateY(-1px); border-color: var(--t-accent-light) !important; }
        [data-mi-training-card-inner]:hover { box-shadow: var(--t-shadow) !important; transform: translateY(-1px); border-color: var(--t-accent-light) !important; }
        input[data-mi-input]:focus { outline: none; border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
      `}</style>
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroAvatar}>
            {(driver.name || "D").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={styles.heroName} data-mi-title>{driver.name}</h1>
            <div style={styles.heroBadgeRow}>
              {driver.driverId && (
                <span style={styles.heroBadgeId}>{driver.driverId}</span>
              )}
              {driver.organizationId?.name && (
                <span style={styles.heroBadgeOrg}>{driver.organizationId.name}</span>
              )}
              <span style={{ ...styles.heroBadgeStatus, background: driver.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)", border: driver.status === "Active" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(107,114,128,0.4)", color: driver.status === "Active" ? "var(--t-success)" : "var(--t-text-faint)" }}>
                ● {driver.status || "Active"}
              </span>
            </div>
            <div style={styles.heroStats} data-mi-hero-stats>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{formsUploaded}/{totalForms}</span>
                <span style={styles.heroStatLabel}>Forms Uploaded</span>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{trainingsCompleted}</span>
                <span style={styles.heroStatLabel}>Trainings Passed</span>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{driver.status || "—"}</span>
                <span style={styles.heroStatLabel}>Status</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={styles.heroEditBtn}
            data-mi-edit-btn
          >
            {isEditing ? "✕ Cancel" : "✎ Edit Info"}
          </button>
        </div>
      </div>

      <div style={styles.container} data-mi-container>
        {hasMissingForms && (
          <div style={styles.warningBanner}>
            <p style={styles.warningText}>
              <strong>Required Documents Pending:</strong> Please upload the following required onboarding forms: {missingForms.join(", ")}
            </p>
          </div>
        )}
        <div style={styles.profileCard} data-mi-card>
          <h3 style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-faint)", margin: "0 0 20px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Driver Information
          </h3>
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
              style={styles.saveBtn}
              data-mi-save-btn
            >
              Save Changes
            </button>
          )}
          {/* Compliance Documents Section */}
          <div style={styles.section} data-mi-section>
            <h3 style={styles.sectionTitle}>📋 Compliance Documents</h3>
            <p style={styles.sectionDescription}>
              Upload the required compliance documents for your organization. You can update them at any time.
            </p>
            {docsLoading ? (
              <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
            ) : mandatoryDocuments.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No compliance documents required yet</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-ghost)" }}>Your organization hasn't configured required documents. Contact your administrator.</p>
              </div>
            ) : (
              <div style={styles.formsGrid} data-mi-forms-grid>
                {mandatoryDocuments.map((docName) => {
                  const entry = (driver.complianceDocuments || []).find((d: any) => d.name === docName);
                  const hasDoc = entry && entry.document;
                  return (
                    <div style={styles.formCard} key={docName} data-mi-form-card-inner>
                      <h4 style={styles.formTitle}>{docName}</h4>
                      {hasDoc ? (
                        <div style={styles.formUploaded}>
                          <p style={styles.formStatus}>✓ Uploaded</p>
                          <a href={`${API_BASE_URL.replace("/api", "")}/${entry.document}`} target="_blank" rel="noopener noreferrer" style={styles.viewLink}>
                            View Document
                          </a>
                          <label style={styles.uploadButton}>
                            {uploadingDoc === docName ? "Uploading..." : "Update"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              disabled={uploadingDoc === docName}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingDoc(docName);
                                const fd = new FormData();
                                fd.append("file", file);
                                fd.append("driverId", driver._id);
                                fd.append("documentName", docName);
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await axios.post(`${API_BASE_URL}/drivers/upload-compliance-document`, fd, {
                                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
                                  });
                                  setDriver(res.data.driver);
                                  setFormData(res.data.driver);
                                } catch (err: any) {
                                  alert(err.response?.data?.message || `Failed to upload ${docName}`);
                                } finally {
                                  setUploadingDoc(null);
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <div style={styles.formNotUploaded}>
                          <p style={styles.formStatusRequired}>⚠ Required</p>
                          <label style={styles.uploadButton}>
                            {uploadingDoc === docName ? "Uploading..." : "Upload"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                              disabled={uploadingDoc === docName}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingDoc(docName);
                                const fd = new FormData();
                                fd.append("file", file);
                                fd.append("driverId", driver._id);
                                fd.append("documentName", docName);
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await axios.post(`${API_BASE_URL}/drivers/upload-compliance-document`, fd, {
                                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
                                  });
                                  setDriver(res.data.driver);
                                  setFormData(res.data.driver);
                                } catch (err: any) {
                                  alert(err.response?.data?.message || `Failed to upload ${docName}`);
                                } finally {
                                  setUploadingDoc(null);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trainings Section */}
          <div style={styles.section} data-mi-section>
            <h3 style={styles.sectionTitle}>📚 Trainings</h3>
            <p style={styles.sectionDescription}>
              Upload proof documents for trainings you have passed. You can update them at any time.
            </p>
            {trainingsLoading ? (
              <div style={{ padding: "32px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading…</div>
            ) : mandatoryTrainings.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" as const, background: "var(--t-surface-alt)", borderRadius: "12px", border: "1px dashed var(--t-border-strong)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--t-text-secondary)" }}>No training requirements set up yet</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-ghost)" }}>Your organization hasn't configured mandatory trainings. Contact your administrator.</p>
              </div>
            ) : (
            <div style={styles.trainingsGrid} data-mi-training-grid>
              {mandatoryTrainings.map((trainingName) => {
                const training = driver.trainings?.find((t: any) => t.name === trainingName);
                const hasProof = training && training.proofDocument;
                
                return (
                  <div key={trainingName} style={styles.trainingCard} data-mi-training-card-inner>
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
                              e.currentTarget.style.backgroundColor = "var(--t-accent)";
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
                              e.currentTarget.style.backgroundColor = "var(--t-accent)";
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
            )}
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
                style={styles.saveBtn}
                data-mi-save-btn
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
  hero: {
    background: "linear-gradient(135deg, #0A0F1E 0%, var(--t-bg) 55%, var(--t-surface) 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "36px 40px 32px",
  },
  heroInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "flex-start",
    gap: "24px",
  },
  heroAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #4F46E5, #7c3aed)",
    border: "1px solid rgba(129,140,248,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  heroName: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 10px",
    letterSpacing: "-0.4px",
  },
  heroBadgeRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: "16px",
  },
  heroBadgeId: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--t-indigo)",
    background: "var(--t-indigo-bg)",
    border: "1px solid rgba(79,70,229,0.3)",
    borderRadius: "6px",
    padding: "3px 10px",
  },
  heroBadgeOrg: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--t-success)",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: "6px",
    padding: "3px 10px",
  },
  heroBadgeStatus: {
    fontSize: "11px",
    fontWeight: 700,
    borderRadius: "6px",
    padding: "3px 10px",
  },
  heroStats: {
    display: "flex",
    gap: "32px",
  },
  heroStat: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
  },
  heroStatNum: {
    fontSize: "20px",
    fontWeight: 800,
    color: "var(--t-indigo)",
    lineHeight: 1,
  },
  heroStatLabel: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  heroEditBtn: {
    marginLeft: "auto",
    flexShrink: 0,
    background: "var(--t-border)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "var(--t-text-secondary)",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    alignSelf: "flex-start",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "28px 24px 60px",
  },
  saveBtn: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "24px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
    letterSpacing: "0.2px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  button: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  profileCard: {
    backgroundColor: "var(--t-surface)",
    padding: "28px 32px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    marginBottom: "20px",
  },
  profileTitle: {
    margin: "16px 0",
    fontSize: "26px",
    color: "var(--t-text-secondary)",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  profileInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "4px 32px",
    fontSize: "14px",
    color: "var(--t-text-secondary)",
    textAlign: "left",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  infoLabel: {
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },
  infoValue: {
    fontSize: "14px",
    color: "var(--t-text-secondary)",
    fontWeight: 500,
  },
  formField: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    padding: "10px 0",
  },
  inputField: {
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  labelText: {
    fontWeight: 700,
    fontSize: "9px",
    color: "var(--t-text-ghost)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },
  section: {
    marginTop: "16px",
    textAlign: "left" as const,
    padding: "28px 32px",
    backgroundColor: "var(--t-surface)",
    borderRadius: "16px",
    border: "1px solid var(--t-border)",
    boxShadow: "var(--t-shadow)",
  },
  sectionTitle: {
    fontSize: "10px",
    fontWeight: 700,
    marginBottom: "8px",
    marginTop: 0,
    borderBottom: "1px solid var(--t-border)",
    paddingBottom: "14px",
    color: "var(--t-text-faint)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },
  sectionDescription: {
    fontSize: "13px",
    color: "var(--t-text-dim)",
    marginBottom: "20px",
    marginTop: "10px",
    textAlign: "left" as const,
    lineHeight: "1.6",
  },
  formsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    marginTop: "16px",
  },
  formCard: {
    backgroundColor: "var(--t-surface-alt)",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid var(--t-border)",
    textAlign: "center" as const,
    transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
  },
  formTitle: {
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "14px",
    marginTop: 0,
    color: "var(--t-text-secondary)",
    lineHeight: "1.4",
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
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "var(--t-success-bg)",
    color: "var(--t-success)",
    border: "1px solid var(--t-success-bg)",
  },
  formStatusRequired: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "var(--t-warning-bg)",
    color: "var(--t-warning)",
    border: "1px solid var(--t-warning-bg)",
  },
  viewLink: {
    color: "var(--t-indigo)",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 600,
  },
  downloadButton: {
    backgroundColor: "var(--t-success-bg)",
    color: "var(--t-success)",
    padding: "6px 12px",
    borderRadius: "7px",
    border: "1px solid var(--t-success-bg)",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    display: "inline-block",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  uploadButton: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "7px",
    border: "none",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    display: "inline-block",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  warningBanner: {
    backgroundColor: "var(--t-warning-bg)",
    border: "1px solid var(--t-warning-bg)",
    borderRadius: "12px",
    padding: "14px 20px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  warningText: {
    color: "var(--t-warning)",
    fontSize: "13px",
    margin: 0,
    lineHeight: "1.5",
  },
  trainingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  trainingCard: {
    backgroundColor: "var(--t-surface-alt)",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid var(--t-border)",
    textAlign: "center" as const,
    transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
  },
  trainingTitle: {
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "14px",
    marginTop: 0,
    color: "var(--t-text-secondary)",
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
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "var(--t-success-bg)",
    color: "var(--t-success)",
    border: "1px solid var(--t-success-bg)",
  },
  trainingStatusPending: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-dim)",
    border: "1px solid var(--t-input-border)",
  },
};

export default MyInfo;
