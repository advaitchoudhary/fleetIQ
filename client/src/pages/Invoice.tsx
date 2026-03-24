import React, { useState, useEffect, CSSProperties } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { API_BASE_URL } from "../utils/env";
import { FaFilePdf, FaArrowRight, FaInfoCircle, FaClipboardList } from "react-icons/fa";

interface InvoiceItem {
  id: number; name: string; quantity: number; rate: number; tax: string; amount: number;
}

interface Driver {
  _id: string; name: string; email: string; contact?: string; address?: string;
  business_name?: string; hst_gst?: string;
  backhaulRate?: number; comboRate?: number; extraSheetEWRate?: number;
  regularBannerRate?: number; wholesaleRate?: number; voilaRate?: number;
  tcsLinehaulTrentonRate?: number;
}

const Invoice: React.FC = () => {
  const [data, setData]                   = useState<Driver[]>([]);
  const [items]                           = useState<InvoiceItem[]>([]);
  const [invoiceDate, setInvoiceDate]     = useState<Date>(new Date());
  const [notes, setNotes]                 = useState("");

  const defaultFrom = (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d; })();
  const [customRange, setCustomRange]     = useState<DateRange | undefined>({ from: defaultFrom, to: new Date() });

  const [selectedDriver, setSelectedDriver]     = useState<string>("__placeholder__");
  const [timesheetsRaw, setTimesheetsRaw]       = useState<any[]>([]);
  const [timesheets, setTimesheets]             = useState<any[]>([]);
  const [categoryRates, setCategoryRates]       = useState<Record<string, number>>({});

  const [fromDetails, setFromDetails] = useState({ name: "", address: "", phone: "", email: "" });
  const [toDetails,   setToDetails]   = useState({ name: "", businessName: "", contact: "", address: "", gst: "" });

  const [subtotal, setSubtotal] = useState<number>(items.reduce((s, i) => s + i.amount, 0));
  const [hst,      setHst]      = useState<number>(items.reduce((s, i) => i.tax === "H" ? s + i.amount * 0.13 : s, 0));
  const [total,    setTotal]    = useState<number>(subtotal + hst);

  const isDateInRange = (dateStr: string): boolean => {
    if (!customRange?.from || !customRange?.to) return true;
    const date = new Date(dateStr);
    return date >= customRange.from && date <= customRange.to;
  };

  const invoicePeriod = customRange?.from && customRange?.to
    ? `${format(customRange.from, "yyyy-MM-dd")} - ${format(customRange.to, "yyyy-MM-dd")}`
    : "";

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    setSelectedDriver(driverId);
    const driver = data.find((d) => d._id === driverId);
    if (driver) {
      setToDetails({ name: driver.name || "", businessName: driver.business_name || "", contact: driver.contact || "", address: driver.address || "", gst: driver.hst_gst || "" });
    }
    const fetchDriverTimesheets = async () => {
      if (!driver?.email) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/timesheets?noPagination=true`, { headers: { Authorization: `Bearer ${token}` } });
        setTimesheetsRaw(res.data.data.filter((t: any) => t.driver === driver.email));
      } catch (err) { console.error("Error fetching driver timesheets:", err); }
    };
    fetchDriverTimesheets();
  };

  useEffect(() => {
    fetchDrivers().then(setData);
    axios.get(`${API_BASE_URL}/organizations/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => {
        const o = res.data;
        setFromDetails({ name: o.name || "", address: o.address || "", phone: o.phone || "", email: o.email || "" });
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timesheetsRaw.length === 0) { setTimesheets([]); return; }
    setTimesheets(timesheetsRaw.filter((t: any) => isDateInRange(t.date)));
    fetchCategoryRates();
  }, [timesheetsRaw, customRange]);

  useEffect(() => {
    const newTotal = timesheets.reduce((acc, t) => {
      if (t.status !== "approved") return acc;
      const rate = categoryRates[t.category] || 0;
      let start = new Date(`1970-01-01T${t.startTime}`);
      let end   = new Date(`1970-01-01T${t.endTime}`);
      if (end <= start) end.setDate(end.getDate() + 1);
      return acc + (end.getTime() - start.getTime()) / 3600000 * rate;
    }, 0);
    const newHST = newTotal * 0.13;
    setSubtotal(newTotal); setHst(newHST); setTotal(newTotal + newHST);
  }, [timesheets, categoryRates]);

  const fetchDrivers = async (): Promise<Driver[]> => {
    try {
      const res = await axios.get<Driver[]>(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      return res.data;
    } catch { return []; }
  };

  const fetchCategoryRates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      const all = res.data;
      setData(all);
      const sel = all.find((d: any) => d._id === selectedDriver);
      if (!sel) return;
      const rates: Record<string, number> = {};
      if (sel.backhaulRate)              rates["Backhaul"]               = sel.backhaulRate;
      if (sel.comboRate)                 rates["Combo"]                  = sel.comboRate;
      if (sel.extraSheetEWRate)          rates["Extra Sheet/E.W"]        = sel.extraSheetEWRate;
      if (sel.regularBannerRate)         rates["Regular/Banner"]         = sel.regularBannerRate;
      if (sel.wholesaleRate)             rates["Wholesale"]              = sel.wholesaleRate;
      if (sel.voilaRate)                 rates["voila"]                  = sel.voilaRate;
      if (sel.tcsLinehaulTrentonRate)    rates["TCS linehaul trenton"]   = sel.tcsLinehaulTrentonRate;
      setCategoryRates(rates);
    } catch (err) { console.error("Failed to fetch category rates:", err); }
  };

  const getApprovedRows = () =>
    timesheets
      .filter((t) => t.status === "approved")
      .map((t) => {
        const rate = categoryRates[t.category] || 0;
        let start = new Date(`1970-01-01T${t.startTime}`);
        let end   = new Date(`1970-01-01T${t.endTime}`);
        if (end <= start) end.setDate(end.getDate() + 1);
        const hrs = (end.getTime() - start.getTime()) / 3600000;
        return [t.date, t.category, `${hrs.toFixed(2)} hrs`, `$${rate.toFixed(2)}`, `$${(hrs * rate).toFixed(2)}`];
      });

  const buildPDFDoc = () => {
    const doc = new jsPDF();
    const pw = 210;
    const approvedRows = getApprovedRows();

    // ── Page background ──
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, pw, 297, "F");

    // ── Card background ──
    doc.setFillColor(22, 27, 34);
    doc.roundedRect(8, 8, pw - 16, 268, 4, 4, "F");

    // ── Logo ──
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(14, 13, 9, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
    doc.text("Fleet", 25, 19.5);
    doc.setTextColor(129, 140, 248);
    doc.text("IQ", 25 + doc.getTextWidth("Fleet"), 19.5);

    // ── INVOICE title ──
    doc.setFont("helvetica", "bold").setFontSize(30).setTextColor(248, 250, 252);
    doc.text("INVOICE", 14, 46);

    // ── Right: dates ──
    const rx = 138;
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(107, 114, 128);
    doc.text("INVOICE DATE", rx, 16);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(248, 250, 252);
    doc.text(invoiceDate.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }), rx, 25);

    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(107, 114, 128);
    doc.text("INVOICE PERIOD", rx, 35);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(209, 213, 219);
    doc.text(invoicePeriod || "—", rx, 43);

    // Invoice number badge
    const invNum = `#INV-${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}${String(invoiceDate.getDate()).padStart(2, "0")}`;
    doc.setFillColor(25, 22, 65);
    doc.roundedRect(rx - 1, 47, 57, 7, 2, 2, "F");
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(129, 140, 248);
    doc.text(invNum, rx + 27, 51.8, { align: "center" });

    // ── Divider ──
    doc.setDrawColor(35, 40, 52);
    doc.setLineWidth(0.4);
    doc.line(14, 58, pw - 14, 58);

    // ── FROM / TO ──
    const ftY = 65;
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(75, 85, 99);
    doc.text("FROM", 14, ftY);
    doc.setDrawColor(35, 40, 52);
    doc.setLineWidth(0.4);
    doc.line(107, 60, 107, 108);
    doc.text("TO", 115, ftY);

    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(248, 250, 252);
    doc.text(fromDetails.name || "—", 14, ftY + 9);
    doc.text(toDetails.name || "—", 115, ftY + 9);

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(156, 163, 175);
    const fromLines = [fromDetails.address, fromDetails.email, fromDetails.phone].filter(Boolean) as string[];
    const toLines = [toDetails.businessName, toDetails.contact, toDetails.address, toDetails.gst ? `GST/HST: ${toDetails.gst}` : ""].filter(Boolean) as string[];
    fromLines.forEach((line, i) => doc.text(line, 14, ftY + 17 + i * 6));
    toLines.forEach((line, i) => doc.text(line, 115, ftY + 17 + i * 6));

    // ── Table ──
    const tableY = 117;
    (doc as any).autoTable({
      startY: tableY,
      head: [["DATE", "CATEGORY", "HOURS", "RATE", "SUBTOTAL"]],
      body: approvedRows.length > 0 ? approvedRows : [["—", "No approved timesheets in period", "—", "—", "—"]],
      theme: "plain",
      headStyles: {
        fillColor: [22, 27, 34],
        textColor: [75, 85, 99],
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
        lineColor: [40, 46, 58],
        lineWidth: 0.3,
      },
      bodyStyles: {
        fillColor: [22, 27, 34],
        textColor: [209, 213, 219],
        fontSize: 9.5,
        cellPadding: { top: 8, bottom: 8, left: 6, right: 6 },
        lineColor: [30, 35, 45],
        lineWidth: 0.25,
      },
      alternateRowStyles: { fillColor: [17, 22, 30] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 72 },
        2: { cellWidth: 26, halign: "right" as const },
        3: { cellWidth: 24, halign: "right" as const },
        4: { cellWidth: 28, halign: "right" as const, fontStyle: "bold", textColor: [248, 250, 252] },
      },
      margin: { left: 12, right: 12 },
    });

    // ── Summary ──
    const finalY = (doc as any).lastAutoTable.finalY;
    let sy = finalY + 13;

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(156, 163, 175);
    doc.text("Subtotal", 140, sy);
    doc.text(`$${subtotal.toFixed(2)}`, 199, sy, { align: "right" });

    sy += 8;
    doc.text("HST (13%)", 140, sy);
    doc.text(`$${hst.toFixed(2)}`, 199, sy, { align: "right" });

    doc.setDrawColor(40, 46, 58);
    doc.setLineWidth(0.4);
    doc.line(138, sy + 4, 200, sy + 4);

    sy += 13;
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(107, 114, 128);
    doc.text("TOTAL", 140, sy);
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(129, 140, 248);
    doc.text(`$${total.toFixed(2)}`, 199, sy, { align: "right" });

    // ── Footer ──
    const footerY = sy + 20;
    doc.setDrawColor(30, 35, 45);
    doc.setLineWidth(0.35);
    doc.line(12, footerY - 6, pw - 12, footerY - 6);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(75, 85, 99);
    doc.text("www.fleetiq.ca", 14, footerY + 1);
    doc.text("support@fleetiq.ca", pw / 2, footerY + 1, { align: "center" });
    doc.text("© 2026 FleetIQ Inc. All rights reserved.", pw - 14, footerY + 1, { align: "right" });

    // ── Notes ──
    if (notes.trim()) {
      const notesY = footerY + 15;
      doc.setFillColor(17, 22, 30);
      doc.roundedRect(12, notesY - 5, pw - 24, 22, 3, 3, "F");
      doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(75, 85, 99);
      doc.text("NOTES", 22, notesY + 2);
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(156, 163, 175);
      doc.text(doc.splitTextToSize(notes, 168), 22, notesY + 9);
    }

    return doc;
  };

  const generatePDF = () => {
    buildPDFDoc().save("invoice.pdf");
  };

  const generateAndSendPDF = async () => {
    const doc = buildPDFDoc();
    const base64 = doc.output("datauristring").split(";base64,")[1];
    try {
      await axios.post(`${API_BASE_URL}/timesheets/send-invoice-email`, { driverId: selectedDriver, invoicePdf: base64 });
      alert("Invoice sent successfully!");
    } catch { alert("Failed to send invoice"); }
  };

  const isDisabled = !selectedDriver || selectedDriver === "__placeholder__";

  const STATUS_BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
    approved: { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)",  color: "#34d399", label: "Approved" },
    rejected: { bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.25)",   color: "#f87171", label: "Rejected" },
    pending:  { bg: "rgba(234,179,8,0.1)",    border: "rgba(234,179,8,0.25)",   color: "#fbbf24", label: "Pending"  },
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0d1117", minHeight: "100vh", color: "#fff" }}>
      <Navbar />
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input:focus, select:focus, textarea:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15) !important; outline: none; }
        select option { background: #1a1d27; color: #f3f4f6; }
      `}</style>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "36px 40px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
              Generate Invoice
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              Create and distribute billing for active fleet drivers.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={generatePDF}
              disabled={isDisabled}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: isDisabled ? "#4b5563" : "#e5e7eb", fontSize: "13px", fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <FaFilePdf size={13} /> Generate PDF
            </button>
            <button
              onClick={generateAndSendPDF}
              disabled={isDisabled}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", background: isDisabled ? "#2d2f3a" : "#4F46E5", border: "none", borderRadius: "10px", color: isDisabled ? "#4b5563" : "#fff", fontSize: "13px", fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: isDisabled ? "none" : "0 4px 14px rgba(79,70,229,0.35)" }}
            >
              <FaArrowRight size={12} /> Send Email
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Invoice Settings card */}
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(79,70,229,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#818CF8"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                </div>
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>Invoice Settings</h2>
              </div>

              {/* Driver */}
              <div style={{ marginBottom: "18px" }}>
                <label style={styles.label}>DRIVER</label>
                <select value={selectedDriver} onChange={handleDriverChange} style={styles.input}>
                  <option value="__placeholder__" disabled>Select a driver...</option>
                  {data.map((d, i) => (
                    <option key={d._id || i} value={d._id}>{d.name || `Driver ${i + 1}`}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Date */}
              <div style={{ marginBottom: "18px" }}>
                <label style={styles.label}>INVOICE DATE</label>
                <input
                  type="date"
                  value={format(invoiceDate, "yyyy-MM-dd")}
                  onChange={(e) => e.target.value && setInvoiceDate(new Date(e.target.value + "T12:00:00"))}
                  style={styles.input}
                />
              </div>

              {/* Billing Period */}
              <div>
                <label style={styles.label}>BILLING PERIOD</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="date"
                    value={customRange?.from ? format(customRange.from, "yyyy-MM-dd") : ""}
                    onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value ? new Date(e.target.value + "T12:00:00") : undefined }))}
                    style={styles.input}
                  />
                  <input
                    type="date"
                    value={customRange?.to ? format(customRange.to, "yyyy-MM-dd") : ""}
                    onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value ? new Date(e.target.value + "T12:00:00") : undefined }))}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Population info box */}
            <div style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: "12px", padding: "16px 18px", display: "flex", gap: "12px" }}>
              <FaInfoCircle size={16} style={{ color: "#818CF8", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#a5b4fc", marginBottom: "6px" }}>Dynamic Population</div>
                <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.65 }}>
                  Timesheets and billing metrics will automatically pull from driver data once a driver and period are confirmed.
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* From / To cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

              {/* FROM */}
              <div style={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px" }}>From (Organization)</span>
                  <button
                    onClick={() => {}}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}
                    title="Edit"
                  >
                    ✎
                  </button>
                </div>
                {fromDetails.name ? (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "8px" }}>{fromDetails.name}</div>
                    {fromDetails.address && <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "3px" }}>{fromDetails.address}</div>}
                    {fromDetails.email && <div style={{ fontSize: "12px", color: "#818CF8" }}>{fromDetails.email}</div>}
                    {fromDetails.phone && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "3px" }}>{fromDetails.phone}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#4b5563" }}>Loading org profile…</div>
                )}
              </div>

              {/* TO */}
              <div style={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px" }}>To (Driver)</span>
                  <button
                    onClick={() => {}}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}
                    title="Edit"
                  >
                    ✎
                  </button>
                </div>
                {selectedDriver === "__placeholder__" ? (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>No Driver Selected</div>
                    <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.6 }}>Select a driver from settings to populate contact details and tax ID.</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3f4f6", marginBottom: "8px" }}>{toDetails.name}</div>
                    {toDetails.businessName && <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "3px" }}>{toDetails.businessName}</div>}
                    {toDetails.contact && <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "3px" }}>{toDetails.contact}</div>}
                    {toDetails.gst && <div style={{ fontSize: "12px", color: "#818CF8" }}>GST/HST: {toDetails.gst}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Timesheets & Activities */}
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>Timesheets & Activities</h2>
                <button style={{ background: "none", border: "none", color: "#818CF8", fontSize: "11px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  + MANUAL ENTRY
                </button>
              </div>

              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.8fr", gap: "0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", marginBottom: "4px" }}>
                {["DATE / REFERENCE", "DESCRIPTION", "QUANTITY / HRS", "RATE", "AMOUNT"].map((h) => (
                  <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.8px", padding: "0 8px" }}>{h}</div>
                ))}
              </div>

              {timesheets.length === 0 ? (
                <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <FaClipboardList size={32} style={{ color: "#374151" }} />
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                    {selectedDriver === "__placeholder__" ? "Select a driver to view active timesheets" : "No timesheets found for the selected period."}
                  </div>
                  <div style={{ fontSize: "12px", color: "#374151" }}>
                    {selectedDriver === "__placeholder__" ? "Telematics will sync shift data here" : "Try adjusting the billing period."}
                  </div>
                </div>
              ) : (
                <div>
                  {timesheets.map((t) => {
                    const rate = categoryRates[t.category] || 0;
                    let start = new Date(`1970-01-01T${t.startTime}`);
                    let end   = new Date(`1970-01-01T${t.endTime}`);
                    if (end <= start) end.setDate(end.getDate() + 1);
                    const hrs = (end.getTime() - start.getTime()) / 3600000;
                    const rowAmt = (hrs * rate).toFixed(2);
                    const badge = STATUS_BADGE[t.status] || STATUS_BADGE.pending;
                    return (
                      <div key={t._id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.8fr", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "12px 0" }}>
                        <div style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>{t.date}</div>
                        <div style={{ padding: "0 8px" }}>
                          <div style={{ fontSize: "13px", color: "#f3f4f6", fontWeight: 500 }}>{t.category}</div>
                          <span style={{ fontSize: "10px", fontWeight: 600, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "1px 7px", borderRadius: "20px", marginTop: "3px", display: "inline-block" }}>{badge.label}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>{hrs.toFixed(2)} hrs</div>
                        <div style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>${rate.toFixed(2)}</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f3f4f6", padding: "0 8px" }}>${rowAmt}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "10px" }}>
                  <span>Subtotal</span><span style={{ color: "#9ca3af" }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", paddingBottom: "14px", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>HST (13%)</span><span style={{ color: "#9ca3af" }}>${hst.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#f3f4f6" }}>Total Amount</span>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#818CF8" }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Notes */}
            <div style={styles.card}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
                Invoice Notes & Internal Memo
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional payment terms or operational notes here..."
                style={{ width: "100%", minHeight: "100px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#9ca3af", resize: "vertical", outline: "none", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box", lineHeight: 1.65 }}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "22px",
  },
  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "13px",
    color: "#f3f4f6",
    background: "rgba(255,255,255,0.05)",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default Invoice;
