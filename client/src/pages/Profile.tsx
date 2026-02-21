import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Navbar from "./Navbar";
import { useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driver = location.state?.driver;
  const [timesheets, setTimesheets] = useState<any[]>([]);

  useEffect(() => {
    const fetchDriverTimesheets = async () => {
      if (!driver?.email) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/timesheets?noPagination=true`);
        const driverTimesheets = response.data.data.filter(
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
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <FaArrowLeft size={13} /> Back
        </button>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.leftSection}>
            {driver.image ? (
              <img
                src={driver.image}
                alt="Profile"
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.initialsContainer}>
                {getInitials(driver.name)}
              </div>
            )}
            <div style={styles.driverInfo}>
              <h2 style={styles.driverName}>{driver.name}</h2>
              <p style={styles.driverRole}>Professional Driver</p>
              <p style={styles.driverLocation}>{driver.address}</p>
            </div>
          </div>
        </div>

        {/* Sections — full-width single column */}
        <div style={styles.sectionsWrapper}>
          {/* Driver Details + License in a two-column grid */}
          <div style={styles.twoColRow}>
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>🚗 Driver Details</h3>
              <div style={styles.fieldGrid}>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Email</span>
                  <span style={styles.fieldValue}>{driver.email}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Username</span>
                  <span style={styles.fieldValue}>{driver.username || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Contact</span>
                  <span style={styles.fieldValue}>{driver.contact}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>HST/GST</span>
                  <span style={styles.fieldValue}>{driver.hst_gst || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Business Name</span>
                  <span style={styles.fieldValue}>{driver.business_name || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Backhaul Rate</span>
                  <span style={styles.fieldValue}>${driver.backhaulRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Combo Rate</span>
                  <span style={styles.fieldValue}>${driver.comboRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Extra Sheet/E.W Rate</span>
                  <span style={styles.fieldValue}>${driver.extraSheetEWRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Regular/Banner Rate</span>
                  <span style={styles.fieldValue}>${driver.regularBannerRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Wholesale Rate</span>
                  <span style={styles.fieldValue}>${driver.wholesaleRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>Voila Rate</span>
                  <span style={styles.fieldValue}>${driver.voilaRate || "N/A"}</span>
                </div>
                <div style={styles.fieldItem}>
                  <span style={styles.fieldLabel}>TCS Linehaul Trenton Rate</span>
                  <span style={styles.fieldValue}>${driver.tcsLinehaulTrentonRate || "N/A"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>🚘 License Details</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Licence No.</span>
                    <span style={styles.fieldValue}>{driver.licence || "N/A"}</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Licence Expiry Date</span>
                    <span style={styles.fieldValue}>{driver.licence_expiry_date ? new Date(driver.licence_expiry_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                  </div>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>📌 Status</h3>
                <div style={styles.fieldGrid}>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Current Status</span>
                    <span style={styles.fieldValue}>{driver.status || "N/A"}</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Work Status</span>
                    <span style={styles.fieldValue}>{driver.workStatus || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>💳 Direct Deposit Details</h3>
                {driver.bankDetails ? (
                  <div style={styles.fieldGrid}>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Bank Name</span>
                      <span style={styles.fieldValue}>{driver.bankDetails.bankName || "N/A"}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Account Number</span>
                      <span style={styles.fieldValue}>{driver.bankDetails.accountNumber || "N/A"}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Transit Number</span>
                      <span style={styles.fieldValue}>{driver.bankDetails.transitNumber || "N/A"}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Institution Number</span>
                      <span style={styles.fieldValue}>{driver.bankDetails.institutionNumber || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>No Direct Deposit details available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Required Documents — full width */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>📄 Required Documents</h3>
              <div style={styles.documentsChecklist}>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.agencySignOff ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.agencySignOff ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Agency Sign Off</span>
                  {driver.requiredOnboardingForms?.agencySignOff && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.agencySignOff}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.driverDeliveryExpectations ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.driverDeliveryExpectations ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Driver Delivery Expectations</span>
                  {driver.requiredOnboardingForms?.driverDeliveryExpectations && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.driverDeliveryExpectations}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.cellPhonePolicy ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.cellPhonePolicy ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Cell Phone Policy</span>
                  {driver.requiredOnboardingForms?.cellPhonePolicy && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.cellPhonePolicy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.storeSurvey1 ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.storeSurvey1 ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Store Survey 1</span>
                  {driver.requiredOnboardingForms?.storeSurvey1 && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.storeSurvey1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.tobaccoAndLCPValidation ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.tobaccoAndLCPValidation ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Tobacco and LCP Validation</span>
                  {driver.requiredOnboardingForms?.tobaccoAndLCPValidation && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.tobaccoAndLCPValidation}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
                <div style={styles.checklistItem}>
                  <span style={{
                    ...styles.checkIcon,
                    color: driver.requiredOnboardingForms?.driverSop ? "#10b981" : "#ef4444"
                  }}>
                    {driver.requiredOnboardingForms?.driverSop ? "✓" : "✗"}
                  </span>
                  <span style={styles.checklistLabel}>Driver SOP</span>
                  {driver.requiredOnboardingForms?.driverSop && (
                    <a
                      href={`${API_BASE_URL.replace("/api", "")}/${driver.requiredOnboardingForms.driverSop}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocumentLink}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
              {(!driver.requiredOnboardingForms?.agencySignOff || 
                !driver.requiredOnboardingForms?.driverDeliveryExpectations || 
                !driver.requiredOnboardingForms?.cellPhonePolicy ||
                !driver.requiredOnboardingForms?.storeSurvey1 ||
                !driver.requiredOnboardingForms?.tobaccoAndLCPValidation ||
                !driver.requiredOnboardingForms?.driverSop) && (
                <p style={styles.missingDocsWarning}>
                  ⚠️ Some required documents are missing
                </p>
              )}
            </div>

          {/* Trainings — full width */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>📚 Trainings</h3>
              <div style={styles.trainingsTracker}>
                {(() => {
                  // List of all available trainings
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

                  // Get completed trainings (with proof documents)
                  const completedTrainings = driver.trainings?.filter((t: any) => {
                    const name = typeof t === 'string' ? t : t?.name;
                    return name && name !== "Adipisci laborum laboriosam" && (typeof t === 'object' ? t.proofDocument : false);
                  }) || [];

                  // Get pending trainings (in available list but not completed)
                  const completedTrainingNames = completedTrainings.map((t: any) => typeof t === 'string' ? t : t.name);
                  const pendingTrainings = availableTrainings.filter(name => !completedTrainingNames.includes(name));

                  return (
                    <div>
                      {/* Completed Trainings */}
                      {completedTrainings.length > 0 && (
                        <div>
                          <h4 style={styles.trainingsSubtitle}>Completed Trainings</h4>
                          <div style={styles.trainingsList}>
                            {completedTrainings.map((training: any, index: number) => {
                              const trainingName = typeof training === 'string' ? training : training.name;
                              return (
                                <div key={index} style={styles.trainingTrackerItem}>
                                  <div style={styles.trainingTrackerLeft}>
                                    <span style={styles.trainingCheckIcon}>✓</span>
                                    <span style={styles.trainingTrackerName}>{trainingName}</span>
                                  </div>
                                  {typeof training === 'object' && training.proofDocument && (
                                    <a
                                      href={`${API_BASE_URL.replace("/api", "")}/${training.proofDocument}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={styles.viewTrainingProofLink}
                                    >
                                      View Proof
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pending Trainings */}
                      {pendingTrainings.length > 0 && (
                        <div style={{ marginTop: completedTrainings.length > 0 ? "20px" : "0" }}>
                          <h4 style={styles.trainingsSubtitle}>Pending Trainings</h4>
                          <div style={styles.trainingsList}>
                            {pendingTrainings.map((trainingName, index) => (
                              <div key={index} style={styles.trainingTrackerItem}>
                                <div style={styles.trainingTrackerLeft}>
                                  <span style={styles.trainingPendingIcon}>○</span>
                                  <span style={styles.trainingTrackerNamePending}>{trainingName}</span>
                                </div>
                                <span style={styles.pendingLabel}>Pending</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Trainings Message */}
                      {completedTrainings.length === 0 && pendingTrainings.length === 0 && (
                        <p style={styles.noTrainingsText}>No trainings available</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>📚 Timesheets</h3>
          {timesheets.length === 0 ? (
            <p>No timesheets available for this driver.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Start Time</th>
                  <th style={styles.th}>End Time</th>
                  <th style={styles.th}>Start KM</th>
                  <th style={styles.th}>End KM</th>
                  <th style={styles.th}>Total KM</th>
                  <th style={styles.th}>Attachments</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Planned KM</th>
                  <th style={styles.th}>SubTotal</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t) => {
                  const start = parseFloat(t.startKM);
                  const end = parseFloat(t.endKM);
                  const totalKM =
                    !isNaN(start) && !isNaN(end) ? end - start : "N/A";
                  // Map category names to rate field names
                  const categoryToRateMap: Record<string, string> = {
                    "Backhaul": "backhaulRate",
                    "Combo": "comboRate",
                    "Extra Sheet/E.W": "extraSheetEWRate",
                    "Regular/Banner": "regularBannerRate",
                    "Wholesale": "wholesaleRate",
                    "Wholesale DZ": "wholesaleRate", // Uses same rate as Wholesale
                    "voila": "voilaRate",
                    "TCS linehaul trenton": "tcsLinehaulTrentonRate"
                  };
                  const rateField = categoryToRateMap[t.category || ""] || 
                    `${t.category?.toLowerCase().replace(/\/|\s+/g, "")}Rate`;
                  const rate = driver?.[rateField] || 0;
                  const subtotal =
                    !isNaN(Number(totalKM)) && !isNaN(rate)
                      ? Number(totalKM) * rate
                      : NaN;
                  return (
                    <tr key={t._id}>
                      <td style={styles.td}>{t.date}</td>
                      <td style={styles.td}>{t.startTime}</td>
                      <td style={styles.td}>{t.endTime}</td>
                      <td style={styles.td}>{t.startKM}</td>
                      <td style={styles.td}>{t.endKM}</td>
                      <td style={styles.td}>
                        {typeof totalKM === "number" ? totalKM : "N/A"}
                      </td>
                      <td style={styles.td}>
                        {(t.attachments || []).length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "5px",
                            }}
                          >
                            {t.attachments.map((path: string, idx: number) => (
                              <a
                                key={idx}
                                href={`${API_BASE_URL.replace(
                                  "/api",
                                  ""
                                )}/${path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={`${API_BASE_URL.replace(
                                    "/api",
                                    ""
                                  )}/${path}`}
                                  alt={`attachment-${idx}`}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span>No Attachments</span>
                        )}
                      </td>
                      <td style={styles.td}>{t.category || "N/A"}</td>
                      <td style={styles.td}>{t.plannedKM || "N/A"}</td>
                      <td style={styles.td}>
                        {!isNaN(subtotal) ? `$${subtotal.toFixed(2)}` : "N/A"}
                      </td>
                      <td style={styles.td}>
                        {t.status === "approved"
                          ? "✔️"
                          : t.status === "rejected"
                          ? "❌"
                          : "⏳"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "100%",
    margin: "0 auto",
    padding: "30px 40px",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
    minHeight: "100vh",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "20px",
    transition: "background-color 0.2s, border-color 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  sectionsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "24px",
  },
  twoColRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
    marginTop: "16px",
  },
  fieldItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  fieldValue: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#111827",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "24px",
    marginBottom: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
  },
  profileImage: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    border: "3px solid #4F46E5",
    marginRight: "24px",
    objectFit: "cover",
  },
  initialsContainer: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    color: "white",
    fontSize: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    marginRight: "24px",
    backgroundColor: "#4F46E5",
  },
  driverInfo: {
    textAlign: "left" as const,
  },
  driverName: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "4px",
    color: "#111827",
  },
  driverRole: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "2px",
  },
  driverLocation: {
    fontSize: "14px",
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "4px",
    marginTop: 0,
    color: "#1f2937",
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
    padding: "10px 20px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    marginTop: "8px",
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
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    wordBreak: "break-word",
    whiteSpace: "wrap",
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "8px 8px",
    fontSize: "14px",
    textAlign: "left",
    backgroundColor: "#ffffff",
    wordBreak: "break-word",
  },
  documentsChecklist: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "15px",
  },
  checklistItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  checkIcon: {
    fontSize: "20px",
    fontWeight: "bold",
    minWidth: "24px",
    textAlign: "center",
  },
  checklistLabel: {
    flex: 1,
    fontSize: "15px",
    fontWeight: 500,
    color: "#1f2937",
  },
  viewDocumentLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    padding: "4px 12px",
    borderRadius: "4px",
    backgroundColor: "#eef2ff",
    transition: "background-color 0.2s",
  },
  missingDocsWarning: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#fef3c7",
    borderRadius: "6px",
    color: "#92400e",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "center",
  },
  trainingsTracker: {
    marginTop: "15px",
  },
  trainingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  trainingTrackerItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  trainingTrackerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  trainingCheckIcon: {
    fontSize: "20px",
    color: "#10b981",
    fontWeight: "bold",
    minWidth: "24px",
    textAlign: "center",
  },
  trainingPendingIcon: {
    fontSize: "20px",
    color: "#6b7280",
    fontWeight: "bold",
    minWidth: "24px",
    textAlign: "center",
  },
  trainingTrackerName: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#1f2937",
  },
  trainingTrackerNamePending: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#6b7280",
  },
  trainingsSubtitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "12px",
    marginTop: "0",
  },
  pendingLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#f59e0b",
    padding: "4px 12px",
    borderRadius: "4px",
    backgroundColor: "#fef3c7",
  },
  viewTrainingProofLink: {
    color: "#4F46E5",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    padding: "4px 12px",
    borderRadius: "4px",
    backgroundColor: "#eef2ff",
    transition: "background-color 0.2s",
  },
  noTrainingsText: {
    color: "#6b7280",
    fontSize: "14px",
    fontStyle: "italic",
    textAlign: "center",
    padding: "20px",
  },
};

export default Profile;
