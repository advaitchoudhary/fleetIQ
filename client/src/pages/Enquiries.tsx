import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const Enquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEnquiries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching enquiries:", error);
        setEnquiries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
    <Navbar />

    {/* Hero */}
    <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 55%, #312e81 100%)", padding: "36px 40px" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto", display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "22px" }}>📬</div>
        <div>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "1.2px" }}>Admin</p>
          <h1 style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>Contact Enquiries</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>Messages submitted through the contact form</p>
        </div>
      </div>
    </div>

    <div style={styles.container}>
      {loading ? (
        <p style={{ color: "var(--t-text-dim)", fontSize: "15px" }}>Loading enquiries...</p>
      ) : enquiries.length === 0 ? (
        <p style={{ color: "var(--t-text-dim)", fontSize: "15px" }}>No enquiries yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Message</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((entry, index) => (
                <tr key={entry._id || index} style={index % 2 === 0 ? undefined : styles.row}>
                  <td style={styles.td}>{entry.name}</td>
                  <td style={styles.td}>{entry.email}</td>
                  <td style={styles.td}>{entry.message}</td>
                  <td style={styles.td}>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "28px 40px",
  },
  tableWrapper: {
    borderRadius: "16px",
    border: "1px solid var(--t-border)",
    boxShadow: "var(--t-shadow)",
    backgroundColor: "var(--t-surface)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    borderBottom: "1px solid var(--t-border)",
    padding: "12px 16px",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "left",
    backgroundColor: "var(--t-surface-alt)",
    color: "var(--t-indigo)",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    textAlign: "left",
    color: "var(--t-text-muted)",
    borderBottom: "1px solid var(--t-input-bg)",
  },
  row: {
    backgroundColor: "var(--t-stripe)",
  },
};

export default Enquiries;