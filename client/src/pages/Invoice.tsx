import React, { useState, useEffect, CSSProperties } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "./Navbar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { API_BASE_URL } from "../utils/env";
import { FaFilePdf, FaArrowRight, FaInfoCircle } from "react-icons/fa";

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
    const ph = 297;
    const marginX = 12;
    const cardX = 8;
    const cardY = 8;
    const cardW = pw - 16;
    const cardH = ph - 16;
    const contentX = 14;
    const contentW = pw - 28;
    const approvedRows = getApprovedRows();

    const palette = {
      page: [255, 255, 255] as [number, number, number],
      card: [251, 253, 255] as [number, number, number],
      panel: [248, 250, 252] as [number, number, number],
      panelAlt: [244, 248, 252] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
      borderSoft: [235, 241, 246] as [number, number, number],
      text: [15, 23, 42] as [number, number, number],
      textSoft: [71, 85, 105] as [number, number, number],
      textMuted: [100, 116, 139] as [number, number, number],
      navy: [23, 58, 99] as [number, number, number],
      navySoft: [230, 239, 248] as [number, number, number],
      accent: [79, 70, 229] as [number, number, number],
    };

    const drawPanel = (x: number, y: number, w: number, h: number, fill: [number, number, number], radius = 4) => {
      doc.setFillColor(...fill);
      doc.roundedRect(x, y, w, h, radius, radius, "F");
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, w, h, radius, radius, "S");
    };

    const writeLines = (lines: string[], x: number, y: number, maxWidth: number, lineGap = 5.5) => {
      let cursorY = y;
      lines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, maxWidth);
        doc.text(wrapped, x, cursorY);
        cursorY += wrapped.length * lineGap;
      });
      return cursorY;
    };

    const invoiceDateLabel = invoiceDate.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
    const invoiceDueLabel = invoiceDateLabel;
    const invNum = `#INV-${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}${String(invoiceDate.getDate()).padStart(2, "0")}`;
    const fromLines = [fromDetails.address, fromDetails.email, fromDetails.phone].filter(Boolean) as string[];
    const toLines = [toDetails.businessName, toDetails.contact, toDetails.address, toDetails.gst ? `GST/HST: ${toDetails.gst}` : ""].filter(Boolean) as string[];

    doc.setFillColor(...palette.page);
    doc.rect(0, 0, pw, ph, "F");

    doc.setFillColor(...palette.card);
    doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "F");
    doc.setDrawColor(...palette.borderSoft);
    doc.setLineWidth(0.25);
    doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, "S");

    // Header
    doc.setFillColor(...palette.navy);
    doc.roundedRect(contentX, 13, 11, 11, 2.5, 2.5, "F");
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(255, 255, 255);
    doc.text("F", contentX + 5.5, 20.6, { align: "center" });

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...palette.navy);
    doc.text("FLEETIQ", contentX + 15, 17.2);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...palette.textMuted);
    doc.text("Professional fleet billing", contentX + 15, 22.6);

    doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(...palette.text);
    doc.text("INVOICE", pw - 14, 23, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...palette.textMuted);
    doc.text("FleetIQ billing statement", pw - 14, 28.8, { align: "right" });

    const metaX = 128;
    const metaY = 35;
    const metaW = pw - metaX - 14;
    drawPanel(metaX, metaY, metaW, 36, palette.panel);

    const metaItems = [
      { label: "Invoice #", value: invNum },
      { label: "Invoice Date", value: invoiceDateLabel },
      { label: "Billing Period", value: invoicePeriod || "—" },
      { label: "Due Date", value: invoiceDueLabel },
    ];

    const metaColW = (metaW - 12) / 2;
    metaItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = metaX + 6 + col * metaColW;
      const y = metaY + 8 + row * 14;
      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(...palette.textMuted);
      doc.text(item.label.toUpperCase(), x, y);
      doc.setFont("helvetica", "bold").setFontSize(index === 0 ? 9.5 : 9).setTextColor(...palette.text);
      doc.text(doc.splitTextToSize(item.value, metaColW - 6), x, y + 5.8);
    });

    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.35);
    doc.line(contentX, 78, pw - contentX, 78);

    // From / To blocks
    const blocksY = 84;
    const gutter = 8;
    const blockW = (contentW - gutter) / 2;
    const blockH = 42;
    drawPanel(contentX, blocksY, blockW, blockH, palette.panel);
    drawPanel(contentX + blockW + gutter, blocksY, blockW, blockH, palette.panel);

    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...palette.textMuted);
    doc.text("FROM", contentX + 8, blocksY + 8);
    doc.text("BILL TO", contentX + blockW + gutter + 8, blocksY + 8);

    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...palette.text);
    doc.text(fromDetails.name || "—", contentX + 8, blocksY + 16);
    doc.text(toDetails.name || "—", contentX + blockW + gutter + 8, blocksY + 16);

    doc.setFont("helvetica", "normal").setFontSize(8.8).setTextColor(...palette.textSoft);
    writeLines(fromLines.length ? fromLines : ["—"], contentX + 8, blocksY + 22, blockW - 16);
    writeLines(toLines.length ? toLines : ["—"], contentX + blockW + gutter + 8, blocksY + 22, blockW - 16);

    // Table header label
    const tableTopY = blocksY + blockH + 14;
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...palette.textMuted);
    doc.text("LINE ITEMS", contentX, tableTopY);
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...palette.text);
    doc.text("Approved Timesheets & Services", contentX, tableTopY + 8);

    // ── Table ──
    const tableY = tableTopY + 14;
    (doc as any).autoTable({
      startY: tableY,
      head: [["DATE", "CATEGORY", "HOURS", "RATE", "SUBTOTAL"]],
      body: approvedRows.length > 0 ? approvedRows : [["—", "No approved timesheets in period", "—", "—", "—"]],
      theme: "grid",
      headStyles: {
        fillColor: palette.navySoft,
        textColor: palette.navy,
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: { top: 6, bottom: 6, left: 7, right: 7 },
        lineColor: palette.border,
        lineWidth: 0.25,
      },
      bodyStyles: {
        fillColor: palette.page,
        textColor: palette.textSoft,
        fontSize: 9.2,
        cellPadding: { top: 8, bottom: 8, left: 7, right: 7 },
        lineColor: palette.borderSoft,
        lineWidth: 0.25,
      },
      alternateRowStyles: { fillColor: palette.panel },
      columnStyles: {
        0: { cellWidth: 40, whiteSpace: "nowrap" as const },
        1: { cellWidth: 68 },
        2: { cellWidth: 22, halign: "right" as const },
        3: { cellWidth: 26, halign: "right" as const },
        4: { cellWidth: 28, halign: "right" as const, fontStyle: "bold", textColor: palette.text },
      },
      margin: { left: marginX, right: marginX },
      tableLineColor: palette.border,
      tableLineWidth: 0.2,
    });

    // Totals block
    const finalY = (doc as any).lastAutoTable.finalY;
    const notesY = finalY + 16;
    const footerReserveY = ph - 26;
    const notesW = 106;
    const totalsW = 64;
    const notesH = notes.trim() ? 28 : 22;
    const totalsH = 38;
    drawPanel(contentX, notesY, notesW, notesH, palette.panel);
    drawPanel(pw - 14 - totalsW, notesY, totalsW, totalsH, palette.panelAlt);

    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...palette.textMuted);
    doc.text("NOTES", contentX + 8, notesY + 8);
    doc.setFont("helvetica", "normal").setFontSize(8.7).setTextColor(...palette.textSoft);
    const noteCopy = notes.trim() || "Thank you for your business. Please remit payment by the due date.";
    doc.text(doc.splitTextToSize(noteCopy, notesW - 16), contentX + 8, notesY + 14);

    let sy = notesY + 10;
    const totalsX = pw - 14 - totalsW + 8;
    const totalsRight = pw - 22;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...palette.textSoft);
    doc.text("Subtotal", totalsX, sy);
    doc.text(`$${subtotal.toFixed(2)}`, totalsRight, sy, { align: "right" });

    sy += 8;
    doc.text("HST (13%)", totalsX, sy);
    doc.text(`$${hst.toFixed(2)}`, totalsRight, sy, { align: "right" });

    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.35);
    doc.line(totalsX, sy + 4, totalsRight, sy + 4);

    sy += 13;
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...palette.textMuted);
    doc.text("BALANCE DUE", totalsX, sy);
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...palette.navy);
    doc.text(`$${total.toFixed(2)}`, totalsRight, sy, { align: "right" });

    // Footer
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.35);
    doc.line(contentX, footerReserveY - 6, pw - contentX, footerReserveY - 6);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...palette.textMuted);
    doc.text("www.fleetiqlogistics.com", contentX, footerReserveY + 1);
    doc.text("support@fleetiqlogistics.com", pw / 2, footerReserveY + 1, { align: "center" });
    doc.text("© 2026 FleetIQ Inc. All rights reserved.", pw - contentX, footerReserveY + 1, { align: "right" });

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
  const invoiceNumber = `INV-${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}${String(invoiceDate.getDate()).padStart(2, "0")}`;
  const dueDateLabel = invoiceDate.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
  const approvedTimesheets = timesheets.filter((t) => t.status === "approved");

  const STATUS_BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
    approved: { bg: "var(--t-success-bg)",  border: "rgba(16,185,129,0.25)",  color: "var(--t-success)", label: "Approved" },
    rejected: { bg: "var(--t-error-bg)",    border: "rgba(239,68,68,0.25)",   color: "var(--t-error)", label: "Rejected" },
    pending:  { bg: "var(--t-warning-bg)",    border: "rgba(234,179,8,0.25)",   color: "var(--t-warning)", label: "Pending"  },
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      <Navbar />
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input:focus, select:focus, textarea:focus { border-color: var(--t-accent) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.15) !important; outline: none; }
        select option { background: var(--t-surface); color: var(--t-text); }
        .fi-premium-invoice {
          --fi-bg: #ffffff;
          --fi-surface: #ffffff;
          --fi-surface-soft: #f8fafc;
          --fi-surface-muted: #fcfdff;
          --fi-border: #e5e7eb;
          --fi-border-strong: #dbe3ee;
          --fi-text: #0f172a;
          --fi-text-soft: #475569;
          --fi-text-muted: #64748b;
          --fi-primary: #173a63;
          --fi-primary-strong: #0f2f52;
          --fi-total-bg: #f4f8fc;
          background: var(--fi-bg);
          color: var(--fi-text);
          border: 1px solid var(--fi-border);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
        }
        .fi-premium-invoice__header,
        .fi-premium-invoice__party-grid,
        .fi-premium-invoice__footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 22px;
        }
        .fi-premium-invoice__header {
          align-items: start;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--fi-border);
        }
        .fi-premium-invoice__brand {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .fi-premium-invoice__logo {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #173a63 0%, #24548f 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.04em;
          flex-shrink: 0;
        }
        .fi-premium-invoice__eyebrow,
        .fi-premium-invoice__section-label,
        .fi-premium-invoice__meta-item dt {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .fi-premium-invoice__eyebrow {
          color: var(--fi-primary);
          margin-bottom: 6px;
        }
        .fi-premium-invoice__brand-name {
          margin: 0 0 12px;
          font-size: 30px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--fi-text);
        }
        .fi-premium-invoice__company-meta {
          display: grid;
          gap: 4px;
        }
        .fi-premium-invoice__company-meta p,
        .fi-premium-invoice__party-card p,
        .fi-premium-invoice__notes-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--fi-text-soft);
        }
        .fi-premium-invoice__meta-panel,
        .fi-premium-invoice__party-card,
        .fi-premium-invoice__table-card,
        .fi-premium-invoice__notes-card,
        .fi-premium-invoice__totals-card {
          border: 1px solid var(--fi-border);
          border-radius: 16px;
          background: var(--fi-surface);
        }
        .fi-premium-invoice__meta-panel {
          background: var(--fi-surface-soft);
          padding: 20px 22px;
        }
        .fi-premium-invoice__meta-kicker {
          display: inline-block;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__title {
          margin: 0;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 800;
          color: var(--fi-primary-strong);
        }
        .fi-premium-invoice__meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 18px;
          margin: 18px 0 0;
        }
        .fi-premium-invoice__meta-item dt {
          margin: 0 0 5px;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__meta-item dd {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 600;
          color: var(--fi-text);
        }
        .fi-premium-invoice__party-grid,
        .fi-premium-invoice__footer-grid {
          margin-top: 24px;
        }
        .fi-premium-invoice__party-card,
        .fi-premium-invoice__notes-card,
        .fi-premium-invoice__totals-card {
          padding: 20px 22px;
        }
        .fi-premium-invoice__section-label {
          display: inline-block;
          margin-bottom: 10px;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__section-title,
        .fi-premium-invoice__party-name {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--fi-text);
        }
        .fi-premium-invoice__table-card {
          margin-top: 24px;
          overflow: hidden;
        }
        .fi-premium-invoice__table-head {
          padding: 20px 22px 16px;
          border-bottom: 1px solid var(--fi-border);
        }
        .fi-premium-invoice__table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .fi-premium-invoice__table {
          width: 100%;
          border-collapse: collapse;
        }
        .fi-premium-invoice__table thead th {
          background: var(--fi-surface-soft);
          color: var(--fi-text-muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 14px 18px;
          border-bottom: 1px solid var(--fi-border);
          text-align: left;
        }
        .fi-premium-invoice__table tbody td {
          padding: 16px 18px;
          border-bottom: 1px solid #edf2f7;
          font-size: 14px;
          line-height: 1.5;
          color: var(--fi-text-soft);
          vertical-align: top;
        }
        .fi-premium-invoice__table tbody tr:nth-child(even) td {
          background: var(--fi-surface-muted);
        }
        .fi-premium-invoice__table tbody tr:last-child td {
          border-bottom: none;
        }
        .fi-premium-invoice__item-title {
          font-weight: 600;
          color: var(--fi-text);
        }
        .fi-premium-invoice__item-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__table .is-numeric {
          text-align: right;
          white-space: nowrap;
        }
        .fi-premium-invoice__amount {
          font-weight: 700;
          color: var(--fi-text);
        }
        .fi-premium-invoice__empty {
          text-align: center;
          padding: 34px 18px !important;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__totals-card {
          background: var(--fi-total-bg);
        }
        .fi-premium-invoice__totals-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          font-size: 14px;
          color: var(--fi-text-soft);
        }
        .fi-premium-invoice__totals-row strong {
          font-weight: 700;
          color: var(--fi-text);
        }
        .fi-premium-invoice__totals-total {
          margin-top: 14px;
          padding-top: 18px;
          border-top: 1px solid var(--fi-border-strong);
        }
        .fi-premium-invoice__total-label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fi-text-muted);
        }
        .fi-premium-invoice__total-value {
          display: block;
          font-size: 34px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--fi-primary-strong);
        }
        .fi-premium-invoice__footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid var(--fi-border);
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px 18px;
          font-size: 12px;
          color: var(--fi-text-muted);
        }
        @media (max-width: 1180px) {
          .fi-invoice-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 980px) {
          .fi-premium-invoice {
            padding: 24px;
          }
          .fi-premium-invoice__header,
          .fi-premium-invoice__party-grid,
          .fi-premium-invoice__footer-grid {
            grid-template-columns: 1fr;
          }
        }
        @media print {
          .fi-premium-invoice {
            box-shadow: none;
            border-radius: 0;
            break-inside: avoid;
          }
          .fi-premium-invoice__meta-panel,
          .fi-premium-invoice__table thead th,
          .fi-premium-invoice__table tbody tr:nth-child(even) td,
          .fi-premium-invoice__totals-card {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "36px 40px" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "28px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
              Generate Invoice
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
              Create and distribute billing for active fleet drivers.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            <button
              onClick={generatePDF}
              disabled={isDisabled}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", background: "var(--t-hover-bg)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: isDisabled ? "var(--t-text-ghost)" : "var(--t-text-secondary)", fontSize: "13px", fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <FaFilePdf size={13} /> Generate PDF
            </button>
            <button
              onClick={generateAndSendPDF}
              disabled={isDisabled}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", background: isDisabled ? "var(--t-hover-bg)" : "var(--t-accent)", border: "none", borderRadius: "10px", color: isDisabled ? "var(--t-text-ghost)" : "#fff", fontSize: "13px", fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: isDisabled ? "none" : "0 4px 14px rgba(79,70,229,0.35)" }}
            >
              <FaArrowRight size={12} /> Send Email
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="fi-invoice-layout" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Invoice Settings card */}
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(79,70,229,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--t-indigo)"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L13 10.414V17a1 1 0 01-1.447.894l-4-2A1 1 0 017 15v-4.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                </div>
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--t-text)" }}>Invoice Settings</h2>
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
              <FaInfoCircle size={16} style={{ color: "var(--t-indigo)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--t-indigo)", marginBottom: "6px" }}>Dynamic Population</div>
                <div style={{ fontSize: "12px", color: "var(--t-text-dim)", lineHeight: 1.65 }}>
                  Timesheets and billing metrics will automatically pull from driver data once a driver and period are confirmed.
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <section className="fi-premium-invoice">
              <header className="fi-premium-invoice__header">
                <div className="fi-premium-invoice__brand">
                  <div className="fi-premium-invoice__logo" aria-hidden="true">
                    <span>F</span>
                  </div>
                  <div>
                    <div className="fi-premium-invoice__eyebrow">FleetIQ</div>
                    <h2 className="fi-premium-invoice__brand-name">Invoice</h2>
                    <div className="fi-premium-invoice__company-meta">
                      <p>{fromDetails.name || "FleetIQ Inc."}</p>
                      {fromDetails.address && <p>{fromDetails.address}</p>}
                      {fromDetails.email && <p>{fromDetails.email}</p>}
                      {fromDetails.phone && <p>{fromDetails.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="fi-premium-invoice__meta-panel">
                  <span className="fi-premium-invoice__meta-kicker">Client Billing</span>
                  <h3 className="fi-premium-invoice__title">INVOICE</h3>
                  <dl className="fi-premium-invoice__meta-grid">
                    <div className="fi-premium-invoice__meta-item">
                      <dt>Invoice #</dt>
                      <dd>{invoiceNumber}</dd>
                    </div>
                    <div className="fi-premium-invoice__meta-item">
                      <dt>Invoice Date</dt>
                      <dd>{dueDateLabel}</dd>
                    </div>
                    <div className="fi-premium-invoice__meta-item">
                      <dt>Billing Period</dt>
                      <dd>{invoicePeriod || "—"}</dd>
                    </div>
                    <div className="fi-premium-invoice__meta-item">
                      <dt>Due Date</dt>
                      <dd>{dueDateLabel}</dd>
                    </div>
                  </dl>
                </div>
              </header>

              <section className="fi-premium-invoice__party-grid">
                <article className="fi-premium-invoice__party-card">
                  <span className="fi-premium-invoice__section-label">From</span>
                  <div className="fi-premium-invoice__party-name">{fromDetails.name || "—"}</div>
                  {fromDetails.address && <p>{fromDetails.address}</p>}
                  {fromDetails.email && <p>{fromDetails.email}</p>}
                  {fromDetails.phone && <p>{fromDetails.phone}</p>}
                </article>

                <article className="fi-premium-invoice__party-card">
                  <span className="fi-premium-invoice__section-label">Bill To</span>
                  {selectedDriver === "__placeholder__" ? (
                    <>
                      <div className="fi-premium-invoice__party-name">No Driver Selected</div>
                      <p>Select a driver from settings to populate billing details.</p>
                    </>
                  ) : (
                    <>
                      <div className="fi-premium-invoice__party-name">{toDetails.name || "—"}</div>
                      {toDetails.businessName && <p>{toDetails.businessName}</p>}
                      {toDetails.contact && <p>{toDetails.contact}</p>}
                      {toDetails.address && <p>{toDetails.address}</p>}
                      {toDetails.gst && <p>GST/HST: {toDetails.gst}</p>}
                    </>
                  )}
                </article>
              </section>

              <section className="fi-premium-invoice__table-card">
                <div className="fi-premium-invoice__table-head">
                  <span className="fi-premium-invoice__section-label">Line Items</span>
                  <h3 className="fi-premium-invoice__section-title">Approved Timesheets & Services</h3>
                </div>
                <div className="fi-premium-invoice__table-wrap">
                  <table className="fi-premium-invoice__table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th className="is-numeric">Hours</th>
                        <th className="is-numeric">Rate</th>
                        <th className="is-numeric">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedTimesheets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="fi-premium-invoice__empty">
                            {selectedDriver === "__placeholder__" ? "Select a driver to preview line items." : "No approved timesheets found for the selected period."}
                          </td>
                        </tr>
                      ) : (
                        approvedTimesheets.map((t) => {
                          const rate = categoryRates[t.category] || 0;
                          let start = new Date(`1970-01-01T${t.startTime}`);
                          let end = new Date(`1970-01-01T${t.endTime}`);
                          if (end <= start) end.setDate(end.getDate() + 1);
                          const hrs = (end.getTime() - start.getTime()) / 3600000;
                          const rowAmt = hrs * rate;
                          const badge = STATUS_BADGE[t.status] || STATUS_BADGE.pending;

                          return (
                            <tr key={t._id}>
                              <td>{t.date}</td>
                              <td>
                                <div className="fi-premium-invoice__item-title">{t.category}</div>
                                <div className="fi-premium-invoice__item-subtitle">{badge.label} timesheet</div>
                              </td>
                              <td className="is-numeric">{hrs.toFixed(2)}</td>
                              <td className="is-numeric">${rate.toFixed(2)}</td>
                              <td className="is-numeric fi-premium-invoice__amount">${rowAmt.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="fi-premium-invoice__footer-grid">
                <div className="fi-premium-invoice__notes-card">
                  <span className="fi-premium-invoice__section-label">Notes</span>
                  <h3 className="fi-premium-invoice__section-title">Payment Terms & Memo</h3>
                  <p className="fi-premium-invoice__notes-text">
                    {notes.trim() || "Thank you for your business. Please remit payment by the due date. For billing questions, contact FleetIQ support."}
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional payment terms or operational notes here..."
                    style={{ width: "100%", minHeight: "110px", marginTop: "16px", background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "var(--t-text-faint)", resize: "vertical", outline: "none", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box", lineHeight: 1.65 }}
                  />
                </div>

                <aside className="fi-premium-invoice__totals-card">
                  <div className="fi-premium-invoice__totals-row">
                    <span>Subtotal</span>
                    <strong>${subtotal.toFixed(2)}</strong>
                  </div>
                  <div className="fi-premium-invoice__totals-row">
                    <span>HST (13%)</span>
                    <strong>${hst.toFixed(2)}</strong>
                  </div>
                  <div className="fi-premium-invoice__totals-total">
                    <span className="fi-premium-invoice__total-label">Balance Due</span>
                    <strong className="fi-premium-invoice__total-value">${total.toFixed(2)}</strong>
                  </div>
                </aside>
              </section>

              <footer className="fi-premium-invoice__footer">
                <span>www.fleetiqlogistics.com</span>
                <span>support@fleetiqlogistics.com</span>
                <span>© 2026 FleetIQ Inc. All rights reserved.</span>
              </footer>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  card: {
    background: "var(--t-surface-alt)",
    border: "1px solid var(--t-border)",
    borderRadius: "14px",
    padding: "22px",
  },
  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid var(--t-border)",
    fontSize: "13px",
    color: "var(--t-text)",
    background: "var(--t-input-bg)",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default Invoice;
