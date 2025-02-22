import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Define TypeScript interface for invoice items
interface InvoiceItem {
  id: number;
  name: string;
  quantity: number;
  rate: number;
  tax: string;
  amount: number;
}

const Invoice: React.FC = () => {
  // State for Invoice Details
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

  // Function to handle changes in input fields
  const handleFieldChange = (section: string, field: string, value: string) => {
    if (section === "from") {
      setFromDetails((prev) => ({ ...prev, [field]: value }));
    } else if (section === "to") {
      setToDetails((prev) => ({ ...prev, [field]: value }));
    } else if (section === "attention") {
      setAttention(value);
    }
  };

  // Function to handle table updates
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          if (field === "quantity" || field === "rate") {
            updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
          }

          return updatedItem;
        }
        return item;
      })
    );
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
      <h1 style={styles.title}>Invoice</h1>
  
      {/* Invoice Content */}
      <div ref={invoiceRef} style={styles.invoiceContainer}>
        {/* Invoice Date & Period */}
        <label>Invoice Date:</label>
        <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={styles.input} />
  
        <label>Invoice Period:</label>
        <input type="text" value={invoicePeriod} onChange={(e) => setInvoicePeriod(e.target.value)} style={styles.input} />
  
        {/* From & To Details (Editable) */}
        <div style={styles.section}>
          <div style={styles.halfWidth}>
            <h3>From:</h3>
            <input type="text" value={fromDetails.name} onChange={(e) => handleFieldChange("from", "name", e.target.value)} style={styles.input} />
            <input type="text" value={fromDetails.contact} onChange={(e) => handleFieldChange("from", "contact", e.target.value)} style={styles.input} />
            <input type="text" value={fromDetails.address} onChange={(e) => handleFieldChange("from", "address", e.target.value)} style={styles.input} />
            <input type="text" value={fromDetails.gst} onChange={(e) => handleFieldChange("from", "gst", e.target.value)} style={styles.input} />
          </div>
  
          <div style={styles.halfWidth}>
            <h3>To:</h3>
            <input type="text" value={toDetails.name} onChange={(e) => handleFieldChange("to", "name", e.target.value)} style={styles.input} />
            <input type="text" value={toDetails.address} onChange={(e) => handleFieldChange("to", "address", e.target.value)} style={styles.input} />
            <input type="text" value={toDetails.gst} onChange={(e) => handleFieldChange("to", "gst", e.target.value)} style={styles.input} />
            <input type="text" value={toDetails.phone} onChange={(e) => handleFieldChange("to", "phone", e.target.value)} style={styles.input} />
          </div>
        </div>
  
        {/* Attention Section */}
        <label>Attention:</label>
        <input type="text" value={attention} onChange={(e) => handleFieldChange("attention", "", e.target.value)} style={styles.input} />
  
        {/* Table Section */}
        <h3>Invoice Items</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input type="text" value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} style={styles.input} />
                </td>
                <td>
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} style={styles.input} />
                </td>
                <td>
                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} style={styles.input} />
                </td>
                <td>
                  <input type="text" value={item.tax} onChange={(e) => handleItemChange(index, "tax", e.target.value)} style={styles.input} />
                </td>
                <td>${item.amount.toFixed(2)}</td>
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
const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
  invoiceContainer: {
    backgroundColor: "#fff",
    padding: "30px", // Increased padding
    border: "1px solid #ddd",
    textAlign: "left" as const,
    maxWidth: "900px", // More width
    margin: "20px auto", // Center the form better
    borderRadius: "8px", // Rounded corners
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
  },
  input: {
    display: "block",
    margin: "10px 0", // More spacing between fields
    padding: "8px", // Increased padding
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    marginTop: "20px",
    borderCollapse: "collapse" as const,
  },
  th: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "12px", // More padding for better visibility
    textAlign: "left" as const,
    fontSize: "14px",
    border: "1px solid #ddd",
  },
  td: {
    border: "1px solid #ddd",
    padding: "12px", // Increased padding inside table cells
    textAlign: "left" as const,
    fontSize: "14px",
  },
  totals: {
    marginTop: "20px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  button: {
    padding: "12px 24px", // More padding for better button click area
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "20px",
    transition: "background 0.3s ease",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  halfWidth: { width: "48%" },
  section: { display: "flex", justifyContent: "space-between" },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    textTransform: "uppercase" as const, // Explicitly typed
    letterSpacing: "1px", // This is fine as a string
    textAlign: "center" as const,
    marginBottom: "20px",
    color: "#333",
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
  },
};
export default Invoice;