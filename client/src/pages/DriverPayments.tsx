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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(`${API_BASE_URL}/drivers`, { headers });
        const driverList = Array.isArray(res.data) ? res.data : [];
        setDrivers(driverList);
        // Fetch onboard statuses for all drivers in parallel
        const statuses = await Promise.all(
          driverList.map((d: any) =>
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
        setDrivers([]);
        setOnboardStatuses({});
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
        { headers: getAuthHeaders() }
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
    if (!periodFrom || !periodTo) { alert("Please select both a start and end date."); return; }
    setCalculating(true);
    setPreview(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payments/calculate`,
        { driverId: selectedDriver._id, periodFrom, periodTo },
        { headers: getAuthHeaders() }
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
        { headers: getAuthHeaders() }
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      <Navbar />
      <div style={styles.pageContainer}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>DRIVER PAYMENTS</div>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Driver Payments</h1>
            <p style={styles.pageDescription}>Pay drivers directly via Stripe Connect.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left: Driver Stripe Status */}
          <div>
            <div style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaStripe size={20} style={{ color: "#6772e5" }} />
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>
                  Stripe Connect Status
                </h2>
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--t-text-dim)" }}>
                  {onboardedCount}/{drivers.length} connected
                </span>
              </div>

              {loading ? (
                <p style={{ color: "var(--t-text-dim)", fontSize: "14px" }}>Loading drivers...</p>
              ) : drivers.length === 0 ? (
                <p style={{ color: "var(--t-text-dim)", fontSize: "14px" }}>No drivers found.</p>
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
                          border: "1px solid " + (selectedDriver?._id === d._id ? "var(--t-indigo)" : "var(--t-border)"),
                          background: selectedDriver?._id === d._id ? "var(--t-indigo-bg)" : "var(--t-surface-alt)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--t-text-secondary)" }}>{d.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--t-text-dim)" }}>{d.email}</div>
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
            <div style={{ ...styles.card, background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.2)", marginTop: "16px" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 700, color: "var(--t-indigo)" }}>How Stripe Connect works</h3>
              <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", color: "var(--t-text-faint)", lineHeight: "1.7" }}>
                <li>Click <strong>Connect</strong> next to a driver to start Stripe onboarding</li>
                <li>Driver opens the Stripe-hosted form to add bank details</li>
                <li>Once connected, you can send payouts directly to their bank</li>
                <li>Drivers can view their payouts in their Stripe Express dashboard</li>
              </ol>
            </div>
          </div>

          {/* Right: Initiate Payout */}
          <div style={styles.card}>
            <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "var(--t-text)" }}>
              Initiate Payout
            </h2>

            {!selectedDriver ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--t-text-faint)", fontSize: "14px" }}>
                <FaDollarSign size={32} style={{ marginBottom: "8px", opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Select a driver on the left to initiate a payout</p>
              </div>
            ) : (
              <>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "12px", marginBottom: "20px", border: "1px solid var(--t-border)" }}>
                  <div style={{ fontWeight: 700, color: "var(--t-text-secondary)", fontSize: "15px" }}>{selectedDriver.name}</div>
                  <div style={{ fontSize: "13px", color: "var(--t-text-dim)" }}>{selectedDriver.email}</div>
                  {!onboardStatuses[selectedDriver._id]?.onboarded && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--t-error)", background: "var(--t-error-bg)", borderRadius: "6px", padding: "6px 10px" }}>
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
                    <div style={{ background: "var(--t-success-bg)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginBottom: "4px" }}>Payout Amount</div>
                      <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--t-success)" }}>
                        ${preview.totalAmount.toFixed(2)} <span style={{ fontSize: "16px", fontWeight: 500 }}>CAD</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--t-text-dim)", marginTop: "4px" }}>
                        from {preview.timesheetCount} approved timesheet{preview.timesheetCount !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {preview.timesheets.length > 0 && (
                      <div style={{ background: "var(--t-surface-alt)", border: "1px solid var(--t-border)", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                        <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", fontSize: "12px", fontWeight: 700, color: "var(--t-text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Included Timesheets
                        </div>
                        {preview.timesheets.map((ts: any) => (
                          <div key={ts._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--t-stripe)", fontSize: "13px" }}>
                            <span style={{ color: "var(--t-text-muted)" }}>{ts.weekEnding || (ts.date ? new Date(ts.date).toLocaleDateString() : "—")}</span>
                            <span style={{ fontWeight: 600, color: "var(--t-text-secondary)" }}>${(ts.totalAmount || 0).toFixed(2)}</span>
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
                      <div style={{ fontSize: "14px", color: "var(--t-text-dim)", textAlign: "center", padding: "12px" }}>
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
  pageContainer: { padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  pageTitle: { margin: "0 0 8px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" },
  pageDescription: { margin: 0, fontSize: "14px", color: "var(--t-text-dim)" },
  card: { background: "var(--t-surface)", borderRadius: "16px", border: "1px solid var(--t-border)", padding: "24px", boxShadow: "var(--t-shadow)" },
  driverRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", transition: "border 0.15s" },
  connectedBadge: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "var(--t-success-bg)", color: "var(--t-success)", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  connectBtn: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#6772e5", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { width: "100%", padding: "10px", background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "var(--t-text-muted)" },
  payBtn: { width: "100%", padding: "14px", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--t-border-strong)", fontSize: "14px", color: "var(--t-text-secondary)", background: "var(--t-input-bg)", outline: "none", boxSizing: "border-box" as const },
  label: { display: "block", fontSize: "11px", fontWeight: 700, color: "var(--t-text-ghost)", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.6px" },
};

export default DriverPayments;
