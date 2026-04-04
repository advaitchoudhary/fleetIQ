import React, { useEffect, useState, useMemo } from "react";
import ExcelJS from "exceljs";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrashAlt, FaClipboard, FaCalendarAlt } from "react-icons/fa";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format, parseISO } from "date-fns";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";


const WORK_AUTH_OPTIONS = [
  { value: "Canadian Citizen",                       hasExpiry: false },
  { value: "Permanent Resident",                     hasExpiry: false },
  { value: "Work Permit",                            hasExpiry: true  },
  { value: "Open Work Permit",                       hasExpiry: true  },
  { value: "Post-Graduate Work Permit (PGWP)",       hasExpiry: true  },
  { value: "Bridging Open Work Permit (BOWP)",       hasExpiry: true  },
  { value: "Study Permit (Work Authorization)",      hasExpiry: true  },
  { value: "International Mobility Program (IMP)",   hasExpiry: true  },
  { value: "Seasonal Agricultural Worker Program",   hasExpiry: true  },
];

const workAuthNeedsExpiry = (val: string) =>
  WORK_AUTH_OPTIONS.find((o) => o.value === val)?.hasExpiry ?? false;

const Drivers: React.FC = () => {
  const navigate = useNavigate();


  const generatePassword = () => {
    return Math.random().toString(36).slice(-8); // Example: "aB3dE9fG"
  };

  const formatContact = (raw: string): string => {
    // Strip the "+1 (" prefix first so its "1" digit is never re-extracted
    const withoutPrefix = raw.replace(/^\+1[\s\-\(]*/, "");
    let digits = withoutPrefix.replace(/\D/g, "");
    // Also handle paste of a full E.164 number like "14567890123"
    if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `+1 (${digits}`;
    if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const formatSIN = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const validateExpiryDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date <= today) return "Licence expiry date must be in the future.";
    const soon = new Date(today); soon.setDate(soon.getDate() + 30);
    if (date <= soon) return "Warning: Licence expires within 30 days.";
    return "";
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
  const [addFieldErrors, setAddFieldErrors] = useState({ contact: "", sinNo: "", licence: "", licence_expiry_date: "" });
  const [editFieldErrors, setEditFieldErrors] = useState({ contact: "", sinNo: "", licence: "", licence_expiry_date: "" });
  const [showAddExpiryPicker, setShowAddExpiryPicker] = useState(false);
  const [showEditExpiryPicker, setShowEditExpiryPicker] = useState(false);
  const [showAddWorkAuthPicker, setShowAddWorkAuthPicker] = useState(false);
  const [showEditWorkAuthPicker, setShowEditWorkAuthPicker] = useState(false);

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
    workStatus: "",
    workAuthExpiry: "",
    trainings: [],
  });

  const [editedDriver, setEditedDriver] = useState<any>(null);
  const [, setIsUpdateDisabled] = useState(true);
  const [, setLoading] = useState(false);
  const [, setError] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest" | "none">("none");
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState<number>(0);
  const [isApplicationsButtonHovered, setIsApplicationsButtonHovered] = useState(false);
  const [driverPayouts, setDriverPayouts] = useState<any[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  
  const fetchDriverPayouts = async (driverId: string) => {
    setPayoutsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/payments?driverId=${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverPayouts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDriverPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  };

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
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const drivers = response.data;
        setData(drivers);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        // 404 means no drivers yet — show empty state, not demo data in production
        if (err.response?.status === 404) {
          setData([]);
        } else {
          setData([]);
        }
        setLoading(false);
      }
    };



    const createDriver = async (newDriver: any) => {
    try {
      const token = localStorage.getItem("token");
      // Create the driver record (backend hashes the password and creates the driver)
      const response = await axios.post(`${API_BASE_URL}/drivers`, newDriver, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201 || response.status === 200) {
        fetchDrivers();
        setIsAddModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error creating driver:", error);
      alert(error.response?.data?.message || "Failed to create driver");
    }
  };

    const updateDriver = async (updatedDriver: any) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/drivers/${updatedDriver._id}`, updatedDriver, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDrivers(); // Refresh list
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating driver:", error);
      alert(error.response?.data?.message || "Failed to update driver");
    }
  };

  const deleteDriver = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/drivers/${selectedDriver._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDrivers(); // Refresh list
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error("Error deleting driver:", error);
      alert(error.response?.data?.message || "Failed to delete driver");
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
      { accessorKey: "workStatus", header: "Work Authorization" },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isDemo = String(row.original._id).startsWith("demo-");
          return (
            <div style={styles.actionButtons}>
              <FaEdit
                style={{ ...styles.iconEdit, opacity: isDemo ? 0.3 : 1, cursor: isDemo ? "not-allowed" : "pointer" }}
                onClick={(e) => { e.stopPropagation(); if (!isDemo) handleEdit(row.original); }}
              />
              <FaTrashAlt
                style={{ ...styles.iconDelete, opacity: isDemo ? 0.3 : 1, cursor: isDemo ? "not-allowed" : "pointer" }}
                onClick={(e) => { e.stopPropagation(); if (!isDemo) handleDelete(row.original); }}
              />
            </div>
          );
        },
      },
    ];

  const handleExport = () => {
    if (!filteredData.length) { alert("No drivers to export."); return; }
    exportDrivers();
  };

  const exportDrivers = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Drivers");
    worksheet.columns = [
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Contact", key: "contact" },
      { header: "Username", key: "username" },
      { header: "Status", key: "status" },
      { header: "Work Status", key: "workStatus" },
      { header: "Hours This Week", key: "hoursThisWeek" },
      { header: "Licence Class", key: "licence" },
      { header: "Licence Expiry", key: "licence_expiry_date" },
      { header: "Business Name", key: "business_name" },
      { header: "HST/GST", key: "hst_gst" },
      { header: "Address", key: "address" },
      { header: "Combo Rate", key: "comboRate" },
      { header: "Backhaul Rate", key: "backhaulRate" },
      { header: "Regular/Banner Rate", key: "regularBannerRate" },
      { header: "Wholesale Rate", key: "wholesaleRate" },
      { header: "Voila Rate", key: "voilaRate" },
      { header: "TCS Linehaul Trenton Rate", key: "tcsLinehaulTrentonRate" },
    ];
    worksheet.addRows(filteredData.map((d: any) => ({
      name: d.name || "",
      email: d.email || "",
      contact: d.contact || "",
      username: d.username || "",
      status: d.status || "",
      workStatus: d.workStatus || "",
      hoursThisWeek: d.hoursThisWeek || 0,
      licence: d.licence || "",
      licence_expiry_date: d.licence_expiry_date || "",
      business_name: d.business_name || "",
      hst_gst: d.hst_gst || "",
      address: d.address || "",
      comboRate: d.comboRate || "",
      backhaulRate: d.backhaulRate || "",
      regularBannerRate: d.regularBannerRate || "",
      wholesaleRate: d.wholesaleRate || "",
      voilaRate: d.voilaRate || "",
      tcsLinehaulTrentonRate: d.tcsLinehaulTrentonRate || "",
    })));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drivers_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering and sorting logic for search and hours sort
  const filteredData = useMemo(() => {
    let result = data.filter((driver) =>
      (driver.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (driver.email || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (driver.contact || "").toLowerCase().includes(searchText.toLowerCase())
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
    setEditedDriver(driver);
    setIsEditModalOpen(true);
    setIsUpdateDisabled(true);
    setUsernameError("");
    setEditFieldErrors({ contact: "", sinNo: "", licence: "", licence_expiry_date: "" });
    fetchDriverPayouts(driver._id);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "var(--t-bg)", color: "var(--t-text)" }}>
      <style>{`
        input::placeholder { color: var(--t-text-ghost); }
        select option { background: var(--t-surface); color: var(--t-text); }
        input:focus, select:focus { outline: none; border-color: var(--t-accent) !important; box-shadow: 0 0 0 3px var(--t-indigo-bg) !important; }
      `}</style>
      <Navbar />
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>DRIVERS</div>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>Driver Management</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>Manage driver profiles, rates & credentials for the entire logistical network.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={() => navigate("/driver-applications")}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", position: "relative" as const }}
            >
              <FaClipboard size={13} /> Driver Applications
              {pendingApplicationsCount > 0 && (
                <span style={{ position: "absolute" as const, top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>{pendingApplicationsCount}</span>
              )}
            </button>
            <button
              onClick={handleExport}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Export
            </button>
            <button
              onClick={() => { setIsAddModalOpen(true); setAddFieldErrors({ contact: "", sinNo: "", licence: "", licence_expiry_date: "" }); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}
            >
              + Add Driver
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" as const }}>
            <span style={{ position: "absolute" as const, left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--t-text-ghost)", pointerEvents: "none" as const, fontSize: "14px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or badge ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", padding: "11px 16px 11px 40px", background: "var(--t-input-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "highest" | "lowest" | "none")}
            style={{ padding: "11px 36px 11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text)", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer", minWidth: "200px", appearance: "none" as const, WebkitAppearance: "none" as const }}
          >
            <option value="none">Sort by: Active Hours</option>
            <option value="highest">Highest Hours</option>
            <option value="lowest">Lowest Hours</option>
          </select>
        </div>

        {/* Table Card */}
        <div style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", overflow: "hidden", marginBottom: "24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--t-hover-bg)" }}>
                {["S.NO", "DRIVER", "CONTACT INFORMATION", "STATUS", "HOURS (WK)", "WORK AUTHORIZATION", "ACTIONS"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left" as const, fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", whiteSpace: "nowrap" as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "14px" }}>No matching drivers found.</td>
                </tr>
              ) : (
                filteredData.map((driver: any, idx: number) => {
                  const isDemo = String(driver._id).startsWith("demo-");
                  const statusCfg: Record<string, { bg: string; border: string; color: string }> = {
                    active:     { bg: "var(--t-success-bg)", border: "rgba(16,185,129,0.3)",  color: "var(--t-success)" },
                    inactive:   { bg: "var(--t-warning-bg)", border: "rgba(234,179,8,0.3)",   color: "var(--t-warning)" },
                    suspended:  { bg: "var(--t-error-bg)",   border: "rgba(239,68,68,0.3)",   color: "var(--t-error)" },
                    "on leave": { bg: "var(--t-warning-bg)", border: "rgba(234,179,8,0.3)",   color: "var(--t-warning)" },
                  };
                  const statusKey = (driver.status || "active").toLowerCase();
                  const badge = statusCfg[statusKey] || statusCfg.active;
                  const hours = parseFloat(driver.hoursThisWeek || "0");
                  const avatarColors = ["#4F46E5", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
                  const avatarColor = avatarColors[idx % avatarColors.length];
                  const initials = (driver.name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                  const driverId = `OP-${String(driver._id || "").slice(-4).toUpperCase() || String(1000 + idx)}`;

                  return (
                    <tr
                      key={driver._id}
                      style={{ borderBottom: "1px solid var(--t-stripe)", cursor: isDemo ? "default" : "pointer", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-stripe)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => { if (!isDemo) navigate("/profile", { state: { driver } }); }}
                    >
                      {/* S.NO */}
                      <td style={{ padding: "18px 16px", fontSize: "13px", color: "var(--t-text-ghost)", fontWeight: 500, width: "60px" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* DRIVER */}
                      <td style={{ padding: "18px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ position: "relative" as const, flexShrink: 0 }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                              {initials}
                            </div>
                            <div style={{ position: "absolute" as const, bottom: "1px", right: "1px", width: "9px", height: "9px", borderRadius: "50%", background: statusKey === "active" ? "var(--t-success)" : statusKey === "suspended" ? "var(--t-error)" : "var(--t-warning)", border: "1.5px solid var(--t-surface)" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text)", borderLeft: "2px solid var(--t-accent)", paddingLeft: "8px" }}>{driver.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--t-text-ghost)", paddingLeft: "8px", marginTop: "2px" }}>ID: {driverId}</div>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td style={{ padding: "18px 16px" }}>
                        <div style={{ fontSize: "13px", color: "var(--t-text-faint)" }}>{driver.email}</div>
                        <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "3px" }}>{driver.contact || "—"}</div>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: "18px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" as const }}>
                          ● {(driver.status || "Active").toUpperCase()}
                        </span>
                      </td>

                      {/* HOURS */}
                      <td style={{ padding: "18px 16px", minWidth: "80px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>{hours.toFixed(1)}</div>
                        <div style={{ height: "2px", width: "56px", background: "var(--t-border)", borderRadius: "2px", marginTop: "5px" }}>
                          <div style={{ width: `${Math.min(100, hours / 60 * 100)}%`, height: "100%", background: statusKey === "suspended" ? "var(--t-error)" : "var(--t-accent)", borderRadius: "2px" }} />
                        </div>
                      </td>

                      {/* WORK AUTH */}
                      <td style={{ padding: "18px 16px", fontSize: "13px", color: "var(--t-text-faint)" }}>
                        {driver.workStatus || "—"}
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: "18px 16px" }}>
                        <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { if (!isDemo) handleEdit(driver); }}
                            style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", color: "var(--t-indigo)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isDemo ? "not-allowed" : "pointer", opacity: isDemo ? 0.3 : 1 }}
                          >
                            <FaEdit size={11} />
                          </button>
                          <button
                            onClick={() => { if (!isDemo) handleDelete(driver); }}
                            style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--t-error-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--t-error)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isDemo ? "not-allowed" : "pointer", opacity: isDemo ? 0.3 : 1 }}
                          >
                            <FaTrashAlt size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table footer */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--t-input-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "var(--t-text-ghost)" }}>
              Showing <strong style={{ color: "var(--t-text-faint)" }}>1–{filteredData.length}</strong> of <strong style={{ color: "var(--t-text-faint)" }}>{data.length}</strong> drivers
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        {(() => {
          const totalFleet = data.length;
          const compliantCount = data.filter((d: any) => (d.status || "").toLowerCase() === "active").length;
          const today = new Date();
          const renewalCount = data.filter((d: any) => {
            if (!d.licence_expiry_date) return false;
            const exp = new Date(d.licence_expiry_date + "T00:00:00");
            const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 15;
          }).length;
          const avgHrs = totalFleet > 0 ? data.reduce((s: number, d: any) => s + parseFloat(d.hoursThisWeek || "0"), 0) / totalFleet : 0;
          const compliantPct = totalFleet > 0 ? (compliantCount / totalFleet) * 100 : 0;

          const statCards = [
            { icon: "👥", badge: null as string | null, label: "TOTAL FLEET", value: String(totalFleet), sub: "Active personnel across all regions", subColor: "var(--t-text-dim)", accentRgb: "79,70,229", progress: null as number | null },
            { icon: "✅", badge: null, label: "COMPLIANT", value: String(compliantCount), sub: null as string | null, subColor: "var(--t-text-dim)", accentRgb: "16,185,129", progress: compliantPct },
            { icon: "📋", badge: null, label: "LICENSE RENEWAL", value: String(renewalCount).padStart(2, "0"), sub: "Action required within 15 days", subColor: "var(--t-warning)", accentRgb: "245,158,11", progress: null },
            { icon: "⏱", badge: null, label: "AVG. WEEKLY HRS", value: avgHrs.toFixed(1), sub: "Optimal fatigue management score", subColor: "var(--t-text-dim)", accentRgb: "129,140,248", progress: null },
          ];

          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {statCards.map((c) => (
                <div key={c.label} style={{ background: "var(--t-surface)", borderRadius: "14px", border: "1px solid var(--t-hover-bg)", padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `rgba(${c.accentRgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      {c.icon}
                    </div>
                    {c.badge && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-success)", background: "var(--t-success-bg)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "2px 8px" }}>{c.badge}</span>
                    )}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", marginBottom: "6px" }}>{c.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px", marginBottom: "6px" }}>{c.value}</div>
                  {c.progress !== null && (
                    <div style={{ height: "3px", borderRadius: "3px", background: "var(--t-border)", marginBottom: "6px" }}>
                      <div style={{ width: `${c.progress}%`, height: "100%", borderRadius: "3px", background: "var(--t-success)" }} />
                    </div>
                  )}
                  {c.sub && (
                    <div style={{ fontSize: "11px", color: c.subColor, fontWeight: 500 }}>{c.sub}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

      </div>

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setIsAddModalOpen(false)}>
          <div style={{ background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", width: "100%", maxWidth: "920px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)" }} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaEdit size={16} color="var(--t-indigo)" />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Add New Driver</div>
                  <div style={{ fontSize: "12px", color: "var(--t-text-ghost)", marginTop: "2px" }}>Create a new driver profile and credentials</div>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: "0 28px 24px", overflowY: "auto" as const }}>

              {/* IDENTITY & CREDENTIALS */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" as const }}>IDENTITY & CREDENTIALS</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME</label>
                  <input type="text" placeholder="Enter name" style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>EMAIL ADDRESS</label>
                  <input type="email" placeholder="Enter email" style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>USERNAME</label>
                  <input type="text" placeholder="Enter username" value={selectedDriver.username} style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => { const v = e.target.value.trim(); setSelectedDriver({ ...selectedDriver, username: v }); checkUsernameExists(v); }} />
                  {usernameError && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{usernameError}</p>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>CONTACT NO.</label>
                  <input type="text" placeholder="+1 (416) 555-0191" value={selectedDriver.contact}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${addFieldErrors.contact ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => { const formatted = formatContact(e.target.value); setSelectedDriver({ ...selectedDriver, contact: formatted }); const digits = formatted.replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, ""); setAddFieldErrors((prev) => ({ ...prev, contact: digits.length > 0 && digits.length < 10 ? "Enter a valid 10-digit phone number." : "" })); }} />
                  {addFieldErrors.contact && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{addFieldErrors.contact}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>BUSINESS NAME</label>
                  <input type="text" placeholder="Enter business name" style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, business_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>HST/GST NUMBER</label>
                  <input type="text" placeholder="Enter HST/GST number" style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, hst_gst: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>SIN NO.</label>
                  <input type="text" placeholder="XXX-XXX-XXX" value={selectedDriver.sinNo}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${addFieldErrors.sinNo ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => { const formatted = formatSIN(e.target.value); setSelectedDriver({ ...selectedDriver, sinNo: formatted }); const digits = formatted.replace(/\D/g, ""); setAddFieldErrors((prev) => ({ ...prev, sinNo: digits.length > 0 && digits.length < 9 ? "SIN must be 9 digits." : digits.length === 0 ? "SIN No. is required." : "" })); }} />
                  {addFieldErrors.sinNo && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{addFieldErrors.sinNo}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTHORIZATION</label>
                  <select value={selectedDriver.workStatus}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                    onChange={(e) => { setSelectedDriver({ ...selectedDriver, workStatus: e.target.value, workAuthExpiry: "" }); setShowAddWorkAuthPicker(false); }}>
                    <option value="">Select work authorization</option>
                    {WORK_AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>STATUS</label>
                  <select style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* RATE CONFIGURATION */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "28px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" as const }}>RATE CONFIGURATION</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {([["BACKHAUL RATE", "backhaulRate"], ["COMBO RATE", "comboRate"], ["EXTRA SHEET/E.W", "extraSheetEWRate"], ["REGULAR/BANNER", "regularBannerRate"]] as [string, string][]).map(([label, field]) => (
                  <div key={field} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "10px" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text-ghost)" }}>$</span>
                      <input type="number" placeholder="0.00" style={{ flex: 1, background: "none", border: "none", color: "var(--t-text)", fontSize: "16px", fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", outline: "none", width: "100%", padding: 0 }}
                        onChange={(e) => setSelectedDriver({ ...selectedDriver, [field]: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {([["WHOLESALE RATE", "wholesaleRate"], ["VOILA RATE", "voilaRate"], ["TCS LINEHAUL TRENTON", "tcsLinehaulTrentonRate"]] as [string, string][]).map(([label, field]) => (
                  <div key={field} style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "10px" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text-ghost)" }}>$</span>
                      <input type="number" placeholder="0.00" style={{ flex: 1, background: "none", border: "none", color: "var(--t-text)", fontSize: "16px", fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", outline: "none", width: "100%", padding: 0 }}
                        onChange={(e) => setSelectedDriver({ ...selectedDriver, [field]: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>

              {/* LICENSING & EXPIRY */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "28px 0 20px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1.2px", whiteSpace: "nowrap" as const }}>LICENSING & EXPIRY</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: workAuthNeedsExpiry(selectedDriver.workStatus) ? "1fr 1fr 1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE CLASS</label>
                  <input type="text" placeholder="e.g. AZ, DZ, G" value={selectedDriver.licence}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${addFieldErrors.licence ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => { const upper = e.target.value.toUpperCase(); setSelectedDriver({ ...selectedDriver, licence: upper }); setAddFieldErrors((prev) => ({ ...prev, licence: upper.trim() === "" ? "Licence class is required." : "" })); }} />
                  {addFieldErrors.licence && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{addFieldErrors.licence}</p>}
                </div>
                <div style={{ position: "relative" as const }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE EXPIRY DATE</label>
                  <div onClick={() => setShowAddExpiryPicker(v => !v)}
                    style={{ padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${addFieldErrors.licence_expiry_date?.startsWith("Warning") ? "var(--t-warning)" : addFieldErrors.licence_expiry_date ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    <span style={{ color: selectedDriver.licence_expiry_date ? "var(--t-text)" : "var(--t-text-ghost)" }}>{selectedDriver.licence_expiry_date ? format(parseISO(selectedDriver.licence_expiry_date), "MMM d, yyyy") : "Select expiry date"}</span>
                    <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                  </div>
                  {showAddExpiryPicker && (<>
                    <div onClick={() => setShowAddExpiryPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>
                      <DayPicker mode="single" selected={selectedDriver.licence_expiry_date ? parseISO(selectedDriver.licence_expiry_date) : undefined}
                        onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); setSelectedDriver({ ...selectedDriver, licence_expiry_date: dateStr }); setAddFieldErrors((prev) => ({ ...prev, licence_expiry_date: validateExpiryDate(dateStr) })); setShowAddExpiryPicker(false); } }}
                        styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0" } as React.CSSProperties }} />
                    </div>
                  </>)}
                  {addFieldErrors.licence_expiry_date && <p style={{ margin: "4px 0 0", fontSize: "11px", color: addFieldErrors.licence_expiry_date.startsWith("Warning") ? "var(--t-warning)" : "var(--t-error)" }}>{addFieldErrors.licence_expiry_date}</p>}
                </div>
                {workAuthNeedsExpiry(selectedDriver.workStatus) && (
                  <div style={{ position: "relative" as const }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTH EXPIRY</label>
                    <div onClick={() => setShowAddWorkAuthPicker(v => !v)}
                      style={{ padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <span style={{ color: selectedDriver.workAuthExpiry ? "var(--t-text)" : "var(--t-text-ghost)" }}>{selectedDriver.workAuthExpiry ? format(parseISO(selectedDriver.workAuthExpiry), "MMM d, yyyy") : "Select expiry date"}</span>
                      <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                    </div>
                    {showAddWorkAuthPicker && (<>
                      <div onClick={() => setShowAddWorkAuthPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>
                        <DayPicker mode="single" selected={selectedDriver.workAuthExpiry ? parseISO(selectedDriver.workAuthExpiry) : undefined}
                          onSelect={(d) => { if (d) { setSelectedDriver({ ...selectedDriver, workAuthExpiry: format(d, "yyyy-MM-dd") }); setShowAddWorkAuthPicker(false); } }}
                          styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0" } as React.CSSProperties }} />
                      </div>
                    </>)}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>PASSWORD</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="text" value={selectedDriver.password} placeholder="Enter password"
                      style={{ flex: 1, padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" }}
                      onChange={(e) => setSelectedDriver({ ...selectedDriver, password: e.target.value })} />
                    <button onClick={() => handleCopyPassword(selectedDriver.password)}
                      style={{ padding: "11px 14px", background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: "8px", color: "var(--t-indigo)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <FaClipboard size={13} />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>ADDRESS</label>
                  <input type="text" placeholder="Enter address"
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => setSelectedDriver({ ...selectedDriver, address: e.target.value })} />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: "20px 28px", borderTop: "1px solid var(--t-hover-bg)", display: "flex", justifyContent: "flex-end", gap: "12px", flexShrink: 0 }}>
              <button onClick={() => setIsAddModalOpen(false)} style={{ padding: "11px 20px", background: "none", border: "none", color: "var(--t-text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Close without saving
              </button>
              <button
                onClick={() => {
                  if (usernameError) { alert("Please resolve username error before submitting."); return; }
                  const sinDigits = (selectedDriver.sinNo || "").replace(/\D/g, "");
                  const contactDigits = (selectedDriver.contact || "").replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, "");
                  const errors = { sinNo: sinDigits.length !== 9 ? "SIN must be 9 digits." : "", contact: contactDigits.length > 0 && contactDigits.length !== 10 ? "Enter a valid 10-digit phone number." : "", licence: !(selectedDriver.licence || "").trim() ? "Licence class is required." : "", licence_expiry_date: validateExpiryDate(selectedDriver.licence_expiry_date || "") };
                  setAddFieldErrors(errors);
                  if (errors.sinNo || errors.contact || errors.licence || (errors.licence_expiry_date && !errors.licence_expiry_date.startsWith("Warning"))) return;
                  createDriver({ ...selectedDriver, username: (selectedDriver.username || "").trim() });
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}
              >
                ✓ Add Driver Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {isEditModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "var(--t-modal-overlay)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--t-surface)", borderRadius: "16px", maxWidth: "960px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--t-shadow-lg)", border: "1px solid var(--t-border)" }}>

            {/* Modal Header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--t-hover-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg,#4F46E5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaEdit size={16} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--t-text)" }}>Edit Driver Profile</h2>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--t-text-dim)" }}>Update credentials, rates, and licensing information</p>
                </div>
              </div>
              <button onClick={() => { setIsEditModalOpen(false); setUsernameError(""); }} style={{ background: "var(--t-hover-bg)", border: "1px solid var(--t-border-strong)", color: "var(--t-text-faint)", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", fontFamily: "Inter, system-ui, sans-serif" }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 28px 28px" }}>

              {/* Section: Identity & Credentials */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>IDENTITY &amp; CREDENTIALS</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>FULL NAME</label>
                  <input type="text" defaultValue={selectedDriver?.name}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>EMAIL ADDRESS</label>
                  <input type="email" defaultValue={selectedDriver?.email}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => handleInputChange("email", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>USERNAME</label>
                  <input type="text" placeholder="Enter username" defaultValue={selectedDriver?.username}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${usernameError ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => handleUsernameChangeEdit(e.target.value)} />
                  {usernameError && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{usernameError}</p>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>CONTACT NUMBER</label>
                  <input type="text" placeholder="+1 (416) 555-0191" value={selectedDriver?.contact || ""}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${editFieldErrors.contact ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => {
                      const formatted = formatContact(e.target.value);
                      handleInputChange("contact", formatted);
                      const digits = formatted.replace(/\D/g, "");
                      setEditFieldErrors((prev) => ({ ...prev, contact: digits.length > 0 && digits.length < 10 ? "Enter a valid 10-digit phone number." : "" }));
                    }} />
                  {editFieldErrors.contact && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{editFieldErrors.contact}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>SIN NUMBER</label>
                  <input type="text" placeholder="XXX-XXX-XXX" value={selectedDriver?.sinNo || ""}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${editFieldErrors.sinNo ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => {
                      const formatted = formatSIN(e.target.value);
                      handleInputChange("sinNo", formatted);
                      const digits = formatted.replace(/\D/g, "");
                      setEditFieldErrors((prev) => ({ ...prev, sinNo: digits.length > 0 && digits.length < 9 ? "SIN must be 9 digits." : digits.length === 0 ? "SIN No. is required." : "" }));
                    }} />
                  {editFieldErrors.sinNo && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{editFieldErrors.sinNo}</p>}
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>STATUS</label>
                  <select value={selectedDriver?.status || "Active"}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                    onChange={(e) => handleInputChange("status", e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>HST / GST NUMBER</label>
                  <input type="text" placeholder="e.g. 123456789RT0001" defaultValue={selectedDriver?.hst_gst}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => handleInputChange("hst_gst", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>BUSINESS NAME</label>
                  <input type="text" placeholder="Optional — if incorporated" defaultValue={selectedDriver?.business_name}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => handleInputChange("business_name", e.target.value)} />
                </div>
              </div>

              {/* Section: Rate Configuration */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>RATE CONFIGURATION</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {([["BACKHAUL RATE", "backhaulRate"], ["COMBO RATE", "comboRate"], ["EXTRA SHEET / E.W", "extraSheetEWRate"], ["REGULAR / BANNER", "regularBannerRate"]] as [string, string][]).map(([label, field]) => (
                  <div key={field} style={{ background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "14px" }}>
                    <label style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-indigo)", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>{label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", color: "var(--t-text-dim)" }}>$</span>
                      <input type="number" defaultValue={selectedDriver?.[field]}
                        style={{ flex: 1, padding: "8px 10px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", width: "100%", boxSizing: "border-box" as const }}
                        onChange={(e) => handleInputChange(field, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {([["WHOLESALE RATE", "wholesaleRate"], ["VOILA RATE", "voilaRate"], ["TCS LINEHAUL TRENTON", "tcsLinehaulTrentonRate"]] as [string, string][]).map(([label, field]) => (
                  <div key={field} style={{ background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.18)", borderRadius: "10px", padding: "14px" }}>
                    <label style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-indigo)", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>{label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", color: "var(--t-text-dim)" }}>$</span>
                      <input type="number" defaultValue={selectedDriver?.[field]}
                        style={{ flex: 1, padding: "8px 10px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "6px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", width: "100%", boxSizing: "border-box" as const }}
                        onChange={(e) => handleInputChange(field, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Section: Licensing & Expiry */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>LICENSING &amp; EXPIRY</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE CLASS</label>
                  <input type="text" placeholder="e.g. AZ, DZ, G" value={selectedDriver?.licence || ""}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${editFieldErrors.licence ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase();
                      handleInputChange("licence", upper);
                      setEditFieldErrors((prev) => ({ ...prev, licence: upper.trim() === "" ? "Licence class is required." : "" }));
                    }} />
                  {editFieldErrors.licence && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--t-error)" }}>{editFieldErrors.licence}</p>}
                </div>
                <div style={{ position: "relative" as const }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>LICENCE EXPIRY DATE</label>
                  <div onClick={() => setShowEditExpiryPicker(v => !v)}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: `1px solid ${editFieldErrors.licence_expiry_date?.startsWith("Warning") ? "var(--t-warning)" : editFieldErrors.licence_expiry_date ? "var(--t-error)" : "var(--t-border-strong)"}`, borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                    {(() => {
                      const raw = selectedDriver?.licence_expiry_date;
                      const dateStr = raw ? (raw.includes("T") ? raw.split("T")[0] : raw) : "";
                      return <span style={{ color: dateStr ? "var(--t-text)" : "var(--t-text-ghost)" }}>{dateStr ? format(parseISO(dateStr), "MMM d, yyyy") : "Select expiry date"}</span>;
                    })()}
                    <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                  </div>
                  {showEditExpiryPicker && (
                    <>
                      <div onClick={() => setShowEditExpiryPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                        <DayPicker mode="single"
                          selected={(() => { const raw = selectedDriver?.licence_expiry_date; const s = raw ? (raw.includes("T") ? raw.split("T")[0] : raw) : ""; return s ? parseISO(s) : undefined; })()}
                          onSelect={(d) => { if (d) { const dateStr = format(d, "yyyy-MM-dd"); handleInputChange("licence_expiry_date", dateStr); setEditFieldErrors((prev) => ({ ...prev, licence_expiry_date: validateExpiryDate(dateStr) })); setShowEditExpiryPicker(false); } }}
                          styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0", color: "var(--t-text)" } as React.CSSProperties }} />
                      </div>
                    </>
                  )}
                  {editFieldErrors.licence_expiry_date && (
                    <p style={{ margin: "5px 0 0", fontSize: "11px", color: editFieldErrors.licence_expiry_date.startsWith("Warning") ? "var(--t-warning)" : "var(--t-error)" }}>{editFieldErrors.licence_expiry_date}</p>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTHORIZATION</label>
                  <select value={selectedDriver?.workStatus || ""}
                    style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: selectedDriver?.workStatus ? "var(--t-text)" : "var(--t-text-ghost)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, cursor: "pointer" }}
                    onChange={(e) => { handleInputChange("workStatus", e.target.value); handleInputChange("workAuthExpiry", ""); setShowEditWorkAuthPicker(false); }}>
                    <option value="">Select work authorization</option>
                    {WORK_AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
                  </select>
                </div>
                {workAuthNeedsExpiry(selectedDriver?.workStatus) && (
                  <div style={{ position: "relative" as const }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", display: "block", marginBottom: "7px" }}>WORK AUTH EXPIRY DATE</label>
                    <div onClick={() => setShowEditWorkAuthPicker(v => !v)}
                      style={{ width: "100%", padding: "11px 14px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", color: "var(--t-text)", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                      <span style={{ color: selectedDriver?.workAuthExpiry ? "var(--t-text)" : "var(--t-text-ghost)" }}>
                        {selectedDriver?.workAuthExpiry ? format(parseISO(selectedDriver.workAuthExpiry), "MMM d, yyyy") : "Select expiry date"}
                      </span>
                      <FaCalendarAlt size={13} style={{ color: "var(--t-text-ghost)" }} />
                    </div>
                    {showEditWorkAuthPicker && (
                      <>
                        <div onClick={() => setShowEditWorkAuthPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "var(--t-select-bg)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid var(--t-border-strong)" }}>
                          <DayPicker mode="single"
                            selected={selectedDriver?.workAuthExpiry ? parseISO(selectedDriver.workAuthExpiry) : undefined}
                            onSelect={(d) => { if (d) { handleInputChange("workAuthExpiry", format(d, "yyyy-MM-dd")); setShowEditWorkAuthPicker(false); } }}
                            styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0", color: "var(--t-text)" } as React.CSSProperties }} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Section: Payout History */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0 20px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", whiteSpace: "nowrap" as const }}>PAYOUT HISTORY</span>
                <div style={{ flex: 1, height: "1px", background: "var(--t-hover-bg)" }} />
              </div>

              {payoutsLoading ? (
                <div style={{ padding: "24px", textAlign: "center" as const, color: "var(--t-text-ghost)", fontSize: "13px" }}>Loading payouts…</div>
              ) : driverPayouts.length === 0 ? (
                <div style={{ background: "var(--t-surface-alt)", border: "1px dashed var(--t-border)", borderRadius: "10px", padding: "28px", textAlign: "center" as const }}>
                  <p style={{ margin: 0, color: "var(--t-text-ghost)", fontSize: "13px" }}>No payouts recorded for this driver yet.</p>
                </div>
              ) : (
                <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--t-hover-bg)" }}>
                        {["DATE", "PERIOD", "AMOUNT (CAD)", "TIMESHEETS", "STATUS"].map((h) => (
                          <th key={h} style={{ padding: "11px 14px", textAlign: "left" as const, fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {driverPayouts.map((p: any, i: number) => {
                        const statusCfg: Record<string, { bg: string; color: string }> = {
                          paid:       { bg: "var(--t-success-bg)", color: "var(--t-success)" },
                          pending:    { bg: "var(--t-warning-bg)", color: "var(--t-warning)" },
                          processing: { bg: "var(--t-info-bg)",    color: "var(--t-info)" },
                          failed:     { bg: "var(--t-error-bg)",   color: "var(--t-error)" },
                        };
                        const sc = statusCfg[p.status] || statusCfg.pending;
                        const paidDate = p.paidAt ? format(new Date(p.paidAt), "MMM d, yyyy") : (p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : "—");
                        const periodStr = p.periodFrom && p.periodTo
                          ? `${format(new Date(p.periodFrom), "MMM d")} – ${format(new Date(p.periodTo), "MMM d, yyyy")}`
                          : "—";
                        const amountCad = ((p.amount || 0) / 100).toFixed(2);
                        return (
                          <tr key={p._id || i} style={{ borderBottom: i < driverPayouts.length - 1 ? "1px solid var(--t-stripe)" : "none", background: i % 2 === 1 ? "var(--t-stripe)" : "transparent" }}>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text-secondary)" }}>{paidDate}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text-faint)" }}>{periodStr}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--t-text)", fontWeight: 600 }}>${amountCad}</td>
                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--t-text-dim)" }}>{(p.timesheetIds || []).length} sheet{(p.timesheetIds || []).length !== 1 ? "s" : ""}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.color, textTransform: "capitalize" as const }}>{p.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ padding: "20px 28px", borderTop: "1px solid var(--t-border)", display: "flex", justifyContent: "flex-end", gap: "12px", flexShrink: 0 }}>
              <button onClick={() => { setIsEditModalOpen(false); setUsernameError(""); }}
                style={{ padding: "11px 20px", background: "none", border: "none", color: "var(--t-text-dim)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                Close without saving
              </button>
              <button
                onClick={() => {
                  if (usernameError) { alert("Please resolve username error before submitting."); return; }
                  const sinDigits = (selectedDriver.sinNo || "").replace(/\D/g, "");
                  const contactDigits = (selectedDriver.contact || "").replace(/^\+1[\s\-\(]*/, "").replace(/\D/g, "");
                  const errors = {
                    sinNo: sinDigits.length !== 9 ? "SIN must be 9 digits." : "",
                    contact: contactDigits.length > 0 && contactDigits.length !== 10 ? "Enter a valid 10-digit phone number." : "",
                    licence: !(selectedDriver.licence || "").trim() ? "Licence class is required." : "",
                    licence_expiry_date: validateExpiryDate(selectedDriver.licence_expiry_date || ""),
                  };
                  setEditFieldErrors(errors);
                  if (errors.sinNo || errors.contact || errors.licence || (errors.licence_expiry_date && !errors.licence_expiry_date.startsWith("Warning"))) return;
                  updateDriver(selectedDriver);
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px", background: "var(--t-accent)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
                ✓ Update Driver Records
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

  );
};

import { CSSProperties } from "react";

const styles: { [key: string]: CSSProperties } = {
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "28px 40px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--t-text)",
    marginBottom: "24px",
  },
  headerWrapper: {
    marginBottom: "20px",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    backgroundColor: "var(--t-surface)",
    border: "1px solid var(--t-border)",
    borderRadius: "12px",
    boxShadow: "var(--t-shadow)",
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
    color: "var(--t-text-faint)",
    pointerEvents: "none",
  },
  searchInput: {
    padding: "8px 14px 8px 32px",
    borderRadius: "8px",
    border: "1px solid var(--t-input-border)",
    backgroundColor: "var(--t-input-bg)",
    fontSize: "13px",
    color: "var(--t-text-secondary)",
    width: "220px",
    outline: "none",
  },
  filterDropdown: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid var(--t-input-border)",
    backgroundColor: "var(--t-select-bg)",
    fontSize: "13px",
    color: "var(--t-text-secondary)",
    cursor: "pointer",
    outline: "none",
  },
  tableWrapper: {
    backgroundColor: "var(--t-surface)",
    borderRadius: "16px",
    border: "1px solid var(--t-border)",
    boxShadow: "var(--t-shadow)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "13px 16px",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "left",
    backgroundColor: "var(--t-indigo-bg)",
    color: "var(--t-indigo)",
    borderBottom: "2px solid var(--t-border)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    whiteSpace: "nowrap" as const,
  },
  td: {
    borderBottom: "1px solid var(--t-stripe)",
    padding: "14px 18px",
    fontSize: "14px",
    textAlign: "left",
    color: "var(--t-text-muted)",
    cursor: "pointer",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  iconEdit: {
    color: "var(--t-accent)",
    cursor: "pointer",
    fontSize: "15px",
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "var(--t-indigo-bg)",
  },
  iconDelete: {
    color: "var(--t-error)",
    cursor: "pointer",
    fontSize: "15px",
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "var(--t-error-bg)",
  },
  addDriverButton: {
    backgroundColor: "var(--t-accent)",
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
    backgroundColor: "var(--t-success)",
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
    backgroundColor: "var(--t-error)",
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
  formGroup: {
    marginBottom: "16px",
  },
  fieldError: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "var(--t-error)",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--t-text-dim)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid var(--t-input-border)",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    outline: "none",
    boxSizing: "border-box",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid var(--t-border)",
  },
  addButton: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  editButton: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
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
    color: "var(--t-text-dim)",
  },
};

export default Drivers;
