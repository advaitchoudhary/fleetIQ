import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [org, setOrg] = useState({ name: "", address: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
      } else {
        alert("There was an error sending your message.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form.");
    } finally {
      setSubmitting(false);
    }
  };

  const infoItems = [
    { icon: <FaMapMarkerAlt size={16} />, label: "Address", value: org.address || "—" },
    { icon: <FaPhone size={16} />, label: "Phone", value: org.phone || "—" },
    { icon: <FaEnvelope size={16} />, label: "Email", value: org.email || "—" },
    { icon: <FaClock size={16} />, label: "Business Hours", value: "Mon – Fri, 9 AM – 5 PM EST" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "var(--t-bg)", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 768px) {
          [data-cu-grid] { grid-template-columns: 1fr !important; }
          [data-cu-wrap] { padding: 24px 20px !important; }
        }
        [data-cu-input]:focus { border-color: var(--t-accent) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); outline: none; }
        [data-cu-info-card]:hover { border-color: var(--t-accent) !important; background: var(--t-hover-bg) !important; }
        [data-cu-submit]:hover:not(:disabled) { background: #4338ca !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45) !important; }
      `}</style>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 40px" }} data-cu-wrap>
        {/* Breadcrumb */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--t-text-faint)", letterSpacing: "1px", marginBottom: "14px" }}>
          CONTACT US
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "30px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.5px" }}>
            Contact Us
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-dim)" }}>
            Reach out to your fleet admin — we're here to help.
          </p>
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "32px", alignItems: "start" }} data-cu-grid>

          {/* ── Left: Company info ─────────────────────────────── */}
          <div>
            {org.name && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--t-text-ghost)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Company
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.3px" }}>
                  {org.name}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {infoItems.map((item) => (
                <div
                  key={item.label}
                  data-cu-info-card
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "16px 18px",
                    background: "var(--t-surface)",
                    border: "1px solid var(--t-border)",
                    borderRadius: "12px",
                    transition: "border-color 0.15s, background 0.15s",
                    cursor: "default",
                  }}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--t-accent)", flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--t-text-secondary)" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Form ────────────────────────────────────── */}
          <div style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)", borderRadius: "16px", padding: "32px", boxShadow: "var(--t-shadow)" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--t-success-bg)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
                  ✓
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--t-text)" }}>Message Sent</h3>
                <p style={{ margin: "0 0 24px", fontSize: "14px", color: "var(--t-text-dim)" }}>Your admin will be in touch shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{ padding: "10px 24px", background: "var(--t-hover-bg)", border: "1px solid var(--t-border)", borderRadius: "8px", fontSize: "14px", fontWeight: 600, color: "var(--t-text-secondary)", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ marginBottom: "4px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--t-text)", marginBottom: "4px" }}>Send a Message</div>
                  <div style={{ fontSize: "13px", color: "var(--t-text-dim)" }}>Fill in the form below and we'll get back to you.</div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    data-cu-input
                    style={{ width: "100%", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1px solid var(--t-border)", backgroundColor: "var(--t-input-bg)", color: "var(--t-text-secondary)", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, transition: "border-color 0.15s, box-shadow 0.15s" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    data-cu-input
                    style={{ width: "100%", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1px solid var(--t-border)", backgroundColor: "var(--t-input-bg)", color: "var(--t-text-secondary)", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, transition: "border-color 0.15s, box-shadow 0.15s" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "9px", fontWeight: 700, color: "var(--t-text-ghost)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                    data-cu-input
                    style={{ width: "100%", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1px solid var(--t-border)", backgroundColor: "var(--t-input-bg)", color: "var(--t-text-secondary)", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" as const, height: "140px", resize: "vertical" as const, transition: "border-color 0.15s, box-shadow 0.15s" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  data-cu-submit
                  style={{ width: "100%", padding: "13px", background: "var(--t-accent)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "Inter, system-ui, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "background 0.15s, transform 0.15s, box-shadow 0.15s", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Sending…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
