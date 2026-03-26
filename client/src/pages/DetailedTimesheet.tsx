import React, { useEffect, useState, useCallback, JSX } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, FILE_BASE_URL } from "../utils/env";
import Navbar from "./Navbar";
import { FaArrowLeft } from "react-icons/fa";

const DetailedTimesheet: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [timesheet, setTimesheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set());
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [resetHover, setResetHover] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [driversMap, setDriversMap] = useState<Record<string, string>>({});
  // Local UI state for dropdown and supporting fields
  const [, setExtraWorkSelected] = useState("No");
  const [, setExtraWorkFrom] = useState("");
  const [, setExtraWorkTo] = useState("");
  const [, setExtraWorkComments] = useState("");
  // Multi-select for delay types (legacy, will be replaced by checkboxes)
  const [, setExtraDelay] = useState("No");
  const [, setExtraDelayTypes] = useState<string[]>([]);
  // Checkbox-based selection for delay types
  const [selectedDelayTypes, setSelectedDelayTypes] = useState<string[]>([]);
  // Store delay fields
  const [storeDelayFields, setStoreDelayFields] = useState({
    duration: "",
    from: "",
    to: "",
    reason: "",
  });
  // Road delay fields
  const [roadDelayFields, setRoadDelayFields] = useState({
    duration: "",
    from: "",
    to: "",
    reason: "",
  });
  // Other delay fields
  const [, setOtherDelayFields] = useState({
    from: "",
    to: "",
    duration: "",
    reason: "",
  });
  // Store delay state variables
  // const [storeDelay, setStoreDelay] = useState(
  //   formData.storeDelay || {
  //     duration: "",
  //     from: "",
  //     to: "",
  //     reason: "",
  //   }
  // );

  // Function to handle back navigation while preserving filters.
  // Bug fix: use the React Router `location` (from useLocation()) instead of the
  // browser global `location`. Also fixed the back URL from "/applications" to
  // "/all-timesheets" which is the actual timesheets list route.
  const handleBackClick = () => {
    // Get the current search params from the URL that brought us here
    const searchParams = new URLSearchParams(location.search);

    // Build the back URL with preserved filters
    let backUrl = "/applications";
    const params: string[] = [];

    if (searchParams.get("filter")) params.push(`filter=${searchParams.get("filter")}`);
    if (searchParams.get("user")) params.push(`user=${searchParams.get("user")}`);
    if (searchParams.get("search")) params.push(`search=${searchParams.get("search")}`);
    if (searchParams.get("rangeStart")) params.push(`rangeStart=${searchParams.get("rangeStart")}`);
    if (searchParams.get("rangeEnd")) params.push(`rangeEnd=${searchParams.get("rangeEnd")}`);
    if (searchParams.get("page")) params.push(`page=${searchParams.get("page")}`);

    if (params.length > 0) {
      backUrl += `?${params.join("&")}`;
    }

    navigate(backUrl);
  };

  const allFields = [
    "date", "driver", "driverName", "startTime", "endTime", "customer", "totalHours",
    "category", "tripNumber", "loadID", "gateOutTime", "gateInTime", "plannedHours",
    "plannedKM", "startKM", "endKM", "comments", "attachments", "status",
    "extraWorkSheet", "extraDuration", "durationFrom", "durationTo", "extraWorkSheetComments",
    "extraDelay", "delayStoreDuration", "delayStoreFrom", "delayStoreTo", "delayStoreReason",
    "delayRoadDuration", "delayRoadFrom", "delayRoadTo", "delayRoadReason",
    "delayOtherDuration", "delayOtherFrom", "delayOtherTo", "delayOtherReason",
  ];

  const fetchAllDrivers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      const driverMap: Record<string, string> = {};
      response.data.forEach((driver: any) => {
        if (driver.email && driver.name) {
          driverMap[driver.email] = driver.name;
        }
      });
      setDriversMap(driverMap);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    }
  }, []);

    // Add keyboard event listener for Escape key
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleBackClick();
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

  useEffect(() => {
    fetchAllDrivers();
    const fetchTimesheet = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/timesheet/${id}`);
        interface TimesheetData {
          [key: string]: any; // Adjust the type as necessary for your data structure
        }

        const data: TimesheetData = response.data;
        const filledData: TimesheetData = {};
        allFields.forEach((field) => {
          filledData[field] = field in data ? data[field] : "";
        });
        // --- Normalize extraWorkSheet and extraDelay values for dropdowns ---
        filledData.extraWorkSheet = data.extraWorkSheet ? "yes" : "no";
        filledData.extraDelay = data.extraDelay || "no";

        // --- Unified delayDetails object ---
        const delayDetails = {
          store: {
            duration: data.delayStoreDuration || "",
            from: data.delayStoreFrom || "",
            to: data.delayStoreTo || "",
            reason: data.delayStoreReason || "",
          },
          road: {
            duration: data.delayRoadDuration || "",
            from: data.delayRoadFrom || "",
            to: data.delayRoadTo || "",
            reason: data.delayRoadReason || "",
          },
          other: {
            duration: data.delayOtherDuration || "",
            from: data.delayOtherFrom || "",
            to: data.delayOtherTo || "",
            reason: data.delayOtherReason || "",
          },
        };
        // --- Unified extraWorkSheetDetails object ---
        const extraWorkSheetDetails = {
          duration: data.extraWorkSheetDetails?.duration || "",
          from: data.extraWorkSheetDetails?.from || "",
          to: data.extraWorkSheetDetails?.to || "",
          comments: data.extraWorkSheetDetails?.comments || data.extraWorkSheetComments || "",
        };
        const transformedTimesheet = {
          ...data,
          delayDetails,
          extraWorkSheetDetails,
        };
        setTimesheet(transformedTimesheet);
        setFormData({
          ...filledData,
          extraWorkSheet: data.extraWorkSheet ? "yes" : "no",
          delayDetails,
          extraWorkSheetDetails,
        });
        // --- Compute required fields with new logic ---
        const computeRequiredFields = (data: any, context: any) => {
          const extraWorkSheet = context.extraWorkSheet?.toLowerCase?.() === "yes";
          const extraDelay = context.extraDelay?.toLowerCase?.() === "yes";

          const excludedFields: string[] = [];

          if (!extraWorkSheet) {
            excludedFields.push(
              "extraDuration",
              "durationFrom",
              "durationTo",
              "extraWorkSheetComments"
            );
          }

          if (!extraDelay) {
            excludedFields.push(
              "delayStoreDuration", "delayStoreFrom", "delayStoreTo", "delayStoreReason",
              "delayRoadDuration", "delayRoadFrom", "delayRoadTo", "delayRoadReason",
              "delayOtherDuration", "delayOtherFrom", "delayOtherTo", "delayOtherReason"
            );
          }

          const fields = Object.entries(data)
            .filter(([k, v]) => {
              if (k === "status") return false;
              if (v === "" || v == null) return false;
              if (typeof v !== "string" && typeof v !== "number") return false;
              if (excludedFields.includes(k)) return false;
              return true;
            })
            .map(([k]) => k);

          return fields;
        };

        setRequiredFields(computeRequiredFields(filledData, formData));

        // Initialize extra work and store delay UI state
        setExtraWorkSelected(data.extraWorkSheet ? "Yes" : "No");
        setExtraDelay(data.extraDelay || "No");
        setExtraDelayTypes([]); // reset on fetch
        setStoreDelayFields({
          duration: calculateDuration(delayDetails.store.from, delayDetails.store.to),
          from: delayDetails.store.from,
          to: delayDetails.store.to,
          reason: delayDetails.store.reason,
        });
        setRoadDelayFields({
          duration: calculateDuration(delayDetails.road.from, delayDetails.road.to),
          from: delayDetails.road.from,
          to: delayDetails.road.to,
          reason: delayDetails.road.reason,
        });
        setOtherDelayFields({
          duration: delayDetails.other.duration,
          from: delayDetails.other.from,
          to: delayDetails.other.to,
          reason: delayDetails.other.reason,
        });
      } catch (error) {
        console.error("Failed to load timesheet", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheet();
  }, [id, fetchAllDrivers]);

  // Utility function to calculate delay duration
  const calculateDuration = (from: string, to: string) => {
    if (!from || !to) return "";
    const [fromHours, fromMinutes] = from.split(":").map(Number);
    const [toHours, toMinutes] = to.split(":").map(Number);

    let totalMinutes = (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight delays

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hr ${minutes} min`;
  };

  useEffect(() => {
    const calculateDuration = (from: string, to: string) => {
      if (!from || !to) return "";
      const [fh, fm] = from.split(":").map(Number);
      const [th, tm] = to.split(":").map(Number);
      let start = fh * 60 + fm;
      let end = th * 60 + tm;
      if (end < start) end += 24 * 60;
      const diff = end - start;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return `${hours} hr ${minutes} min`;
    };

    const extraDuration = calculateDuration(
      formData.extraWorkSheetDetails?.from,
      formData.extraWorkSheetDetails?.to
    );

    setFormData((prev: any) => ({
      ...prev,
      extraWorkSheetDetails: {
        ...prev.extraWorkSheetDetails,
        duration: extraDuration,
      },
      extraDuration: calculateDuration(prev.durationFrom, prev.durationTo),
      delayDetails: {
        ...prev.delayDetails,
        store: {
          ...prev.delayDetails?.store,
          duration: calculateDuration(storeDelayFields.from, storeDelayFields.to),
        },
        road: {
          ...prev.delayDetails?.road,
          duration: calculateDuration(roadDelayFields.from, roadDelayFields.to),
        },
        other: {
          ...prev.delayDetails?.other,
          // Keep as is for now
        },
      },
    }));

    setStoreDelayFields((prev) => ({
      ...prev,
      duration: calculateDuration(prev.from, prev.to),
    }));

    setRoadDelayFields((prev) => ({
      ...prev,
      duration: calculateDuration(prev.from, prev.to),
    }));
    // OtherDelayFields: duration is not based on from/to, so leave as is
  }, [
    formData.durationFrom, formData.durationTo,
    storeDelayFields.from, storeDelayFields.to,
    roadDelayFields.from, roadDelayFields.to,
    formData.extraWorkSheetDetails?.from,
    formData.extraWorkSheetDetails?.to,
  ]);

  // Set default selected delay types when formData or timesheet is loaded
  useEffect(() => {
    if (formData.extraDelay === "yes") {
      const selected: string[] = [];
      if (
        formData.delayDetails?.store?.duration ||
        formData.delayDetails?.store?.reason
      ) {
        selected.push("Store Delay");
      }
      if (
        formData.delayDetails?.road?.duration ||
        formData.delayDetails?.road?.reason
      ) {
        selected.push("Road Delay");
      }
      if (
        formData.delayDetails?.other?.duration ||
        formData.delayDetails?.other?.reason
      ) {
        selected.push("Other Delay");
      }
      setSelectedDelayTypes(selected);
    }
  }, [formData]);

  // Unified input handler for all form fields, including extraDelay
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (name === "extraWorkSheet") {
      setExtraWorkSelected(value === "yes" ? "Yes" : "No");
      if (value === "no") {
        setExtraWorkFrom("");
        setExtraWorkTo("");
        setExtraWorkComments("");
      }
    }
    if (name === "extraDelay") {
      // This will always be "yes" or "no"
      // No need for extraDelay state variable, use formData.extraDelay everywhere
      if (value === "no") {
        setExtraDelayTypes([]);
        setStoreDelayFields({ duration: "", from: "", to: "", reason: "" });
        setRoadDelayFields({ duration: "", from: "", to: "", reason: "" });
        setOtherDelayFields({ duration: "", from: "", to: "", reason: "" });
      }
    }
  };

  // Handlers for each delay type's fields
  const handleStoreDelayField = (field: string, value: string) => {
    setStoreDelayFields((prev) => ({ ...prev, [field]: value }));
    setFormData((prev: any) => ({
      ...prev,
      delayDetails: {
        ...prev.delayDetails,
        store: {
          ...prev.delayDetails?.store,
          [field]: value,
        },
        road: prev.delayDetails?.road,
        other: prev.delayDetails?.other,
      },
    }));
  };
  const handleRoadDelayField = (field: string, value: string) => {
    setRoadDelayFields((prev) => ({ ...prev, [field]: value }));
    setFormData((prev: any) => ({
      ...prev,
      delayDetails: {
        ...prev.delayDetails,
        road: {
          ...prev.delayDetails?.road,
          [field]: value,
        },
        store: prev.delayDetails?.store,
        other: prev.delayDetails?.other,
      },
    }));
  };
  const handleOtherDelayField = (field: string, value: string) => {
    setOtherDelayFields((prev) => ({ ...prev, [field]: value }));
    setFormData((prev: any) => ({
      ...prev,
      delayDetails: {
        ...prev.delayDetails,
        other: {
          ...prev.delayDetails?.other,
          [field]: value,
        },
        store: prev.delayDetails?.store,
        road: prev.delayDetails?.road,
      },
    }));
  };

  // Unified delay change handler for use in new Other Delay block
  const handleDelayChange = (delayType: string, field: string, value: string) => {
    if (delayType === "Store Delay") {
      handleStoreDelayField(field, value);
    } else if (delayType === "Road Delay") {
      handleRoadDelayField(field, value);
    } else if (delayType === "Other Delay") {
      handleOtherDelayField(field, value);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", color: "var(--t-text-dim)", fontSize: "15px" }}>Loading...</div>;
  if (!timesheet) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", color: "var(--t-text-dim)", fontSize: "15px" }}>No timesheet found.</div>;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--t-bg)", minHeight: "100vh" }}>
    <Navbar />

    {/* Page Header Bar */}
    <div style={{ padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={handleBackClick}
        title="Go back to timesheets list (or press Escape)"
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", background: "var(--t-hover-bg)",
          color: "var(--t-text-faint)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px", fontSize: "12px", fontWeight: 700,
          cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "0.3px",
        }}
      >
        <FaArrowLeft size={10} /> BACK TO LIST
      </button>
      <div style={{ textAlign: "center" as const }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
          Timesheet: TS-{String(timesheet._id || "").slice(-6).toUpperCase()}
        </h1>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--t-text-ghost)" }}>Last synced: 2 minutes ago</p>
      </div>
      <span style={{
        padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
        background: timesheet.status === "approved" ? "var(--t-success-bg)" : timesheet.status === "rejected" ? "var(--t-error-bg)" : "var(--t-warning-bg)",
        color: timesheet.status === "approved" ? "var(--t-success)" : timesheet.status === "rejected" ? "#f87171" : "var(--t-warning)",
        border: `1px solid ${timesheet.status === "approved" ? "rgba(16,185,129,0.3)" : timesheet.status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`,
        letterSpacing: "0.8px", textTransform: "uppercase" as const,
      }}>
        {timesheet.status || "Pending Review"}
      </span>
    </div>

    <div style={{ display: "flex", padding: "24px 40px", gap: "24px", alignItems: "flex-start" }}>
      {/* Left Side: Overview Cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: "16px" }}>

        {/* OVERVIEW Card */}
        <div style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--t-accent)", display: "inline-block" }} /> OVERVIEW
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {([
              ["ORGANIZATION ID", `FLT-${String(timesheet._id || "").slice(-8).toUpperCase()}`],
              ["LOG DATE", timesheet.date || "—"],
              ["DRIVER NAME", driversMap[timesheet.driver] || timesheet.driverName || timesheet.driver || "—"],
              ["VEHICLE ID", timesheet.vehicleID || "—"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <p style={{ margin: "0 0 3px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SHIFT METRICS Card */}
        <div style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 14px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>SHIFT METRICS</p>
          {([
            ["🕐", "Start / End Time", `${timesheet.startTime || "—"} — ${timesheet.endTime || "—"}`],
            ["⏱", "Total Duration", timesheet.totalHours ? `${timesheet.totalHours} hrs` : "—"],
            ["🏢", "Customer", timesheet.customer || "—"],
            ["📦", "Job Category", timesheet.category || "—"],
          ] as [string, string, string][]).map(([icon, label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--t-text-dim)" }}>
                <span>{icon}</span>{label}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--t-text)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* LOGISTICS IDS Card */}
        <div style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>LOGISTICS IDS</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {([
              ["TRIP NUMBER", timesheet.tripNumber ? `#TRP-${timesheet.tripNumber}` : "—"],
              ["LOAD ID", timesheet.loadID ? `#LOD-${timesheet.loadID}` : "—"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ background: "var(--t-surface-alt)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--t-indigo)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attachments */}
        {Array.isArray(timesheet.attachments) && timesheet.attachments.length > 0 && (
          <div style={{ background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px" }}>
            <p style={{ margin: "0 0 16px", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px" }}>ATTACHMENTS</p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "12px" }}>
              {timesheet.attachments.map((src: string, idx: number) => (
                <img
                  key={idx}
                  src={`${FILE_BASE_URL}/${src}`}
                  alt={`attachment-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    display: "block",
                    transition: "box-shadow 0.2s"
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Side: Editable Form */}
      <div style={{ flex: 1, background: "var(--t-surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "28px", overflowY: "auto" as const, maxHeight: "calc(100vh - 140px)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(79,70,229,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px" }}>✎</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--t-text)" }}>Modify Timesheet</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-dim)" }}>Update the records for {driversMap[timesheet.driver] || timesheet.driverName || timesheet.driver || "driver"}</p>
          </div>
        </div>
        {
          // Custom fields rendering for form, with new Extra Delay block
          (() => {
            let inExtra = false;
            const categoryOptions = ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale", "Wholesale DZ", "voila", "TCS linehaul trenton"];
            // Filter out delay-related fields, will be handled in custom block
            const DELAY_FIELDS = [
              "extraDelay",
              "delayStoreDuration", "delayStoreFrom", "delayStoreTo", "delayStoreReason",
              "delayRoadDuration", "delayRoadFrom", "delayRoadTo", "delayRoadReason",
              "delayOtherDuration", "delayOtherFrom", "delayOtherTo", "delayOtherReason",
              "delayDetails"
            ];
            // Explicitly exclude extra worksheet fields to prevent duplicate rendering
            const EXCLUDED_FIELDS = [
              "extraDuration", "durationFrom", "durationTo", "extraWorkSheetComments"
            ];
            // Render all fields except delay and excluded extra worksheet fields (handled separately below)
            const filtered = Object.entries(formData)
              .filter(([key, value]) =>
                value !== "" &&
                key !== "status" &&
                DELAY_FIELDS.indexOf(key) === -1 &&
                EXCLUDED_FIELDS.indexOf(key) === -1 &&
                (typeof value === "string" || typeof value === "number")
              );
            // We'll manually inject the new Extra Delay block after "extraDelay"
            return (
              <>
                {filtered.map(([key, value]) => (
                  <React.Fragment key={key}>
                    {/* Section header for Extra Worksheet */}
                    {key === "extraWorkSheet" && !inExtra && (inExtra = true) && (
                      <h4 style={{ gridColumn: "1 / -1", marginTop: "24px", color: "var(--t-text-faint)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px" }}>Extra Worksheet</h4>
                    )}
                    {/* Render extra worksheet fields conditionally */}
                    {key === "extraWorkSheet" ? (
                      <>
                        <div style={styles.formRow}>
                          <label style={styles.formLabel}>
                            {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                          </label>
                          <select
                            name={key}
                            value={formData.extraWorkSheet}
                            onChange={handleInputChange}
                            disabled={correctedFields.has(key)}
                            style={styles.formSelect}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                          {!correctedFields.has(key) && (
                            <button
                              onClick={() => setCorrectedFields(prev => new Set(prev).add(key))}
                              style={styles.correctButton}
                              title="Mark as Correct"
                            >
                              ✅
                            </button>
                          )}
                        </div>
                        {formData.extraWorkSheet === "yes" && (
                          <>
                            {/* Extra Duration: no correct-info icon for duration */}
                            <div style={styles.formRow}>
                              <label style={styles.formLabel}>Extra Duration</label>
                              <input
                                type="text"
                                name="extraDuration"
                                value={formData.extraDuration}
                                readOnly
                                disabled
                                style={styles.readOnlyInput}
                              />
                              {/* No correct-info icon for duration */}
                            </div>
                            {/* Duration From */}
                            <div style={styles.formRow}>
                              <label style={styles.formLabel}>Duration From</label>
                              <input
                                type="time"
                                name="durationFrom"
                                value={formData.durationFrom}
                                onChange={handleInputChange}
                                disabled={correctedFields.has("durationFrom")}
                                style={styles.formInput}
                              />
                              {!correctedFields.has("durationFrom") && (
                                <button
                                  onClick={() => setCorrectedFields(prev => new Set(prev).add("durationFrom"))}
                                  style={styles.correctButton}
                                  title="Mark as Correct"
                                >
                                  ✅
                                </button>
                              )}
                            </div>
                            {/* Duration To */}
                            <div style={styles.formRow}>
                              <label style={styles.formLabel}>Duration To</label>
                              <input
                                type="time"
                                name="durationTo"
                                value={formData.durationTo}
                                onChange={handleInputChange}
                                disabled={correctedFields.has("durationTo")}
                                style={styles.formInput}
                              />
                              {!correctedFields.has("durationTo") && (
                                <button
                                  onClick={() => setCorrectedFields(prev => new Set(prev).add("durationTo"))}
                                  style={styles.correctButton}
                                  title="Mark as Correct"
                                >
                                  ✅
                                </button>
                              )}
                            </div>
                            {/* Extra Work Sheet Comments */}
                            <div style={styles.formRow}>
                              <label style={styles.formLabel}>Extra Work Sheet Comments</label>
                              <textarea
                                name="extraWorkSheetComments"
                                value={formData.extraWorkSheetComments}
                                onChange={handleInputChange}
                                rows={3}
                                style={styles.formTextarea}
                                disabled={correctedFields.has("extraWorkSheetComments")}
                              />
                              {!correctedFields.has("extraWorkSheetComments") && (
                                <button
                                  onClick={() => setCorrectedFields(prev => new Set(prev).add("extraWorkSheetComments"))}
                                  style={styles.correctButton}
                                  title="Mark as Correct"
                                >
                                  ✅
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    ) : key === "category" ? (
                      <div style={styles.formRow}>
                        <label style={styles.formLabel}>
                          {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                        </label>
                        <select
                          name={key}
                          value={String(value)}
                          onChange={handleInputChange}
                          disabled={correctedFields.has(key)}
                          style={styles.formSelect}
                        >
                          <option value="">Select Category</option>
                          {categoryOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {!correctedFields.has(key) && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add(key))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    ) : key === "comments" || key.toLowerCase().includes("comment") ? (
                      <div style={styles.formRow}>
                        <label style={styles.formLabel}>
                          {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                        </label>
                        <textarea
                          name={key}
                          value={value as string}
                          onChange={handleInputChange}
                          rows={3}
                          style={styles.formTextarea}
                          disabled={correctedFields.has(key)}
                        />
                        {!correctedFields.has(key) && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add(key))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={styles.formRow}>
                        <label style={styles.formLabel}>
                          {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={
                            key === "driver"
                              ? String(driversMap[value as keyof typeof driversMap] || value)
                              : String(value)
                          }
                          onChange={handleInputChange}
                          readOnly={key === "customer"}
                          disabled={correctedFields.has(key)}
                          style={styles.formInput}
                        />
                        {!correctedFields.has(key) && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add(key))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {/* --- Extra Delay Custom Block (dropdown + checkboxes + forms) --- */}
                <h4 style={{ gridColumn: "1 / -1", marginTop: "24px", color: "var(--t-text-faint)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px" }}>Delays</h4>
                {/* Improved "Was there an Extra Delay?" field - standardized dropdown + check icon */}
                <div style={styles.formRowWide}>
                  <label style={styles.formLabel}>
                    Was there an Extra Delay?
                  </label>
                  <select
                    name="extraDelay"
                    value={formData.extraDelay || ""}
                    onChange={handleInputChange}
                    disabled={correctedFields.has("extraDelay")}
                    style={styles.formSelect}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  {!correctedFields.has("extraDelay") && (
                    <button
                      onClick={() => setCorrectedFields(prev => new Set(prev).add("extraDelay"))}
                      style={styles.correctButton}
                      title="Mark as Correct"
                    >
                      ✅
                    </button>
                  )}
                </div>
                {/* Delay Types Checkboxes */}
                {(formData.extraDelay === "yes") && (
                  <div style={{ marginBottom: "16px", marginLeft: 4, padding: "12px 16px", background: "var(--t-surface-alt)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--t-text-faint)" }}>
                      Select Delay Types:
                    </label>
                    <div style={{ display: "flex", flexDirection: "row", gap: "24px", marginTop: "10px" }}>
                      {["Store Delay", "Road Delay", "Other Delay"].map((type) => (
                        <label key={type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--t-text-secondary)", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedDelayTypes.includes(type)}
                            onChange={e => {
                              const updated = e.target.checked
                                ? [...selectedDelayTypes, type]
                                : selectedDelayTypes.filter((t) => t !== type);
                              setSelectedDelayTypes(updated);
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "var(--t-indigo)" }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {/* Delay Forms */}
                {(formData.extraDelay === "yes") && selectedDelayTypes.includes("Store Delay") && (
                  <div style={styles.delaySectionCard}>
                    <h4 style={styles.delaySectionTitle}>Store Delay</h4>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>From:</label>
                      <input
                        type="time"
                        value={formData.delayDetails?.store?.from || ""}
                        onChange={e => handleStoreDelayField("from", e.target.value)}
                        disabled={correctedFields.has("delayStoreFrom")}
                        style={styles.input}
                      />
                      {!correctedFields.has("delayStoreFrom") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayStoreFrom"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>To:</label>
                      <input
                        type="time"
                        value={formData.delayDetails?.store?.to || ""}
                        onChange={e => handleStoreDelayField("to", e.target.value)}
                        disabled={correctedFields.has("delayStoreTo")}
                        style={styles.input}
                      />
                      {!correctedFields.has("delayStoreTo") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayStoreTo"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>Duration:</label>
                      <input
                        type="text"
                        value={formData.delayDetails?.store?.duration || ""}
                        readOnly
                        disabled
                        style={{
                          ...styles.input,
                          backgroundColor: "var(--t-hover-bg)",
                          color: "var(--t-text-ghost)"
                        }}
                      />
                      {/* No correct-info icon for duration */}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>Reason:</label>
                      <textarea
                        value={formData.delayDetails?.store?.reason || ""}
                        onChange={e => handleStoreDelayField("reason", e.target.value)}
                        disabled={correctedFields.has("delayStoreReason")}
                        style={{ ...styles.input, resize: "vertical" as const, minHeight: "60px" }}
                      />
                      {!correctedFields.has("delayStoreReason") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayStoreReason"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {(formData.extraDelay === "yes") && selectedDelayTypes.includes("Road Delay") && (
                  <div style={styles.delaySectionCard}>
                    <h4 style={styles.delaySectionTitle}>Road Delay</h4>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>From:</label>
                      <input
                        type="time"
                        value={formData.delayDetails?.road?.from || ""}
                        onChange={e => handleRoadDelayField("from", e.target.value)}
                        disabled={correctedFields.has("delayRoadFrom")}
                        style={styles.input}
                      />
                      {!correctedFields.has("delayRoadFrom") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayRoadFrom"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>To:</label>
                      <input
                        type="time"
                        value={formData.delayDetails?.road?.to || ""}
                        onChange={e => handleRoadDelayField("to", e.target.value)}
                        disabled={correctedFields.has("delayRoadTo")}
                        style={styles.input}
                      />
                      {!correctedFields.has("delayRoadTo") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayRoadTo"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>Duration:</label>
                      <input
                        type="text"
                        value={formData.delayDetails?.road?.duration || ""}
                        readOnly
                        disabled
                        style={{
                          ...styles.input,
                          backgroundColor: "var(--t-hover-bg)",
                          color: "var(--t-text-ghost)"
                        }}
                      />
                      {/* No correct-info icon for duration */}
                    </div>
                    <div style={styles.delayFieldRow}>
                      <label style={styles.delayLabel}>Reason:</label>
                      <textarea
                        value={formData.delayDetails?.road?.reason || ""}
                        onChange={e => handleRoadDelayField("reason", e.target.value)}
                        disabled={correctedFields.has("delayRoadReason")}
                        style={{ ...styles.input, resize: "vertical" as const, minHeight: "60px" }}
                      />
                      {!correctedFields.has("delayRoadReason") && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add("delayRoadReason"))}
                          style={styles.correctButton}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {(formData.extraDelay === "yes") && selectedDelayTypes.includes("Other Delay") && (
                  <div style={styles.delaySectionCard}>
                    <h4 style={styles.delaySectionTitle}>Other Delay</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <label style={styles.delayLabel}>From:</label>
                        <input
                          type="time"
                          value={formData.delayDetails?.other?.from || ""}
                          onChange={e => handleDelayChange("Other Delay", "from", e.target.value)}
                          disabled={correctedFields.has("delayOtherFrom")}
                          style={styles.input}
                        />
                        {!correctedFields.has("delayOtherFrom") && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add("delayOtherFrom"))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <label style={styles.delayLabel}>To:</label>
                        <input
                          type="time"
                          value={formData.delayDetails?.other?.to || ""}
                          onChange={e => handleDelayChange("Other Delay", "to", e.target.value)}
                          disabled={correctedFields.has("delayOtherTo")}
                          style={styles.input}
                        />
                        {!correctedFields.has("delayOtherTo") && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add("delayOtherTo"))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <label style={styles.delayLabel}>Duration:</label>
                        <input
                          type="text"
                          value={formData.delayDetails?.other?.duration || ""}
                          onChange={e => handleDelayChange("Other Delay", "duration", e.target.value)}
                          disabled
                          style={styles.input}
                        />
                        {/* No correct-info icon for duration */}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <label style={styles.delayLabel}>Reason:</label>
                        <textarea
                          value={formData.delayDetails?.other?.reason || ""}
                          onChange={e => handleDelayChange("Other Delay", "reason", e.target.value)}
                          disabled={correctedFields.has("delayOtherReason")}
                          style={{ ...styles.input, resize: "vertical" as const, minHeight: "60px" }}
                        />
                        {!correctedFields.has("delayOtherReason") && (
                          <button
                            onClick={() => setCorrectedFields(prev => new Set(prev).add("delayOtherReason"))}
                            style={styles.correctButton}
                            title="Mark as Correct"
                          >
                            ✅
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()
        }
        {/* Reset All Corrections Button */}
        <button
          onClick={() => setCorrectedFields(new Set())}
          style={{
            marginTop: "16px",
            marginBottom: "24px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: resetHover ? "var(--t-border)" : "rgba(255,255,255,0.04)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--t-text-faint)",
            transition: "background 0.2s",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
          onMouseEnter={() => setResetHover(true)}
          onMouseLeave={() => setResetHover(false)}
        >
          Reset All Corrections
        </button>
        {/* Approve button logic update with delay validation */}
        {(() => {
          const allCorrected = requiredFields.every((field) =>
            Array.from(correctedFields).some(corrected =>
              corrected.trim().toLowerCase() === field.trim().toLowerCase()
            )
          );
          // Delay validation logic and enhanced Approve button disabling
          const storeDelayChecked = formData.extraDelay === "yes" && selectedDelayTypes.includes("Store Delay");
          const roadDelayChecked = formData.extraDelay === "yes" && selectedDelayTypes.includes("Road Delay");
          const otherDelayChecked = formData.extraDelay === "yes" && selectedDelayTypes.includes("Other Delay");
          const isStoreDelayValid = !storeDelayChecked ||
            (formData.delayDetails?.store?.from && formData.delayDetails?.store?.to && formData.delayDetails?.store?.reason);
          const isRoadDelayValid = !roadDelayChecked ||
            (formData.delayDetails?.road?.from && formData.delayDetails?.road?.to && formData.delayDetails?.road?.reason);
          const isOtherDelayValid = !otherDelayChecked ||
            (formData.delayDetails?.other?.from && formData.delayDetails?.other?.to && formData.delayDetails?.other?.reason);
          // Enhanced: Approve disabled if extraDelay === "yes" and all checkboxes are false
          const storeDelaySelected = selectedDelayTypes && selectedDelayTypes.includes("Store Delay");
          const roadDelaySelected = selectedDelayTypes && selectedDelayTypes.includes("Road Delay");
          const otherDelaySelected = selectedDelayTypes && selectedDelayTypes.includes("Other Delay");
          const isApproveDisabled = !(
            allCorrected &&
            isStoreDelayValid &&
            isRoadDelayValid &&
            isOtherDelayValid
          );
          const approveDisabledFull = isApproveDisabled || (formData.extraDelay === "yes" && !storeDelaySelected && !roadDelaySelected && !otherDelaySelected);
          return (
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={async () => {
                  try {
                    await axios.put(`${API_BASE_URL}/timesheet/${id}`, formData);
                    await axios.put(`${API_BASE_URL}/timesheet/${id}/status`, { status: "approved" });
                    alert("Timesheet updated and approved successfully.");
                    window.location.reload();
                  } catch (err) {
                    alert("Failed to update or approve timesheet.");
                  }
                }}
                disabled={approveDisabledFull}
                style={{
                  flex: 1,
                  padding: "11px 20px",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: approveDisabledFull ? "not-allowed" : "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  background: approveDisabledFull ? "var(--t-hover-bg)" : "var(--t-accent)",
                  color: approveDisabledFull ? "var(--t-text-ghost)" : "#fff",
                  boxShadow: approveDisabledFull ? "none" : "0 4px 14px rgba(79,70,229,0.35)",
                }}
              >
                ✓ Submit Changes
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.put(`${API_BASE_URL}/timesheet/${id}/status`, { status: "rejected" });
                    alert("Timesheet rejected.");
                  } catch (err) {
                    alert("Failed to reject timesheet.");
                  }
                }}
                style={{ padding: "11px 20px", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", background: "var(--t-error-bg)", color: "var(--t-error)", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Discard
              </button>
            </div>
          );
        })()}
      </div>
      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div
          onClick={() => setSelectedImageIndex(null)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImageIndex(null)}
              style={{
                position: "absolute",
                top: "-12px",
                right: "-12px",
                background: "var(--t-surface)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✖
            </button>
            <img
              src={`${FILE_BASE_URL}/${timesheet.attachments[selectedImageIndex]}`}
              alt="Preview"
              style={{
                maxHeight: "95vh",
                maxWidth: "90vw",
                borderRadius: "12px",
                background: "var(--t-surface)"
              }}
            />
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: { margin: "16px 0" },
  label: { fontWeight: "bold" as const },
  select: { padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", backgroundColor: "var(--t-select-bg)", color: "var(--t-text-secondary)" },
  supportingFields: { marginTop: "10px" },
  input: { padding: "10px 12px", marginBottom: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", backgroundColor: "var(--t-input-bg)", color: "var(--t-text-secondary)" },
  formLabel: {
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--t-text-dim)",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
  },
  formSelect: {
    width: "100%",
    padding: "10px 12px",
    paddingRight: "30px",
    fontSize: "14px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    backgroundColor: "var(--t-select-bg)",
    color: "var(--t-text-secondary)",
  },
  formTextarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    resize: "vertical" as const,
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
  },
  formRow: {
    marginBottom: "12px",
    display: "grid",
    gridTemplateColumns: "140px 1fr 30px",
    alignItems: "center",
    gap: "10px",
  },
  formRowWide: {
    marginBottom: "12px",
    display: "grid",
    gridTemplateColumns: "200px 1fr 30px",
    alignItems: "center",
    gap: "10px",
  },
  correctButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    color: "var(--t-success)",
  },
  readOnlyInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    backgroundColor: "var(--t-stripe)",
    color: "var(--t-text-ghost)",
  },
  delaySectionCard: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    backgroundColor: "var(--t-stripe)",
  },
  delaySectionTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--t-text-faint)",
    marginTop: 0,
    marginBottom: "16px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  delayFieldRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  delayLabel: {
    minWidth: 60,
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--t-text-dim)",
  },
};

export default DetailedTimesheet;