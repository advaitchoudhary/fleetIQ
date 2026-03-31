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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh", color: "var(--t-text)" }}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <span>DRIVER MANAGEMENT</span>
          <span style={{ color: "var(--t-text-ghost)" }}>›</span>
          <span style={{ color: "var(--t-text-faint)" }}>ENQUIRIES</span>
        </div>

        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Contact Enquiries</h1>
            <p style={styles.pageDescription}>Messages submitted through the contact form.</p>
          </div>
        </div>

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
    padding: "32px 40px",
  },
  breadcrumb: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    letterSpacing: "1px",
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "28px",
    gap: "16px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: "0 0 8px",
    fontSize: "30px",
    fontWeight: 800,
    color: "var(--t-text)",
    letterSpacing: "-0.5px",
  },
  pageDescription: {
    margin: 0,
    fontSize: "14px",
    color: "var(--t-text-dim)",
  },
  tableWrapper: {
    borderRadius: "16px",
    border: "1px solid var(--t-border)",
    background: "var(--t-surface)",
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
