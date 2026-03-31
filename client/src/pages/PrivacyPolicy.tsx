import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaArrowLeft } from "react-icons/fa";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "36px" }}>
    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "12px", marginTop: 0 }}>{title}</h2>
    <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.8 }}>{children}</div>
  </div>
);

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f0f4ff", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #0A0F1E, #1A0B3E)",
        padding: "16px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #4F46E5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTruck size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          <FaArrowLeft size={11} /> Back
        </button>
      </header>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 24px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#4F46E5", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 12px" }}>Legal</p>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.5px" }}>Privacy Policy</h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>Last updated: March 23, 2026</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e0e7ff", padding: "40px 48px", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" }}>

          <Section title="1. Introduction">
            <p style={{ margin: "0 0 12px" }}>FleetIQ ("we", "us", or "our") is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the FleetIQ platform.</p>
            <p style={{ margin: 0 }}>By using FleetIQ, you consent to the practices described in this Policy. If you do not agree, please discontinue use of the Platform.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p style={{ margin: "0 0 10px" }}><strong>Account & Organization Data</strong></p>
            <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Company name, email address, phone number, and physical address</li>
              <li style={{ marginBottom: "6px" }}>DOT number and other regulatory identifiers</li>
              <li style={{ marginBottom: "6px" }}>Billing information (processed and stored by Stripe — we do not store raw card data)</li>
            </ul>
            <p style={{ margin: "0 0 10px" }}><strong>Driver Data</strong></p>
            <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Full name, email, phone number, and address</li>
              <li style={{ marginBottom: "6px" }}>Driver's licence number, class, and expiry date</li>
              <li style={{ marginBottom: "6px" }}>SIN number (stored encrypted)</li>
              <li style={{ marginBottom: "6px" }}>Work authorization status and compliance documents</li>
              <li style={{ marginBottom: "6px" }}>Pay rates, timesheet records, and payout history</li>
            </ul>
            <p style={{ margin: "0 0 10px" }}><strong>Vehicle & Fleet Data</strong></p>
            <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Vehicle identification numbers (VIN), licence plates, and registration details</li>
              <li style={{ marginBottom: "6px" }}>Maintenance logs, inspection reports, and fuel records</li>
              <li style={{ marginBottom: "6px" }}>Parts inventory and warranty information</li>
            </ul>
            <p style={{ margin: "0 0 10px" }}><strong>Usage Data</strong></p>
            <ul style={{ margin: "0 0 0", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Log data including IP addresses, browser type, and pages visited</li>
              <li style={{ marginBottom: "6px" }}>Feature usage analytics to improve the Platform</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p style={{ margin: "0 0 12px" }}>We use the data we collect to:</p>
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Provide, operate, and improve the FleetIQ platform</li>
              <li style={{ marginBottom: "6px" }}>Process driver payouts via Stripe Connect</li>
              <li style={{ marginBottom: "6px" }}>Send transactional emails (invoice delivery, payout confirmations, compliance alerts)</li>
              <li style={{ marginBottom: "6px" }}>Generate invoices and maintain audit trails</li>
              <li style={{ marginBottom: "6px" }}>Comply with applicable legal obligations</li>
              <li style={{ marginBottom: "6px" }}>Detect and prevent fraudulent activity</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing & Disclosure">
            <p style={{ margin: "0 0 12px" }}>We do not sell your personal data. We may share data with:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}><strong>Stripe</strong> — for payment processing and driver payout facilitation</li>
              <li style={{ marginBottom: "6px" }}><strong>MongoDB Atlas</strong> — for secure cloud data storage</li>
              <li style={{ marginBottom: "6px" }}><strong>Email providers</strong> — for sending transactional notifications</li>
              <li style={{ marginBottom: "6px" }}><strong>Law enforcement or regulators</strong> — when required by applicable law</li>
            </ul>
            <p style={{ margin: 0 }}>All third-party service providers are required to handle your data in accordance with applicable privacy laws and our data processing agreements.</p>
          </Section>

          <Section title="5. Data Retention">
            <p style={{ margin: "0 0 12px" }}>We retain your data for as long as your account is active or as needed to provide services. Specifically:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Timesheet and payment records: 7 years (for tax and audit compliance)</li>
              <li style={{ marginBottom: "6px" }}>Driver profiles: duration of employment + 2 years</li>
              <li style={{ marginBottom: "6px" }}>Vehicle records: duration of ownership + 1 year</li>
              <li style={{ marginBottom: "6px" }}>Account data: 30 days after account cancellation</li>
            </ul>
            <p style={{ margin: 0 }}>You may request deletion of your account and associated data at any time, subject to legal retention requirements.</p>
          </Section>

          <Section title="6. Data Security">
            <p style={{ margin: "0 0 12px" }}>We implement industry-standard security measures including:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>TLS/HTTPS encryption for all data in transit</li>
              <li style={{ marginBottom: "6px" }}>AES-256 encryption for sensitive fields (SIN numbers, credentials)</li>
              <li style={{ marginBottom: "6px" }}>JWT-based authentication with role-based access control</li>
              <li style={{ marginBottom: "6px" }}>Regular security audits and vulnerability assessments</li>
            </ul>
            <p style={{ margin: 0 }}>Despite our best efforts, no transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.</p>
          </Section>

          <Section title="7. Your Rights (PIPEDA / CASL)">
            <p style={{ margin: "0 0 12px" }}>Under Canadian privacy law (PIPEDA), you have the right to:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Access the personal information we hold about you</li>
              <li style={{ marginBottom: "6px" }}>Request correction of inaccurate or incomplete information</li>
              <li style={{ marginBottom: "6px" }}>Withdraw consent for certain uses of your data</li>
              <li style={{ marginBottom: "6px" }}>Request deletion of your data (subject to retention requirements)</li>
              <li style={{ marginBottom: "6px" }}>File a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p style={{ margin: 0 }}>To exercise any of these rights, contact us at <span style={{ color: "#4F46E5", fontWeight: 600 }}>privacy@fleetiqlogistics.com</span>.</p>
          </Section>

          <Section title="8. Cookies & Tracking">
            <p style={{ margin: "0 0 12px" }}>FleetIQ uses minimal cookies strictly necessary for authentication and session management. We do not use third-party advertising cookies or tracking pixels.</p>
            <p style={{ margin: 0 }}>You can disable cookies in your browser settings, but this may affect the functionality of the Platform.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p style={{ margin: 0 }}>FleetIQ is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with their information, please contact us immediately.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p style={{ margin: 0 }}>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice within the Platform at least 14 days before changes take effect. Your continued use of FleetIQ after changes take effect constitutes acceptance of the updated Policy.</p>
          </Section>

          <Section title="11. Contact Us">
            <p style={{ margin: 0 }}>
              For privacy-related inquiries, contact our Privacy Officer at:{" "}
              <span style={{ color: "#4F46E5", fontWeight: 600 }}>privacy@fleetiqlogistics.com</span>
              <br />
              FleetIQ Inc. · Toronto, Ontario, Canada
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "32px" }}>
          <button onClick={() => navigate("/terms")} style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
            Terms of Service →
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
