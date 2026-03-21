import React, { useEffect, useState, useMemo } from "react";
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
import { API_BASE_URL } from "../utils/env";

const DEMO_DRIVERS = [
  { _id: "demo-d1", name: "Marcus Webb", email: "m.webb@fleetmail.ca", contact: "647-555-0191", address: "412 Lakeshore Blvd W, Toronto, ON M5V 1A3", hst_gst: "873456789RT0001", business_name: "Webb Transport Inc.", status: "Active", username: "mwebb", licence: "AZ", licence_expiry_date: "2028-03-14", backhaulRate: 220, comboRate: 270, regularBannerRate: 240, wholesaleRate: 210, voilaRate: 250, tcsLinehaulTrentonRate: 300, trainings: "WHMIS, TDG, Forklift", workStatus: "Full-time", sinNo: "***-**-1234" },
  { _id: "demo-d2", name: "Priya Sehgal", email: "p.sehgal@fleetmail.ca", contact: "905-555-0238", address: "88 Queensway E, Mississauga, ON L5A 1S3", hst_gst: "", business_name: "", status: "Active", username: "psehgal", licence: "DZ", licence_expiry_date: "2027-09-30", backhaulRate: 190, comboRate: 230, regularBannerRate: 205, wholesaleRate: 180, voilaRate: 215, tcsLinehaulTrentonRate: 260, trainings: "WHMIS, Smart Serve", workStatus: "Part-time", sinNo: "***-**-5678" },
  { _id: "demo-d3", name: "Tyler Osei", email: "t.osei@fleetmail.ca", contact: "416-555-0347", address: "2201 Eglinton Ave E, Scarborough, ON M1L 2M3", hst_gst: "902345678RT0001", business_name: "Osei Logistics", status: "Active", username: "tosei", licence: "AZ", licence_expiry_date: "2029-01-22", backhaulRate: 230, comboRate: 285, regularBannerRate: 250, wholesaleRate: 220, voilaRate: 260, tcsLinehaulTrentonRate: 315, trainings: "WHMIS, TDG, Air Brake", workStatus: "Full-time", sinNo: "***-**-9012" },
  { _id: "demo-d4", name: "Fatima Al-Rashid", email: "f.alrashid@fleetmail.ca", contact: "289-555-0154", address: "550 Bronte Rd, Oakville, ON L6L 6L1", hst_gst: "", business_name: "", status: "Inactive", username: "falrashid", licence: "G", licence_expiry_date: "2026-06-18", backhaulRate: 160, comboRate: 195, regularBannerRate: 175, wholesaleRate: 155, voilaRate: 180, tcsLinehaulTrentonRate: 220, trainings: "WHMIS", workStatus: "Seasonal", sinNo: "***-**-3456" },
  { _id: "demo-d5", name: "James Kowalski", email: "j.kowalski@fleetmail.ca", contact: "519-555-0267", address: "1040 Dundas St E, London, ON N5W 3A8", hst_gst: "834567890RT0001", business_name: "JK Freight Solutions", status: "Active", username: "jkowalski", licence: "AZ", licence_expiry_date: "2027-11-05", backhaulRate: 215, comboRate: 265, regularBannerRate: 235, wholesaleRate: 205, voilaRate: 245, tcsLinehaulTrentonRate: 290, trainings: "WHMIS, TDG, Forklift, Air Brake", workStatus: "Full-time", sinNo: "***-**-7890" },
];

