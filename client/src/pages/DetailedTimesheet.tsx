import React, { useEffect, useState, useCallback, JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, FILE_BASE_URL } from "../utils/env";
import Navbar from "./Navbar";
import { FaArrowLeft } from "react-icons/fa";

const DetailedTimesheet: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Function to handle back navigation while preserving filters
  const handleBackClick = () => {
    // Get the current search params from the URL that brought us here
    const searchParams = new URLSearchParams(location.search);
    
    // Build the back URL with preserved filters
    let backUrl = "/applications";
    const params = [];
    
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

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: "#6b7280", fontSize: "15px" }}>Loading...</div>;
  if (!timesheet) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: "#6b7280", fontSize: "15px" }}>No timesheet found.</div>;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
    <Navbar />
    <div style={{ padding: "24px 40px 0 40px" }}>
      <button
        onClick={handleBackClick}
        title="Go back to timesheets list (or press Escape)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          backgroundColor: "#fff",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background-color 0.2s, border-color 0.2s",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <FaArrowLeft size={13} /> Back
      </button>
    </div>
    <div style={{ display: "flex", padding: "20px 40px", gap: "24px" }}>
      {/* Left Side: Details */}
      <div style={{
        flex: 1,
        background: "#ffffff",
        padding: "28px",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        height: "150vh",
        overflowY: "auto"
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "20px" }}>Timesheet Details</h2>
        <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
          {(() => {
            let inExtra = false, inDelay = false;
            return Object.entries(timesheet)
              .filter(([key, value]) => {
                if (key === "updatedAt" && timesheet.createdAt === timesheet.updatedAt) return false;
                return (
                  key !== "attachments" &&
                  key !== "_id" &&
                  key !== "__v" &&
                  typeof value !== "object" &&
                  value !== ""
                );
              })
              .map(([key, value]) => {
                let displayValue = (key === "createdAt" || key === "updatedAt")
                  ? new Date(value as string | number).toLocaleString()
                  : value;
                if (key === "driver" || key === "driverName") {
                  const email = timesheet.driver;
                  const name = typeof email === "string" ? driversMap[email] : undefined;
                  displayValue = name || email || "N/A";
                }

                const elements: JSX.Element[] = [];

                if (key === "extraWorkSheet" && !inExtra) {
                  inExtra = true;
                  elements.push(<h4 key="extraHeader" style={{ color: "#374151", marginTop: "24px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Extra Worksheet</h4>);
                }
                if (key === "delayStoreDuration" && !inDelay) {
                  inDelay = true;
                  elements.push(<h4 key="delayHeader" style={{ color: "#374151", marginTop: "24px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Delays</h4>);
                }

                elements.push(
                  <div key={key} style={{ display: "flex", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <strong style={{ width: "180px", color: "#6b7280", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                      {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                    </strong>
                    <span style={{ color: "#111827", fontSize: "14px" }}>{String(displayValue)}</span>
                  </div>
                );

                return elements;
              });
          })()}
        </div>
        {Array.isArray(timesheet.attachments) && timesheet.attachments.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Attachments</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
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
                    borderRadius: "12px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    border: "1px solid #e5e7eb",
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
      <div style={{ flex: 1, background: "#ffffff", padding: "28px", border: "1px solid #e5e7eb", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)", height: "150vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "20px" }}>Edit Timesheet</h2>
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
                      <h4 style={{ gridColumn: "1 / -1", marginTop: "24px", color: "#374151", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Extra Worksheet</h4>
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
                <h4 style={{ gridColumn: "1 / -1", marginTop: "24px", color: "#374151", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Delays</h4>
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
                  <div style={{ marginBottom: "16px", marginLeft: 4, padding: "12px 16px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                      Select Delay Types:
                    </label>
                    <div style={{ display: "flex", flexDirection: "row", gap: "24px", marginTop: "10px" }}>
                      {["Store Delay", "Road Delay", "Other Delay"].map((type) => (
                        <label key={type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#374151", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedDelayTypes.includes(type)}
                            onChange={e => {
                              const updated = e.target.checked
                                ? [...selectedDelayTypes, type]
                                : selectedDelayTypes.filter((t) => t !== type);
                              setSelectedDelayTypes(updated);
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "#4F46E5" }}
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
                          backgroundColor: "#f9f9f9",
                          color: "#888"
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
                          backgroundColor: "#f9f9f9",
                          color: "#888"
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
            border: "1px solid #d1d5db",
            background: resetHover ? "#f3f4f6" : "#fff",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
            transition: "background 0.2s"
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
          return (
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
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
                disabled={
                  isApproveDisabled ||
                  (
                    formData.extraDelay === "yes" &&
                    !storeDelaySelected &&
                    !roadDelaySelected &&
                    !otherDelaySelected
                  )
                }
                style={{
                  backgroundColor: (
                    isApproveDisabled ||
                    (
                      formData.extraDelay === "yes" &&
                      !storeDelaySelected &&
                      !roadDelaySelected &&
                      !otherDelaySelected
                    )
                  ) ? "#d1d5db" : "#059669",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: (
                    isApproveDisabled ||
                    (
                      formData.extraDelay === "yes" &&
                      !storeDelaySelected &&
                      !roadDelaySelected &&
                      !otherDelaySelected
                    )
                  ) ? "not-allowed" : "pointer"
                }}
              >
                Approve
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
                style={{ backgroundColor: "#dc2626", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Reject
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
                background: "#fff",
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
                background: "#fff"
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
  select: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", backgroundColor: "#fff" },
  supportingFields: { marginTop: "10px" },
  input: { padding: "10px 12px", marginBottom: "8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" },
  formLabel: {
    fontWeight: 600,
    fontSize: "13px",
    color: "#374151",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
    transition: "border-color 0.2s",
  },
  formSelect: {
    width: "100%",
    padding: "10px 12px",
    paddingRight: "30px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  formTextarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    resize: "vertical" as const,
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
    color: "green",
  },
  readOnlyInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  delaySectionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    backgroundColor: "#f9fafb",
  },
  delaySectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
    marginTop: 0,
    marginBottom: "16px",
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
    color: "#6b7280",
  },
};

export default DetailedTimesheet;