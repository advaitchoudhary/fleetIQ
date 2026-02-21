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
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
    <Navbar />

    <div style={styles.container}>
      <h2 style={styles.title}>Contact Enquiries</h2>
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
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "32px 40px",
    textAlign: "center",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#111827",
    letterSpacing: "-0.3px",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    backgroundColor: "#fff",
    padding: "4px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "12px",
    overflow: "hidden",
    tableLayout: "auto",
  },
  th: {
    borderBottom: "1px solid #e5e7eb",
    padding: "14px 18px",
    fontSize: "11px",
    fontWeight: 700,
    textAlign: "left",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    wordBreak: "break-word",
  },
  td: {
    padding: "14px 18px",
    fontSize: "14px",
    textAlign: "left",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    wordBreak: "break-word",
  },
  row: {
    backgroundColor: "#f9fafb",
  },
};

export default Enquiries;