const Drivers: React.FC = () => {
  const navigate = useNavigate();


  const generatePassword = () => {
    return Math.random().toString(36).slice(-8); // Example: "aB3dE9fG"
  };

  const [data, setData] = useState<any[]>([]);
  const [usernameError, setUsernameError] = useState("");
  const checkUsernameExists = async (username: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers/check?username=${username}`);
      if (response.data.exists) {
        setUsernameError("Username already exists.");
      } else {
        setUsernameError("");
      }
    } catch (err) {
      console.error("Failed to check username:", err);
    }
  };
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
    backhaulRate: "",
    comboRate: "",
    extraSheetEWRate: "",
    regularBannerRate: "",
    wholesaleRate: "",
    voilaRate: "",
    tcsLinehaulTrentonRate: "",
    licence: "",
    licence_expiry_date: "",
    status: "Active",
    trainings: "",
    username: "",
    password: generatePassword(),
    sinNo: "",
    workStatus: ""
  });

  const [editedDriver, setEditedDriver] = useState<any>(null);
  const [, setIsUpdateDisabled] = useState(true);
  const [, setLoading] = useState(false);
  const [, setError] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest" | "none">("none");
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [isApplicationsButtonHovered, setIsApplicationsButtonHovered] = useState(false);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchDrivers();
    fetchPendingApplicationsCount();
  }, []);

  // Fetch pending applications count
  const fetchPendingApplicationsCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/driver-applications?status=Pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPendingApplicationsCount(response.data.length);
    } catch (err) {
      console.error("Failed to fetch pending applications count:", err);
    }
  };
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/drivers`);
        const drivers = response.data;
        setData(drivers.length > 0 ? drivers : DEMO_DRIVERS);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setData(DEMO_DRIVERS);
        setLoading(false);
      }
    };



    const createDriver = async (newDriver: any) => {
    try {
      // Step 1: Create the driver in the drivers table
      const response = await axios.post(`${API_BASE_URL}/drivers`, newDriver);
    
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
      console.log(updatedDriver);
    try {
      await axios.put(`${API_BASE_URL}/drivers/${updatedDriver._id}`, updatedDriver);

        fetchDrivers(); // Refresh list
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating driver:", error);
    }
  };

  const deleteDriver = async () => {
    try {
      // await axios.delete(`${API_BASE_URL}/delete/drivers/${selectedDriver._id}`);
      await axios.delete(`${API_BASE_URL}/drivers/${selectedDriver._id}`);

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
      { accessorKey: "status", header: "Status" },
      { 
        accessorKey: "hoursThisWeek", 
        header: "Hours This Week",
        cell: ({ row }) => {
          const hours = row.original.hoursThisWeek || 0;
          return hours.toFixed(2);
        }
      },
      { accessorKey: "workStatus", header: "Work Status" },
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

  // Filtering and sorting logic for search and hours sort
  const filteredData = useMemo(() => {
    let result = data.filter((driver) =>
      driver.name.toLowerCase().includes(searchText.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchText.toLowerCase()) ||
      driver.contact.toLowerCase().includes(searchText.toLowerCase())
    );

    if (sortOrder !== "none") {
      result = [...result].sort((a, b) => {
        const hoursA = parseFloat(a.hoursThisWeek || "0");
        const hoursB = parseFloat(b.hoursThisWeek || "0");
        return sortOrder === "highest" ? hoursB - hoursA : hoursA - hoursB;
      });
    }

    return result;
  }, [data, searchText, sortOrder]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handlers for modals
  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setEditedDriver(driver); // Store the original driver data
    setIsEditModalOpen(true);
    setIsUpdateDisabled(true); // Disable update button initially
    setUsernameError(""); // Clear any previous username errors
  };

  const handleCopyPassword = (password: string): void => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(password)
        .then(() => alert("Password copied to clipboard!"))
        .catch((err) => {
          console.error("Clipboard write failed:", err);
          fallbackCopy(password);
        });
    } else {
      fallbackCopy(password);
    }
  };
  
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";  // Avoid scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      alert(successful ? "Password copied to clipboard!" : "Failed to copy password.");
    } catch (err) {
      console.error("Fallback copy failed:", err);
      alert("Copy not supported.");
    }
    document.body.removeChild(textarea);
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

  const handleUsernameChangeEdit = (value: string) => {
    setSelectedDriver((prev: any) => ({
      ...prev,
      username: value,
    }));

    // If username is the same as original, clear error
    if (editedDriver && editedDriver.username === value.trim()) {
      setUsernameError("");
    } else if (value.trim()) {
      // Only check if username has changed and is not empty
      checkUsernameExists(value.trim());
    } else {
      setUsernameError("");
    }
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={styles.container}>
      <h1 style={styles.pageTitle}>All Drivers</h1>
        {/* Modern Header/Filter Bar */}
        <div style={styles.headerWrapper}>
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "highest" | "lowest" | "none")}
                style={styles.filterDropdown}
              >
                <option value="none">Sort by Hours</option>
                <option value="highest">Highest Hours</option>
                <option value="lowest">Lowest Hours</option>
              </select>
              <button 
                style={{
                  ...styles.driverApplicationsButton,
                  backgroundColor: isApplicationsButtonHovered ? "#218838" : "#28a745",
                }}
                onClick={() => navigate("/driver-applications")}
                onMouseEnter={() => setIsApplicationsButtonHovered(true)}
                onMouseLeave={() => setIsApplicationsButtonHovered(false)}
              >
                Driver Applications
                {pendingApplicationsCount > 0 && (
                  <span style={styles.notificationBadge}>{pendingApplicationsCount}</span>
                )}
              </button>
              <button style={styles.addDriverButton} onClick={() => setIsAddModalOpen(true)}>
                + Add Driver
              </button>
            </div>
          </div>
        </div>

        {/* Modern Table Layout */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} style={styles.th}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                    No matching drivers found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={styles.td}
                        onClick={() => navigate(`/profile`, { state: { driver: row.original } })}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
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

            {/* Backhaul Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Backhaul Rate:</label>
                <input
                    type="number"
                    placeholder="Enter backhaul rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, backhaulRate: e.target.value })}
                />
            </div>

            {/* Combo Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Combo Rate:</label>
                <input
                    type="number"
                    placeholder="Enter combo rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, comboRate: e.target.value })}
                />
            </div>

            {/* Extra Sheet/E.W Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Extra Sheet/E.W Rate:</label>
                <input
                    type="number"
                    placeholder="Enter extra sheet/E.W rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, extraSheetEWRate: e.target.value })}
                />
            </div>

            {/* Regular/Banner Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Regular/Banner Rate:</label>
                <input
                    type="number"
                    placeholder="Enter regular/banner rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, regularBannerRate: e.target.value })}
                />
            </div>

            {/* Wholesale Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Wholesale Rate:</label>
                <input
                    type="number"
                    placeholder="Enter wholesale rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, wholesaleRate: e.target.value })}
                />
            </div>

            {/* Voila Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Voila Rate:</label>
                <input
                    type="number"
                    placeholder="Enter voila rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, voilaRate: e.target.value })}
                />
            </div>

            {/* TCS Linehaul Trenton Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>TCS Linehaul Trenton Rate:</label>
                <input
                    type="number"
                    placeholder="Enter TCS linehaul trenton rate"
                    style={styles.input}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, tcsLinehaulTrentonRate: e.target.value })}
                />
            </div>

            {/* Sin No. */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Sin No.:</label>
              <input
                type="text"
                placeholder="Enter SIN Number"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, sinNo: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Work Status:</label>
              <input
                type="text"
                placeholder="Enter work status"
                style={styles.input}
                onChange={(e) => setSelectedDriver({ ...selectedDriver, workStatus: e.target.value })}
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
                placeholder="Enter username"
                value={selectedDriver.username}
                style={styles.input}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDriver({ ...selectedDriver, username: value });
                  checkUsernameExists(value.trim());
                }}
              />
              {usernameError && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {usernameError}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Password:</label>
              <div style={styles.passwordInputContainer}>
                <input
                  type="text"
                  value={selectedDriver.password}
                  placeholder="Enter password"
                  style={styles.input}
                  onChange={(e) => setSelectedDriver({ ...selectedDriver, password: e.target.value })}
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
                onClick={() => {
                  if (usernameError) {
                    alert("Please resolve username error before submitting.");
                    return;
                  }
                  if (!selectedDriver.sinNo?.trim()) {
                    alert("Sin No. is required.");
                    return;
                  }
                  createDriver(selectedDriver);
                }}
              >
                Add Driver
              </button>
              <button
                style={styles.closeButton}
                onClick={() => setIsAddModalOpen(false)}
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
              <label style={styles.label}>Username:</label>
              <input
                type="text"
                placeholder="Enter username"
                defaultValue={selectedDriver?.username}
                style={styles.input}
                onChange={(e) => handleUsernameChangeEdit(e.target.value)}
              />
              {usernameError && (
                <div style={{ color: "red", fontSize: "0.85rem", marginTop: "4px" }}>
                  {usernameError}
                </div>
              )}
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

            {/* Sin No. */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Sin No.:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.sinNo}
                style={styles.input}
                onChange={(e) => handleInputChange("sinNo", e.target.value)}
              />
            </div>

            {/* Backhaul Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Backhaul Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.backhaulRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("backhaulRate", e.target.value)}
                />
            </div>

            {/* Combo Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Combo Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.comboRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("comboRate", e.target.value)}
                />
            </div>

            {/* Extra Sheet/E.W Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Extra Sheet/E.W Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.extraSheetEWRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("extraSheetEWRate", e.target.value)}
                />
            </div>

            {/* Regular/Banner Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Regular/Banner Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.regularBannerRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("regularBannerRate", e.target.value)}
                />
            </div>

            {/* Wholesale Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Wholesale Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.wholesaleRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("wholesaleRate", e.target.value)}
                />
            </div>

            {/* Voila Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Voila Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.voilaRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("voilaRate", e.target.value)}
                />
            </div>

            {/* TCS Linehaul Trenton Rate */}
            <div style={styles.formGroup}>
                <label style={styles.label}>TCS Linehaul Trenton Rate:</label>
                <input
                    type="number"
                    defaultValue={selectedDriver?.tcsLinehaulTrentonRate}
                    style={styles.input}
                    onChange={(e) => handleInputChange("tcsLinehaulTrentonRate", e.target.value)}
                />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Work Status:</label>
              <input
                type="text"
                defaultValue={selectedDriver?.workStatus}
                style={styles.input}
                onChange={(e) => handleInputChange("workStatus", e.target.value)}
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

            <div style={styles.buttonGroup}>
              <button
                style={styles.editButton}
                onClick={() => {
                  if (usernameError) {
                    alert("Please resolve username error before submitting.");
                    return;
                  }
                  if (!selectedDriver.sinNo?.trim()) {
                    alert("Sin No. is required.");
                    return;
                  }
                  updateDriver(selectedDriver);
                }}
              >
                Update
              </button>
              <button 
                style={styles.closeButton} 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setUsernameError("");
                }}
              >
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
                onClick={deleteDriver}
              >
                Yes, Delete
              </button>
              
              <button
                style={styles.closeButton}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>

  );
};

