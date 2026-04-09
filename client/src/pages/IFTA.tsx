import { useState } from "react";
import axios from "axios";

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
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const params: Record<string, string> = { quarter, year };
      if (vehicleId) params.vehicleId = vehicleId;
      const { data } = await axios.get("/api/ifta/report", { params });
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const params = new URLSearchParams({ quarter, year });
    if (vehicleId) params.append("vehicleId", vehicleId);
    window.open(`/api/ifta/report/pdf?${params}`, "_blank");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>IFTA Quarterly Report</h1>
      <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>
        Fuel tax mileage report across US states and Canadian provinces.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24, alignItems: "flex-end" }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 4 }}>Quarter</label>
          <select value={quarter} onChange={e => setQuarter(e.target.value)} style={selectStyle}>
            {["Q1", "Q2", "Q3", "Q4"].map(q => <option key={q}>{q}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 4 }}>Year</label>
          <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 4 }}>Vehicle ID (optional)</label>
          <input value={vehicleId} onChange={e => setVehicleId(e.target.value)} placeholder="Leave blank for all vehicles" style={{ ...selectStyle, width: "100%" }} />
        </div>
        <button onClick={generate} disabled={loading} style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, height: 38 }}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>❌ {error}</div>}

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#6b7280" }}>⏳ Geocoding coordinates and calculating miles per jurisdiction…</div>}

      {report && !loading && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{report.period}</span>
              <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 12 }}>{report.jurisdictions.length} jurisdictions</span>
            </div>
            <button onClick={downloadPDF} style={{ padding: "8px 16px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              ⬇ Download PDF
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  {["Jurisdiction", "Miles Driven", "Fuel Purchased (L)", "Tax Rate ($/L)", "Net Tax Due"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: h === "Jurisdiction" ? "left" : "right", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.jurisdictions.map((row, i) => (
                  <tr key={row.code} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{row.code}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>{row.milesDriven.toLocaleString()}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>{row.fuelPurchasedLitres.toLocaleString()}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>${row.taxRatePerLitre.toFixed(4)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 500 }}>${row.netTaxDue.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f0f9ff", borderTop: "2px solid #bae6fd", fontWeight: 700 }}>
                  <td style={{ padding: "12px 16px" }}>TOTAL</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>{report.totals.milesDriven.toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>{report.totals.fuelPurchasedLitres.toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>—</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>${report.totals.netTaxDue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {report.jurisdictions.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>No trip data found for {report.period}. Ensure vehicles have completed trips and fuel logs have State/Province filled in.</p>
          )}
        </>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff",
  height: 38,
};
