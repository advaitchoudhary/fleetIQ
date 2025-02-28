import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";

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
  const [invoiceDate, setInvoiceDate] = useState("2025-01-31");
  const [invoicePeriod, setInvoicePeriod] = useState("2025-01-05 - 2025-01-18");

  // From & To Details (Editable)
  const [fromDetails, setFromDetails] = useState({
    name: "14042115 Canada Inc.",
    contact: "Akashdeep Singh PCE00011",
    address: "22 Gaspe Road, Brampton, ON, L6S 0A6",
    gst: "GST/HST: 726861701RT0001",
  });

  const [toDetails, setToDetails] = useState({
    name: "Premier Choice Employment",
    address: "745 Chelton Rd unit-21, London, ON N6M 0J1, Canada",
    gst: "GST/HST: 806154175RT0001",
    phone: "+1 (519) 280-1311",
  });

  // Attention Section (Editable)
  const [attention, setAttention] = useState("Ravneet Kaur");

  // Items Table State (Editable)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, name: "BANNER HOURS", quantity: 41, rate: 24, tax: "H", amount: 984 },
    { id: 2, name: "WHOLESALE HOURS", quantity: 13.25, rate: 27.5, tax: "H", amount: 364.38 },
    { id: 3, name: "COMBO HOURS", quantity: 26.5, rate: 26.5, tax: "H", amount: 702.25 },
    { id: 4, name: "ADJUSTMENT", quantity: -204.5, rate: 1, tax: "H", amount: -204.5 },
  ]);


  // Function to handle table updates
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, [field]: value, amount: field === "quantity" || field === "rate" ? Number(item.quantity) * Number(item.rate) : item.amount }
          : item
      )
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
  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  // Reference for the invoice content
  const invoiceRef = useRef<HTMLDivElement>(null);

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
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.flexColumn}>
            <label>Invoice Period:</label>
            <input type="text" value={invoicePeriod} onChange={(e) => setInvoicePeriod(e.target.value)} style={styles.input} />
          </div>
        </div>

        {/* From & To Details */}
        <div>
          <div style={styles.box}>
            <h3>From:</h3>
            <select style={styles.dropdown}>
              {data.map((driver) => (
                <option key={driver._id} value={driver.name}>{driver.name}</option>
              ))}
            </select>
              {Object.keys(fromDetails).map((key) => (
              <input key={key} type="text" value={fromDetails[key as keyof typeof fromDetails]} style={styles.input} />
            ))}
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
                {["name", "quantity", "rate", "tax"].map((field) => (
                  <td key={field} style={styles.td}>
                    <input type="text" value={item[field as keyof InvoiceItem]} onChange={(e) => handleItemChange(index, field as keyof InvoiceItem, e.target.value)} style={styles.input} />
                  </td>
                ))}
                <td style={styles.td}>${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={styles.totals}>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>HST (13%): ${hst.toFixed(2)}</p>
          <h2>Total: ${total.toFixed(2)}</h2>
        </div>

        {/* Generate PDF Button */}
        <button onClick={generatePDF} style={styles.button}>Generate PDF</button>
      </div>
    </div>
  );
};

// **Enhanced Styles**
const styles = {
  container: { backgroundColor: "#f8f9fa", paddingBottom: "50px" },
  invoiceContainer: { backgroundColor: "#fff", padding: "40px", maxWidth: "900px", margin: "20px auto", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" },
  input: { display: "block", margin: "10px 0", padding: "10px", width: "100%", border: "1px solid #ccc", borderRadius: "5px" },
  table: { width: "100%", marginTop: "20px", borderCollapse: "collapse" as const },
  th: { backgroundColor: "#007bff", color: "#fff", padding: "12px", textAlign: "left" as const },
  td: { border: "1px solid #ddd", padding: "12px", textAlign: "left" as const },
  totals: { marginTop: "20px", fontSize: "18px", fontWeight: "bold" },
  button: { backgroundColor: "#007bff", color: "#fff", fontSize: "16px", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" },
  title: { fontSize: "28px", fontWeight: "bold", textAlign: "center" as const, marginBottom: "20px" },
  flexRow: { display: "flex", gap: "20px" },
  flexColumn: { flex: 1 },
  box: { backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px", marginBottom: "20px" },
  dropdown: { padding: "10px", fontSize: "16px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
  
};

export default Invoice;