import { CSSProperties } from "react";

const styles: { [key: string]: CSSProperties } = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "24px",
  },
  headerWrapper: {
    marginBottom: "20px",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    gap: "16px",
    marginBottom: "16px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#9ca3af",
    pointerEvents: "none",
  },
  searchInput: {
    padding: "8px 14px 8px 32px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#374151",
    width: "220px",
    outline: "none",
  },
  filterDropdown: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#374151",
    cursor: "pointer",
    outline: "none",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: 600,
    textAlign: "left",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    borderBottom: "1px solid #e5e7eb",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap" as const,
  },
  td: {
    borderBottom: "1px solid #f3f4f6",
    padding: "14px 18px",
    fontSize: "14px",
    textAlign: "left",
    color: "#374151",
    cursor: "pointer",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  iconEdit: {
    color: "#4F46E5",
    cursor: "pointer",
    fontSize: "15px",
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "#eef2ff",
  },
  iconDelete: {
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "15px",
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "#fef2f2",
  },
  addDriverButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    fontSize: "13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  driverApplicationsButton: {
    backgroundColor: "#059669",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    fontSize: "13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "background-color 0.2s ease",
    whiteSpace: "nowrap" as const,
  },
  notificationBadge: {
    backgroundColor: "#dc2626",
    color: "#fff",
    borderRadius: "50%",
    minWidth: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    position: "absolute",
    top: "-8px",
    right: "-8px",
    padding: "0 5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.16)",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#111827",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#6b7280",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #f3f4f6",
  },
  addButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  editButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    fontWeight: 600,
  },
  closeButton: {
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    fontWeight: 600,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
  },
  passwordInputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  clipboardButton: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6b7280",
  },
};

export default Drivers;