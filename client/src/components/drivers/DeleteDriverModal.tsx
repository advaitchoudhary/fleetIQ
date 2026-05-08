import React from "react";
import { CSSProperties } from "react";

interface Props {
  isOpen: boolean;
  driverName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteDriverModal: React.FC<Props> = ({ isOpen, driverName, onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Delete Driver</h2>
        <p>Are you sure you want to delete {driverName}?</p>

        <div style={styles.buttonGroup}>
          <button style={styles.deleteButton} onClick={onConfirm}>
            Yes, Delete
          </button>
          <button style={styles.closeButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "var(--t-modal-overlay)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "var(--t-surface)",
    padding: "28px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "var(--t-shadow-lg)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "var(--t-text)",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid var(--t-border)",
  },
  deleteButton: {
    backgroundColor: "var(--t-error)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
  },
  closeButton: {
    backgroundColor: "var(--t-surface)",
    color: "var(--t-text-secondary)",
    border: "1px solid var(--t-border-strong)",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    fontWeight: 600,
  },
};

export default DeleteDriverModal;
