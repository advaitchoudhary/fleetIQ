import React, { useState, useEffect, CSSProperties } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { API_BASE_URL } from "../utils/env";
import { FaFileInvoiceDollar, FaFilePdf, FaEnvelope, FaCalendarAlt } from "react-icons/fa";

// Define TypeScript interface for invoice items
interface InvoiceItem {
  id: number;
  name: string;
  quantity: number;
  rate: number;
  tax: string;
  amount: number;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  contact?: string;
  address?: string;
  business_name?: string;
  hst_gst?: string;
  backhaulRate?: number;
  comboRate?: number;
  extraSheetEWRate?: number;
  regularBannerRate?: number;
  wholesaleRate?: number;
  voilaRate?: number;
  tcsLinehaulTrentonRate?: number;
}

const Invoice: React.FC = () => {
  // State for Invoice Details
  const [data, setData] = useState<Driver[]>([]);
  const [items] = useState<InvoiceItem[]>([]);  // Initialize as empty
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const defaultFrom = (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d; })();
  const [customRange, setCustomRange] = useState<DateRange | undefined>({ from: defaultFrom, to: new Date() });

  const [selectedDriver, setSelectedDriver] = useState<string>("__placeholder__");
  const [timesheetsRaw, setTimesheetsRaw] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [categoryRates, setCategoryRates] = useState<Record<string, number>>({});

  const handleRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) setShowRangePicker(false);
  };

  const rangeLabel = customRange?.from && customRange?.to
    ? `${format(customRange.from, "MMM d, yyyy")} – ${format(customRange.to, "MMM d, yyyy")}`
    : "Select date range";

  // From = Organization, To = Driver
  const [fromDetails, setFromDetails] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [toDetails, setToDetails] = useState({
    name: "",
    businessName: "",
    contact: "",
    address: "",
    gst: "",
  });

  // Helper to check if a date is in range
  const isDateInRange = (dateStr: string): boolean => {
    if (!customRange?.from || !customRange?.to) return true;
    const date = new Date(dateStr);
    return date >= customRange.from && date <= customRange.to;
  };

  // For PDF: derive period string from customRange
  const invoicePeriod = customRange?.from && customRange?.to
    ? `${format(customRange.from, "yyyy-MM-dd")} - ${format(customRange.to, "yyyy-MM-dd")}`
    : "";

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    setSelectedDriver(driverId);
    const selectedDriver = data.find((driver) => driver._id === driverId);

    if (selectedDriver) {
      setToDetails({
        name: selectedDriver.name || "",
        businessName: selectedDriver.business_name || "",
        contact: selectedDriver.contact || "",
        address: selectedDriver.address || "",
        gst: selectedDriver.hst_gst || "",
      });
    }
    // Fetch timesheets for the selected driver, store unfiltered, let useEffect handle filtering
    const fetchDriverTimesheets = async () => {
      if (!selectedDriver?.email) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/timesheets?noPagination=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const driverTimesheets = response.data.data.filter(
          (t: any) => t.driver === selectedDriver.email
        );
        // Store the raw list, then let useEffect re-filter
        setTimesheetsRaw(driverTimesheets);
      } catch (error) {
        console.error("Error fetching driver timesheets:", error);
      }
    };
    fetchDriverTimesheets();
  };

  // Attention Section (Editable)
  const [attention] = useState("Ravneet Kaur");

  useEffect(() => {
    fetchDrivers().then(drivers => {
      setData(drivers);
    });
    const fetchOrgProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/organizations/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const org = res.data;
        setFromDetails({
          name: org.name || "",
          address: org.address || "",
          phone: org.phone || "",
          email: org.email || "",
        });
      } catch (error) {
        console.error("Failed to fetch org profile:", error);
      }
    };
    fetchOrgProfile();
  }, []);

  useEffect(() => {
    if (timesheets.length > 0) {
      // Placeholder: Timesheets are present
    }
  }, [timesheets, categoryRates]); // Recalculate whenever timesheets or rates change
  
  const fetchDrivers = async (): Promise<Driver[]> => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<Driver[]>(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching drivers:", error);
      return [];
    }
  };

  useEffect(() => {
    const newTotal = timesheets.reduce((acc, t) => {
      if (t.status === "approved") {
        const rate = categoryRates[t.category] || 0;
        // Calculate hours worked from start and end time (assume both are "HH:mm" strings)
        let start = new Date(`1970-01-01T${t.startTime}`);
        let end = new Date(`1970-01-01T${t.endTime}`);
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }
        const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const subtotal = hoursWorked * rate;
        return acc + subtotal;
      }
      return acc;
    }, 0);
  
    const newHST = newTotal * 0.13;
  
    setSubtotal(newTotal);
    setHst(newHST);
    setTotal(newTotal + newHST);
  }, [timesheets, categoryRates]);

  // Calculate subtotal & total
  const [subtotal, setSubtotal] = useState<number>(items.reduce((sum, item) => sum + item.amount, 0));
  const [hst, setHst] = useState<number>(items.reduce((sum, item) => (item.tax === "H" ? sum + item.amount * 0.13 : sum), 0));
  const [total, setTotal] = useState<number>(subtotal + hst);

  // Whenever raw timesheets, invoicePeriod, or custom range change, re-filter the list
  useEffect(() => {
    if (timesheetsRaw.length === 0) {
      setTimesheets([]);
      return;
    }
    const filtered = timesheetsRaw.filter((t: any) => {
      const inRange = isDateInRange(t.date);
      return inRange;
    });
    console.log("Filtered Timesheets:", filtered);
    setTimesheets(filtered);
    fetchCategoryRates();

  }, [timesheetsRaw, invoicePeriod, customRange]);

  const isGenerateDisabled = !selectedDriver || selectedDriver === "__placeholder__";

  // Generate PDF function
