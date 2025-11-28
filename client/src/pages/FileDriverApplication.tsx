import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

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
  const [cvor, setCvor] = useState<File | null>(null);
  const [driversAbstract, setDriversAbstract] = useState<File | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    // Download the sample application PDF
    const link = document.createElement("a");
    link.href = "/forms/Sampleapplication.pdf";
    link.download = "Sampleapplication.pdf";
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

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });

      // Add files
      if (licenseFront) formDataToSend.append("licenseFront", licenseFront);
      if (licenseBack) formDataToSend.append("licenseBack", licenseBack);
      if (applicationForm) formDataToSend.append("applicationForm", applicationForm);
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
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      placeholder="Enter your phone number"
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
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      placeholder="Enter your SIN number"
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
                  <strong>ATTENTION:</strong> For Assistance in filling application, PLEASE CALL/TEXT +1 (519) 280-1311 OR EMAIL admin@premierchoicemployment.ca
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
                  style={styles.submitButton}
                  disabled={isSubmitting}
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    minHeight: "100vh",
    padding: "20px",
    overflowY: "auto" as const,
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    color: "#fff",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center" as const,
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
  },
  description: {
    fontSize: "1.2rem",
    marginBottom: "30px",
    textAlign: "center" as const,
    color: "#e5e7eb",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "30px",
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "25px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#fff",
  },
  requirementText: {
    fontSize: "0.9rem",
    color: "#e5e7eb",
    marginBottom: "20px",
    lineHeight: "1.6",
  },
  formRow: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    flexWrap: "wrap" as const,
  },
  formGroup: {
    flex: "1",
    minWidth: "250px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  label: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
  },
  input: {
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
  },
  select: {
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    outline: "none",
  },
  fileInput: {
    padding: "8px",
    fontSize: "0.9rem",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    cursor: "pointer",
  },
  fileName: {
    fontSize: "0.85rem",
    color: "#e5e7eb",
    fontStyle: "italic",
    marginTop: "5px",
  },
  downloadButton: {
    padding: "12px 24px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "background 0.3s ease",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginTop: "20px",
  },
  backButton: {
    padding: "14px 28px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    border: "2px solid #fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "all 0.3s ease",
  },
  submitButton: {
    padding: "14px 28px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "background 0.3s ease",
    boxShadow: "0px 4px 12px rgba(79, 70, 229, 0.4)",
  },
  successMessage: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center" as const,
    border: "2px solid rgba(34, 197, 94, 0.5)",
  },
  errorMessage: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: "15px",
    borderRadius: "6px",
    color: "#fff",
    textAlign: "center" as const,
    border: "1px solid rgba(239, 68, 68, 0.5)",
  },
};

export default FileDriverApplication;
