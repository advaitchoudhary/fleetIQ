import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaDollarSign, FaStripe, FaCheckCircle, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const DriverPayments: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [onboardStatuses, setOnboardStatuses] = useState<Record<string, any>>({});
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [onboarding, setOnboarding] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/drivers`, { headers });
        setDrivers(res.data);
        // Fetch onboard statuses for all drivers in parallel
        const statuses = await Promise.all(
          res.data.map((d: any) =>
            axios
              .get(`${API_BASE_URL}/payments/onboard-status/${d._id}`, { headers })
              .then((r) => ({ id: d._id, ...r.data }))
              .catch(() => ({ id: d._id, onboarded: false }))
          )
        );
        const map: Record<string, any> = {};
        statuses.forEach((s) => { map[s.id] = s; });
        setOnboardStatuses(map);
      } catch (err) {
        console.error("Failed to fetch drivers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const handleOnboard = async (driver: any) => {
    setOnboarding(driver._id);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payments/onboard/${driver._id}`,
        {},
        { headers }
      );
      window.open(res.data.url, "_blank");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start onboarding");
    } finally {
      setOnboarding(null);
    }
  };

  const handleCalculate = async () => {
    if (!selectedDriver) { alert("Select a driver first."); return; }
    setCalculating(true);
    setPreview(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payments/calculate`,
        { driverId: selectedDriver._id, periodFrom, periodTo },
        { headers }
      );
      setPreview(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to calculate payout");
    } finally {
      setCalculating(false);
    }
  };

  const handlePay = async () => {
    if (!preview || !selectedDriver) return;
    if (!window.confirm(`Confirm payout of $${preview.totalAmount.toFixed(2)} CAD to ${selectedDriver.name}?`)) return;

    const driverStatus = onboardStatuses[selectedDriver._id];
    if (!driverStatus?.onboarded) {
      alert("This driver has not completed Stripe onboarding. Please have them connect their Stripe account first.");
      return;
    }

    setPaying(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payments/initiate`,
        {
          driverId: selectedDriver._id,
          periodFrom,
          periodTo,
          timesheetIds: preview.timesheets.map((t: any) => t._id),
          notes,
        },
        { headers }
      );
      alert(`✅ Payout of $${preview.totalAmount.toFixed(2)} CAD sent to ${selectedDriver.name}!\nTransfer ID: ${res.data.transferId}`);
      setPreview(null);
      setSelectedDriver(null);
      setNotes("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Payout failed");
    } finally {
      setPaying(false);
    }
  };

  const onboardedCount = Object.values(onboardStatuses).filter((s) => s.onboarded).length;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaDollarSign style={{ color: "#4F46E5" }} /> Driver Payments
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Pay drivers directly via Stripe Connect</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left: Driver Stripe Status */}
          <div>
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaStripe size={20} style={{ color: "#6772e5" }} />
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                  Stripe Connect Status
                </h2>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#6b7280" }}>
                  {onboardedCount}/{drivers.length} connected
                </span>
              </div>

              {loading ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading drivers...</p>
              ) : drivers.length === 0 ? (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>No drivers found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {drivers.map((d) => {
                    const status = onboardStatuses[d._id];
                    const isOnboarded = status?.onboarded;
                    return (
                      <div
                        key={d._id}
                        onClick={() => { setSelectedDriver(d); setPreview(null); }}
                        style={{
                          ...styles.driverRow,
                          border: selectedDriver?._id === d._id ? "2px solid #4F46E5" : "1px solid #e5e7eb",
                          background: selectedDriver?._id === d._id ? "#eef2ff" : "#fff",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{d.name}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>{d.email}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isOnboarded ? (
                            <span style={styles.connectedBadge}><FaCheckCircle size={11} /> Connected</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOnboard(d); }}
                              style={styles.connectBtn}
                              disabled={onboarding === d._id}
                            >
                              {onboarding === d._id ? "..." : "Connect"}
                              <FaExternalLinkAlt size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Onboarding info */}
            <div style={{ ...styles.card, background: "#f0f9ff", border: "1px solid #bae6fd", marginTop: "16px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 700, color: "#0369a1" }}>How Stripe Connect works</h3>
              <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "#0c4a6e", lineHeight: "1.7" }}>
                <li>Click <strong>Connect</strong> next to a driver to start Stripe onboarding</li>
                <li>Driver opens the Stripe-hosted form to add bank details</li>
                <li>Once connected, you can send payouts directly to their bank</li>
                <li>Drivers can view their payouts in their Stripe Express dashboard</li>
              </ol>
            </div>
          </div>

          {/* Right: Initiate Payout */}
          <div style={styles.card}>
            <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              Initiate Payout
            </h2>

            {!selectedDriver ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                <FaDollarSign size={32} style={{ marginBottom: "8px", opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Select a driver on the left to initiate a payout</p>
              </div>
            ) : (
              <>
                <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 700, color: "#111827", fontSize: "15px" }}>{selectedDriver.name}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>{selectedDriver.email}</div>
                  {!onboardStatuses[selectedDriver._id]?.onboarded && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#dc2626", background: "#fee2e2", borderRadius: "6px", padding: "6px 10px" }}>
                      ⚠️ Driver must complete Stripe onboarding before receiving payments.
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={styles.label}>Period From</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={periodFrom}
                      onChange={(e) => { setPeriodFrom(e.target.value); setPreview(null); }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Period To</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={periodTo}
                      onChange={(e) => { setPeriodTo(e.target.value); setPreview(null); }}
                    />
                  </div>
                </div>

                <button onClick={handleCalculate} style={styles.secondaryBtn} disabled={calculating}>
                  {calculating ? "Calculating..." : "Calculate from Approved Timesheets"}
                </button>

                {preview && (
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Payout Amount</div>
                      <div style={{ fontSize: "32px", fontWeight: 800, color: "#16a34a" }}>
                        ${preview.totalAmount.toFixed(2)} <span style={{ fontSize: "16px", fontWeight: 500 }}>CAD</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
                        from {preview.timesheetCount} approved timesheet{preview.timesheetCount !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {preview.timesheets.length > 0 && (
                      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                        <div style={{ padding: "10px 14px", background: "#f9fafb", fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Included Timesheets
                        </div>
                        {preview.timesheets.map((ts: any) => (
                          <div key={ts._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                            <span style={{ color: "#374151" }}>{ts.weekEnding || (ts.date ? new Date(ts.date).toLocaleDateString() : "—")}</span>
                            <span style={{ fontWeight: 600, color: "#111827" }}>${(ts.totalAmount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginBottom: "16px" }}>
                      <label style={styles.label}>Notes (optional)</label>
                      <input style={styles.input} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Week ending March 8 payout" />
                    </div>

                    {preview.totalAmount > 0 ? (
                      <button onClick={handlePay} style={styles.payBtn} disabled={paying}>
                        {paying ? "Processing..." : `Send $${preview.totalAmount.toFixed(2)} CAD to ${selectedDriver.name}`}
                      </button>
                    ) : (
                      <div style={{ fontSize: "14px", color: "#6b7280", textAlign: "center", padding: "12px" }}>
                        No approved timesheets found for this period.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: { background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  driverRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", transition: "border 0.15s" },
  connectedBadge: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  connectBtn: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#6772e5", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { width: "100%", padding: "10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" },
  payBtn: { width: "100%", padding: "14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#111827", background: "#fff", outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" },
};

export default DriverPayments;
