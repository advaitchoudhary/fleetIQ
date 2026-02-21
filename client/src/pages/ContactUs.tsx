import React, { useState } from "react";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setFormData((prev) => ({ ...prev, image: e.target.files![0] }));
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        alert("Your message has been sent successfully!");
        setFormData({ name: "", email: "", message: "" });
      } else {
        alert("There was an error sending your message.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form.");
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 640px) {
          [data-cu-content] { padding: 24px 16px !important; margin: 16px 12px !important; width: auto !important; }
          [data-cu-title] { font-size: 20px !important; }
          [data-cu-info-grid] { grid-template-columns: 1fr !important; }
          [data-cu-company] { padding: 16px !important; }
        }
      `}</style>
      <Navbar />

      <div style={styles.mainContent} data-cu-content>
        <h2 style={styles.pageTitle} data-cu-title>Contact Us</h2>
        
        <div style={styles.companyInfo} data-cu-company>
          <h3 style={styles.companyName}>Premier Choice Employment</h3>
          <div style={styles.infoGrid} data-cu-info-grid>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Address</span>
              <span style={styles.infoValue}>UNIT-21 745 CHELTON RD, LONDON, ON N6M 0J1</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Phone</span>
              <span style={styles.infoValue}>+1 (519) 280-1311</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>admin@premierchoicemployment.ca</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Business Hours</span>
              <span style={styles.infoValue}>Monday - Friday, 9 AM - 5 PM EST</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            style={styles.input}
          />

          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            style={styles.input}
          />

          <label style={styles.label}>Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Enter your message..."
            style={styles.textarea}
          />

          <button type="submit" style={styles.submitButton}>Send Message</button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  mainContent: {
    margin: "30px auto",
    padding: "40px",
    width: "90%",
    maxWidth: "640px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    marginTop: 0,
    marginBottom: "24px",
    letterSpacing: "-0.3px",
  },
  companyInfo: {
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    marginBottom: "28px",
    border: "1px solid #e5e7eb",
  },
  companyName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
    marginTop: 0,
    marginBottom: "16px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  infoValue: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    fontWeight: 600,
    fontSize: "13px",
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    transition: "border-color 0.2s ease",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    height: "140px",
    resize: "vertical" as const,
    transition: "border-color 0.2s ease",
    outline: "none",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "8px",
  },
};

export default ContactUs;