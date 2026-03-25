import React, { useEffect, useState, useMemo, useRef } from "react";
import ExcelJS from "exceljs";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Navbar from "./Navbar";

import { FILE_BASE_URL, API_BASE_URL } from "../utils/env";

// TypeScript interfaces
interface Timesheet {
  _id: string;
  driver: string;
  driverName: string;
  date: string;
  startTime: string;
  endTime: string;
  customer: string;
  category: string;
  tripNumber: string;
  loadID: string;
  gateOutTime: string;
  gateInTime: string;
  plannedHours: string;
  plannedKM: string;
  startKM: number;
  endKM: number;
  totalHours: string;
  comments: string;
  attachments: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  extraWorkSheetDetails: {
    duration: string;
    from: string;
    to: string;
    comments: string;
  };
  storeDelay: {
    duration: string;
    from: string;
    to: string;
    reason: string;
  };
  extraWorkSheetComments?: string;
  delayStoreReason?: string;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  username: string;
  backhaulRate?: number;
  comboRate?: number;
  extraSheetEWRate?: number;
  regularBannerRate?: number;
  wholesaleRate?: number;
  voilaRate?: number;
  tcsLinehaulTrentonRate?: number;
}

const AllTimesheets: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, setUserRole] = useState<string | null>(null);
  // FilterType must be defined before useState for selectedFilter
  type FilterType = "All" | "Today" | "This Week" | "This Month" | "Custom";
  // Removed edit modal state
  const [, setCategoryRates] = useState<Record<string, number>>(
    {}
  );
  
  // Initialize filter states from URL params or defaults
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "All"
  );
  const [rangeStart, setRangeStart] = useState<string>(
    searchParams.get("rangeStart") || ""
  );
  const [rangeEnd, setRangeEnd] = useState<string>(
    searchParams.get("rangeEnd") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [selectedUser, setSelectedUser] = useState<string>(
    searchParams.get("user") || "All"
  );
  const [users, setUsers] = useState<Driver[]>([]);
  // const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  // --- [1] Add state for status filter
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Pagination state - also persist in URL
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state for delete confirmation
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Track if this is the first load
  const isFirstLoad = useRef(true);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update URL params when filters change
  const updateURLParams = (newParams: Record<string, string>) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const updatedParams = { ...currentParams, ...newParams };
    
    // Remove empty values
    Object.keys(updatedParams).forEach(key => {
      if (!updatedParams[key] || updatedParams[key] === "All") {
        delete updatedParams[key];
      }
    });
    
    setSearchParams(updatedParams);
  };

  // Update URL when filter states change
  useEffect(() => {
    updateURLParams({
      filter: selectedFilter,
      search: searchQuery,
      user: selectedUser,
      status: selectedStatus,
      rangeStart,
      rangeEnd,
      page: page.toString()
    });
  }, [selectedFilter, searchQuery, selectedUser, selectedStatus, rangeStart, rangeEnd, page]);

  // Handler for delete button click (opens modal)
  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setShowModal(true);
  };

  // Handler for confirming delete in modal
  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    try {
      await axios.delete(`${API_BASE_URL}/timesheet/${selectedId}`);
      setData(prev => prev.filter(t => t._id !== selectedId));
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      alert(errorMessage);
    } finally {
      setShowModal(false);
      setSelectedId(null);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
    // Bug fix: fetchTimesheets, fetchCategoryRates, and fetchUsers are all called
    // in the second mount useEffect below; removed duplicate call here to avoid
    // triple API calls on initial load.
  }, []);

  // Refetch data when URL parameters change (e.g., when returning from child component)
  useEffect(() => {
    const urlFilter = searchParams.get("filter") as FilterType;
    const urlUser = searchParams.get("user");
    const urlSearch = searchParams.get("search");
    const urlPage = searchParams.get("page");
    const urlRangeStart = searchParams.get("rangeStart");
    const urlRangeEnd = searchParams.get("rangeEnd");
    const urlStatus = searchParams.get("status");
    
    // URL params changed debug log removed
    
    // Only update state if URL params differ from current state
    if (urlFilter && urlFilter !== selectedFilter) {
      setSelectedFilter(urlFilter);
    }
    if (urlUser && urlUser !== selectedUser) {
      setSelectedUser(urlUser);
    }
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
    if (urlPage && parseInt(urlPage) !== page) {
      setPage(parseInt(urlPage));
    }
    if (urlRangeStart !== null && urlRangeStart !== rangeStart) {
      setRangeStart(urlRangeStart);
    }
    if (urlRangeEnd !== null && urlRangeEnd !== rangeEnd) {
      setRangeEnd(urlRangeEnd);
    }
    if (urlStatus && urlStatus !== selectedStatus) {
      setSelectedStatus(urlStatus);
    }
  }, [searchParams]);

  // Refetch data when navigating back to this component
  useEffect(() => {
    if (!isFirstLoad.current) {
      // Location changed, refetching data...
      fetchTimesheets();
    } else {
      isFirstLoad.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    // Clear any existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Debounce the API call to prevent race conditions
    filterTimeoutRef.current = setTimeout(() => {
      fetchTimesheets();
    }, 100);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [selectedFilter, selectedUser, selectedStatus, searchQuery, rangeStart, rangeEnd]);

  const handleExport = () => {
    if (data.length === 0) {
      alert("No timesheets available to export.");
      return;
    }
    exportTimesheets();
  };

  const handleDeleteFilteredTimesheets = async () => {
    if (data.length === 0) {
      alert("No timesheets available to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${data.length} timesheets? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const ts of data) {
        await axios.delete(`${API_BASE_URL}/timesheet/${ts._id}`);
      }
      fetchTimesheets();
      alert("Selected timesheets deleted successfully.");
    } catch (error) {
      console.error("Error deleting timesheets:", error);
      alert("Failed to delete selected timesheets.");
    }
  };

  const handleBulkApprove = async () => {
    const pending = data.filter((t) => t.status === "pending");
    if (pending.length === 0) { alert("No pending timesheets to approve."); return; }
    if (!window.confirm(`Approve all ${pending.length} pending timesheets?`)) return;
    try {
      await Promise.all(pending.map((ts) => axios.put(`${API_BASE_URL}/timesheets/${ts._id}`, { status: "approved" })));
      fetchTimesheets();
    } catch (err) {
      console.error("Bulk approve error:", err);
      alert("Some timesheets could not be approved. Please try again.");
    }
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSelectedFilter("All");
    setSelectedUser("All");
    setSelectedStatus("All");
    setSearchQuery("");
    setRangeStart("");
    setRangeEnd("");
    setPage(1);
    // Clear URL params immediately
    setSearchParams({});
  };

  // Enhanced filter handlers that update URL
  const handleFilterChange = (newFilter: FilterType) => {
    setSelectedFilter(newFilter);
    setPage(1); // Bug fix: reset to first page when period filter changes
    if (newFilter !== "Custom") {
      setRangeStart("");
      setRangeEnd("");
    }
  };

  const handleUserChange = (newUser: string) => {
    setSelectedUser(newUser);
    setPage(1); // Reset to first page when changing user filter
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setPage(1); // Reset to first page when changing status filter
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const filteredData = useMemo(() => {
    // Since filtering is now handled by the backend, just return the data
    return data;
  }, [data]);
  
  // Export timesheets using ExcelJS

  const exportTimesheets = async () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No timesheets available to export.");
      return;
    }

    // Log a sample timesheet before export (removed)

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheets");

    worksheet.columns = [
      { header: "Full Name", key: "fullName" },
      { header: "Trip Date", key: "date" },
      { header: "Driver Id", key: "driverId" },
      { header: "Trip Number", key: "tripNumber" },
      { header: "Load Type", key: "loadType" },
      { header: "Load ID", key: "loadId" },
      { header: "Start Time", key: "startTime" },
      { header: "Finish Time", key: "finishTime" },
      { header: "Total Hours", key: "totalHours" },
      { header: "Gate Out Time", key: "gateOutTime" },
      { header: "Gate In Time", key: "gateInTime" },
      { header: "Start KMS", key: "startKMS" },
      { header: "Finish KMS", key: "finishKMS" },
      { header: "Total KMS", key: "totalKMS" },
      { header: "Extra Work", key: "extraWork" },
      { header: "Store Delays", key: "storeDelays" },
      { header: "Planned Hours", key: "plannedHours" },
      { header: "Driver Comments", key: "driverComments" },
    ];

    // Use the working CSV transformation logic
    const exportRows = filteredData.map((item) => ({
      fullName: item.driverName?.split(" (@")[0] || "",
      date: item.date || "",
      driverId: item.driverName?.match(/\(@(.*?)\)/)?.[1] || "",
      tripNumber: item.tripNumber || "",
      loadType: item.category || "",
      loadId: item.loadID || "",
      startTime: item.startTime || "",
      finishTime: item.endTime || "",
      totalHours: item.totalHours || "",
      gateOutTime: item.gateOutTime || "",
      gateInTime: item.gateInTime || "",
      startKMS: item.startKM ?? "",
      finishKMS: item.endKM ?? "",
      totalKMS: item.endKM && item.startKM ? (item.endKM - item.startKM).toFixed(2) : "N/A",
      extraWork: item.extraWorkSheetDetails?.duration ? `"Yes/${item.extraWorkSheetComments}"` : "N/A",
      storeDelays: item.storeDelay?.duration ? `"Yes"/${item.delayStoreReason}` : "N/A",
      plannedHours: item.plannedHours || "",
      driverComments: item.comments || "",
    }));

    worksheet.addRows(exportRows);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "filtered_timesheets_export.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchTimesheets();
    fetchCategoryRates();
    fetchUsers();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }
  }, []);

  // Refetch timesheets when page changes
  useEffect(() => {
    fetchTimesheets();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchCategoryRates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      const rates: Record<string, number> = {};

      response.data.forEach((driver: Driver) => {
        if (driver.backhaulRate) rates["Backhaul"] = driver.backhaulRate;
        if (driver.comboRate) rates["Combo"] = driver.comboRate;
        if (driver.extraSheetEWRate)
          rates["Extra Sheet/E.W"] = driver.extraSheetEWRate;
        if (driver.regularBannerRate)
          rates["Regular/Banner"] = driver.regularBannerRate;
        if (driver.wholesaleRate) rates["Wholesale"] = driver.wholesaleRate;
        if (driver.voilaRate) rates["voila"] = driver.voilaRate;
        if (driver.tcsLinehaulTrentonRate) rates["TCS linehaul trenton"] = driver.tcsLinehaulTrentonRate;
      });

      setCategoryRates(rates);
    } catch (error) {
      console.error("Failed to fetch category rates:", error);
    }
  };

  const fetchTimesheets = async () => {
    // Bug fix: show loading indicator and clear stale errors on every fetch
    setLoading(true);
    setError(null);
    try {
      // Build query parameters for backend filtering
      const queryParams = new URLSearchParams();
      
      // Always use pagination
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      // Add filter parameters
      if (selectedFilter !== "All") {
        queryParams.append('filter', selectedFilter);
      }
      if (selectedUser !== "All") {
        queryParams.append('user', selectedUser);
      }
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }
      if (selectedFilter === "Custom" && rangeStart && rangeEnd) {
        queryParams.append('rangeStart', rangeStart);
        queryParams.append('rangeEnd', rangeEnd);
      }
      if (selectedStatus !== "All") {
        queryParams.append('status', selectedStatus);
      }
      
      const url = `${API_BASE_URL}/timesheets?${queryParams.toString()}`;
      
      // Debug logs removed for fetching timesheets
      const response = await axios.get(url);
      // Handle response with pagination
      const timesheetData = response.data.data || response.data;
      setData(timesheetData);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("❌ Error fetching timesheets:", error);
      setError("Failed to load timesheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Removed edit modal handlers

  const columns: ColumnDef<Timesheet>[] = [
    {
      accessorKey: "edit",
      header: "",
      cell: ({ row }) => (
        <span>
          <button
            className="delete-button"
            onClick={() => handleDeleteClick(row.original._id)}
            style={styles.editIcon}
          >
            🗑️
          </button>
        </span>
      ),
    },
    {
      accessorKey: "driverName",
      header: "Driver",
      cell: (info) => info.getValue(),
    },
    { header: "Load ID", accessorKey: "loadID" },
    { header: "Route No.", accessorKey: "tripNumber" },
    {
      header: "Date/Time",
      accessorKey: "date",
      cell: ({ row }) => {
        const tsCreatedAt = new Date(row.original.createdAt);
        const tsUpdatedAt = new Date(row.original.updatedAt);
        const createdAtString = tsCreatedAt.toLocaleString();
        const updatedAtString = tsUpdatedAt.toLocaleString();
        // Compare ISO strings to avoid ms differences
        const createdAtIso = tsCreatedAt.toISOString();
        const updatedAtIso = tsUpdatedAt.toISOString();
        const isEdited = createdAtIso !== updatedAtIso;
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>Created: {createdAtString}</span>
            {isEdited && (
              <>
                <span style={{ fontWeight: 600, color: "#d97706", marginTop: "4px", fontSize: "12px" }}>
                  Edited
                </span>
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                  Updated: {updatedAtString}
                </span>
              </>
            )}
          </div>
        );
      },
    },
    {
      header: "Total Hrs", accessorKey: "totalHours",
    },
    { header: "Start KM", accessorKey: "startKM" },
    { header: "End KM", accessorKey: "endKM" },
    {
      header: "Total KM",
      cell: ({ row }) => {
        const start = parseFloat(row.original.startKM.toString());
        const end = parseFloat(row.original.endKM.toString());
        const total = !isNaN(start) && !isNaN(end) ? end - start : "N/A";
        return total;
      },
    },
    { header: "Category", accessorKey: "category" },
    { header: "Planned KM", accessorKey: "plannedKM" },
    {
      header: "Comments",
      accessorKey: "comments",
      cell: ({ row }) => (
        <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxWidth: "250px" }}>
          {row.original.comments}
        </div>
      ),
    },
    {
      header: "Attachments",
      cell: ({ row }) => {
        const attachments = row.original.attachments || [];
        if (attachments.length === 0) {
          return <span></span>;
        }
        let rowStartIndex = 0;
        for (let i = 0; i < filteredData.length; i++) {
          if (filteredData[i] === row.original) break;
          rowStartIndex += (filteredData[i].attachments || []).length;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {attachments.map((path: string, index: number) => (
              <img
                key={index}
                src={`${FILE_BASE_URL}/${path}`}
                alt={`attachment-${index}`}
                style={{
                  width: "44px",
                  height: "44px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(rowStartIndex + index);
                }}
              />
            ))}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const label =
          status === "approved"
            ? "Approved"
            : status === "rejected"
            ? "Rejected"
            : "Pending";

        return (
          <span style={statusStyles[status as keyof typeof statusStyles]}>
            {label}
          </span>
        );
      },
    },
  ];

  const filteredTable = useReactTable({
    data: Array.isArray(filteredData) ? filteredData : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const navigate = useNavigate();

  const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#141921", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px 28px", width: "360px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "18px", fontWeight: 800, color: "#f9fafb" }}>Delete Timesheet</h3>
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>Are you sure you want to delete this timesheet? This action cannot be undone.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 18px", background: "none", border: "none", color: "#6b7280", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Cancel</button>
            <button onClick={onConfirm} style={{ padding: "10px 18px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>Yes, Delete</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0d1117", minHeight: "100vh" }}>
      <style>{`
        input::placeholder { color: #4b5563; }
        select option { background: #1e2433; color: #f3f4f6; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        tr[data-ts-row]:hover td { background: rgba(255,255,255,0.02); }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" as const }}>
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: "32px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>All Timesheets</h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              Review and approve{" "}
              <strong style={{ color: "#f9fafb" }}>{data.filter((t) => t.status === "pending").length} pending</strong>{" "}
              timesheets from this pay period.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button onClick={handleExport}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#e5e7eb", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
              ⬇ Export (CSV/PDF)
            </button>
            <button onClick={handleBulkApprove}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#4F46E5", border: "none", borderRadius: "10px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
              ✓ Bulk Approve
            </button>
          </div>
        </div>

        {/* Main Table Card */}
        <div style={{ background: "#161b22", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: "24px" }}>

          {/* Filter Bar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" as const }}>
            <div style={{ position: "relative" as const, flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute" as const, left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4b5563", fontSize: "14px", pointerEvents: "none" as const }}>🔍</span>
              <input type="text" placeholder="Search by driver name or load ID..."
                value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)}
                style={{ width: "100%", padding: "9px 14px 9px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const }} />
            </div>
            <select value={selectedUser} onChange={(e) => handleUserChange(e.target.value)}
              style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer", minWidth: "140px" }}>
              <option value="All">All Drivers</option>
              {users.map((d) => <option key={d._id} value={d.email}>{d.name}</option>)}
            </select>
            <select value={selectedFilter} onChange={(e) => handleFilterChange(e.target.value as FilterType)}
              style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer" }}>
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
            {selectedFilter === "Custom" && (
              <>
                <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                  style={{ padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }} />
                <span style={{ color: "#4b5563", fontSize: "12px" }}>→</span>
                <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)}
                  style={{ padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }} />
              </>
            )}
            <select value={selectedStatus} onChange={(e) => handleStatusChange(e.target.value)}
              style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#f3f4f6", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer" }}>
              <option value="All">Status: All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={clearAllFilters} title="Reset filters"
              style={{ padding: "9px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "15px", fontFamily: "Inter, system-ui, sans-serif" }}>
              ↺
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "56px", textAlign: "center" as const, color: "#4b5563", fontSize: "14px" }}>Loading timesheets…</div>
          ) : error ? (
            <div style={{ padding: "56px", textAlign: "center" as const, color: "#f87171", fontSize: "14px" }}>{error}</div>
          ) : (
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "13px 16px", width: "44px" }}>
                      <input type="checkbox" style={{ accentColor: "#4F46E5", cursor: "pointer" }} />
                    </th>
                    {["DRIVER", "LOAD & ROUTE", "DATE/TIME", "KM (S/E)", "TOTAL KM", "HRS", "CATEGORY", "STATUS"].map((h) => (
                      <th key={h} style={{ padding: "13px 16px", textAlign: "left" as const, fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px", whiteSpace: "nowrap" as const }}>{h}</th>
                    ))}
                    <th style={{ padding: "13px 16px", width: "44px" }} />
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: "56px", textAlign: "center" as const, color: "#4b5563", fontSize: "14px" }}>No timesheets found for the selected filters.</td>
                    </tr>
                  ) : filteredData.map((ts, idx) => {
                    const totalKM = (!isNaN(Number(ts.startKM)) && !isNaN(Number(ts.endKM))) ? Number(ts.endKM) - Number(ts.startKM) : null;
                    const plannedKM = parseFloat(ts.plannedKM || "0");
                    const kmVariance = totalKM !== null && plannedKM > 0 ? totalKM - plannedKM : null;
                    const statusCfg: Record<string, { bg: string; color: string; dot: string }> = {
                      approved: { bg: "rgba(16,185,129,0.12)",  color: "#34d399", dot: "#10b981" },
                      pending:  { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", dot: "#f59e0b" },
                      rejected: { bg: "rgba(239,68,68,0.1)",    color: "#f87171", dot: "#ef4444" },
                    };
                    const sc = statusCfg[ts.status] || statusCfg.pending;
                    const avatarColors = ["#4F46E5", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
                    const rawName = (ts.driverName || "").replace(/\s*\(@.*?\)/, "");
                    const driverUsername = (ts.driverName || "").match(/\(@(.*?)\)/)?.[1] || "";
                    const initials = rawName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
                    const dateStr = ts.date ? new Date(ts.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                    return (
                      <tr key={ts._id} data-ts-row
                        onClick={(e) => { if ((e.target as HTMLElement).closest("button, input")) return; navigate(`/timesheet/${ts._id}?${searchParams.toString()}`); }}
                        style={{ borderBottom: idx < filteredData.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", transition: "background 0.15s" }}>
                        <td style={{ padding: "16px 16px" }} onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" style={{ accentColor: "#4F46E5", cursor: "pointer" }} />
                        </td>
                        {/* Driver */}
                        <td style={{ padding: "16px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: avatarColors[idx % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
                            <div>
                              <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#f9fafb" }}>{rawName || "—"}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>ID: {driverUsername || `DR-${String(ts._id).slice(-4).toUpperCase()}`}</p>
                            </div>
                          </div>
                        </td>
                        {/* Load & Route */}
                        <td style={{ padding: "16px 16px" }}>
                          <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#818CF8" }}>#{ts.loadID || "—"}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Route: {ts.tripNumber || "—"}</p>
                        </td>
                        {/* Date/Time */}
                        <td style={{ padding: "16px 16px" }}>
                          <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#e5e7eb" }}>{dateStr}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>{ts.startTime || "—"} – {ts.endTime || "—"}</p>
                        </td>
                        {/* KM S/E */}
                        <td style={{ padding: "16px 16px" }}>
                          <p style={{ margin: "0 0 1px", fontSize: "12px", color: "#9ca3af" }}>{Number(ts.startKM).toLocaleString()}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{Number(ts.endKM).toLocaleString()}</p>
                        </td>
                        {/* Total KM */}
                        <td style={{ padding: "16px 16px" }}>
                          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#f9fafb" }}>{totalKM !== null ? `${totalKM.toLocaleString()} KM` : "—"}</p>
                          {plannedKM > 0 && (
                            <p style={{ margin: 0, fontSize: "11px", color: kmVariance !== null && Math.abs(kmVariance) > 50 ? "#f87171" : "#34d399" }}>
                              Plan: {plannedKM.toLocaleString()} KM
                            </p>
                          )}
                        </td>
                        {/* Hours */}
                        <td style={{ padding: "16px 16px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>{parseFloat(ts.totalHours || "0").toFixed(2)}</span>
                        </td>
                        {/* Category */}
                        <td style={{ padding: "16px 16px" }}>
                          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: "rgba(255,255,255,0.07)", color: "#9ca3af", letterSpacing: "0.5px", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>
                            {ts.category || "—"}
                          </span>
                        </td>
                        {/* Status */}
                        <td style={{ padding: "16px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.color, textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                            {ts.status === "approved" ? "Approved" : ts.status === "rejected" ? "Rejected" : "Pending"}
                          </span>
                        </td>
                        {/* Delete */}
                        <td style={{ padding: "16px 12px" }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDeleteClick(ts._id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: "14px", padding: "4px 6px", borderRadius: "6px", fontFamily: "Inter, system-ui, sans-serif" }}
                            title="Delete">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer + Pagination */}
          {!loading && !error && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                Showing <strong style={{ color: "#9ca3af" }}>{(page - 1) * limit + 1}–{Math.min(page * limit, (page - 1) * limit + filteredData.length)}</strong> of{" "}
                <strong style={{ color: "#9ca3af" }}>{totalPages * limit}</strong> entries
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => handlePageChange(Math.max(page - 1, 1))} disabled={page === 1}
                  style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: page === 1 ? "#374151" : "#9ca3af", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  ‹ Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)}
                    style={{ padding: "6px 10px", background: page === p ? "#4F46E5" : "rgba(255,255,255,0.05)", border: page === p ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: page === p ? "#fff" : "#9ca3af", cursor: "pointer", fontSize: "13px", fontWeight: page === p ? 700 : 400, minWidth: "32px", fontFamily: "Inter, system-ui, sans-serif" }}>
                    {p}
                  </button>
                ))}
                {totalPages > 5 && <span style={{ color: "#4b5563", fontSize: "13px", padding: "0 2px" }}>…</span>}
                {totalPages > 5 && (
                  <button onClick={() => handlePageChange(totalPages)}
                    style={{ padding: "6px 10px", background: page === totalPages ? "#4F46E5" : "rgba(255,255,255,0.05)", border: page === totalPages ? "none" : "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: page === totalPages ? "#fff" : "#9ca3af", cursor: "pointer", fontSize: "13px", minWidth: "32px", fontFamily: "Inter, system-ui, sans-serif" }}>
                    {totalPages}
                  </button>
                )}
                <button onClick={() => handlePageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages}
                  style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: page === totalPages ? "#374151" : "#9ca3af", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {(() => {
          const totalHrs = data.reduce((sum, t) => sum + parseFloat(t.totalHours || "0"), 0);
          const pendingCount = data.filter((t) => t.status === "pending").length;
          const approvedCount = data.filter((t) => t.status === "approved").length;
          const kmVariances = data
            .filter((t) => t.plannedKM && !isNaN(Number(t.startKM)) && !isNaN(Number(t.endKM)))
            .map((t) => {
              const actual = Number(t.endKM) - Number(t.startKM);
              const planned = parseFloat(t.plannedKM);
              return planned > 0 ? Math.abs((actual - planned) / planned) * 100 : 0;
            });
          const avgVariance = kmVariances.length > 0 ? kmVariances.reduce((a, b) => a + b, 0) / kmVariances.length : 0;
          const cards = [
            { icon: "⏱", label: "TOTAL REPORTED HOURS", value: totalHrs.toLocaleString("en", { maximumFractionDigits: 0 }), sub: "↗ 4.2% from last week", subColor: "#34d399" },
            { icon: "⚠", label: "PENDING APPROVALS",    value: pendingCount.toString(),  sub: pendingCount > 0 ? "Requires action" : "All clear", subColor: pendingCount > 0 ? "#f87171" : "#34d399" },
            { icon: "✓✓", label: "APPROVED THIS WEEK",   value: approvedCount.toString(), sub: "On track for payroll", subColor: "#34d399" },
            { icon: "📍", label: "DISTANCE VARIANCE",    value: `${avgVariance.toFixed(1)}%`, sub: avgVariance > 5 ? "Above threshold" : "Within threshold", subColor: avgVariance > 5 ? "#f87171" : "#34d399" },
          ];
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {cards.map((card) => (
                <div key={card.label} style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "22px 24px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", marginBottom: "14px" }}>{card.icon}</div>
                  <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px" }}>{card.label}</p>
                  <p style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>{card.value}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: card.subColor }}>{card.sub}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Attachment preview modal */}
      {selectedImageIndex !== null && (
        <ImagePreviewModal
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
          filteredData={filteredData}
        />
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "28px 40px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  tableWrapper: {
    borderRadius: "16px",
    border: "1px solid #e0e7ff",
    boxShadow: "0 2px 16px rgba(79,70,229,0.07)",
    backgroundColor: "#fff",
    overflowX: "auto",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "13px 16px",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "left" as const,
    backgroundColor: "#f5f3ff",
    color: "#6366f1",
    borderBottom: "2px solid #e0e7ff",
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    whiteSpace: "nowrap" as const,
  },
  td: {
    borderBottom: "1px solid #f0f0ff",
    padding: "14px 18px",
    fontSize: "14px",
    textAlign: "left" as const,
    color: "#374151",
  },
  actions: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "6px",
    minWidth: "140px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    padding: "12px 0",
    fontSize: "14px",
    color: "#374151",
  },
  paginationButton: {
    padding: "7px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "13px",
    color: "#374151",
  },
  approveButton: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    padding: "6px 14px",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  rejectButton: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "6px 14px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  readOnly: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: 600,
    marginTop: "10px",
    padding: "10px 16px",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    display: "inline-block",
  },
  editIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#4F46E5",
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
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    width: "600px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.16)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  exportButton: {
    padding: "7px 16px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  optionButton: {
    margin: "5px",
    padding: "8px 18px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  exportOptions: {
    textAlign: "center" as const,
    padding: "10px 0",
  },
  filterBar: {
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
    marginBottom: "20px",
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  filterLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    whiteSpace: "nowrap" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  filterActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },
  dateInput: {
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#374151",
    backgroundColor: "#f9fafb",
    outline: "none",
  },
  selectInput: {
    padding: "7px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#374151",
    outline: "none",
    cursor: "pointer",
  },
  searchWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#9ca3af",
    pointerEvents: "none" as const,
  },
  searchInput: {
    padding: "8px 14px 8px 32px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#374151",
    width: "240px",
    outline: "none",
  },
  clearButton: {
    padding: "7px 14px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  deleteButton: {
    padding: "7px 16px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
};

const statusStyles = {
  approved: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    padding: "4px 12px",
    borderRadius: "20px",
    fontWeight: 600,
    fontSize: "12px",
    display: "inline-block",
    minWidth: "76px",
    textAlign: "center" as const,
    letterSpacing: "0.3px",
  },
  rejected: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "4px 12px",
    borderRadius: "20px",
    fontWeight: 600,
    fontSize: "12px",
    display: "inline-block",
    minWidth: "76px",
    textAlign: "center" as const,
    letterSpacing: "0.3px",
  },
  pending: {
    backgroundColor: "#fffbeb",
    color: "#b45309",
    padding: "4px 12px",
    borderRadius: "20px",
    fontWeight: 600,
    fontSize: "12px",
    display: "inline-block",
    minWidth: "76px",
    textAlign: "center" as const,
    letterSpacing: "0.3px",
  },
};

export default AllTimesheets;

// Enhanced Image/PDF Preview Modal Component
type ImagePreviewModalProps = {
  selectedImageIndex: number;
  setSelectedImageIndex: React.Dispatch<React.SetStateAction<number | null>>;
  filteredData: Timesheet[];
};

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  selectedImageIndex,
  setSelectedImageIndex,
  filteredData,
}) => {
  // Flat list of all attachments in filteredData
  const allAttachments: string[] = filteredData.flatMap(ts => ts.attachments || []);
  // Map each attachment index to its parent timesheet id for navigation logic
  const attachmentTimesheetIds: string[] = [];
  filteredData.forEach(ts => {
    const tsId = ts._id || (ts.attachments?.[0]?.split("-")[0] ?? "");
    const count = (ts.attachments || []).length;
    for (let i = 0; i < count; i++) {
      attachmentTimesheetIds.push(tsId);
    }
  });
  const fileUrl = allAttachments[selectedImageIndex]
    ? `${FILE_BASE_URL}/${allAttachments[selectedImageIndex]}`
    : "";
  const isPDF = fileUrl.toLowerCase().endsWith(".pdf");
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const lastZoom = useRef<number>(1);
  const lastDistance = useRef<number | null>(null);

  // Reset zoom when file changes
  React.useEffect(() => {
    setZoom(1);
    lastZoom.current = 1;
  }, [selectedImageIndex]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Navigation logic: only allow navigation if next/prev image is from same timesheet
  const handlePrevImage = () => {
    if (selectedImageIndex > 0) {
      const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
      const prevTimesheetId = attachmentTimesheetIds[selectedImageIndex - 1];
      if (currentTimesheetId !== prevTimesheetId) {
        return; // prevent navigating to previous image if from different timesheet
      }
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };
  const handleNextImage = () => {
    if (selectedImageIndex < allAttachments.length - 1) {
      const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
      const nextTimesheetId = attachmentTimesheetIds[selectedImageIndex + 1];
      if (currentTimesheetId !== nextTimesheetId) {
        return; // prevent navigating to next image if from different timesheet
      }
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  // Handle wheel zoom for images
  function handleWheel(e: React.WheelEvent<HTMLImageElement>) {
    e.preventDefault();
    e.stopPropagation();
    let newZoom = zoom + (e.deltaY < 0 ? 0.1 : -0.1);
    newZoom = Math.max(0.3, Math.min(3, newZoom));
    setZoom(newZoom);
    lastZoom.current = newZoom;
  }

  // Handle pinch zoom for images
  function handleTouchStart(e: React.TouchEvent<HTMLImageElement>) {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistance.current = dist;
    }
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    }
  }
  function handleTouchMove(e: React.TouchEvent<HTMLImageElement>) {
    if (e.touches.length === 2 && lastDistance.current !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = newDist / lastDistance.current;
      let newZoom = lastZoom.current * scale;
      newZoom = Math.max(0.3, Math.min(3, newZoom));
      setZoom(newZoom);
    }
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLImageElement>) {
    if (e.touches.length < 2 && lastDistance.current !== null) {
      lastZoom.current = zoom;
      lastDistance.current = null;
    }
    // Swipe left/right for navigation
    if (e.changedTouches.length === 1 && startX.current !== null && startY.current !== null) {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx < 0 && selectedImageIndex < allAttachments.length - 1) {
          // Only allow next if same timesheet
          const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
          const nextTimesheetId = attachmentTimesheetIds[selectedImageIndex + 1];
          if (currentTimesheetId === nextTimesheetId) {
            setSelectedImageIndex(selectedImageIndex + 1);
          }
        }
        if (dx > 0 && selectedImageIndex > 0) {
          // Only allow prev if same timesheet
          const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
          const prevTimesheetId = attachmentTimesheetIds[selectedImageIndex - 1];
          if (currentTimesheetId === prevTimesheetId) {
            setSelectedImageIndex(selectedImageIndex - 1);
          }
        }
      }
      startX.current = null;
      startY.current = null;
    }
  }

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && selectedImageIndex > 0) {
        const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
        const prevTimesheetId = attachmentTimesheetIds[selectedImageIndex - 1];
        if (currentTimesheetId === prevTimesheetId) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
      }
      if (e.key === "ArrowRight" && selectedImageIndex < allAttachments.length - 1) {
        const currentTimesheetId = attachmentTimesheetIds[selectedImageIndex];
        const nextTimesheetId = attachmentTimesheetIds[selectedImageIndex + 1];
        if (currentTimesheetId === nextTimesheetId) {
          setSelectedImageIndex(selectedImageIndex + 1);
        }
      }
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, allAttachments.length, setSelectedImageIndex, attachmentTimesheetIds]);

  if (!fileUrl) return null;

  // Determine if prev/next image is from same timesheet
  const canGoPrev =
    selectedImageIndex > 0 &&
    attachmentTimesheetIds[selectedImageIndex] === attachmentTimesheetIds[selectedImageIndex - 1];
  const canGoNext =
    selectedImageIndex < allAttachments.length - 1 &&
    attachmentTimesheetIds[selectedImageIndex] === attachmentTimesheetIds[selectedImageIndex + 1];

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setSelectedImageIndex(null)}
          style={{
            position: "absolute",
            top: "-12px",
            right: "-12px",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          ✖
        </button>
        {isPDF ? (
          <iframe
            src={fileUrl}
            title="PDF Preview"
            style={{
              width: "80vw",
              height: "90vh",
              backgroundColor: "white",
              borderRadius: "12px",
              border: "none",
            }}
          />
        ) : (
          <img
            ref={imgRef}
            src={fileUrl}
            alt="Preview"
            style={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              borderRadius: "12px",
              transform: `scale(${zoom})`,
              transition: "transform 0.2s ease",
              cursor: zoom > 1 ? "move" : "zoom-in",
              background: "#fff"
            }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevImage}
          disabled={!canGoPrev}
          style={{
            position: "absolute",
            top: "50%",
            left: "-40px",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            padding: "8px 12px",
            fontSize: "18px",
            cursor: !canGoPrev ? "not-allowed" : "pointer",
            transform: "translateY(-50%)",
            opacity: !canGoPrev ? 0.5 : 1
          }}
        >
          ◀
        </button>
        <button
          onClick={handleNextImage}
          disabled={!canGoNext}
          style={{
            position: "absolute",
            top: "50%",
            right: "-40px",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            padding: "8px 12px",
            fontSize: "18px",
            cursor: !canGoNext ? "not-allowed" : "pointer",
            transform: "translateY(-50%)",
            opacity: !canGoNext ? 0.5 : 1
          }}
        >
          ▶
        </button>
        {/* Indicator */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-32px",
            transform: "translateX(-50%)",
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "14px"
          }}
        >
          {selectedImageIndex + 1} / {allAttachments.length}
        </div>
      </div>
    </div>
  );
};

// Modal CSS (can be moved to CSS file or use styled-jsx)
// For simplicity, inject as global style here:
// This can be moved elsewhere as needed.
const modalCss = `
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 28px;
  border-radius: 16px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  font-family: Inter, system-ui, sans-serif;
}
.modal-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}
.modal-content p {
  font-size: 14px;
  color: #6b7280;
}
.modal-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.cancel-btn {
  background-color: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.delete-btn {
  background-color: #dc2626;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
`;

if (typeof document !== "undefined" && !document.getElementById("delete-modal-style")) {
  const style = document.createElement("style");
  style.id = "delete-modal-style";
  style.innerHTML = modalCss;
  document.head.appendChild(style);
}
