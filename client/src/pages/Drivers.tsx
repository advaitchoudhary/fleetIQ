import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrashAlt } from "react-icons/fa"; // Import icons
import Navbar from "./Navbar";

const API_BASE_URL = "http://localhost:8000/api";


const Drivers: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [editedDriver, setEditedDriver] = useState<any>(null);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);

  // Fetch drivers on component mount
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
      await axios.post(`${API_BASE_URL}/driver`, newDriver);
      fetchDrivers(); // Refresh list
      setIsAddModalOpen(false);
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
      { accessorKey: "_id", header: "ID" },
      { accessorKey: "name", header: "Driver Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "address", header: "Address" },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div style={styles.actionButtons}>
            <FaEdit style={styles.iconEdit} onClick={() => handleEdit(row.original)} />
            <FaTrashAlt style={styles.iconDelete} onClick={() => handleDelete(row.original)} />
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
        <h1 style={styles.title}>Drivers Page</h1>
        <p>Manage and view driver information here.</p>

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
                  <td key={cell.id} style={styles.td}>
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
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Add New Driver</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                placeholder="Enter name"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, name: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                placeholder="Enter email"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, email: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address:</label>
              <input
                type="text"
                placeholder="Enter address"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, address: e.target.value })}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button style={styles.addButton} onClick={() => createDriver(selectedDriver)}>
                Add Driver
              </button>
              <button style={styles.closeButton} onClick={() => setIsAddModalOpen(false)}>
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
                placeholder="Enter name"
                defaultValue={selectedDriver?.name}
                style={styles.input}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                placeholder="Enter email"
                defaultValue={selectedDriver?.email}
                style={styles.input}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address:</label>
              <input
                type="text"
                placeholder="Enter address"
                defaultValue={selectedDriver?.address}
                style={styles.input}
                onChange={(e) => handleInputChange("address", e.target.value)}
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
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.deleteButtonHover.backgroundColor)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.deleteButton.backgroundColor)}
                onClick={deleteDriver}
              >
                Yes, Delete
              </button>
              
              <button
                style={styles.closeButton}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.closeButtonHover.backgroundColor)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor)}
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
const styles = {
  container: {
    backgroundColor: "#f4f4f4",
  },
  headerWrapper:{
    textAlign: "center" as const,
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
  },
  table: {
    width: "80%",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  },
  headerRow: {
    backgroundColor: "#f4f4f4",
  },
  th: {
    borderBottom: "2px solid black",
    padding: "12px",
    fontSize: "16px",
    textAlign: "left" as const,
  },
  td: {
    borderBottom: "1px solid gray",
    padding: "12px",
    fontSize: "14px",
    textAlign: "left" as const,
  },
  row: {
    backgroundColor: "white",
    transition: "background 0.3s",
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
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    marginBottom: "15px",
    textAlign: "left" as const,
    marginRight: "15px",

  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
    marginBottom: "10px", // Space between inputs
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "15px", // Equal spacing between buttons
    marginTop: "20px",
  },
  iconDelete: {
    color: "#dc3545",
    cursor: "pointer",
    fontSize: "18px",
  },
  modalOverlay: {
    position: "fixed" as const,
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
    padding: "25px",
    borderRadius: "10px",
    textAlign: "center" as const,
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    width: "40%", // Adjust modal width
    maxWidth: "500px",
  },
  addButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    transition: "background 0.3s",
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
    backgroundColor: "#6c757d", // Muted cancel button
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
    outline: "none", // ✅ Ensure no outline on focus
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none", // ✅ Remove the black border
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background 0.3s",
    outline: "none", // ✅ Ensure no outline on focus
  },
  addButtonHover: {
    backgroundColor: "#218838",
  },
  deleteButtonHover: {
    backgroundColor: "#c82333", // Darker red on hover
  },
  closeButtonHover: {
    backgroundColor: "#5a6268", // Darker gray on hover
  },
};

export default Drivers;