const generatePDF = () => {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold").setFontSize(24).text("INVOICE", 15, 20);
  doc.setFontSize(12).text("Invoice Date:", 15, 30);
  doc.setFont("helvetica", "normal").text(invoiceDate.toLocaleDateString(), 60, 30);
  doc.setFont("helvetica", "bold").text("Invoice Period:", 15, 40);
  doc.setFont("helvetica", "normal").text(invoicePeriod, 60, 40);
  doc.text("From:", 15, 55).text("To:", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.text(fromDetails.name, 15, 63).text(fromDetails.email, 15, 71).text(fromDetails.address, 15, 79).text(fromDetails.phone, 15, 87);
  doc.text(toDetails.name, 120, 63).text(toDetails.businessName, 120, 71).text(toDetails.contact, 120, 79).text(toDetails.gst, 120, 87);

  doc.setFont("helvetica", "bold");
  doc.text("Attention:", 15, 100);
  doc.setFont("helvetica", "normal");
  doc.text(attention, 60, 100);

  // Correctly formatting and calculating the timesheet entries
  const formattedTimesheets = timesheets.map(t => {
    const rate = categoryRates[t.category] || 0;
    let start = new Date(`1970-01-01T${t.startTime}`);
    let end = new Date(`1970-01-01T${t.endTime}`);
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const subtotal = (hoursWorked * rate).toFixed(2);
    return {
      date: t.date,
      category: t.category,
      hoursWorked: `${hoursWorked.toFixed(2)} hrs`, // Updated to show hours
      rate: `$${rate.toFixed(2)}`,
      subtotal: `$${subtotal}`,
      status: t.status // Ensure status is included
    };
  });
  const approvedTimesheets = formattedTimesheets.filter(row => row.status === "approved"); // Filter out rejected or pending entries

  (doc as any).autoTable({
    startY: 115,
    head: [["Date", "Category", "Total Hours", "Rate", "Subtotal"]],
    body: approvedTimesheets,
    theme: "grid"
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(16).setFont("helvetica", "bold").text(`Total: $${total.toFixed(2)}`, 140, finalY + 25);
  doc.save("invoice.pdf");
};

  const generateAndSendPDF = async () => {
    const doc = new jsPDF();
    
    // Title: INVOICE
    doc.setFont("helvetica", "bold").setFontSize(24).text("INVOICE", 15, 20);
    doc.setFontSize(12).text("Invoice Date:", 15, 30);
    doc.setFont("helvetica", "normal").text(invoiceDate.toLocaleDateString(), 60, 30);
    doc.setFont("helvetica", "bold").text("Invoice Period:", 15, 40);
    doc.setFont("helvetica", "normal").text(invoicePeriod, 60, 40);
    doc.text("From:", 15, 55).text("To:", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(fromDetails.name, 15, 63).text(fromDetails.email, 15, 71).text(fromDetails.address, 15, 79).text(fromDetails.phone, 15, 87);
    doc.text(toDetails.name, 120, 63).text(toDetails.businessName, 120, 71).text(toDetails.contact, 120, 79).text(toDetails.gst, 120, 87);
  
    // Attention
    doc.setFont("helvetica", "bold");
    doc.text("Attention:", 15, 100);
    doc.setFont("helvetica", "normal");
    doc.text(attention, 60, 100);
  
    // Format timesheet entries using hours-based calculation (same as generatePDF)
    const formattedTimesheets = timesheets.map(t => {
      const rate = categoryRates[t.category] || 0;
      let start = new Date(`1970-01-01T${t.startTime}`);
      let end = new Date(`1970-01-01T${t.endTime}`);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const subtotal = (hoursWorked * rate).toFixed(2);
      return [
        t.date,
        t.category,
        `${hoursWorked.toFixed(2)} hrs`,
        `$${rate.toFixed(2)}`,
        `$${subtotal}`,
        t.status,
      ];
    });
    const approvedTimesheets = formattedTimesheets.filter(row => row[5] === "approved").map(row => row.slice(0, 5));

    (doc as any).autoTable({
      startY: 115,
      head: [["Date", "Category", "Total Hours", "Rate", "Subtotal"]],
      body: approvedTimesheets,
      theme: "grid"
    });
  
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(16).setFont("helvetica", "bold").text(`Total: $${total.toFixed(2)}`, 140, finalY + 25);
  
    // Convert PDF to Base64
    const pdfBase64 = doc.output('datauristring');
    const base64Only = pdfBase64.split(';base64,')[1];
  
    // Send the Base64 string to the backend
    await sendInvoiceAsEmail(base64Only);
  };
  
  async function sendInvoiceAsEmail(pdfBase64: string) {
    try {
      await axios.post(`${API_BASE_URL}/timesheets/send-invoice-email`, {
        driverId: selectedDriver,
        invoicePdf: pdfBase64
      });
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    }
  }


  const fetchCategoryRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allDrivers = response.data;
      setData(allDrivers); // So dropdown still works
  
      const selected = allDrivers.find((d: any) => d._id === selectedDriver);
      if (!selected) return;
  
      const rates: Record<string, number> = {};
  
      if (selected.backhaulRate) rates["Backhaul"] = selected.backhaulRate;
      if (selected.comboRate) rates["Combo"] = selected.comboRate;
      if (selected.extraSheetEWRate) rates["Extra Sheet/E.W"] = selected.extraSheetEWRate;
      if (selected.regularBannerRate) rates["Regular/Banner"] = selected.regularBannerRate;
      if (selected.wholesaleRate) rates["Wholesale"] = selected.wholesaleRate;
      if (selected.voilaRate) rates["voila"] = selected.voilaRate;
      if (selected.tcsLinehaulTrentonRate) rates["TCS linehaul trenton"] = selected.tcsLinehaulTrentonRate;
  
      setCategoryRates(rates);
    } catch (error) {
      console.error("Failed to fetch category rates:", error);
    }
  };

  const fromFieldLabels: Record<string, string> = {
    name: "Company Name",
    address: "Address",
    phone: "Phone",
    email: "Email",
  };

  const toFieldLabels: Record<string, string> = {
    name: "Driver Name",
    businessName: "Business Name",
    contact: "Phone / Email",
    address: "Address",
    gst: "GST / HST Number",
  };

  const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    pending:  { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      <Navbar />
      <style>{`
        input:focus, select:focus {
          border-color: #4F46E5 !important;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
          outline: none;
        }
        .rdp-root {
          --rdp-day-height: 32px;
          --rdp-day-width: 32px;
          --rdp-day_button-height: 32px;
          --rdp-day_button-width: 32px;
          padding: 12px;
        }
        .rdp-month_caption {
          margin-bottom: 8px;
        }
        .rdp-caption_label {
          font-size: 14px;
          font-weight: 700;
        }
        .rdp-weekdays, .rdp-week {
          gap: 2px;
        }
        .rdp-weekday {
          font-size: 11px;
          width: 32px;
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FaFileInvoiceDollar size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Billing</p>
              <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Invoice</h1>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Generate and send invoices to drivers</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={generateAndSendPDF}
              disabled={isGenerateDisabled}
              style={{ display: "flex", alignItems: "center", gap: "7px", background: isGenerateDisabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.15)", color: isGenerateDisabled ? "rgba(255,255,255,0.35)" : "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: isGenerateDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <FaEnvelope size={13} /> Send Email
            </button>
            <button
              onClick={generatePDF}
              disabled={isGenerateDisabled}
              style={{ display: "flex", alignItems: "center", gap: "7px", background: isGenerateDisabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.15)", color: isGenerateDisabled ? "rgba(255,255,255,0.35)" : "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: isGenerateDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <FaFilePdf size={13} /> Generate PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 40px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Invoice Settings */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Invoice Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "start" }}>
            {/* Invoice Date */}
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Invoice Date</label>
              <div
                onClick={() => { setShowDatePicker(v => !v); setShowRangePicker(false); }}
                style={{ ...styles.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
              >
                <span>{format(invoiceDate, "MMM d, yyyy")}</span>
                <FaCalendarAlt size={13} style={{ color: "#9ca3af" }} />
              </div>
              {showDatePicker && (
                <>
                  <div onClick={() => setShowDatePicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>
                    <DayPicker
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(d) => { if (d) { setInvoiceDate(d); setShowDatePicker(false); } }}
                      styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0" } as React.CSSProperties }}
                    />
                  </div>
                </>
              )}
            </div>
            {/* Invoice Period */}
            <div style={{ position: "relative" }}>
              <label style={styles.label}>Invoice Period</label>
              <div
                onClick={() => { setShowRangePicker(v => !v); setShowDatePicker(false); }}
                style={{ ...styles.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ color: customRange?.from ? "#111827" : "#9ca3af" }}>{rangeLabel}</span>
                <FaCalendarAlt size={13} style={{ color: "#9ca3af" }} />
              </div>
              {showRangePicker && (
                <>
                  <div onClick={() => setShowRangePicker(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>
                    <DayPicker
                      mode="range"
                      selected={customRange}
                      onSelect={handleRangeSelect}
                      styles={{ root: { "--rdp-accent-color": "#4F46E5", "--rdp-accent-background-color": "#ede9fe", fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", margin: "0" } as React.CSSProperties }}
                    />
                  </div>
                </>
              )}
            </div>
            {/* Driver */}
            <div>
              <label style={styles.label}>Driver</label>
              <select value={selectedDriver} onChange={handleDriverChange} style={styles.input}>
                <option value="__placeholder__" disabled>Select a driver</option>
                {data.map((driver, index) => {
                  const driverId = driver._id || `missing-id-${index}`;
                  return (
                    <option key={driverId} value={driverId}>
                      {driver.name || `Unnamed Driver ${index + 1}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Billing Details */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Billing Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0", alignItems: "start" }}>
            {/* From — Organization */}
            <div style={{ padding: "20px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.8px", background: "#ede9fe", padding: "3px 8px", borderRadius: "4px" }}>From</span>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>Organization</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(Object.keys(fromDetails) as (keyof typeof fromDetails)[]).map((key) => (
                  <div key={key}>
                    <label style={styles.label}>{fromFieldLabels[key] || key}</label>
                    <input
                      type="text"
                      value={fromDetails[key]}
                      onChange={(e) => setFromDetails({ ...fromDetails, [key]: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", minHeight: "120px" }}>
              <div style={{ width: "1px", height: "40px", background: "#e5e7eb" }} />
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#9ca3af", margin: "8px 0" }}>→</div>
              <div style={{ width: "1px", height: "40px", background: "#e5e7eb" }} />
            </div>

            {/* To — Driver */}
            <div style={{ padding: "20px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px", background: "#f3f4f6", padding: "3px 8px", borderRadius: "4px" }}>To</span>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>Driver</span>
              </div>
              {selectedDriver === "__placeholder__" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "#9ca3af", fontSize: "13px", gap: "8px" }}>
                  <span style={{ fontSize: "22px" }}>👤</span>
                  Select a driver above to populate fields
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(Object.keys(toDetails) as (keyof typeof toDetails)[]).map((key) => (
                    <div key={key}>
                      <label style={styles.label}>{toFieldLabels[key] || key}</label>
                      <input
                        type="text"
                        value={toDetails[key]}
                        onChange={(e) => setToDetails({ ...toDetails, [key]: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timesheets */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Timesheets</h2>
          {timesheets.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
              {selectedDriver === "__placeholder__" ? "Select a driver to view timesheets." : "No timesheets found for the selected period."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f5f3ff", borderBottom: "2px solid #e0e7ff" }}>
                    {["Date", "Start", "End", "Total Hours", "Start KM", "End KM", "Category", "Subtotal", "Status"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((t) => {
                    const rate = categoryRates[t.category] || 0;
                    let start = new Date(`1970-01-01T${t.startTime}`);
                    let end = new Date(`1970-01-01T${t.endTime}`);
                    if (end <= start) end.setDate(end.getDate() + 1);
                    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    const rowSubtotal = (hoursWorked * rate).toFixed(2);
                    const badge = STATUS_BADGE[t.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={t._id} style={{ borderBottom: "1px solid #f0f0ff" }}>
                        <td style={styles.td}>{t.date}</td>
                        <td style={styles.td}>{t.startTime}</td>
                        <td style={styles.td}>{t.endTime}</td>
                        <td style={styles.td}>{hoursWorked.toFixed(2)} hrs</td>
                        <td style={styles.td}>{t.startKM}</td>
                        <td style={styles.td}>{t.endKM}</td>
                        <td style={{ ...styles.td, fontWeight: 500, color: "#111827" }}>{t.category}</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#111827" }}>${rowSubtotal}</td>
                        <td style={styles.td}>
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderRadius: "16px", padding: "20px 28px", minWidth: "280px", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
              <span>Subtotal</span><span style={{ color: "#374151", fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6b7280", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
              <span>HST (13%)</span><span style={{ color: "#374151", fontWeight: 500 }}>${hst.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              <span>Total</span><span style={{ color: "#4F46E5" }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  card: {
    background: "#fff",
    border: "1px solid #e0e7ff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 2px 16px rgba(79,70,229,0.07)",
  },
  sectionTitle: {
    margin: "0 0 18px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "5px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontSize: "10px",
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "13px 16px",
    color: "#374151",
    verticalAlign: "middle" as const,
  },
};

export default Invoice;