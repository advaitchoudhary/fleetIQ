import { useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

interface JurisdictionRow {
  code: string;
  milesDriven: number;
  fuelPurchasedLitres: number;
  taxRatePerLitre: number;
  netTaxDue: number;
}

interface IFTAReport {
  period: string;
  generatedAt: string;
  jurisdictions: JurisdictionRow[];
  totals: { milesDriven: number; fuelPurchasedLitres: number; netTaxDue: number };
}

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function IFTA() {
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState(String(currentYear));
  const [vehicleId, setVehicleId] = useState("");
  const [report, setReport] = useState<IFTAReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const generate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const params: Record<string, string> = { quarter, year };
      if (vehicleId.trim()) params.vehicleId = vehicleId.trim();
      const { data } = await axios.get(`${API_BASE_URL}/ifta/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams({ quarter, year });
      if (vehicleId.trim()) params.append("vehicleId", vehicleId.trim());
      const response = await axios.get(`${API_BASE_URL}/ifta/report/pdf?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `IFTA_${quarter}_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: "32px 36px", fontFamily: "Inter, system-ui, sans-serif" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          FLEET OPERATIONS
        </div>

        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
            IFTA Quarterly Report
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
            Fuel tax mileage report across US states and Canadian provinces.
          </p>
        </div>

        {/* Filters */}
        <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "14px", padding: "20px 24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "7px" }}>QUARTER</label>
              <select value={quarter} onChange={e => setQuarter(e.target.value)} style={selectStyle}>
                {["Q1", "Q2", "Q3", "Q4"].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "7px" }}>YEAR</label>
              <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", marginBottom: "7px" }}>VEHICLE ID (OPTIONAL)</label>
              <input
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                placeholder="Leave blank for all vehicles"
                style={{ ...selectStyle, width: "100%" }}
              />
            </div>
            <button
              onClick={generate}
              disabled={loading}
              style={{ padding: "10px 22px", background: loading ? "var(--t-text-ghost)" : "var(--t-accent)", color: "#fff", border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "13px", height: "40px", fontFamily: "Inter, system-ui, sans-serif", boxShadow: loading ? "none" : "0 4px 14px rgba(79,70,229,0.35)", transition: "all 0.15s" }}
            >
              {loading ? "Generating…" : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px 16px", background: "var(--t-error-bg)", color: "var(--t-error)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: 500 }}>
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--t-text-ghost)", fontSize: "14px" }}>
            ⏳ Geocoding coordinates and calculating miles per jurisdiction…
          </div>
        )}

        {/* Report */}
        {report && !loading && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--t-text)" }}>{report.period}</span>
                <span style={{ color: "var(--t-text-ghost)", fontSize: "13px", marginLeft: "12px" }}>
                  {report.jurisdictions.length} jurisdiction{report.jurisdictions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={downloadPDF}
                disabled={pdfLoading}
                style={{ padding: "9px 18px", background: "var(--t-surface)", color: pdfLoading ? "var(--t-text-ghost)" : "var(--t-text-faint)", border: "1px solid var(--t-border-strong)", borderRadius: "10px", cursor: pdfLoading ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif", transition: "all 0.15s" }}
              >
                {pdfLoading ? "Downloading…" : "⬇ Download PDF"}
              </button>
            </div>

            <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "14px", overflow: "hidden" }}>
              {report.jurisdictions.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "var(--t-text)" }}>No trip data found for {report.period}</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--t-text-ghost)" }}>
                    Ensure vehicles have completed trips and fuel logs have State/Province filled in.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
                        {["Jurisdiction", "Miles Driven", "Fuel Purchased (L)", "Tax Rate ($/L)", "Net Tax Due"].map(h => (
                          <th key={h} style={{ padding: "13px 18px", textAlign: h === "Jurisdiction" ? "left" : "right", fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "0.8px", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.jurisdictions.map((row, i) => (
                        <tr key={row.code} style={{ borderBottom: "1px solid var(--t-border)", background: i % 2 === 1 ? "var(--t-stripe)" : "transparent" }}>
                          <td style={{ padding: "12px 18px", fontWeight: 600, color: "var(--t-text)" }}>{row.code}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right", color: "var(--t-text-secondary)" }}>{row.milesDriven.toLocaleString()}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right", color: "var(--t-text-secondary)" }}>{row.fuelPurchasedLitres.toLocaleString()}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right", color: "var(--t-text-secondary)" }}>${row.taxRatePerLitre.toFixed(4)}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 600, color: "var(--t-text)" }}>${row.netTaxDue.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: "var(--t-indigo-bg)", borderTop: "2px solid rgba(79,70,229,0.25)", fontWeight: 700 }}>
                        <td style={{ padding: "13px 18px", color: "var(--t-text)" }}>TOTAL</td>
                        <td style={{ padding: "13px 18px", textAlign: "right", color: "var(--t-text)" }}>{report.totals.milesDriven.toFixed(2)}</td>
                        <td style={{ padding: "13px 18px", textAlign: "right", color: "var(--t-text)" }}>{report.totals.fuelPurchasedLitres.toFixed(2)}</td>
                        <td style={{ padding: "13px 18px", textAlign: "right", color: "var(--t-text)" }}>—</td>
                        <td style={{ padding: "13px 18px", textAlign: "right", color: "var(--t-text)" }}>${report.totals.netTaxDue.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer count */}
            {report.jurisdictions.length > 0 && (
              <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--t-text-ghost)", textAlign: "right" }}>
                {report.jurisdictions.length} jurisdiction{report.jurisdictions.length !== 1 ? "s" : ""} · Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid var(--t-border-strong)",
  borderRadius: "8px",
  fontSize: "14px",
  background: "var(--t-input-bg)",
  color: "var(--t-text)",
  height: "40px",
  fontFamily: "Inter, system-ui, sans-serif",
};
