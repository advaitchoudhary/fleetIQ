import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

// Define TypeScript interface for invoice items
interface InvoiceItem {
  id: number;
  name: string;
  quantity: number;
  rate: number;
  tax: string;
  amount: number;
}

const API_BASE_URL = "http://localhost:8000/api";

const Invoice: React.FC = () => {
  // State for Invoice Details
  const [data, setData] = useState<any[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("");


  const invoicePeriodOptions = [
    { label: "Last 15 Days", value: "" },
    { label: "Last 7 Days", value: "" },
    { label: "Last 30 Days", value: "" },
    { label: "Custom Range", value: "custom" },
  ];

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setInvoicePeriod(selectedValue);
  
    if (selectedValue === "custom") {
      setIsCustomRange(true); // Show DatePicker
      setCustomRange([null, null]); // Reset selection
    } else {
      setIsCustomRange(false); // Hide DatePicker
    }
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
    name: "",
    contact: "",
    address: "",
    gst: "",
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

  const [invoicePeriod, setInvoicePeriod] = useState(getLast15DaysRange()); // Dynamic "Last 7 Days"

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    setSelectedDriver(driverId);
    
    const selectedDriver = data.find((driver) => driver._id === driverId);
    
    if (selectedDriver) {
      setFromDetails({
        name: selectedDriver.name || "",
        contact: selectedDriver.contact || "",
        address: selectedDriver.address || "",
        gst: selectedDriver.hst_gst || "",
      });
    }
  };

  // Attention Section (Editable)
  const [attention, setAttention] = useState("Ravneet Kaur");

  // Items Table State (Editable)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, name: "BANNER HOURS", quantity: 41, rate: 24, tax: "H", amount: 984 },
    { id: 2, name: "WHOLESALE HOURS", quantity: 13.25, rate: 27.5, tax: "H", amount: 364.38 },
    { id: 3, name: "COMBO HOURS", quantity: 26.5, rate: 26.5, tax: "H", amount: 702.25 },
    { id: 4, name: "ADJUSTMENT", quantity: 204.5, rate: 1, tax: "H", amount: 204.5 },
  ]);


  // Function to handle table updates
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
  
          // Ensure 'name' is never undefined
          if (!updatedItem.name) {
            updatedItem.name = "";
          }
  
          // Recalculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
  
            // Prevent negative amounts
            if (updatedItem.amount < 0) {
              updatedItem.amount = 0;
            }
          }
  
          return updatedItem;
        }
        return item;
      })
    );
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      console.log(response);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  // Calculate subtotal & total
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const hst = items.reduce((sum, item) => (item.tax === "H" ? sum + item.amount * 0.13 : sum), 0);
  const total = subtotal + hst;

  // Reference for the invoice content
  const invoiceRef = useRef<HTMLDivElement>(null);
  const isGenerateDisabled = !selectedDriver || Object.values(fromDetails).some((value) => value.trim() === "");

  // Generate PDF function
  const generatePDF = () => {
    const doc = new jsPDF();

    // Title: INVOICE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INVOICE", 15, 20);

    // Invoice Date & Period
    doc.setFontSize(12);
    doc.text("Invoice Date:", 15, 30);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceDate, 60, 30);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Period:", 15, 40);
    doc.setFont("helvetica", "normal");
    doc.text(invoicePeriod, 60, 40);

    // FROM & TO Details
    doc.setFont("helvetica", "bold");
    doc.text("From:", 15, 55);
    doc.text("To:", 120, 55);

    doc.setFont("helvetica", "normal");
    doc.text(fromDetails.name, 15, 63);
    doc.text(fromDetails.contact, 15, 71);
    doc.text(fromDetails.address, 15, 79);
    doc.text(fromDetails.gst, 15, 87);

    doc.text(toDetails.name, 120, 63);
    doc.text(toDetails.address, 120, 71);
    doc.text(toDetails.gst, 120, 79);
    doc.text(toDetails.phone, 120, 87);

    // Attention
    doc.setFont("helvetica", "bold");
    doc.text("Attention:", 15, 100);
    doc.setFont("helvetica", "normal");
    doc.text(attention, 60, 100);

    // Table of Invoice Items
    (doc as any).autoTable({
      startY: 115,
      head: [["Item", "Quantity", "Rate", "Tax", "Amount"]],
      body: items.map((item) => [
        item.name,
        item.quantity,
        `$${item.rate.toFixed(2)}`,
        item.tax,
        `$${item.amount.toFixed(2)}`,
      ]),
      theme: "grid",
      styles: { halign: "center" },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });

    // Calculate Y Position after Table
    let finalY = (doc as any).autoTable.previous.finalY + 10;

    // Subtotal & HST
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`HST (13%): $${hst.toFixed(2)}`, 140, finalY + 10);

    // Total
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 25);

    // Save the PDF
    doc.save("invoice.pdf");
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
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.flexColumn}>
            <label>Invoice Period:</label>
            <select value={isCustomRange ? "custom" : invoicePeriod} onChange={handlePeriodChange} style={styles.input}>
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
              <option value="" disabled>Select a Driver</option>
              {data.map((driver) => (
                <option key={driver._id} value={driver._id}>{driver.name}</option>
              ))}
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
              <input key={key} type="text" value={toDetails[key as keyof typeof toDetails]} style={styles.input} />
            ))}
          </div>
        </div>

        {/* Invoice Table */}
        <h3>Invoice Items</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Item", "Quantity", "Rate", "Tax", "Amount"].map((heading) => (
                <th key={heading} style={styles.th}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
  {items.map((item, index) => (
    <tr key={index}>
      <td style={styles.td}>
        <input
          type="text"
          value={item.name} // Ensure 'name' is properly assigned
          onChange={(e) => handleItemChange(index, "name", e.target.value)}
          style={styles.input}
        />
      </td>
      <td style={styles.td}>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
          style={styles.input}
        />
      </td>
      <td style={styles.td}>
        <input
          type="number"
          value={item.rate}
          onChange={(e) => handleItemChange(index, "rate", Number(e.target.value))}
          style={styles.input}
        />
      </td>
      <td style={styles.td}>
        <input
          type="text"
          value={item.tax}
          onChange={(e) => handleItemChange(index, "tax", e.target.value)}
          style={styles.input}
        />
      </td>
      <td style={styles.td}>${item.amount.toFixed(2)}</td>
    </tr>
  ))}
</tbody>
        </table>

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
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "2px solid #ddd",
    width: "fit-content",
    minWidth: "280px",
    textAlign: "right",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  subtotal: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
  },
  hst: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0073e6",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
  },
  total: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#d9534f",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "2px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
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
  },
  title: { fontSize: "28px", fontWeight: "bold", textAlign: "center" as const, marginBottom: "20px" },
  flexRow: { display: "flex", gap: "20px" },
  flexColumn: { flex: 1 },
  box: { backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px", marginBottom: "20px" },
  detailsContainer: { marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "10px" }, // Added spacing
  dropdown: { padding: "10px", fontSize: "16px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
  
};

export default Invoice;