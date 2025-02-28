import React, { useState } from "react";
import Navbar from "./Navbar";

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    image: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact Form Submitted:", formData);
    alert("Your message has been sent successfully!");
    // Here you can integrate with an API or backend to store/send the message
  };

  return (
    <div style={styles.container}>
      <Navbar /> {/* Navbar Component */}

      <div style={styles.mainContent}>
        <h2>Contact Us</h2>
        
        {/* Company Information */}
        <div style={styles.companyInfo}>
          <h3>Driver Fleet Management</h3>
          <p><strong>Address:</strong> 4404 Lismer Ln, London, ON N6L 0E1</p>
          <p><strong>Phone:</strong> +1 (416) 555-1234</p>
          <p><strong>Email:</strong> support@driverfleet.com</p>
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

          {/* File Upload Input */}
          <label style={styles.label}>Upload an Image (Optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />

          {/* Submit Button */}
          <button type="submit" style={styles.submitButton}>Send Message</button>
        </form>
      </div>
    </div>
  );
};

// Define Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    backgroundColor: "#f4f4f4",
  },
  mainContent: {
    margin: "20px auto",
    padding: "20px",
    width: "50%",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
  companyInfo: {
    padding: "10px",
    backgroundColor: "#eef3f8",
    borderRadius: "5px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "1rem",
  },
  input: {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  textarea: {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "1px solid #ddd",
    height: "100px",
  },
  fileInput: {
    padding: "5px",
  },
  submitButton: {
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "1rem",
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
};

export default ContactUs;