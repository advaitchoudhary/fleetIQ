import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

type Provider = "geotab" | "samsara";

interface HardwareDevice {
  id: string;
  name: string;
  serial: string;
}

interface FleetVehicle {
  _id: string;
  unitNumber: string;
  make: string;
  model: string;
}

interface Mapping {
  vehicleId: string;
  deviceSerial: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#f9fafb",
  fontSize: 14,
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#9ca3af",
  marginBottom: 6,
};

const CARD_STYLE: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #1f2937",
  borderRadius: 16,
  padding: "32px 36px",
  maxWidth: 780,
  margin: "0 auto",
};

const Integrations: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [provider, setProvider] = useState<Provider>("geotab");
  const [form, setForm] = useState({
    server: "my.geotab.com",
    database: "",
    username: "",
    password: "",
    apiToken: "",
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // vehicleId → deviceSerial
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ paired: number; errors: any[] } | null>(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  // Load org vehicles when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    axios.get(`${API_BASE_URL}/vehicles`, { headers: getHeaders() })
      .then(res => setFleetVehicles(res.data?.vehicles || res.data || []))
      .catch(() => {});
  }, [step]);

  const credentials = provider === "geotab"
    ? { server: form.server, database: form.database, username: form.username, password: form.password }
    : { apiToken: form.apiToken };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await axios.post(`${API_BASE_URL}/telematics/test`, { provider, credentials }, { headers: getHeaders() });
      setTestResult({ ok: true, msg: "Connection successful! Credentials are valid." });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.response?.data?.message || "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    setDiscoverError(null);
    setHardwareDevices([]);
    try {
      const res = await axios.post(`${API_BASE_URL}/telematics/discover`, { provider, credentials }, { headers: getHeaders() });
      setHardwareDevices(res.data.devices || []);
      if ((res.data.devices || []).length === 0) setDiscoverError("No devices found in your account.");
    } catch (err: any) {
      setDiscoverError(err.response?.data?.message || "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const handleSave = async () => {
    const mappingsArray: Mapping[] = Object.entries(mappings)
      .filter(([, serial]) => serial)
      .map(([vehicleId, deviceSerial]) => ({ vehicleId, deviceSerial }));

    if (mappingsArray.length === 0) return;

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/telematics/bulk-pair`, {
        provider,
        credentials,
        mappings: mappingsArray,
      }, { headers: getHeaders() });
      setSaveResult(res.data);
      setStep(3);
    } catch (err: any) {
      setSaveResult({ paired: 0, errors: [{ error: err.response?.data?.message || "Save failed" }] });
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const providerLabel = provider === "geotab" ? "Geotab" : "Samsara";
  const mappedCount = Object.values(mappings).filter(Boolean).length;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0b0f19", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", letterSpacing: "1.2px", marginBottom: 10 }}>
            VEHICLE MANAGEMENT
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Hardware GPS Integration
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Connect your Geotab or Samsara fleet hardware to FleetIQ in one setup.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
          {[
            { n: 1, label: "Provider & Credentials" },
            { n: 2, label: "Map Devices" },
            { n: 3, label: "Done" },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: step === s.n ? "#7c3aed" : step > s.n ? "#059669" : "#1f2937",
                  color: step >= s.n ? "#fff" : "#6b7280",
                  border: step === s.n ? "2px solid #a78bfa" : "2px solid transparent",
                }}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 500, color: step === s.n ? "#f9fafb" : "#6b7280" }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: "#1f2937", margin: "0 12px" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 ── Provider & Credentials */}
        {step === 1 && (
          <div style={CARD_STYLE}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>
              Choose your GPS provider
            </h2>

            {/* Provider toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
              {(["geotab", "samsara"] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setProvider(p); setTestResult(null); }}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                    border: provider === p ? "2px solid #7c3aed" : "2px solid #374151",
                    background: provider === p ? "#2d1f5e" : "#1f2937",
                    color: provider === p ? "#a78bfa" : "#9ca3af",
                  }}
                >
                  {p === "geotab" ? "🛰️ Geotab" : "🛰️ Samsara"}
                </button>
              ))}
            </div>

            {/* Credential fields */}
            {provider === "geotab" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={LABEL_STYLE}>Server URL</label>
                  <input style={INPUT_STYLE} value={form.server}
                    onChange={e => setForm(f => ({ ...f, server: e.target.value }))} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Database</label>
                  <input style={INPUT_STYLE} placeholder="your_database" value={form.database}
                    onChange={e => setForm(f => ({ ...f, database: e.target.value }))} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Username</label>
                  <input style={INPUT_STYLE} placeholder="admin@yourcompany.com" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={LABEL_STYLE}>Password</label>
                  <input style={INPUT_STYLE} type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
            )}

            {provider === "samsara" && (
              <div>
                <label style={LABEL_STYLE}>API Token</label>
                <input style={INPUT_STYLE} placeholder="samsara_api_..." value={form.apiToken}
                  onChange={e => setForm(f => ({ ...f, apiToken: e.target.value }))} />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>
                  Find this in your Samsara dashboard → Settings → API Tokens
                </p>
              </div>
            )}

            {/* Test result */}
            {testResult && (
              <div style={{
                marginTop: 16, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: testResult.ok ? "#052e16" : "#450a0a",
                color: testResult.ok ? "#4ade80" : "#f87171",
                border: `1px solid ${testResult.ok ? "#166534" : "#7f1d1d"}`,
              }}>
                {testResult.ok ? "✅" : "❌"} {testResult.msg}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                onClick={handleTest}
                disabled={testing}
                style={{
                  padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  border: "1px solid #374151", background: "#1f2937", color: "#f9fafb",
                }}
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
              <button
                onClick={() => { setStep(2); setTestResult(null); }}
                disabled={!testResult?.ok}
                style={{
                  padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: testResult?.ok ? "pointer" : "not-allowed",
                  border: "none", background: testResult?.ok ? "#7c3aed" : "#374151", color: "#fff",
                  opacity: testResult?.ok ? 1 : 0.5,
                }}
              >
                Next: Map Devices →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── Discover & Map */}
        {step === 2 && (
          <div style={CARD_STYLE}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f9fafb" }}>
                Map {providerLabel} devices to your vehicles
              </h2>
              <button
                onClick={handleDiscover}
                disabled={discovering}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: "none", background: "#7c3aed", color: "#fff",
                }}
              >
                {discovering ? "Discovering..." : `🔍 Discover ${providerLabel} Devices`}
              </button>
            </div>

            {discoverError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#450a0a", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
                {discoverError}
              </div>
            )}

            {hardwareDevices.length === 0 && !discoverError && (
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                Click "Discover {providerLabel} Devices" to fetch all hardware devices from your account. Then assign each one to a FleetIQ vehicle below.
              </p>
            )}

            {/* Mapping table */}
            {fleetVehicles.length > 0 && (
              <div style={{ border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
                {/* Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
                  background: "#1a1f2e", padding: "10px 16px",
                  fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.8px",
                }}>
                  <span>FLEETIQ VEHICLE</span>
                  <span>{providerLabel.toUpperCase()} DEVICE</span>
                </div>

                {fleetVehicles.map((v, i) => (
                  <div key={v._id} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, alignItems: "center",
                    padding: "12px 16px",
                    borderTop: i > 0 ? "1px solid #1f2937" : "none",
                    background: i % 2 === 0 ? "#0f1420" : "#111827",
                  }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#f9fafb" }}>{v.unitNumber}</span>
                      <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{v.make} {v.model}</span>
                    </div>
                    <div>
                      {hardwareDevices.length > 0 ? (
                        <select
                          value={mappings[v._id] || ""}
                          onChange={e => setMappings(m => ({ ...m, [v._id]: e.target.value }))}
                          style={{ ...INPUT_STYLE, padding: "8px 10px" }}
                        >
                          <option value="">— No device —</option>
                          {hardwareDevices.map(d => (
                            <option key={d.id} value={d.serial}>
                              {d.name} ({d.serial})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          placeholder="Enter device ID manually"
                          value={mappings[v._id] || ""}
                          onChange={e => setMappings(m => ({ ...m, [v._id]: e.target.value }))}
                          style={{ ...INPUT_STYLE, padding: "8px 10px" }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
              <button
                onClick={() => setStep(1)}
                style={{ padding: "10px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", border: "1px solid #374151", background: "transparent", color: "#9ca3af" }}
              >
                ← Back
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {mappedCount > 0 && (
                  <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>
                    {mappedCount} vehicle{mappedCount !== 1 ? "s" : ""} mapped
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || mappedCount === 0}
                  style={{
                    padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: mappedCount > 0 ? "pointer" : "not-allowed",
                    border: "none", background: mappedCount > 0 ? "#059669" : "#374151", color: "#fff",
                    opacity: mappedCount > 0 ? 1 : 0.5,
                  }}
                >
                  {saving ? "Saving..." : `✓ Save ${mappedCount} Pairing${mappedCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── Confirmation */}
        {step === 3 && saveResult && (
          <div style={{ ...CARD_STYLE, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {saveResult.paired > 0 ? "🎉" : "⚠️"}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#f9fafb" }}>
              {saveResult.paired > 0 ? "Integration Complete!" : "Something went wrong"}
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 15, color: "#9ca3af" }}>
              {saveResult.paired > 0
                ? `${saveResult.paired} vehicle${saveResult.paired !== 1 ? "s" : ""} successfully paired to ${providerLabel}.`
                : "No vehicles were paired. Check the errors below."}
            </p>

            {fleetVehicles.length - Object.values(mappings).filter(Boolean).length > 0 && saveResult.paired > 0 && (
              <div style={{
                display: "inline-block", padding: "8px 16px", borderRadius: 8, marginBottom: 24,
                background: "#1c1400", border: "1px solid #451a03", color: "#fb923c", fontSize: 13,
              }}>
                ⚠️ {fleetVehicles.length - Object.values(mappings).filter(Boolean).length} vehicle{fleetVehicles.length - Object.values(mappings).filter(Boolean).length !== 1 ? "s" : ""} skipped (no device selected)
              </div>
            )}

            {saveResult.errors.length > 0 && (
              <div style={{ textAlign: "left", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Errors:</div>
                {saveResult.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#fca5a5" }}>{e.vehicleId}: {e.error}</div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => navigate("/tracking")}
                style={{ padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: "#7c3aed", color: "#fff" }}
              >
                🗺️ Go to Live Tracking
              </button>
              <button
                onClick={() => { setStep(2); setSaveResult(null); }}
                style={{ padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1px solid #374151", background: "transparent", color: "#d1d5db" }}
              >
                + Add More Vehicles
              </button>
            </div>

            <p style={{ marginTop: 20, fontSize: 12, color: "#4b5563" }}>
              Hardware GPS polling is active every 5 minutes. Positions will appear on the Live Tracking map automatically.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Integrations;
