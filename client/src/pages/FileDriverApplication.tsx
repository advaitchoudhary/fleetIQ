import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaArrowLeft } from "react-icons/fa";

const FileDriverApplication: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    sinNo: "",
    licenseClass: "",
    licenseExpiryDate: "",
    truckingExperienceYears: "",
    truckingExperienceMonths: "",
    preferredStartLocation: "",
  });

  // File state
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  const [applicationForm, setApplicationForm] = useState<File | null>(null);
  const [pceConsentForm, setPceConsentForm] = useState<File | null>(null);
  const [cvor, setCvor] = useState<File | null>(null);
  const [driversAbstract, setDriversAbstract] = useState<File | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format Canadian SIN number (XXX XXX XXX)
  const formatSIN = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "");
    
    // Limit to 9 digits
    const limited = numbers.slice(0, 9);
    
    // Format as XXX XXX XXX
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    }
  };

  const handleSINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatSIN(e.target.value);
    setFormData((prev) => ({
      ...prev,
      sinNo: formattedValue,
    }));
  };

  // Format Canadian phone number ((XXX) XXX-XXXX)
  const formatPhone = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, "");
    
    // Limit to 10 digits
    const limited = numbers.slice(0, 10);
    
    // Format as (XXX) XXX-XXXX
    if (limited.length <= 3) {
      return limited.length > 0 ? `(${limited}` : limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formattedValue,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (15MB max)
      if (file.size > 15 * 1024 * 1024) {
        alert(`${fileType} file size must be less than 15MB`);
        return;
      }

      switch (fileType) {
        case "licenseFront":
          setLicenseFront(file);
          break;
        case "licenseBack":
          setLicenseBack(file);
          break;
        case "applicationForm":
          setApplicationForm(file);
          break;
        case "pceConsentForm":
          setPceConsentForm(file);
          break;
        case "cvor":
          setCvor(file);
          break;
        case "driversAbstract":
          setDriversAbstract(file);
          break;
      }
    }
  };

  const handleDownloadApplication = () => {
    // Download the driver application form PDF
    const link = document.createElement("a");
    link.href = "/forms/DriverApplicationForm.pdf";
    link.download = "DriverApplicationForm.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPCEConsent = () => {
    // Download the PCE Consent Form PDF
    const link = document.createElement("a");
    link.href = "/forms/PCE Consent form.pdf";
    link.download = "PCE Consent form.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.address || 
        !formData.sinNo || !formData.licenseClass || !formData.licenseExpiryDate) {
      setSubmitError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (!licenseFront || !licenseBack) {
      setSubmitError("Please upload both front and back of your driver's license");
      setIsSubmitting(false);
      return;
    }

    if (!applicationForm) {
      setSubmitError("Please upload the filled application form");
      setIsSubmitting(false);
      return;
    }

    if (!pceConsentForm) {
      setSubmitError("Please download, fill, and upload the PCE Consent Form");
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          // Strip formatting from SIN number and phone number before sending (remove spaces, parentheses, dashes)
          let valueToSend = value;
          if (key === "sinNo") {
            valueToSend = value.replace(/\s/g, "");
          } else if (key === "phone") {
            valueToSend = value.replace(/\D/g, ""); // Remove all non-numeric characters
          }
          formDataToSend.append(key, valueToSend);
        }
      });

      // Add files
      if (licenseFront) formDataToSend.append("licenseFront", licenseFront);
      if (licenseBack) formDataToSend.append("licenseBack", licenseBack);
      if (applicationForm) formDataToSend.append("applicationForm", applicationForm);
      if (pceConsentForm) formDataToSend.append("pceConsentForm", pceConsentForm);
      if (cvor) formDataToSend.append("cvor", cvor);
      if (driversAbstract) formDataToSend.append("driversAbstract", driversAbstract);

      const response = await axios.post(
        `${API_BASE_URL}/driver-applications/submit`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        setSubmitSuccess(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      setSubmitError(
        error.response?.data?.message || "Failed to submit application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <style>{`
        .driver-application-input::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1;
        }
        .driver-application-input::-webkit-input-placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1;
        }
        .driver-application-input::-moz-placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1;
        }
        .driver-application-input:-ms-input-placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1;
        }
      `}</style>
      <button
        type="button"
        onClick={() => navigate("/")}
        onMouseEnter={() => setIsBackButtonHovered(true)}
        onMouseLeave={() => setIsBackButtonHovered(false)}
        style={{
          ...styles.backToHomeButton,
          backgroundColor: isBackButtonHovered 
            ? "rgba(255, 255, 255, 0.3)" 
            : "rgba(255, 255, 255, 0.2)",
          borderColor: isBackButtonHovered 
            ? "rgba(255, 255, 255, 0.5)" 
            : "rgba(255, 255, 255, 0.3)",
        }}
      >
        <FaArrowLeft style={{ marginRight: "8px", fontSize: "12px" }} />
        Back
      </button>
      <div style={styles.overlay}>
        <div style={styles.content}>
          <h1 style={styles.title}>Driver Application</h1>
          <p style={styles.description}>
            Thank you for your interest in joining Premier Choice Employment
          </p>

          {submitSuccess ? (
            <div style={styles.successMessage}>
              <h2>✅ Your application has been submitted!</h2>
              <p>We will review your application and get back to you soon.</p>
              <p>Redirecting to home page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Personal Information Section */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Personal Information</h2>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>SIN Number *</label>
                    <input
                      type="text"
                      name="sinNo"
                      value={formData.sinNo}
                      onChange={handleSINChange}
                      required
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="XXX XXX XXX"
                      maxLength={11}
                    />
                  </div>
                </div>
              </div>

              {/* Driver's License Section */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Add Driver's License</h2>
                <p style={styles.requirementText}>
                  License requirements: License must not be expired. Upload a picture (.JPEG or .pdf file)
                </p>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>License Class *</label>
                    <select
                      name="licenseClass"
                      value={formData.licenseClass}
                      onChange={handleInputChange}
                      required
                      style={styles.select}
                    >
                      <option value="">Select license class</option>
                      <option value="AZ">AZ</option>
                      <option value="DZ">DZ</option>
                      <option value="G">G</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>License Expiry Date *</label>
                    <input
                      type="date"
                      name="licenseExpiryDate"
                      value={formData.licenseExpiryDate}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Trucking Experience (Years) *</label>
                    <input
                      type="number"
                      name="truckingExperienceYears"
                      value={formData.truckingExperienceYears}
                      onChange={handleInputChange}
                      required
                      min="0"
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="Years"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Trucking Experience (Months) *</label>
                    <input
                      type="number"
                      name="truckingExperienceMonths"
                      value={formData.truckingExperienceMonths}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="11"
                      style={styles.input}
                      className="driver-application-input"
                      placeholder="Months"
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Start Location</label>
                  <input
                    type="text"
                    name="preferredStartLocation"
                    value={formData.preferredStartLocation}
                    onChange={handleInputChange}
                    style={styles.input}
                    className="driver-application-input"
                    placeholder="Enter preferred start location"
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Upload Front of Driver's License *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "licenseFront")}
                      required
                      style={styles.fileInput}
                    />
                    {licenseFront && (
                      <p style={styles.fileName}>Selected: {licenseFront.name}</p>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Upload Back of Driver's License *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "licenseBack")}
                      required
                      style={styles.fileInput}
                    />
                    {licenseBack && (
                      <p style={styles.fileName}>Selected: {licenseBack.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Drivers Application Form Section */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Upload Driver's Application</h2>
                <p style={styles.requirementText}>
                  Application requirements:
                  <br />
                  • 10-year History of education/work experience
                  <br />
                  • Cover all 10-year period from 2011-2022 including history even if you were outside Canada
                  <br />
                  • Certifications, if any
                  <br />
                  • Download and save application to your mobile/computer device &gt; Fill out with above information and upload
                  <br />
                  <strong>ATTENTION:</strong> For Assistance in filling application, PLEASE CALL/TEXT +1 (519) 280-1311 OR EMAIL admin@fleetiqlogistics.com
                </p>
                <div style={styles.formGroup}>
                  <button
                    type="button"
                    onClick={handleDownloadApplication}
                    style={styles.downloadButton}
                  >
                    Download Application Form
                  </button>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Filled Application Form *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "applicationForm")}
                    required
                    style={styles.fileInput}
                  />
                  {applicationForm && (
                    <p style={styles.fileName}>Selected: {applicationForm.name}</p>
                  )}
                </div>
              </div>

              {/* PCE Consent Form Section */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>PCE Consent Form *</h2>
                <p style={styles.requirementText}>
                  <strong>Required:</strong> You must download, fill out, and upload the PCE Consent Form before submitting your application.
                  <br />
                  • Download the PCE Consent Form below
                  <br />
                  • Fill out all required fields
                  <br />
                  • Upload the completed form
                  <br />
                  <strong>You cannot submit the application until the PCE Consent Form is uploaded.</strong>
                </p>
                <div style={styles.formGroup}>
                  <button
                    type="button"
                    onClick={handleDownloadPCEConsent}
                    style={styles.downloadButton}
                  >
                    Download PCE Consent Form
                  </button>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Filled PCE Consent Form *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFileChange(e, "pceConsentForm")}
                    required
                    style={styles.fileInput}
                  />
                  {pceConsentForm && (
                    <p style={styles.fileName}>Selected: {pceConsentForm.name}</p>
                  )}
                  {!pceConsentForm && (
                    <p style={styles.requirementText}>
                      <strong style={{ color: "#fbbf24" }}>⚠️ Required: Please upload the filled PCE Consent Form to proceed.</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* CVOR Section (Optional) */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Add CVOR (Optional)</h2>
                <p style={styles.requirementText}>
                  CVOR requirements: Cannot be older than 30 days prior to today's date. Upload a picture, or a file as a PDF or DOC.
                  <br />
                  Don't have a current CVOR? You can order by clicking here.
                  <br />
                  If you have paid for documents and have not received yet, Please call (519) 280-1311.
                </p>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload CVOR</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "cvor")}
                    style={styles.fileInput}
                  />
                  {cvor && <p style={styles.fileName}>Selected: {cvor.name}</p>}
                </div>
              </div>

              {/* Drivers Abstract Section (Optional) */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Add Driver's Abstract (Optional)</h2>
                <p style={styles.requirementText}>
                  Abstract requirements: Cannot be older than 30 days prior to today's date. Upload a file as a PDF or DOC.
                  <br />
                  Don't have a current driver abstract? You can order one here.
                </p>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Driver's Abstract</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, "driversAbstract")}
                    style={styles.fileInput}
                  />
                  {driversAbstract && (
                    <p style={styles.fileName}>Selected: {driversAbstract.name}</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div style={styles.errorMessage}>{submitError}</div>
              )}

              {/* Submit Button */}
              <div style={styles.buttonContainer}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={styles.backButton}
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    ...(!pceConsentForm ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                  }}
                  disabled={isSubmitting || !pceConsentForm}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    minHeight: "100vh",
    backgroundImage: `url('/fleet.avif')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(2px)",
    minHeight: "100vh",
    padding: "40px 20px",
    overflowY: "auto" as const,
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    color: "#fff",
  },
  title: {
    fontSize: "36px",
    fontWeight: 700,
    marginBottom: "8px",
    marginTop: 0,
    textAlign: "center" as const,
    textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
    letterSpacing: "-0.5px",
  },
  description: {
    fontSize: "17px",
    marginBottom: "32px",
    textAlign: "center" as const,
    color: "rgba(255, 255, 255, 0.8)",
    textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
    fontWeight: 400,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(12px)",
    padding: "28px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
    marginTop: 0,
    color: "#fff",
    letterSpacing: "-0.2px",
  },
  requirementText: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: "18px",
    lineHeight: "1.7",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "12px",
    marginTop: "12px",
    flexWrap: "wrap" as const,
  },
  formGroup: {
    flex: "1",
    minWidth: "250px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.9)",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
  },
  fileInput: {
    padding: "8px 10px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    cursor: "pointer",
  },
  fileName: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
    marginTop: "4px",
  },
  downloadButton: {
    padding: "10px 22px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background 0.2s ease",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
  },
  buttonContainer: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "16px",
  },
  backButton: {
    padding: "12px 28px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    transition: "all 0.2s ease",
    backdropFilter: "blur(8px)",
  },
  backToHomeButton: {
    position: "absolute" as const,
    top: "20px",
    left: "20px",
    padding: "8px 18px",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.3px",
    transition: "all 0.2s ease",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    backdropFilter: "blur(8px)",
  },
  submitButton: {
    padding: "12px 28px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    transition: "background 0.2s ease",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
  },
  successMessage: {
    backgroundColor: "rgba(5, 150, 105, 0.15)",
    backdropFilter: "blur(12px)",
    padding: "32px",
    borderRadius: "16px",
    textAlign: "center" as const,
    border: "1px solid rgba(5, 150, 105, 0.3)",
  },
  errorMessage: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    backdropFilter: "blur(8px)",
    padding: "14px 20px",
    borderRadius: "10px",
    color: "#fff",
    textAlign: "center" as const,
    border: "1px solid rgba(220, 38, 38, 0.3)",
    fontSize: "14px",
  },
};

export default FileDriverApplication;
