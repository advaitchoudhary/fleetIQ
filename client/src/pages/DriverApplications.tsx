import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL, FILE_BASE_URL } from "../utils/env";
import { FaCheck, FaTimes, FaEye, FaClipboardList } from "react-icons/fa";

interface DriverApplication {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  sinNo: string;
  licenseClass: string;
  licenseExpiryDate: string;
  licenseFront: string;
  licenseBack: string;
  applicationForm: string;
  truckingExperienceYears: number;
  truckingExperienceMonths: number;
  pceConsentForm?: string;
  cvor?: string;
  driversAbstract?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNotes?: string;
  preferredStartLocation?: string;
  createdAt: string;
  updatedAt: string;
}

const DriverApplications: React.FC = () => {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [approvalResult, setApprovalResult] = useState<{ username: string; password: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/driver-applications${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      alert("Failed to fetch applications");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/driver-applications/${selectedApplication._id}/approve`,
        { adminNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.driver) {
        setApprovalResult({
          username: response.data.driver.username,
          password: response.data.driver.password,
        });
      }

      setIsActionModalOpen(false);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error approving application:", error);
      alert(error.response?.data?.message || "Failed to approve application");
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!adminNotes.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/driver-applications/${selectedApplication._id}/reject`,
        { adminNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsActionModalOpen(false);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      alert(error.response?.data?.message || "Failed to reject application");
    }
  };

  const openActionModal = (application: DriverApplication, type: "approve" | "reject") => {
    setSelectedApplication(application);
    setActionType(type);
    setAdminNotes("");
    setApprovalResult(null);
    setIsActionModalOpen(true);
  };

  const openViewModal = (application: DriverApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#f59e0b";
      case "Approved":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return "";
    // If file path starts with uploads/, make it accessible via the static file server
    if (filePath.startsWith("uploads/")) {
      return `${FILE_BASE_URL}/${filePath}`;
    }
    return filePath;
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0d1117", minHeight: "100vh" }}>
      <Navbar />
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <FaClipboardList size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Drivers</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Driver Applications</h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Review and manage incoming driver applications</p>
          </div>
        </div>
      </div>
      <div style={styles.container}>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Applications</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Applications Table */}
        {loading ? (
          <p style={styles.loading}>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p style={styles.noData}>No applications found</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>License Class</th>
                  <th style={styles.th}>Experience</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application._id} style={styles.tr}>
                    <td style={styles.td}>{application.name}</td>
                    <td style={styles.td}>{application.email}</td>
                    <td style={styles.td}>{application.phone}</td>
                    <td style={styles.td}>{application.licenseClass}</td>
                    <td style={styles.td}>
                      {application.truckingExperienceYears}y {application.truckingExperienceMonths}m
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(application.status),
                        }}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(application.createdAt)}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => openViewModal(application)}
                          style={{ ...styles.actionButton, ...styles.viewButton }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {application.status === "Pending" && (
                          <>
                            <button
                              onClick={() => openActionModal(application, "approve")}
                              style={{ ...styles.actionButton, ...styles.approveButton }}
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => openActionModal(application, "reject")}
                              style={{ ...styles.actionButton, ...styles.rejectButton }}
                              title="Reject"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedApplication && (
          <div style={styles.modalOverlay} onClick={() => setIsViewModalOpen(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>Application Details</h2>
                  <p style={styles.modalSubtitle}>{selectedApplication.name} — {formatDate(selectedApplication.createdAt)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(selectedApplication.status) }}>
                    {selectedApplication.status}
                  </span>
                  <button style={styles.closeButton} onClick={() => setIsViewModalOpen(false)}>×</button>
                </div>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Personal Information</h3>
                  <div style={styles.fieldGrid}>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Name</span>
                      <span style={styles.fieldValue}>{selectedApplication.name}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Email</span>
                      <span style={styles.fieldValue}>{selectedApplication.email}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Phone</span>
                      <span style={styles.fieldValue}>{selectedApplication.phone}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Address</span>
                      <span style={styles.fieldValue}>{selectedApplication.address}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>SIN Number</span>
                      <span style={styles.fieldValue}>{selectedApplication.sinNo}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>License & Experience</h3>
                  <div style={styles.fieldGrid}>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>License Class</span>
                      <span style={styles.fieldValue}>{selectedApplication.licenseClass}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Expiry Date</span>
                      <span style={styles.fieldValue}>{formatDate(selectedApplication.licenseExpiryDate)}</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Experience</span>
                      <span style={styles.fieldValue}>{selectedApplication.truckingExperienceYears}y {selectedApplication.truckingExperienceMonths}m</span>
                    </div>
                    {selectedApplication.preferredStartLocation && (
                      <div style={styles.fieldItem}>
                        <span style={styles.fieldLabel}>Preferred Location</span>
                        <span style={styles.fieldValue}>{selectedApplication.preferredStartLocation}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.fileLinkRow}>
                    <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.licenseFront), title: "License Front" }); }} style={styles.fileLinkButton}>
                      📄 License Front
                    </button>
                    <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.licenseBack), title: "License Back" }); }} style={styles.fileLinkButton}>
                      📄 License Back
                    </button>
                  </div>
                </div>

                <div style={styles.detailCard}>
                  <h3 style={styles.detailCardTitle}>Documents</h3>
                  <div style={styles.fileLinkRow}>
                    <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.applicationForm), title: "Application Form" }); }} style={styles.fileLinkButton}>
                      📄 Application Form
                    </button>
                    {selectedApplication.pceConsentForm && (
                      <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.pceConsentForm!), title: "PCE Consent Form" }); }} style={styles.fileLinkButton}>
                        📄 PCE Consent Form
                      </button>
                    )}
                    {selectedApplication.cvor && (
                      <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.cvor!), title: "CVOR" }); }} style={styles.fileLinkButton}>
                        📄 CVOR
                      </button>
                    )}
                    {selectedApplication.driversAbstract && (
                      <button onClick={() => { setPreviewError(false); setPreviewFile({ url: getFileUrl(selectedApplication.driversAbstract!), title: "Driver's Abstract" }); }} style={styles.fileLinkButton}>
                        📄 Driver's Abstract
                      </button>
                    )}
                  </div>
                </div>

                {selectedApplication.adminNotes && (
                  <div style={styles.detailCard}>
                    <h3 style={styles.detailCardTitle}>Admin Notes</h3>
                    <p style={styles.notesText}>{selectedApplication.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Modal (Approve/Reject) */}
        {isActionModalOpen && selectedApplication && (
          <div style={styles.modalOverlay} onClick={() => setIsActionModalOpen(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2>{actionType === "approve" ? "Approve Application" : "Reject Application"}</h2>
                <button style={styles.closeButton} onClick={() => setIsActionModalOpen(false)}>
                  ×
                </button>
              </div>
              <div style={styles.modalBody}>
                {approvalResult ? (
                  <div style={styles.approvalResult}>
                    <h3 style={{ color: "#34d399" }}>✅ Application Approved!</h3>
                    <p style={{ color: "#d1d5db" }}>Driver account has been created with the following credentials:</p>
                    <div style={styles.credentials}>
                      <div>
                        <strong>Username:</strong> {approvalResult.username}
                      </div>
                      <div>
                        <strong>Password:</strong> {approvalResult.password}
                      </div>
                    </div>
                    <p style={styles.warning}>
                      ⚠️ Please share these credentials with the driver. They can change their password after
                      logging in.
                    </p>
                    <button
                      style={styles.confirmButton}
                      onClick={() => {
                        setIsActionModalOpen(false);
                        setApprovalResult(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ color: "#d1d5db" }}>
                      <strong style={{ color: "#e5e7eb" }}>Applicant:</strong> {selectedApplication.name} ({selectedApplication.email})
                    </p>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        Admin Notes {actionType === "reject" ? "(required)" : "(optional)"}
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        style={styles.textarea}
                        placeholder={
                          actionType === "approve"
                            ? "Add any notes about this approval..."
                            : "Please provide a reason for rejection..."
                        }
                        required={actionType === "reject"}
                      />
                    </div>
                    <div style={styles.modalActions}>
                      <button
                        style={styles.cancelButton}
                        onClick={() => setIsActionModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        style={
                          actionType === "approve"
                            ? styles.approveModalButton
                            : styles.rejectModalButton
                        }
                        onClick={actionType === "approve" ? handleApprove : handleReject}
                      >
                        {actionType === "approve" ? "Approve" : "Reject"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* File Preview Modal */}
        {previewFile && (
          <div style={styles.previewOverlay} onClick={() => setPreviewFile(null)}>
            <div style={styles.previewContainer} onClick={(e) => e.stopPropagation()}>
              <div style={styles.previewHeader}>
                <h2 style={styles.previewTitle}>{previewFile.title}</h2>
                <button style={styles.closeButton} onClick={() => setPreviewFile(null)}>
                  ×
                </button>
              </div>
              <div style={styles.previewBody}>
                {previewError ? (
                  <div style={styles.previewErrorContainer}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "#e5e7eb", marginBottom: "8px" }}>
                      Unable to load file
                    </p>
                    <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>
                      The file could not be found or is unavailable.
                    </p>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.downloadLink}
                    >
                      Try opening in new tab ↗
                    </a>
                  </div>
                ) : previewFile.url.match(/\.(pdf)$/i) ? (
                  <iframe
                    src={previewFile.url}
                    style={styles.previewIframe}
                    title={previewFile.title}
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <img
                    src={previewFile.url}
                    alt={previewFile.title}
                    style={styles.previewImage}
                    onError={() => setPreviewError(true)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "28px 40px",
  },
  filterBar: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "flex-end",
  },
  filterSelect: {
    padding: "8px 14px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "#1c2128",
    color: "#d1d5db",
    cursor: "pointer",
    fontWeight: 500,
    outline: "none",
  },
  loading: {
    textAlign: "center",
    padding: "60px 40px",
    color: "#9ca3af",
    fontSize: "15px",
  },
  noData: {
    textAlign: "center",
    padding: "60px 40px",
    color: "#9ca3af",
    fontSize: "15px",
  },
  tableWrapper: {
    backgroundColor: "#161b22",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "left",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "#818CF8",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    whiteSpace: "nowrap" as const,
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background-color 0.15s",
  },
  td: {
    padding: "14px 18px",
    fontSize: "14px",
    color: "#d1d5db",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
    letterSpacing: "0.3px",
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
  },
  actionButton: {
    padding: "7px 10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  },
  viewButton: {
    backgroundColor: "rgba(79,70,229,0.12)",
    color: "#818CF8",
  },
  approveButton: {
    backgroundColor: "rgba(16,185,129,0.12)",
    color: "#34d399",
  },
  rejectButton: {
    backgroundColor: "rgba(239,68,68,0.1)",
    color: "#fca5a5",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    backdropFilter: "blur(4px)",
  },
  modalContent: {
    backgroundColor: "#161b22",
    borderRadius: "16px",
    maxWidth: "720px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#f3f4f6",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "4px 0 0 0",
  },
  closeButton: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "20px",
    cursor: "pointer",
    color: "#9ca3af",
    padding: 0,
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "color 0.2s",
    flexShrink: 0,
  },
  modalBody: {
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  detailCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  detailCardTitle: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#4b5563",
    margin: "0 0 16px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  fieldItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  fieldLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  fieldValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#e5e7eb",
  },
  fileLinkRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  fileLinkButton: {
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#818CF8",
    backgroundColor: "rgba(79,70,229,0.1)",
    border: "1px solid rgba(79,70,229,0.2)",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background-color 0.2s",
  },
  notesText: {
    fontSize: "14px",
    color: "#d1d5db",
    lineHeight: 1.7,
    margin: 0,
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#e5e7eb",
    minHeight: "100px",
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  cancelButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  approveModalButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  rejectModalButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  confirmButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4F46E5",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  approvalResult: {
    textAlign: "center",
  },
  credentials: {
    backgroundColor: "rgba(16,185,129,0.08)",
    padding: "16px 20px",
    borderRadius: "10px",
    margin: "16px 0",
    fontSize: "14px",
    color: "#d1d5db",
    border: "1px solid rgba(16,185,129,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  warning: {
    color: "#fbbf24",
    fontSize: "13px",
    marginTop: "16px",
    backgroundColor: "rgba(234,179,8,0.08)",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(234,179,8,0.2)",
  },
  previewOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
    backdropFilter: "blur(4px)",
  },
  previewContainer: {
    backgroundColor: "#161b22",
    borderRadius: "16px",
    maxWidth: "90vw",
    maxHeight: "90vh",
    width: "auto",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    flexShrink: 0,
  },
  previewTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#f3f4f6",
    margin: 0,
  },
  previewBody: {
    padding: "16px",
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: "calc(90vh - 70px)",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "calc(90vh - 110px)",
    objectFit: "contain" as const,
    borderRadius: "4px",
  },
  previewIframe: {
    width: "80vw",
    height: "calc(90vh - 110px)",
    border: "none",
    borderRadius: "4px",
  },
  previewErrorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 40px",
    textAlign: "center",
  },
  downloadLink: {
    color: "#818CF8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 16px",
    backgroundColor: "rgba(79,70,229,0.12)",
    borderRadius: "8px",
  },
};

export default DriverApplications;



