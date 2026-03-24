import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaArrowLeft } from "react-icons/fa";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "36px" }}>
    <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "12px", marginTop: 0 }}>{title}</h2>
    <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.8 }}>{children}</div>
  </div>
);

const TermsOfService: React.FC = () => {
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
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.5px" }}>Terms of Service</h1>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>Last updated: March 23, 2026</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e0e7ff", padding: "40px 48px", boxShadow: "0 2px 16px rgba(79,70,229,0.07)" }}>

          <Section title="1. Acceptance of Terms">
            <p style={{ margin: "0 0 12px" }}>By accessing or using FleetIQ ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Platform.</p>
            <p style={{ margin: 0 }}>These Terms apply to all users of the Platform, including fleet operators, administrators, drivers, and any other persons who access or use the service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p style={{ margin: "0 0 12px" }}>FleetIQ is a fleet operations management platform that provides tools for:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Driver management, onboarding, and compliance tracking</li>
              <li style={{ marginBottom: "6px" }}>Vehicle registry, maintenance scheduling, and inspection management</li>
              <li style={{ marginBottom: "6px" }}>Digital timesheet submission and approval workflows</li>
              <li style={{ marginBottom: "6px" }}>Stripe-powered driver payouts and payment history</li>
              <li style={{ marginBottom: "6px" }}>Multi-company and multi-tenant organizational management</li>
            </ul>
            <p style={{ margin: 0 }}>FleetIQ reserves the right to modify, suspend, or discontinue any feature of the Platform at any time with reasonable notice.</p>
          </Section>

          <Section title="3. Account Registration">
            <p style={{ margin: "0 0 12px" }}>To use the Platform, you must register for an account and provide accurate, complete information. You are responsible for:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Maintaining the confidentiality of your account credentials</li>
              <li style={{ marginBottom: "6px" }}>All activities that occur under your account</li>
              <li style={{ marginBottom: "6px" }}>Notifying FleetIQ immediately of any unauthorized use of your account</li>
            </ul>
            <p style={{ margin: 0 }}>You must be at least 18 years of age and have the legal authority to enter into contracts on behalf of your organization to register.</p>
          </Section>

          <Section title="4. Subscription Plans & Billing">
            <p style={{ margin: "0 0 12px" }}>FleetIQ offers the following subscription plans:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}><strong>Driver Management</strong> — $49/month</li>
              <li style={{ marginBottom: "6px" }}><strong>Vehicle & Fleet Operations</strong> — $49/month</li>
              <li style={{ marginBottom: "6px" }}><strong>Fleet Bundle</strong> — $79/month</li>
            </ul>
            <p style={{ margin: "0 0 12px" }}>Subscriptions are billed monthly or annually depending on your selected billing cycle. Annual plans are offered at a discounted rate. All prices are in CAD unless stated otherwise.</p>
            <p style={{ margin: 0 }}>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. No refunds are provided for partial billing periods.</p>
          </Section>

          <Section title="5. Driver Payments & Stripe Connect">
            <p style={{ margin: "0 0 12px" }}>FleetIQ integrates with Stripe to facilitate driver payouts. By using the payment features, you agree to Stripe's Terms of Service in addition to these Terms.</p>
            <p style={{ margin: "0 0 12px" }}>FleetIQ acts solely as a platform connecting fleet operators with their drivers. FleetIQ is not responsible for errors, delays, or failures in payment processing caused by Stripe or third-party banking systems.</p>
            <p style={{ margin: 0 }}>You are solely responsible for ensuring that driver pay rates, timesheet approvals, and payout amounts are accurate before initiating any transfer.</p>
          </Section>

          <Section title="6. Acceptable Use">
            <p style={{ margin: "0 0 12px" }}>You agree not to use the Platform to:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "6px" }}>Upload false, misleading, or fraudulent information about drivers or vehicles</li>
              <li style={{ marginBottom: "6px" }}>Violate any applicable federal, provincial, or local laws or regulations</li>
              <li style={{ marginBottom: "6px" }}>Attempt to gain unauthorized access to any part of the Platform</li>
              <li style={{ marginBottom: "6px" }}>Interfere with or disrupt the integrity or performance of the Platform</li>
              <li style={{ marginBottom: "6px" }}>Use the Platform for any illegal employment or labour practices</li>
            </ul>
          </Section>

          <Section title="7. Data & Privacy">
            <p style={{ margin: "0 0 12px" }}>Your use of the Platform is also governed by our <strong>Privacy Policy</strong>, which is incorporated into these Terms by reference. By using FleetIQ, you consent to the collection and use of data as described in the Privacy Policy.</p>
            <p style={{ margin: 0 }}>You retain ownership of all data you upload to the Platform. You grant FleetIQ a limited licence to process and store that data solely for the purpose of providing the service.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p style={{ margin: 0 }}>All intellectual property rights in the Platform, including software, design, trademarks, and content created by FleetIQ, are owned by FleetIQ. You are granted a limited, non-exclusive, non-transferable licence to use the Platform solely for your internal business operations.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p style={{ margin: "0 0 12px" }}>To the maximum extent permitted by applicable law, FleetIQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>
            <p style={{ margin: 0 }}>FleetIQ's total liability to you for any claims arising under these Terms shall not exceed the amount you paid to FleetIQ in the three (3) months preceding the claim.</p>
          </Section>

          <Section title="10. Termination">
            <p style={{ margin: 0 }}>FleetIQ reserves the right to suspend or terminate your account at any time if you violate these Terms. Upon termination, your right to access the Platform will cease immediately. You may export your data within 30 days of termination notice.</p>
          </Section>

          <Section title="11. Governing Law">
            <p style={{ margin: 0 }}>These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts of Ontario, Canada.</p>
          </Section>

          <Section title="12. Changes to Terms">
            <p style={{ margin: 0 }}>FleetIQ may update these Terms at any time. We will notify you of material changes via email or a notice within the Platform at least 14 days before changes take effect. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="13. Contact">
            <p style={{ margin: 0 }}>
              If you have questions about these Terms, please contact us at:{" "}
              <span style={{ color: "#4F46E5", fontWeight: 600 }}>legal@fleetiq.ca</span>
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "32px" }}>
          <button onClick={() => navigate("/privacy")} style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
            Privacy Policy →
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px", fontFamily: "Inter, system-ui, sans-serif" }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
