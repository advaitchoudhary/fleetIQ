import React, { useEffect, useState, useCallback, JSX } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, FILE_BASE_URL } from "../utils/env";
import Navbar from "./Navbar";

const DetailedTimesheet: React.FC = () => {
  const { id } = useParams();
  const [timesheet, setTimesheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set());
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [resetHover, setResetHover] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [driversMap, setDriversMap] = useState<Record<string, string>>({});

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

        setTimesheet(data);
        setFormData(filledData);
        setRequiredFields(
          Object.entries(filledData)
            .filter(([k, v]) =>
              v !== "" &&
              (typeof v === "string" || typeof v === "number") &&
              k !== "status"
            )
            .map(([k]) => k)
        );
      } catch (error) {
        console.error("Failed to load timesheet", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheet();
  }, [id, fetchAllDrivers]);

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

    setFormData((prev: any) => ({
      ...prev,
      extraDuration: calculateDuration(prev.durationFrom, prev.durationTo),
      delayStoreDuration: calculateDuration(prev.delayStoreFrom, prev.delayStoreTo),
      delayRoadDuration: calculateDuration(prev.delayRoadFrom, prev.delayRoadTo),
      delayOtherDuration: calculateDuration(prev.delayOtherFrom, prev.delayOtherTo)
    }));
  }, [
    formData.durationFrom, formData.durationTo,
    formData.delayStoreFrom, formData.delayStoreTo,
    formData.delayRoadFrom, formData.delayRoadTo,
    formData.delayOtherFrom, formData.delayOtherTo
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading...</p>;
  if (!timesheet) return <p>No timesheet found.</p>;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
    <Navbar />
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      {/* Left Side: Beautified Details */}
      <div style={{
        flex: 1,
        background: "#f0f0f0",
        padding: "20px",
        borderRadius: "8px",
        height: "150vh",
        overflowY: "auto"
      }}>
        <h2>Timesheet Details</h2>
        <div style={{ display: "grid", gap: "10px", fontSize: "14px" }}>
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
                  elements.push(<h4 key="extraHeader" style={{ color: "#555", marginTop: "20px" }}>Extra Worksheet</h4>);
                }
                if (key === "delayStoreDuration" && !inDelay) {
                  inDelay = true;
                  elements.push(<h4 key="delayHeader" style={{ color: "#555", marginTop: "20px" }}>Delays</h4>);
                }

                elements.push(
                  <div key={key} style={{ display: "flex" }}>
                    <strong style={{ width: "180px", color: "#333" }}>
                      {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}:
                    </strong>
                    <span style={{ color: "#555" }}>{String(displayValue)}</span>
                  </div>
                );

                return elements;
              });
          })()}
        </div>
        {Array.isArray(timesheet.attachments) && timesheet.attachments.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <h4>Attachments</h4>
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
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    display: "block"
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Side: Editable Form */}
      <div style={{ flex: 1, background: "#fff", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", height: "150vh", overflowY: "auto" }}>
        <h2>Edit Timesheet</h2>
        {
          // Collapse Empty Fields: Only show fields with non-empty values
          (() => {
            // 1. Add logic to determine which dependent fields to show
            const showExtraWorkSheetFields = String(formData.extraWorkSheet).toLowerCase() === "yes";
            const showExtraDelayFields = String(formData.extraDelay).toLowerCase() === "yes";
            let inExtra = false, inDelay = false;
            // Category dropdown options
            const categoryOptions = ["Backhaul", "Combo", "Extra Sheet/E.W", "Regular/Banner", "Wholesale", "Wholesale DZ"];
            return Object.entries(formData)
              .filter(([_, value]) => value !== "")
              .map(([key, value]) => {
                // 2. Exclude extraWorkSheet dependent fields if its value is "no"
                if (
                  !showExtraWorkSheetFields &&
                  ["extraDuration", "durationFrom", "durationTo", "extraWorkSheetComments"].includes(key)
                ) return null;
                // Ensure extraWorkSheet dropdown is always shown, regardless of value
                if (!showExtraDelayFields && key.startsWith("delay") && key !== "extraDelay") return null;
                if (key === "status") return null;
                if (!(typeof value === "string" || typeof value === "number")) return null;
                return (
                  <React.Fragment key={key}>
                    {/* Section headers for Extra Worksheet and Delays */}
                    {key === "extraWorkSheet" && !inExtra && (inExtra = true) && (
                      <h4 style={{ gridColumn: "1 / -1", marginTop: "20px", color: "#555" }}>Extra Worksheet</h4>
                    )}
                    {key === "delayStoreDuration" && !inDelay && (inDelay = true) && (
                      <h4 style={{ gridColumn: "1 / -1", marginTop: "20px", color: "#555" }}>Delays</h4>
                    )}
                    <div
                      style={{
                        marginBottom: "12px",
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 30px",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <label style={{ fontWeight: "bold" }}>
                        {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, c => c.toUpperCase())}
                      </label>
                      {key === "extraWorkSheet" && (String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "no") ? (
                        <select
                          name={key}
                          value={String(value).toLowerCase()}
                          onChange={handleChange}
                          disabled={correctedFields.has(key)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            paddingRight: "30px",
                            fontSize: "14px",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      ) : key === "extraDelay" && (String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "no") ? (
                        <select
                          name={key}
                          value={String(value).toLowerCase()}
                          onChange={handleChange}
                          disabled={correctedFields.has(key)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            paddingRight: "30px",
                            fontSize: "14px",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      ) : key === "category" ? (
                        <select
                          name={key}
                          value={value}
                          onChange={handleChange}
                          disabled={correctedFields.has(key)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            paddingRight: "30px",
                            fontSize: "14px",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                        >
                          <option value="">Select Category</option>
                          {categoryOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : key === "comments" || key.toLowerCase().includes("comment") ? (
                        <textarea
                          name={key}
                          value={value}
                          onChange={handleChange}
                          rows={3}
                          style={{
                            width: "100%",
                            padding: "8px",
                            paddingRight: "30px",
                            fontSize: "14px",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                          disabled={correctedFields.has(key)}
                        />
                      ) : (
                        // Custom field rendering for time/duration fields
                        (
                          [
                            "durationFrom", "durationTo",
                            "delayStoreFrom", "delayStoreTo",
                            "delayRoadFrom", "delayRoadTo",
                            "delayOtherFrom", "delayOtherTo"
                          ].includes(key) ? (
                            <input
                              type="time"
                              name={key}
                              value={value}
                              onChange={handleChange}
                              disabled={correctedFields.has(key)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                paddingRight: "30px",
                                fontSize: "14px",
                                border: "1px solid #ccc",
                                borderRadius: "4px"
                              }}
                            />
                          ) : [
                            "extraDuration",
                            "delayStoreDuration",
                            "delayRoadDuration",
                            "delayOtherDuration"
                          ].includes(key) ? (
                            <input
                              type="text"
                              name={key}
                              value={value}
                              readOnly
                              disabled
                              style={{
                                width: "100%",
                                padding: "8px",
                                paddingRight: "30px",
                                fontSize: "14px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                backgroundColor: "#f9f9f9",
                                color: "#888"
                              }}
                            />
                          ) : (
                          <input
                            type="text"
                            name={key}
                            value={
                              key === "driver"
                                ? driversMap[value] || value
                                : value
                            }
                            onChange={handleChange}
                            readOnly={key === "customer"}
                            disabled={correctedFields.has(key)}
                            style={{
                              width: "100%",
                              padding: "8px",
                              paddingRight: "30px",
                              fontSize: "14px",
                              border: "1px solid #ccc",
                              borderRadius: "4px"
                            }}
                          />
                          )
                        )
                      )}
                      {!correctedFields.has(key) && (
                        <button
                          onClick={() => setCorrectedFields(prev => new Set(prev).add(key))}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "18px",
                            color: "green"
                          }}
                          title="Mark as Correct"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </React.Fragment>
                );
              });
          })()
        }
        {/* Reset All Corrections Button */}
        <button
          onClick={() => setCorrectedFields(new Set())}
          style={resetHover ? {
            marginTop: "10px",
            marginBottom: "20px",
            padding: "8px 12px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            background: "#e0e0e0",
            cursor: "pointer"
          } : {
            marginTop: "10px",
            marginBottom: "20px",
            padding: "8px 12px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer"
          }}
          onMouseEnter={() => setResetHover(true)}
          onMouseLeave={() => setResetHover(false)}
        >
          Reset All Corrections
        </button>
        {/* Approve button logic update */}
        {(() => {
          const allCorrected = requiredFields.every((field) =>
            Array.from(correctedFields).some(corrected =>
              corrected.trim().toLowerCase() === field.trim().toLowerCase()
            )
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
                disabled={!allCorrected}
                style={{
                  backgroundColor: !allCorrected ? "#aaa" : "green",
                  color: "white",
                  padding: "10px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: !allCorrected ? "not-allowed" : "pointer"
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
                style={{ backgroundColor: "red", color: "white", padding: "10px", border: "none", borderRadius: "5px" }}
              >
                Reject
              </button>
            </div>
          );
        })()}
      </div>
      {/* Image Modal */}
      {selectedImageIndex !== null && (
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
            <img
              src={`${FILE_BASE_URL}/${timesheet.attachments[selectedImageIndex]}`}
              alt="Preview"
              style={{
                maxHeight: "95vh",
                maxWidth: "90vw",
                borderRadius: "8px",
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

export default DetailedTimesheet;