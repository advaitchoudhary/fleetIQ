import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import AddDriverModal from "../components/drivers/AddDriverModal";
import EditDriverModal from "../components/drivers/EditDriverModal";
import DeleteDriverModal from "../components/drivers/DeleteDriverModal";
import CategoryModal from "../components/drivers/CategoryModal";
import DriversTable from "../components/drivers/DriversTable";
import DriverStatsCards from "../components/drivers/DriverStatsCards";
import { FALLBACK_CATEGORIES, INITIAL_DRIVER_STATE, exportDriversToExcel } from "../utils/driverUtils";

const Drivers: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);

  const [orgCategories, setOrgCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [orgCategoriesConfigured, setOrgCategoriesConfigured] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>({ ...INITIAL_DRIVER_STATE });

  const [searchText, setSearchText] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest" | "none">("none");
  const [orgNotesSummary, setOrgNotesSummary] = useState<Record<string, { count: number; worstType: string }>>({});

  // Fetch users on component mount
  useEffect(() => {
    fetchDrivers();

    const token = localStorage.getItem("token");
    // Fetch all org notes to build per-driver summary for table indicator
    const TYPE_PRIORITY: Record<string, number> = { Incident: 4, Warning: 3, General: 2, Compliment: 1 };
    axios.get(`${API_BASE_URL}/driver-notes`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const allNotes: any[] = Array.isArray(res.data) ? res.data : [];
      const summary: Record<string, { count: number; worstType: string }> = {};
      allNotes.forEach((n) => {
        const dId = n.driverId?._id || n.driverId;
        if (!dId) return;
        const id = String(dId);
        if (!summary[id]) summary[id] = { count: 0, worstType: "General" };
        summary[id].count += 1;
        if ((TYPE_PRIORITY[n.type] || 0) > (TYPE_PRIORITY[summary[id].worstType] || 0)) {
          summary[id].worstType = n.type;
        }
      });
      setOrgNotesSummary(summary);
    }).catch(() => {});

    axios.get(`${API_BASE_URL}/organizations/timesheet-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const cats: string[] = res.data.timesheetCategories || [];
      if (cats.length > 0) {
        setOrgCategories(cats);
        setOrgCategoriesConfigured(true);
      } else {
        setOrgCategoriesConfigured(false);
      }
    }).catch(() => {});
  }, []);

    const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      setData([]);
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

  const handleExport = () => {
    if (!filteredData.length) { alert("No drivers to export."); return; }
    exportDriversToExcel(filteredData);
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

  // Handlers for modals
  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  };

  const handleDelete = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteModalOpen(true);
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
              onClick={handleExport}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "10px", color: "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Export
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
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

        <DriversTable
          drivers={filteredData}
          totalCount={data.length}
          orgNotesSummary={orgNotesSummary}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={(driver) => navigate("/profile", { state: { driver } })}
        />

        <DriverStatsCards data={data} />

      </div>

      <AddDriverModal
        isOpen={isAddModalOpen}
        orgCategories={orgCategories}
        orgCategoriesConfigured={orgCategoriesConfigured}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={() => { fetchDrivers(); setIsAddModalOpen(false); }}
        onConfigureCategories={() => setShowCatModal(true)}
      />


      <EditDriverModal
        isOpen={isEditModalOpen}
        driver={selectedDriver}
        orgCategories={orgCategories}
        orgCategoriesConfigured={orgCategoriesConfigured}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => { fetchDrivers(); setIsEditModalOpen(false); }}
        onConfigureCategories={() => setShowCatModal(true)}
      />
      <DeleteDriverModal
        isOpen={isDeleteModalOpen}
        driverName={selectedDriver?.name || ""}
        onConfirm={deleteDriver}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <CategoryModal
        isOpen={showCatModal}
        initialCategories={orgCategories}
        onSaved={(categories, configured) => { setOrgCategories(categories); setOrgCategoriesConfigured(configured); }}
        onClose={() => setShowCatModal(false)}
      />
    </div>

  );
};

export default Drivers;
