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
        const response = await axios.get(`${API_BASE_URL}/contact`);
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
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Message</th>
              <th style={styles.tableHeader}>Date</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((entry, index) => (
              <tr key={index} style={index % 2 === 0 ? undefined : styles.rowHover}>
                <td style={styles.tableCell}>{entry.name}</td>
                <td style={styles.tableCell}>{entry.email}</td>
                <td style={styles.tableCell}>{entry.message}</td>
                <td style={styles.tableCell}>
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "30px",
    backgroundColor: "#f7f9fc",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#2d3748",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#fff",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#edf2f7",
    fontWeight: "bold",
    padding: "12px 15px",
    textAlign: "left",
    borderBottom: "2px solid #ccc",
    fontSize: "15px",
    color: "#4a5568",
  },
  tableCell: {
    padding: "12px 15px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    color: "#2d3748",
  },
  rowHover: {
    backgroundColor: "#f7fafc",
  }
};

export default Enquiries;