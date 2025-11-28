import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

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
    // If file path starts with uploads/, make it accessible via the API
    if (filePath.startsWith("uploads/")) {
      return `${API_BASE_URL.replace("/api", "")}/${filePath}`;
    }
    return filePath;
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.title}>Driver Applications</h1>

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
                <h2>Application Details</h2>
                <button style={styles.closeButton} onClick={() => setIsViewModalOpen(false)}>
                  ×
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.detailSection}>
                  <h3>Personal Information</h3>
                  <div style={styles.detailRow}>
                    <strong>Name:</strong> {selectedApplication.name}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Email:</strong> {selectedApplication.email}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Phone:</strong> {selectedApplication.phone}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Address:</strong> {selectedApplication.address}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>SIN Number:</strong> {selectedApplication.sinNo}
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <h3>License Information</h3>
                  <div style={styles.detailRow}>
                    <strong>License Class:</strong> {selectedApplication.licenseClass}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Expiry Date:</strong> {formatDate(selectedApplication.licenseExpiryDate)}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Experience:</strong> {selectedApplication.truckingExperienceYears} years,{" "}
                    {selectedApplication.truckingExperienceMonths} months
                  </div>
                  {selectedApplication.preferredStartLocation && (
                    <div style={styles.detailRow}>
                      <strong>Preferred Start Location:</strong> {selectedApplication.preferredStartLocation}
                    </div>
                  )}
                  <div style={styles.fileLinks}>
                    <a
                      href={getFileUrl(selectedApplication.licenseFront)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      View License Front
                    </a>
                    <a
                      href={getFileUrl(selectedApplication.licenseBack)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      View License Back
                    </a>
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <h3>Documents</h3>
                  <div style={styles.fileLinks}>
                    <a
                      href={getFileUrl(selectedApplication.applicationForm)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.fileLink}
                    >
                      View Application Form
                    </a>
                    {selectedApplication.cvor && (
                      <a
                        href={getFileUrl(selectedApplication.cvor)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.fileLink}
                      >
                        View CVOR
                      </a>
                    )}
                    {selectedApplication.driversAbstract && (
                      <a
                        href={getFileUrl(selectedApplication.driversAbstract)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.fileLink}
                      >
                        View Driver's Abstract
                      </a>
                    )}
                  </div>
                </div>

                {selectedApplication.adminNotes && (
                  <div style={styles.detailSection}>
                    <h3>Admin Notes</h3>
                    <div style={styles.detailRow}>{selectedApplication.adminNotes}</div>
                  </div>
                )}

                <div style={styles.detailSection}>
                  <div style={styles.detailRow}>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(selectedApplication.status),
                      }}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Submitted:</strong> {formatDate(selectedApplication.createdAt)}
                  </div>
                </div>
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
                    <h3 style={{ color: "#10b981" }}>✅ Application Approved!</h3>
                    <p>Driver account has been created with the following credentials:</p>
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
                    <p>
                      <strong>Applicant:</strong> {selectedApplication.name} ({selectedApplication.email})
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
                          actionType === "approve" ? styles.approveButton : styles.rejectButton
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
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "40px 20px",
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "20px",
  },
  filterBar: {
    marginBottom: "20px",
  },
  filterSelect: {
    padding: "10px 15px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  noData: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
    color: "#374151",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  viewButton: {
    backgroundColor: "#3b82f6",
    color: "#fff",
  },
  approveButton: {
    backgroundColor: "#10b981",
    color: "#fff",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    maxWidth: "700px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    color: "#6b7280",
    padding: 0,
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: "24px",
  },
  detailSection: {
    marginBottom: "24px",
  },
  detailRow: {
    marginBottom: "12px",
    fontSize: "14px",
    color: "#374151",
    lineHeight: "1.6",
  },
  fileLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "12px",
  },
  fileLink: {
    color: "#3b82f6",
    textDecoration: "underline",
    fontSize: "14px",
    cursor: "pointer",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    minHeight: "100px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  cancelButton: {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    backgroundColor: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  confirmButton: {
    padding: "10px 20px",
    borderRadius: "6px",
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
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "8px",
    margin: "16px 0",
    fontSize: "14px",
  },
  warning: {
    color: "#f59e0b",
    fontSize: "13px",
    marginTop: "16px",
  },
};

export default DriverApplications;



