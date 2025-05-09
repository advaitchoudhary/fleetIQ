import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { API_BASE_URL } from "../utils/env";

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
}

const Invoice: React.FC = () => {
  // State for Invoice Details
  const [data, setData] = useState<Driver[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);  // Initialize as empty
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("__placeholder__");
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [categoryRates, setCategoryRates] = useState<Record<string, number>>({});

  const invoicePeriodOptions = [
    { label: "Last 15 Days", value: "last15" },
    { label: "Last 7 Days", value: "last7" },
    { label: "Last 30 Days", value: "last30" },
    { label: "Custom Range", value: "custom" },
  ];

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setInvoicePeriod(selectedValue);
  
    if (selectedValue === "last15") {
      setInvoicePeriod(getLast15DaysRange());
    } else if (selectedValue === "last7") {
      // implement getLast7DaysRange()
    } else if (selectedValue === "last30") {
      // implement getLast30DaysRange()
    } else if (selectedValue === "custom") {
      setIsCustomRange(true);
      setCustomRange([null, null]);
      return;
    }
    setIsCustomRange(false);
  };

  const handleCustomDateChange = (dates: [Date | null, Date | null] | null) => {
    if (!dates) return;
  
    const [start, end] = dates;
    setCustomRange([start, end]);
  
    if (start && end) {
      const formattedStart = format(start, "yyyy-MM-dd");
      const formattedEnd = format(end, "yyyy-MM-dd");
      setInvoicePeriod(`${formattedStart} - ${formattedEnd}`);
    }
    
    // Ensure dropdown stays on "Custom Range"
    setIsCustomRange(true);
  };

  // From & To Details (Editable)
  const [fromDetails, setFromDetails] = useState({
    businessName: "",
    address: "",
    gst: "",
    name: "",
    contact: "",
  });

  const [toDetails, setToDetails] = useState({
    name: "Premier Choice Employment",
    address: "745 Chelton Rd unit-21, London, ON N6M 0J1, Canada",
    gst: "GST/HST: 806154175RT0001",
    phone: "+1 (519) 280-1311",
  });

  const getLast15DaysRange = () => {
    const today = new Date();
    const last15Days = new Date();
    last15Days.setDate(today.getDate() - 14); // Get date 15 days ago
  
    return `${format(last15Days, "yyyy-MM-dd")} - ${format(today, "yyyy-MM-dd")}`;
  };

  const [invoicePeriod, setInvoicePeriod] = useState(getLast15DaysRange());

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    setSelectedDriver(driverId);
    console.log(data);
    const selectedDriver = data.find((driver) => driver._id === driverId);
    
    if (selectedDriver) {
      setFromDetails({
        businessName: selectedDriver.business_name || "",
        address: selectedDriver.address || "",
        gst: selectedDriver.hst_gst || "",
        name: selectedDriver.name || "",
        contact: selectedDriver.contact || "",
      });
    }
    // Fetch timesheets for the selected driver
    const fetchDriverTimesheets = async () => {
      if (!selectedDriver?.email) return;
  
      try {
        const response = await axios.get(`${API_BASE_URL}/timesheets`);
        const driverTimesheets = response.data.filter(
          (t: any) => t.driver === selectedDriver.email
        );
        console.log("Driver Timesheets:", driverTimesheets);
        setTimesheets(driverTimesheets);
      } catch (error) {
        console.error("Error fetching driver timesheets:", error);
      }
    };
  
    fetchDriverTimesheets();
  };

  // Attention Section (Editable)
  const [attention, setAttention] = useState("Ravneet Kaur");

  useEffect(() => {
    fetchDrivers().then(drivers => {
      setData(drivers);
    });
    fetchCategoryRates();
  }, []);

  useEffect(() => {
    if (timesheets.length > 0) {
      const subtotals = timesheets.map(timesheet => {
        const { startKM, endKM, category } = timesheet;
        const rate = categoryRates[category] || 0; // Ensure there's a fallback rate
        const distance = endKM - startKM;
        const subtotal = distance * rate;
        return {
          ...timesheet,
          subtotal: subtotal.toFixed(2) // Format subtotal for consistency
        };
      });
  
      console.log("Timesheets with calculated subtotals:", subtotals);
    }
  }, [timesheets, categoryRates]); // Recalculate whenever timesheets or rates change
  
  const fetchDrivers = async (): Promise<Driver[]> => {
    try {
      const response = await axios.get<Driver[]>(`${API_BASE_URL}/drivers`);
      return response.data;
    } catch (error) {
      console.error("Error fetching drivers:", error);
      return [];
    }
  };

  useEffect(() => {
    const newTotal = timesheets.reduce((acc, t) => {
      // Only include timesheets where the status is 'approved'
      if (t.status === "approved") {
        const rate = categoryRates[t.category] || 0;
        const subtotal = (t.endKM - t.startKM) * rate;
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

  const isGenerateDisabled = !selectedDriver || Object.values(fromDetails).some((value) => value.trim() === "");

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
  doc.text(fromDetails.name, 15, 63).text(fromDetails.contact, 15, 71).text(fromDetails.address, 15, 79).text(fromDetails.gst, 15, 87);
  doc.text(toDetails.name, 120, 63).text(toDetails.address, 120, 71).text(toDetails.gst, 120, 79).text(toDetails.phone, 120, 87);

  doc.setFont("helvetica", "bold");
  doc.text("Attention:", 15, 100);
  doc.setFont("helvetica", "normal");
  doc.text(attention, 60, 100);
  
  // Correctly formatting and calculating the timesheet entries
  const formattedTimesheets = timesheets.map(t => {
    const rate = categoryRates[t.category] || 0;
    const quantity = t.endKM - t.startKM || 0;  // Ensuring quantity is defined
    const subtotal = (quantity * rate).toFixed(2);
    return [
      t.date, 
      t.category, 
      `${quantity}`, // Correctly formatted
      `$${rate.toFixed(2)}`, 
      `$${subtotal}`
    ];
  });

  (doc as any).autoTable({
    startY: 115,
    head: [["Date", "Category", "Total KMs", "Rate", "Subtotal"]],
    body: formattedTimesheets,
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
    doc.text(fromDetails.name, 15, 63).text(fromDetails.contact, 15, 71).text(fromDetails.address, 15, 79).text(fromDetails.gst, 15, 87);
    doc.text(toDetails.name, 120, 63).text(toDetails.address, 120, 71).text(toDetails.gst, 120, 79).text(toDetails.phone, 120, 87);
  
    // Attention
    doc.setFont("helvetica", "bold");
    doc.text("Attention:", 15, 100);
    doc.setFont("helvetica", "normal");
    doc.text(attention, 60, 100);
  
    // Correctly formatting and calculating the timesheet entries
    const formattedTimesheets = timesheets.map(t => {
      const rate = categoryRates[t.category] || 0;
      const quantity = t.endKM - t.startKM || 0;  // Ensuring quantity is defined
      const subtotal = (quantity * rate).toFixed(2);
      return [
        t.date, 
        t.category, 
        `${quantity}`, // Correctly formatted
        `$${rate.toFixed(2)}`, 
        `$${subtotal}`
      ];
    });
  
    (doc as any).autoTable({
      startY: 115,
      head: [["Date", "Category", "Total KMs", "Rate", "Subtotal"]],
      body: formattedTimesheets,
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
      await axios.post(`${API_BASE_URL}/send-invoice-email`, {
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
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      const rates: Record<string, number> = {};
  
      response.data.forEach((driver: any) => {
        if (driver.backhaulRate) rates["Backhaul"] = driver.backhaulRate;
        if (driver.comboRate) rates["Combo"] = driver.comboRate;
        if (driver.extraSheetEWRate) rates["Extra Sheet/E.W"] = driver.extraSheetEWRate;
        if (driver.regularBannerRate) rates["Regular/Banner"] = driver.regularBannerRate;
        if (driver.wholesaleRate) rates["Wholesale"] = driver.wholesaleRate;
      });
  
      setCategoryRates(rates);
    } catch (error) {
      console.error("Failed to fetch category rates:", error);
    }
  };

  return (
    <div style={styles.container}>
      <Navbar />
      <h1 style={styles.title}>Invoice</h1>

      {/* Invoice Form */}
      <div style={styles.invoiceContainer}>
        {/* Invoice Date & Period */}
        <div style={styles.flexRow}>
          <div style={styles.flexColumn}>
            <label>Invoice Date:</label>
              <input
                type="date"
                value={invoiceDate.toISOString().split('T')[0]}
                onChange={(e) => setInvoiceDate(new Date(e.target.value))}
                style={styles.input}
              />
          </div>
          <div style={styles.flexColumn}>
            <label>Invoice Period:</label>
            <select
              value={isCustomRange ? "custom" : invoicePeriod}
              onChange={handlePeriodChange}
              style={styles.input}
            >
              {invoicePeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isCustomRange && (
              <DatePicker
                selected={customRange[0]}
                onChange={handleCustomDateChange}
                startDate={customRange[0]}
                endDate={customRange[1]}
                selectsRange
                inline
              />
            )}
          </div>
        </div>

        {/* From & To Details */}
        <div>
          <div style={styles.box}>
            <h3>From:</h3>
            <select value={selectedDriver} onChange={handleDriverChange} style={styles.dropdown}>
              <option value="__placeholder__" disabled>Select a Driver</option>
              {data.map((driver, index) => {
                const driverId = driver._id || `missing-id-${index}`;
                return (
                  <option key={driverId} value={driverId}>
                    {driver.name || `Unnamed Driver ${index + 1}`}
                  </option>
                );
              })}
            </select>
            
            {selectedDriver && (
            <div style={styles.detailsContainer}>
              {Object.keys(fromDetails).map((key) => (
                <input
                  key={key}
                  type="text"
                  value={fromDetails[key as keyof typeof fromDetails]}
                  onChange={(e) =>
                    setFromDetails({ ...fromDetails, [key]: e.target.value })
                  }
                  style={styles.input}
                />
              ))}
            </div>
          )}
          </div>
          <div style={styles.box}>
            <h3>To:</h3>
            {Object.keys(toDetails).map((key) => (
              <input
                key={key}
                type="text"
                value={toDetails[key as keyof typeof toDetails]}
                style={styles.input}
                readOnly
              />
            ))}
          </div>
        </div>

      {/* Timesheets Table */}
      <div style={styles.timesheetsSection}>
        <h3 style={styles.sectionTitle}>📚 Timesheets</h3>
        {timesheets.length === 0 ? (
          <p>No timesheets available for this driver.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Start KM</th>
                <th style={styles.th}>End KM</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Subtotal</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((t) => {
                const rate = categoryRates[t.category] || 0;
                const subtotal = ((t.endKM - t.startKM) * rate).toFixed(2);
                return (
                  <tr key={t._id}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.startTime}</td>
                    <td style={styles.td}>{t.endTime}</td>
                    <td style={styles.td}>{t.startKM}</td>
                    <td style={styles.td}>{t.endKM}</td>
                    <td style={styles.td}>{t.category}</td>
                    <td style={styles.td}>${subtotal}</td>
                    <td style={styles.td}>
                      {t.status === "approved" ? "✔️" : t.status === "rejected" ? "❌" : "⏳"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

        {/* Totals Section */}
        <div style={styles.totalsContainer}>
          <p style={styles.subtotal}>
            Subtotal: <span>${subtotal.toFixed(2)}</span>
          </p>
          <p style={styles.hst}>
            HST (13%): <span>${hst.toFixed(2)}</span>
          </p>
          <h2 style={styles.total}>
            Total: <span>${total.toFixed(2)}</span>
          </h2>
        </div>

        {/* Generate PDF Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', float: 'right' }}>
          <button
            onClick={generatePDF}
            style={{
              ...styles.button,
              backgroundColor: isGenerateDisabled ? "#ccc" : "#007bff",
              cursor: isGenerateDisabled ? "not-allowed" : "pointer",
            }}
            disabled={isGenerateDisabled}
          >
            Generate PDF
          </button>
          <button
            onClick={generateAndSendPDF}
            style={{
              ...styles.button,
              backgroundColor: isGenerateDisabled ? "#ccc" : "#007bff",
              cursor: isGenerateDisabled ? "not-allowed" : "pointer",
            }}
          >
            Send Invoice as Email
          </button>
        </div>
      </div>
    </div>
  );
};

// **Enhanced Styles**
const styles = {
  container: { backgroundColor: "#f8f9fa", paddingBottom: "50px" },
  invoiceContainer: { backgroundColor: "#fff", padding: "40px", maxWidth: "900px", margin: "20px auto", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  input: { display: "block", margin: "10px 0", padding: "10px", width: "80%", border: "1px solid #ccc", borderRadius: "5px" },
  table: { width: "100%", marginTop: "20px", borderCollapse: "collapse" as const },
  th: { backgroundColor: "#007bff", color: "#fff", padding: "12px", textAlign: "left" as const },
  td: { border: "1px solid #ddd", padding: "12px", textAlign: "left" as const },
  totalsContainer: {
    marginTop: "30px",
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "#ffffff", // More standard color code
    borderRadius: "12px", // Slightly larger radius for a softer look
    border: "1px solid #cccccc", // Lighter border for less visual weight
    width: "100%", // Full width for better responsiveness
    maxWidth: "600px", // Maximum width to maintain readability
    textAlign: "right" as const,
    boxShadow: "0 2px 15px rgba(0,0,0,0.1)", // Softer shadow for subtle depth
    marginLeft: "auto", // Center align the container
    marginRight: "auto"
  },
  subtotal: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333333", // Standard color for better cross-browser consistency
    marginBottom: "10px", // Slightly increased spacing
    display: "flex",
    justifyContent: "space-between",
    padding: "0 10px" // Padding for better alignment of the content within
  },
  hst: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0056b3", // Slightly darker blue for better readability
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 10px"
  },
  total: {
    fontSize: "20px", // Increased size for emphasis
    fontWeight: "bold",
    color: "#c9302c", // A more consistent branding color that's easier on the eyes
    marginTop: "10px",
    paddingTop: "12px",
    borderTop: "1px solid #eeeeee", // Lighter border for a subtler separation
    display: "flex",
    justifyContent: "space-between",
    padding: "0 10px"
  },
  button: {
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "16px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    display: "block", // Ensure it behaves as a block element
    marginLeft: "auto", // Moves it to the right inside a flex container
    marginRight: "4px", // Ensures no margin on the right
  },
  title: { fontSize: "28px", fontWeight: "bold", textAlign: "center" as const, marginBottom: "20px" },
  flexRow: { display: "flex", gap: "20px" },
  flexColumn: { flex: 1 },
  box: { backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px", marginBottom: "20px" },
  detailsContainer: { marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "10px" }, // Added spacing
  dropdown: { padding: "10px", fontSize: "16px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
  timesheetsSection: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "5px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
};

export default Invoice;