import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [org, setOrg] = useState({ name: "", address: "", phone: "", email: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API_BASE_URL}/organizations/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const { name, address, phone, email } = res.data;
      setOrg({ name: name || "", address: address || "", phone: phone || "", email: email || "" });
    }).catch(() => {});
  }, []);

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
          <h3 style={styles.companyName}>{org.name || "—"}</h3>
          <div style={styles.infoGrid} data-cu-info-grid>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Address</span>
              <span style={styles.infoValue}>{org.address || "—"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Phone</span>
              <span style={styles.infoValue}>{org.phone || "—"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{org.email || "—"}</span>
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
    backgroundColor: "var(--t-bg)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  mainContent: {
    margin: "30px auto",
    padding: "40px",
    width: "90%",
    maxWidth: "640px",
    backgroundColor: "var(--t-surface)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "var(--t-shadow)",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--t-text)",
    marginTop: 0,
    marginBottom: "24px",
    letterSpacing: "-0.3px",
  },
  companyInfo: {
    padding: "24px",
    backgroundColor: "var(--t-surface-alt)",
    borderRadius: "12px",
    marginBottom: "28px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  companyName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--t-text-secondary)",
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
    gap: "4px",
  },
  infoLabel: {
    fontSize: "9px",
    fontWeight: 700,
    color: "var(--t-text-ghost)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },
  infoValue: {
    fontSize: "13px",
    color: "var(--t-text-muted)",
    fontWeight: 500,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    fontWeight: 700,
    fontSize: "9px",
    color: "var(--t-text-ghost)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    transition: "border-color 0.2s ease",
    outline: "none",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "var(--t-input-bg)",
    color: "var(--t-text-secondary)",
    height: "140px",
    resize: "vertical" as const,
    transition: "border-color 0.2s ease",
    outline: "none",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  submitButton: {
    backgroundColor: "var(--t-accent)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "8px",
    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default ContactUs;