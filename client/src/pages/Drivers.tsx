import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrashAlt, FaClipboard } from "react-icons/fa";
import Navbar from "./Navbar";

const API_BASE_URL = "http://localhost:8000/api";


const Drivers: React.FC = () => {
  const navigate = useNavigate();

  const generateUsername = () => {
    return "driver" + Math.floor(Math.random() * 10000); // Example: driver1234
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8); // Example: "aB3dE9fG"
  };

  const [data, setData] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>({
    name: "",
    email: "",
    contact: "",
    address: "",
    hst_gst: "",
    business_name: "",
    rate: "",
    licence: "",
    licence_expiry_date: "",
    status: "Active",
    trainings: "",
    username: generateUsername(), // Auto-generated username
    password: generatePassword(), // Auto-generated password
  });



  
  const [editedDriver, setEditedDriver] = useState<any>(null);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      setData(response.data); // Set fetched data
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

    const createDriver = async (newDriver: any) => {
      try {
        // Step 1: Create the driver in the drivers table
        const response = await axios.post(`${API_BASE_URL}/driver`, newDriver);
    
        if (response.status === 201 || response.status === 200) {
          const { name, email, password } = newDriver;
    
          // Step 2: Create a user entry in the users table
          await axios.post(`${API_BASE_URL}/auth/register`, {
            name,
            email,
            password,  // Ensure password is stored securely (hashed in backend)
            role: "driver",  // Assign role as "driver"
          });
    
          fetchDrivers();
          setIsAddModalOpen(false);
        }
      } catch (error) {
        console.error("Error creating driver:", error);
      }
    };

    const updateDriver = async (updatedDriver: any) => {
      try {
        await axios.put(`${API_BASE_URL}/update/driver/${updatedDriver._id}`, updatedDriver);
        fetchDrivers(); // Refresh list
        setIsEditModalOpen(false);
      } catch (error) {
        console.error("Error updating driver:", error);
      }
    };

    const deleteDriver = async () => {
      try {
        await axios.delete(`${API_BASE_URL}/delete/driver/${selectedDriver._id}`);
        fetchDrivers(); // Refresh list
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error("Error deleting driver:", error);
      }
    };
  
    const columns: ColumnDef<typeof data[0]>[] = [
      {
        header: "S.No",
        cell: ({ row }) => row.index + 1,
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "hst_gst", header: "HST/GST" },
      { accessorKey: "business_name", header: "Business Name" },
      { accessorKey: "rate", header: "Rate" },
      { accessorKey: "licence", header: "Licence" },
      { accessorKey: "licence_expiry_date", header: "Licence Expiry Date" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "trainings", header: "Trainings" },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div style={styles.actionButtons}>
            <FaEdit
              style={styles.iconEdit}
              onClick={(e) => {
                e.stopPropagation(); // Prevents navigation from triggering
                handleEdit(row.original);
              }}
            />
            <FaTrashAlt
              style={styles.iconDelete}
              onClick={(e) => {
                e.stopPropagation(); // Prevents navigation from triggering
                handleDelete(row.original);
              }}
            />
          </div>
        ),
      },
    ];

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

  // Handlers for modals
  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setEditedDriver(driver); // Store the original driver data
    setIsEditModalOpen(true);
    setIsUpdateDisabled(true); // Disable update button initially
  };

  const handleCopyPassword = (password: string): void => {
    navigator.clipboard.writeText(password);
    alert("Password copied to clipboard!");
  };

  const handleDelete = (driver: any) => {
    console.log(driver);
    setSelectedDriver(driver);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setSelectedDriver((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  
    // Check if values changed & are not empty
    setIsUpdateDisabled(
      !value.trim() ||
      (editedDriver && editedDriver[field] === value.trim()) ||
      Object.keys(editedDriver).every(
        (key) => editedDriver[key] === selectedDriver[key]
      )
    );
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.headerWrapper}>
        <h1 style={styles.title}>All Drivers</h1>
        <p>Manage and view all drivers information here.</p>

        <button style={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
          + Add Driver
        </button>
      </div>


      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={styles.headerRow}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} style={styles.th}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} style={styles.row}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={styles.td} onClick={() => navigate(`/profile`, { state: { driver: row.original } })}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside modal
          >
            <h2 style={styles.modalTitle}>Add New Driver</h2>

            {/* Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                placeholder="Enter name"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, name: e.target.value })}
              />
            </div>

            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                placeholder="Enter email"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, email: e.target.value })}
              />
            </div>

            {/* Contact */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Contact:</label>
              <input
                type="text"
                placeholder="Enter contact number"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, contact: e.target.value })}
              />
            </div>

            {/* Address */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Address:</label>
              <input
                type="text"
                placeholder="Enter address"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, address: e.target.value })}
              />
            </div>

            {/* HST/GST */}
            <div style={styles.formGroup}>
              <label style={styles.label}>HST/GST:</label>
              <input
                type="text"
                placeholder="Enter HST/GST number"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, hst_gst: e.target.value })}
              />
            </div>

            {/* Business Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Name:</label>
              <input
                type="text"
                placeholder="Enter business name"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, business_name: e.target.value })}
              />
            </div>

            {/* Rate */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Rate:</label>
              <input
                type="number"
                placeholder="Enter rate"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, rate: e.target.value })}
              />
            </div>

            {/* Licence */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Licence:</label>
              <input
                type="text"
                placeholder="Enter licence number"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, licence: e.target.value })}
              />
            </div>

            {/* Licence Expiry Date */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Licence Expiry Date:</label>
              <input
                type="date"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, licence_expiry_date: e.target.value })}
              />
            </div>

            {/* Status (Dropdown) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Status:</label>
              <select
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Trainings */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Trainings:</label>
              <input
                type="text"
                placeholder="Enter trainings"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, trainings: e.target.value })}
              />
            </div>

            {/* Username */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Username:</label>
              <input
                type="text"
                value={selectedDriver.username}
                readOnly
                style={{ ...styles.input, backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Password:</label>
              <div style={styles.passwordInputContainer}>
                <input
                  type="text"
                  value={selectedDriver.password}
                  readOnly
                  style={styles.input}
                />
                <button 
                  style={styles.clipboardButton} 
                  onClick={() => handleCopyPassword(selectedDriver.password)}
                >
                  <FaClipboard />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div style={styles.buttonGroup}>
              <button
                style={styles.addButton}
                onClick={() => createDriver(selectedDriver)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = styles.addButtonHover.backgroundColor || "#c82333"; // Default fallback
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = styles.addButton.backgroundColor || "#dc3545"; // Default fallback
                }}
              >
                Add Driver
              </button>
              <button
                style={styles.closeButton}
                onClick={() => setIsAddModalOpen(false)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = styles.closeButtonHover.backgroundColor || "#c82333"; // Default fallback
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor || "#dc3545"; // Default fallback
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Edit Driver</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.name}
                style={styles.input}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                defaultValue={selectedDriver?.email}
                style={styles.input}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.contact}
                style={styles.input}
                onChange={(e) => handleInputChange("contact", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>HST/GST:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.hst_gst}
                style={styles.input}
                onChange={(e) => handleInputChange("hst_gst", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Business Name:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.business_name}
                style={styles.input}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Rate:</label>
              <input
                type="number"
                defaultValue={selectedDriver?.rate}
                style={styles.input}
                onChange={(e) => handleInputChange("rate", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Licence:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.licence}
                style={styles.input}
                onChange={(e) => handleInputChange("licence", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Licence Expiry Date:</label>
              <input
                type="date"
                defaultValue={selectedDriver?.licence_expiry_date ? 
                  new Date(selectedDriver.licence_expiry_date).toISOString().split('T')[0] : ""
                }
                style={styles.input}
                onChange={(e) => handleInputChange("licence_expiry_date", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status:</label>
              <select
                value={selectedDriver?.status || "Active"} // Default value is "Active"
                style={styles.input}
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Trainings:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.trainings}
                style={styles.input}
                onChange={(e) => handleInputChange("trainings", e.target.value)}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button style={styles.editButton} onClick={() => updateDriver(selectedDriver)}>
                Update
              </button>
              <button style={styles.closeButton} onClick={() => setIsEditModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Delete Driver</h2>
            <p>Are you sure you want to delete {selectedDriver?.name}?</p>

            <div style={styles.buttonGroup}>
              <button
                style={styles.deleteButton}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = styles.deleteButtonHover.backgroundColor || "#c82333"; // Default fallback
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = styles.deleteButton.backgroundColor || "#dc3545"; // Default fallback
                }}
                onClick={deleteDriver}
              >
                Yes, Delete
              </button>
              
              <button
                style={styles.closeButton}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = styles.closeButtonHover.backgroundColor || "#c82333"; // Default fallback
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor || "#dc3545"; // Default fallback
                }}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎨 Fixed Styles (Added closeButton & deleteButton)
import { CSSProperties } from "react";

const styles: { [key: string]: CSSProperties } = {
  modalOverlay: {
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    width: "550px", // Adjusted for better layout
    maxHeight: "85vh",
    overflowY: "auto",
    borderRadius: "10px",
    padding: "25px",
    paddingRight: "50px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Softer shadow
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.3s ease-in-out",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as "collapse",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  },
  th: {
    borderBottom: "2px solid black",
    padding: "12px",
    fontSize: "16px",
    textAlign: "left" as "left",
  },
  td: {
    borderBottom: "1px solid gray",
    padding: "12px",
    fontSize: "14px",
    textAlign: "left" as "left",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  iconEdit: {
    color: "#007bff",
    cursor: "pointer",
    fontSize: "18px",
  },
  iconDelete: {
    color: "#dc3545",
    cursor: "pointer",
    fontSize: "18px",
  },
  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold" },
  passwordInputContainer: { position: "relative", display: "flex", alignItems: "center" },

  clipboardButton: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#555",
  },
  input: { 
    flex: 1, 
    padding: "8px 35px 8px 10px", 
    border: "1px solid #ccc", 
    borderRadius: "5px", 
    backgroundColor: "#f5f5f5", 
    width: "100%",
  },
  headerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
    backgroundColor: "#f8f9fa", // Light gray background
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow for better visibility
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#333",
  },
  description: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "15px",
  },
  addButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s, transform 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  addButtonHover: {
    backgroundColor: "#218838",
    transform: "scale(1.05)", // Slight zoom effect on hover
  },
  editButton: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    transition: "background 0.3s",
  },
  closeButton: {
    backgroundColor: "#6c757d",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
    outline: "none",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
    outline: "none",
  },
  deleteButtonHover: {
    backgroundColor: "#c82333",
  },
  closeButtonHover: {
    backgroundColor: "#5a6268",
  },
};

export default Drivers;