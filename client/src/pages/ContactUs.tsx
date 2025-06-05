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
      <Navbar /> {/* Navbar Component */}

      <div style={styles.mainContent}>
        <h2>Contact Us</h2>
        
        {/* Company Information */}
        <div style={styles.companyInfo}>
          <h3> Premier Choice Employment</h3>
          <p><strong>Address:</strong> UNIT-21 745 CHELTON RD, LONDON, ON N6M 0J1</p>
          <p><strong>Phone:</strong> +1 (519) 280-1311</p>
          <p><strong>Email:</strong> admin@premierchoicemployment.ca</p>
          <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 5 PM EST</p>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name Input */}
          <label style={styles.label}>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            style={styles.input}
          />

          {/* Email Input */}
          <label style={styles.label}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            style={styles.input}
          />

          {/* Message Input */}
          <label style={styles.label}>Message:</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Enter your message..."
            style={styles.textarea}
          />

          {/* Submit Button */}
          <button type="submit" style={styles.submitButton}>Send Message</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  mainContent: {
    margin: "40px auto",
    padding: "40px",
    width: "90%",
    maxWidth: "640px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  companyInfo: {
    padding: "20px",
    backgroundColor: "#e2ecf9",
    borderRadius: "10px",
    marginBottom: "30px",
    border: "1px solid #c9daf4",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "18px",
  },
  label: {
    fontWeight: 600,
    fontSize: "1rem",
    marginBottom: "4px",
    color: "#2d3748",
  },
  input: {
    padding: "14px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e0",
    transition: "border-color 0.3s ease",
    outline: "none",
  },
  textarea: {
    padding: "14px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e0",
    height: "140px",
    transition: "border-color 0.3s ease",
    outline: "none",
  },
  fileInput: {
    padding: "6px",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: "1rem",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    fontWeight: 600,
  },
};

export default ContactUs;