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
    fetchTimesheets();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    }

    // Add focus event listener to refetch data when returning to this component
    const handleFocus = () => {
      // fetchTimesheets();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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
    const isCustomFilterActive = selectedFilter === "Custom" && !!rangeStart && !!rangeEnd;

    // Filter state debug log removed

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
      });

      setCategoryRates(rates);
    } catch (error) {
      console.error("Failed to fetch category rates:", error);
    }
  };

  const fetchTimesheets = async () => {
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
                <span style={{ fontWeight: "bold", color: "orange", marginTop: "4px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  Edited
                </span>
                <span style={{ color: "#888", fontSize: "12px" }}>
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
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  cursor: "pointer"
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
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete this timesheet?</p>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="delete-btn" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>All Timesheets</h1>
        <div style={{ ...styles.filterBar, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ ...styles.searchWrapper, position: "relative" }}>
              <span style={{ ...styles.searchIcon }}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={styles.filterGroup}>
              <label>User:</label>
              <select value={selectedUser} onChange={(e) => handleUserChange(e.target.value)} style={styles.selectInput}>
                <option value="All">All Users</option>
                {users.map((driver: Driver) => (
                  <option key={driver._id} value={driver.email}>{driver.name} ({driver.username})</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label>Filter:</label>
              <select
                value={selectedFilter ?? "All"}
                onChange={e => handleFilterChange(e.target.value as FilterType)}
                style={styles.selectInput}
              >
                <option value="Today">Today</option>
                <option value="All">All</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Range</option>
              </select>
              {selectedFilter === "Custom" && (
                <>
                  <label>From:</label>
                  <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} style={styles.dateInput} />
                  <label>To:</label>
                  <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} style={styles.dateInput} />
                </>
              )}
            </div>
            {/* [2] Add status filter dropdown */}
            <div style={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={selectedStatus}
                onChange={e => handleStatusChange(e.target.value)}
                style={styles.selectInput}
              >
                <option value="All">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {/* Clear Filters Button */}
            {((selectedFilter !== "All") || (selectedUser !== "All") || (selectedStatus !== "All") || searchQuery.trim() || ((selectedFilter as string) === "Custom" && (rangeStart || rangeEnd))) && (
              <button onClick={clearAllFilters} style={styles.clearButton}>
                Clear Filters ✕
              </button>
            )}
            <button onClick={handleExport} style={styles.exportButton}>
              Export Timesheet 📤
            </button>
            <button onClick={handleDeleteFilteredTimesheets} style={styles.rejectButton}>
              Delete Timesheets 🗑️
            </button>
          </div>
        </div>

        {/* Removed extra export button and exportOptions container */}
        {loading ? (
          <p>Loading timesheets...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  {filteredTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={styles.th}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {filteredData && filteredData.length > 0 ? (
                    filteredTable.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button")) return;
                          
                          // Build URL with current search parameters to preserve filters
                          let detailUrl = `/timesheet/${row.original._id}`;
                          const currentParams = new URLSearchParams(searchParams);
                          
                          if (currentParams.toString()) {
                            detailUrl += `?${currentParams.toString()}`;
                          }
                          
                          navigate(detailUrl);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <style>
              {`
                table tr:hover td {
                  background-color: #f0f4ff;
                  transition: background-color 0.2s ease;
                  cursor: pointer;
                }
              `}
            </style>
            {/* Pagination controls */}
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(Math.max(page - 1, 1))}
                disabled={page === 1}
                style={styles.paginationButton}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
                disabled={page === totalPages}
                style={styles.paginationButton}
              >
                Next
              </button>
            </div>
          </>
        )}

      </div>
      {/* Enhanced Image/PDF preview modal */}
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
    textAlign: "center" as const,
    padding: "40px 20px",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
    padding: "10px",
    overflowX: "auto",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
    tableLayout: "auto" as const,
  },
  th: {
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left" as const,
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    wordBreak: "break-word" as const,
    whiteSpace: "wrap" as const,
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "8px 8px",
    fontSize: "14px",
    textAlign: "left" as const,
    backgroundColor: "#ffffff",
    wordBreak: "break-word" as const,
  },
  actions: {
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: "8px",
    minWidth: "150px",
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    padding: "12px 0",
    fontSize: "14px",
  },
  paginationButton: {
    padding: "6px 14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    fontWeight: 500,
  },
  approveButton: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    padding: "6px 14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #a7f3d0",
  },
  rejectButton: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "6px 14px",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px #fecaca",
  },
  readOnly: {
    color: "gray",
    fontStyle: "italic",
  },
  error: {
    color: "red",
    fontSize: "16px",
    marginTop: "10px",
  },
  editIcon: {
    background: "none",
    border: "none",
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "10px",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto" as const,
    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  exportButton: {
    padding: "10px 20px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  optionButton: {
    margin: "5px",
    padding: "8px 18px",
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  exportOptions: {
    textAlign: "center" as const,
    padding: "10px 0",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    gap: "16px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  },
  dateInput: {
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  selectInput: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f9f9f9",
    fontSize: "14px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#888",
  },
  searchInput: {
    padding: "8px 14px 8px 32px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    fontSize: "14px",
    width: "250px",
  },
  clearButton: {
    padding: "8px 14px",
    backgroundColor: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

const statusStyles = {
  approved: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
  },
  rejected: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
  },
  pending: {
    backgroundColor: "#fff7ed",
    color: "#b45309",
    padding: "4px 12px",
    borderRadius: "9px",
    fontWeight: 600,
    display: "inline-block",
    minWidth: "80px",
    textAlign: "center" as const,
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
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000
    }}>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setSelectedImageIndex(null)}
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            padding: "8px 12px",
            fontSize: "16px",
            cursor: "pointer",
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
              borderRadius: "8px"
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
              borderRadius: "8px",
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
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-around;
}
.cancel-btn {
  background-color: #ccc;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.delete-btn {
  background-color: #e53935;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
`;

if (typeof document !== "undefined" && !document.getElementById("delete-modal-style")) {
  const style = document.createElement("style");
  style.id = "delete-modal-style";
  style.innerHTML = modalCss;
  document.head.appendChild(style);
}
