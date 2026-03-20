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
        const response = await axios.get(`${API_BASE_URL}/contacts`);
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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
    <Navbar />

    <div style={styles.container}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>Contact Enquiries</h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>Messages submitted through the contact form</p>
      </div>
      {loading ? (
        <p style={{ color: "#6b7280", fontSize: "15px" }}>Loading enquiries...</p>
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
                <tr key={index} style={index % 2 === 0 ? undefined : styles.row}>
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
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    backgroundColor: "#fff",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: 600,
    textAlign: "left",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    fontSize: "14px",
    textAlign: "left",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
  },
  row: {
    backgroundColor: "#f9fafb",
  },
};

export default Enquiries;