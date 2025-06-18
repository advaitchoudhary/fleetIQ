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
    <div>
    <Navbar />

    <div style={styles.container}>
      <h2 style={styles.title}>Contact Enquiries</h2>
      {loading ? (
        <p>Loading enquiries...</p>
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
    padding: "40px 20px",
    backgroundColor: "#f4f6f8",
    textAlign: "center",
    minHeight: "100vh",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#2d3748",
    textAlign: "center",
  },
  tableWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
    padding: "10px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    borderRadius: "8px",
    overflow: "hidden",
    tableLayout: "auto",
  },
  th: {
    borderBottom: "1px solid #e2e8f0",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    wordBreak: "break-word",
    whiteSpace: "wrap",
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "8px 8px",
    fontSize: "14px",
    textAlign: "left",
    backgroundColor: "#ffffff",
    wordBreak: "break-word",
  },
  row: {
    backgroundColor: "#f7fafc",
  },
};

export default Enquiries;