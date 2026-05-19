import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaEnvelope, FaPhone, FaClock, FaMapMarkerAlt, FaArrowRight, FaArrowLeft, FaShieldAlt, FaHeadset, FaBook, FaBug } from "react-icons/fa";

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
  };

  const contacts = [
    {
      icon: <FaEnvelope size={16} />,
      label: "General Support",
      value: "support@fleetiqlogistics.com",
      sub: "Response within 24 hours",
    },
    {
      icon: <FaEnvelope size={16} />,
      label: "Billing & Subscriptions",
      value: "billing@fleetiqlogistics.com",
      sub: "Response within 1 business day",
    },
    {
      icon: <FaPhone size={16} />,
      label: "Phone Support",
      value: "+1 (800) 555-0192",
      sub: "Mon – Fri, 9 AM – 6 PM EST",
    },
    {
      icon: <FaMapMarkerAlt size={16} />,
      label: "Head Office",
      value: "100 Fleet Street, Toronto, ON M5H 2N2",
      sub: "Canada",
    },
    {
      icon: <FaClock size={16} />,
      label: "Business Hours",
      value: "Monday – Friday",
      sub: "9:00 AM – 6:00 PM EST",
    },
  ];

  const helpTopics = [
    { icon: <FaHeadset size={18} />, title: "Account & Login", desc: "Password resets, account access, role changes, and multi-org setup." },
    { icon: <FaShieldAlt size={18} />, title: "Billing & Plans", desc: "Subscription upgrades, invoices, payment methods, and cancellations." },
    { icon: <FaBook size={18} />, title: "Getting Started", desc: "Onboarding guides, driver setup, vehicle registration, and first dispatch." },
    { icon: <FaBug size={18} />, title: "Report an Issue", desc: "Bug reports, unexpected behaviour, or data discrepancies in the platform." },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#090D18", color: "#fff" }}>
      <style>{`
        * { box-sizing: border-box; }
        .sp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; transition: border-color 0.2s, background 0.2s; }
        .sp-card:hover { border-color: rgba(123,108,246,0.4); background: rgba(123,108,246,0.04); }
        .sp-input { width: 100%; padding: 11px 14px; background: #0F1629; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 9px; color: #fff; font-size: 14px; font-family: Inter, system-ui, sans-serif; outline: none; transition: border-color 0.2s; }
        .sp-input:focus { border-color: #7B6CF6; }
        .sp-input::placeholder { color: rgba(255,255,255,0.2); }
        .sp-submit { width: 100%; padding: 13px; background: #7B6CF6; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: Inter, system-ui, sans-serif; box-shadow: 0 4px 20px rgba(123,108,246,0.35); transition: background 0.2s, transform 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .sp-submit:hover:not(:disabled) { background: #6D5EE8; transform: translateY(-1px); }
        .sp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 900px) { [data-sp-grid] { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { [data-sp-topics] { grid-template-columns: 1fr !important; } [data-sp-wrap] { padding: 24px 20px !important; } }
      `}</style>

      {/* Nav */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#7B6CF6,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaTruck size={14} color="#fff" />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#7B6CF6" }}>IQ</span>
          </span>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          <FaArrowLeft size={11} /> Back to Login
        </button>
      </div>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "52px 48px" }} data-sp-wrap>

        {/* Header */}
        <div style={{ marginBottom: "52px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(123,108,246,0.1)", border: "1px solid rgba(123,108,246,0.25)", borderRadius: "20px", padding: "5px 14px", marginBottom: "18px" }}>
            <FaHeadset size={12} color="#7B6CF6" />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#7B6CF6", letterSpacing: "0.5px" }}>SUPPORT CENTER</span>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>
            Reach out to the FleetIQ Logistics team — we're here Monday through Friday.
          </p>
        </div>

        {/* Help topics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px", marginBottom: "52px" }} data-sp-topics>
          {helpTopics.map((t) => (
            <div key={t.title} className="sp-card" style={{ padding: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(123,108,246,0.12)", border: "1px solid rgba(123,108,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7B6CF6", marginBottom: "14px" }}>
                {t.icon}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Two-column: contact info + form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "32px", alignItems: "start" }} data-sp-grid>

          {/* Left: contact info */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Company</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>FleetIQ Logistics</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {contacts.map((c) => (
                <div key={c.label} className="sp-card" style={{ padding: "16px 18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(123,108,246,0.12)", border: "1px solid rgba(123,108,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7B6CF6", flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "3px" }}>{c.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: "2px" }}>{c.value}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: contact form */}
          <div style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
                  ✓
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#fff" }}>Message Sent</h3>
                <p style={{ margin: "0 0 24px", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}
                  style={{ padding: "10px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ marginBottom: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>Send a Message</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>We'll respond to your inquiry as soon as possible.</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "7px" }}>Full Name</label>
                    <input className="sp-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "7px" }}>Email Address</label>
                    <input className="sp-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "7px" }}>Topic</label>
                  <select className="sp-input" name="subject" value={formData.subject} onChange={handleChange} required style={{ cursor: "pointer", appearance: "none" as const }}>
                    <option value="" disabled>Select a topic</option>
                    <option value="Account & Login">Account &amp; Login</option>
                    <option value="Billing & Plans">Billing &amp; Plans</option>
                    <option value="Getting Started">Getting Started</option>
                    <option value="Report an Issue">Report an Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "7px" }}>Message</label>
                  <textarea className="sp-input" name="message" value={formData.message} onChange={handleChange} placeholder="Describe your issue or question in detail…" required style={{ height: "130px", resize: "vertical" as const }} />
                </div>

                <button type="submit" className="sp-submit" disabled={submitting}>
                  {submitting ? "Sending…" : <><span>Send Message</span><FaArrowRight size={13} /></>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "64px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} FleetIQ Logistics. All rights reserved.</div>
          <div style={{ display: "flex", gap: "20px" }}>
            {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Login", href: "/login" }].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
              >{label}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Support;
