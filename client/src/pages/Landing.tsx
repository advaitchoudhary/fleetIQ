import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTruck, FaUsers, FaFileAlt, FaCreditCard, FaCalendarAlt,
  FaShieldAlt, FaTools, FaChartBar, FaCheckCircle, FaArrowRight,
  FaCar, FaGasPump, FaClipboardList, FaBell, FaBuilding,
  FaLayerGroup, FaAngleDown,
} from "react-icons/fa";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-reveal: add .visible to .land-reveal elements when they enter the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".land-reveal, .land-reveal-left, .land-reveal-right, .land-reveal-scale").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const driverFeatures = [
    { icon: <FaUsers size={16} />, text: "Digital driver onboarding & applications" },
    { icon: <FaFileAlt size={16} />, text: "Timesheet submission from any device" },
    { icon: <FaClipboardList size={16} />, text: "Document & compliance tracking" },
    { icon: <FaBell size={16} />, text: "Licence & certification expiry alerts" },
    { icon: <FaCreditCard size={16} />, text: "Rate management per driver category" },
    { icon: <FaCheckCircle size={16} />, text: "Admin approval workflow for timesheets" },
  ];

  const vehicleFeatures = [
    { icon: <FaCar size={16} />, text: "Full vehicle registry with VIN & plates" },
    { icon: <FaTools size={16} />, text: "Preventive & corrective maintenance logs" },
    { icon: <FaClipboardList size={16} />, text: "DVIR pre/post-trip inspections" },
    { icon: <FaGasPump size={16} />, text: "Fuel consumption & L/100km analytics" },
    { icon: <FaShieldAlt size={16} />, text: "Parts inventory & warranty tracking" },
    { icon: <FaChartBar size={16} />, text: "Full cost tracking & service history" },
  ];

  const paymentFeatures = [
    { icon: <FaCreditCard size={16} />, text: "Stripe-powered direct driver payouts" },
    { icon: <FaFileAlt size={16} />, text: "Auto-calculated subtotals from timesheets" },
    { icon: <FaChartBar size={16} />, text: "Full payment history & audit trail" },
    { icon: <FaCalendarAlt size={16} />, text: "Flexible pay period selection" },
    { icon: <FaBuilding size={16} />, text: "Multi-company billing support" },
    { icon: <FaCheckCircle size={16} />, text: "Invoice generation & management" },
  ];

  const plans = [
    {
      name: "Driver Management",
      price: "$49",
      period: "/mo",
      desc: "Everything you need to manage your driver workforce end-to-end.",
      color: "#4F46E5",
      features: [
        "Unlimited driver profiles",
        "Digital driver applications",
        "Timesheet submission & approval",
        "Document & compliance tracking",
        "Stripe driver payouts",
        "Payment history & invoicing",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Fleet Bundle",
      price: "$79",
      period: "/mo",
      desc: "The complete platform — drivers, vehicles, and payments in one place.",
      color: "#4F46E5",
      features: [
        "Everything in Driver Management",
        "Full vehicle registry",
        "Maintenance & inspection logs",
        "Fuel consumption analytics",
        "Parts & warranty tracking",
        "Cost tracking & service history",
        "Scheduling calendar",
        "Multi-company support",
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Vehicle & Fleet Operations",
      price: "$49",
      period: "/mo",
      desc: "Full vehicle management and fleet operations — from inspections to cost tracking.",
      color: "#4F46E5",
      features: [
        "Full vehicle registry",
        "DVIR inspection reports",
        "Preventive maintenance scheduling",
        "Fuel logs & L/100km stats",
        "Parts inventory management",
        "Warranty & service history",
      ],
      cta: "Get Started",
      highlight: false,
    },
  ];

  const faqs = [
    {
      q: "Can drivers access FleetIQ on their phones?",
      a: "Yes. Drivers can log in from any device — phone, tablet, or desktop — to submit timesheets, view their schedule, and check their payment status.",
    },
    {
      q: "How does driver payout work?",
      a: "FleetIQ integrates with Stripe to process payments directly to drivers. Admins select a pay period, review auto-calculated totals from approved timesheets, and send payouts in one click.",
    },
    {
      q: "Can I manage multiple fleets or companies?",
      a: "Absolutely. FleetIQ supports multi-tenancy — you can manage multiple organizations from a single admin account, each with their own drivers, vehicles, and billing.",
    },
    {
      q: "Is there a contract or can I cancel anytime?",
      a: "No long-term contracts. All plans are month-to-month and you can cancel at any time. Annual billing is also available at a discounted rate.",
    },
    {
      q: "How does driver onboarding work?",
      a: "Drivers apply through a public application form. Admins review, approve, and onboard drivers directly in the platform — uploading required documents, setting rates, and assigning credentials.",
    },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#111827", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }

        /* ── Navbar ── */
        .land-nav-btn-outline {
          padding: 9px 20px; background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
          cursor: pointer; font-size: 14px; font-weight: 500;
          font-family: Inter, system-ui, sans-serif;
          transition: background 0.2s, border-color 0.2s;
        }
        .land-nav-btn-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); }
        .land-nav-btn-primary {
          padding: 9px 20px; background: #4F46E5; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 14px rgba(79,70,229,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .land-nav-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.55); }

        /* ── Hero ── */
        .land-hero-btn-primary {
          padding: 15px 36px; background: #4F46E5; color: #fff; border: none;
          border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(79,70,229,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .land-hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,70,229,0.6); }
        .land-hero-btn-outline {
          padding: 15px 36px; background: rgba(255,255,255,0.1); color: #fff;
          border: 1px solid rgba(255,255,255,0.35); border-radius: 10px;
          cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          backdrop-filter: blur(8px);
          transition: background 0.2s, transform 0.2s;
        }
        .land-hero-btn-outline:hover { background: rgba(255,255,255,0.18); transform: translateY(-2px); }

        /* ── Feature check items ── */
        .land-check-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 8px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          font-size: 14px; color: #374151; font-weight: 500;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .land-check-item:hover { background: #eef2ff; border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(79,70,229,0.08); }

        /* ── Feature cards ── */
        .land-feature-card {
          background: #fff; border-radius: 16px; padding: 32px 28px;
          border: 1px solid #E5E7EB; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .land-feature-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-3px); }

        /* ── Pricing cards ── */
        .land-plan-card {
          background: #fff; border-radius: 20px; padding: 36px 32px;
          border: 2px solid #e5e7eb;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          display: flex; flex-direction: column;
        }
        .land-plan-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.1); transform: translateY(-4px); }
        .land-plan-card.highlight {
          border-color: #4F46E5;
          box-shadow: 0 8px 40px rgba(79,70,229,0.18);
        }
        .land-plan-btn {
          width: 100%; padding: 13px; border: none; border-radius: 10px;
          cursor: pointer; font-size: 15px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: auto;
        }
        .land-plan-btn:hover { transform: translateY(-1px); }

        /* ── CTA buttons ── */
        .land-cta-btn-primary {
          padding: 16px 40px; background: #4F46E5; color: #fff; border: none;
          border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(79,70,229,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .land-cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,70,229,0.65); }
        .land-cta-btn-outline {
          padding: 16px 40px; background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,0.3); border-radius: 10px;
          cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .land-cta-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.55); transform: translateY(-2px); }

        /* ── FAQ ── */
        .land-faq-item {
          border: 1px solid #e5e7eb; border-radius: 12px;
          overflow: hidden; transition: border-color 0.2s;
        }
        .land-faq-item:hover { border-color: #c7d2fe; }
        .land-faq-btn {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; background: #fff; border: none; cursor: pointer;
          font-size: 15px; font-weight: 600; color: #111827;
          font-family: Inter, system-ui, sans-serif; text-align: left;
          transition: background 0.2s;
        }
        .land-faq-btn:hover { background: #f9fafb; }
        .land-faq-answer {
          padding: 0 24px 20px; font-size: 14px; color: #6b7280; line-height: 1.65;
        }

        /* ── Keyframes ── */
        @keyframes land-fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes land-fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes land-fadeInLeft {
          from { opacity: 0; transform: translateX(-44px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes land-fadeInRight {
          from { opacity: 0; transform: translateX(44px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes land-scaleIn {
          from { opacity: 0; transform: scale(0.91); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes land-bgZoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1); }
        }
        @keyframes land-scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes land-orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-12px) scale(1.03); }
        }

        /* ── Hero direct animations ── */
        .land-hero-bg  { animation: land-bgZoom 1.8s cubic-bezier(0.22,1,0.36,1) both; }
        .land-hero-badge { animation: land-fadeInDown 0.55s 0.15s ease-out both; }
        .land-hero-h1  { animation: land-fadeInUp 0.65s 0.3s ease-out both; }
        .land-hero-p   { animation: land-fadeInUp 0.55s 0.5s ease-out both; }
        .land-hero-btns { animation: land-fadeInUp 0.5s 0.65s ease-out both; }
        .land-hero-trust { animation: land-fadeInUp 0.45s 0.82s ease-out both; }
        .land-scroll-hint { animation: land-scrollBounce 2s 1.5s ease-in-out infinite; }

        /* ── Scroll-reveal base ── */
        .land-reveal        { opacity: 0; transform: translateY(28px);  transition: opacity 0.65s ease, transform 0.65s ease; }
        .land-reveal-left   { opacity: 0; transform: translateX(-44px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .land-reveal-right  { opacity: 0; transform: translateX(44px);  transition: opacity 0.65s ease, transform 0.65s ease; }
        .land-reveal-scale  { opacity: 0; transform: scale(0.92);       transition: opacity 0.55s ease, transform 0.55s ease; }
        .land-reveal.visible, .land-reveal-left.visible,
        .land-reveal-right.visible, .land-reveal-scale.visible {
          opacity: 1; transform: none;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .land-nav { padding: 14px 20px !important; }
          .land-hero-heading { font-size: 38px !important; letter-spacing: -1px !important; }
          .land-hero-sub { font-size: 17px !important; }
          .land-section { padding: 64px 20px !important; }
          .land-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .land-features-grid { grid-template-columns: 1fr 1fr !important; }
          .land-deep-grid { grid-template-columns: 1fr !important; }
          .land-plans-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin: 0 auto !important; }
          .land-footer { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .land-steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .land-hero-heading { font-size: 30px !important; }
          .land-features-grid { grid-template-columns: 1fr !important; }
          .land-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className="land-nav"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 48px",
          backgroundColor: scrolled ? "rgba(15,23,42,0.97)" : "rgba(15,23,42,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.07)",
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaTruck size={22} style={{ color: "#818CF8" }} />
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="land-nav-btn-outline" onClick={() => navigate("/login")}>Log In</button>
          <button className="land-nav-btn-primary" onClick={() => navigate("/file-application")}>
            File Driver Application
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="land-hero-bg" style={{
          position: "absolute", inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80')`,
          backgroundSize: "cover", backgroundPosition: "center", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(79,70,229,0.5) 100%)",
          zIndex: 1,
        }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", color: "#fff", maxWidth: "800px", padding: "0 24px" }}>
          <div className="land-hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            backgroundColor: "rgba(79,70,229,0.25)", border: "1px solid rgba(129,140,248,0.4)",
            borderRadius: "100px", padding: "6px 18px",
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.8px",
            color: "#A5B4FC", marginBottom: "28px", textTransform: "uppercase",
          }}>
            <FaTruck size={12} />
            Fleet Operations Platform
          </div>
          <h1
            className="land-hero-heading land-hero-h1"
            style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.06, marginBottom: "24px", letterSpacing: "-2px", marginTop: 0 }}
          >
            Run a smarter fleet.{" "}
            <span style={{ color: "#818CF8" }}>Zero chaos.</span>
          </h1>
          <p
            className="land-hero-sub land-hero-p"
            style={{ fontSize: "20px", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: "44px", fontWeight: 400, maxWidth: "600px", margin: "0 auto 44px" }}
          >
            FleetIQ unifies driver management, vehicle operations, timesheets, and Stripe-powered payouts — in one purpose-built platform for modern fleet operators.
          </p>
          <div className="land-hero-btns" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="land-hero-btn-primary" onClick={() => navigate("/login")}>
              Get Started <FaArrowRight size={13} />
            </button>
            <button className="land-hero-btn-outline" onClick={() => navigate("/file-application")}>
              File Driver Application
            </button>
          </div>
          <p className="land-hero-trust" style={{ marginTop: "24px", fontSize: "13px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.2px" }}>
            No credit card required · Cancel anytime
          </p>
        </div>
        <div className="land-scroll-hint" style={{ position: "absolute", bottom: "36px", left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.4 }}>
          <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.5)" }} />
          <span style={{ fontSize: "10px", color: "#fff", letterSpacing: "2px", textTransform: "uppercase" }}>Scroll</span>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ backgroundColor: "#fff", padding: "56px 48px", borderBottom: "1px solid #E5E7EB" }}>
        <div
          className="land-stats-grid"
          style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}
        >
          {[
            { value: "34+", label: "Platform Features" },
            { value: "100%", label: "Paperless Operations" },
            { value: "Stripe", label: "Powered Payouts" },
            { value: "3", label: "Flexible Plans" },
          ].map((stat, i) => (
            <div key={stat.label} className="land-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: "42px", fontWeight: 800, color: "#4F46E5", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "14px", color: "#6B7280", marginTop: "10px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU GET — overview cards ── */}
      <section className="land-section" style={{ backgroundColor: "#F9FAFB", padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "12px" }}>
              WHAT YOU GET
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, marginBottom: "16px", color: "#111827", marginTop: 0, letterSpacing: "-0.5px" }}>
              One platform. Every operation.
            </h2>
            <p style={{ fontSize: "18px", color: "#6B7280", maxWidth: "540px", margin: "0 auto", lineHeight: 1.65 }}>
              Stop juggling spreadsheets and disconnected tools. FleetIQ brings your entire operation under one roof.
            </p>
          </div>
          <div
            className="land-features-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}
          >
            {[
              {
                icon: <FaUsers size={22} style={{ color: "#4F46E5" }} />,
                title: "Driver Management",
                desc: "Digital applications, onboarding, and profiles for every driver. Track compliance, documents, rates, and work status from one dashboard.",
                bg: "#eef2ff",
              },
              {
                icon: <FaTruck size={22} style={{ color: "#0891b2" }} />,
                title: "Vehicle Operations",
                desc: "Full vehicle registry with maintenance scheduling, DVIR inspections, fuel analytics, and parts inventory — all linked to your fleet.",
                bg: "#e0f2fe",
              },
              {
                icon: <FaFileAlt size={22} style={{ color: "#059669" }} />,
                title: "Digital Timesheets",
                desc: "Drivers submit hours from any device. Admins review, approve, and auto-calculate payouts in seconds. No paper, no back-and-forth.",
                bg: "#d1fae5",
              },
              {
                icon: <FaCreditCard size={22} style={{ color: "#7c3aed" }} />,
                title: "Driver Payouts",
                desc: "Stripe-powered direct deposits. Select a pay period, review auto-totals, and pay drivers — all from within the platform.",
                bg: "#ede9fe",
              },
              {
                icon: <FaBuilding size={22} style={{ color: "#d97706" }} />,
                title: "Multi-Company Support",
                desc: "Manage multiple organizations from a single account. Built for agencies and enterprise operators running multiple fleets.",
                bg: "#fef3c7",
              },
              {
                icon: <FaLayerGroup size={22} style={{ color: "#dc2626" }} />,
                title: "Flexible Subscriptions",
                desc: "Driver Management, Vehicle & Fleet Operations, or the full Fleet Bundle. Pay for what you use and scale as your fleet grows.",
                bg: "#fee2e2",
              },
            ].map((feature, i) => (
              <div key={feature.title} className="land-feature-card land-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: feature.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "10px", color: "#111827", marginTop: 0 }}>{feature.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: DRIVER MANAGEMENT ── */}
      <section className="land-section" style={{ backgroundColor: "#fff", padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div className="land-reveal-left">
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "12px" }}>
                DRIVER MANAGEMENT
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                From application to payroll — fully digital
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.7, marginBottom: "32px" }}>
                FleetIQ handles every stage of the driver lifecycle. Drivers apply online, admins onboard with documents, set rates, and manage compliance — then pay out directly through Stripe at the end of each period.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {driverFeatures.map((f, i) => (
                  <div key={i} className="land-check-item">
                    <span style={{ color: "#4F46E5", flexShrink: 0 }}>{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                className="land-hero-btn-primary"
                style={{ marginTop: "32px" }}
                onClick={() => navigate("/login")}
              >
                Explore Driver Tools <FaArrowRight size={13} />
              </button>
            </div>
            {/* Visual panel */}
            <div className="land-reveal-right" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e1b4b 100%)", borderRadius: "20px", padding: "36px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              </div>
              {[
                { label: "Active Drivers", value: "24", badge: "active", badgeColor: "#d1fae5", badgeText: "#059669" },
                { label: "Pending Timesheets", value: "7", badge: "review", badgeColor: "#fef3c7", badgeText: "#d97706" },
                { label: "Payouts This Month", value: "$18,430", badge: "sent", badgeColor: "#ede9fe", badgeText: "#7c3aed" },
                { label: "Docs Missing", value: "2", badge: "action needed", badgeColor: "#fee2e2", badgeText: "#dc2626" },
              ].map((row, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{row.value}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: row.badgeColor, color: row.badgeText }}>{row.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: VEHICLE OPERATIONS ── */}
      <section className="land-section" style={{ backgroundColor: "#F9FAFB", padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            {/* Visual panel — left */}
            <div className="land-reveal-left" style={{ background: "linear-gradient(135deg, #0c4a6e 0%, #0F172A 100%)", borderRadius: "20px", padding: "36px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              </div>
              {[
                { label: "Unit #104 — Oil Change Due", status: "due soon", sc: "#fef3c7", tc: "#d97706" },
                { label: "Unit #87 — Inspection Passed", status: "ok", sc: "#d1fae5", tc: "#059669" },
                { label: "Unit #112 — In Maintenance", status: "in progress", sc: "#e0f2fe", tc: "#0891b2" },
                { label: "Unit #033 — Warranty Expiring", status: "alert", sc: "#fee2e2", tc: "#dc2626" },
              ].map((row, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: row.sc, color: row.tc }}>{row.status}</span>
                </div>
              ))}
              <div style={{ marginTop: "20px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Avg Fuel Efficiency</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8" }}>11.4 <span style={{ fontSize: "16px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>L/100km</span></div>
              </div>
            </div>
            <div className="land-reveal-right">
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#0891b2", marginBottom: "12px" }}>
                VEHICLE OPERATIONS
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                Keep every vehicle road-ready
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.7, marginBottom: "32px" }}>
                From registration to retirement, FleetIQ tracks every vehicle in your fleet. Schedule preventive maintenance, log DVIR inspections, monitor fuel burn, and manage parts & warranties — all in one place.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {vehicleFeatures.map((f, i) => (
                  <div key={i} className="land-check-item">
                    <span style={{ color: "#0891b2", flexShrink: 0 }}>{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                className="land-hero-btn-primary"
                style={{ marginTop: "32px" }}
                onClick={() => navigate("/login")}
              >
                Explore Vehicle Tools <FaArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: PAYMENTS ── */}
      <section className="land-section" style={{ backgroundColor: "#fff", padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div className="land-reveal-left">
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#7c3aed", marginBottom: "12px" }}>
                PAYMENTS & BILLING
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                Pay drivers in one click
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.7, marginBottom: "32px" }}>
                FleetIQ calculates driver pay automatically from approved timesheets and your per-category rates. Connect with Stripe once — then pay any driver, anytime, with a full audit trail of every transaction.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {paymentFeatures.map((f, i) => (
                  <div key={i} className="land-check-item">
                    <span style={{ color: "#7c3aed", flexShrink: 0 }}>{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                className="land-hero-btn-primary"
                style={{ marginTop: "32px" }}
                onClick={() => navigate("/login")}
              >
                Explore Payment Tools <FaArrowRight size={13} />
              </button>
            </div>
            {/* Visual panel */}
            <div className="land-reveal-right" style={{ background: "linear-gradient(135deg, #2e1065 0%, #0F172A 100%)", borderRadius: "20px", padding: "36px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              </div>
              {[
                { name: "J. Martinez", period: "Mar 1–15", amount: "$1,840", status: "Paid" },
                { name: "S. Patel", period: "Mar 1–15", amount: "$2,110", status: "Paid" },
                { name: "T. Williams", period: "Mar 1–15", amount: "$1,560", status: "Processing" },
                { name: "R. Chen", period: "Mar 1–15", amount: "$1,980", status: "Pending" },
              ].map((row, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{row.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{row.period}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#a78bfa" }}>{row.amount}</span>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px",
                      background: row.status === "Paid" ? "#d1fae5" : row.status === "Processing" ? "#e0f2fe" : "#fef3c7",
                      color: row.status === "Paid" ? "#059669" : row.status === "Processing" ? "#0891b2" : "#d97706",
                    }}>{row.status}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Total Sent</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa", marginTop: "4px" }}>$7,490</div>
                </div>
                <div style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Drivers Paid</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa", marginTop: "4px" }}>2 / 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-section" style={{ backgroundColor: "#F9FAFB", padding: "96px 48px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "12px" }}>
            HOW IT WORKS
          </p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", letterSpacing: "-0.5px" }}>
            Up and running in minutes
          </h2>
          <p style={{ fontSize: "17px", color: "#6b7280", marginBottom: "64px", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 64px" }}>
            No setup fees. No IT required. Just sign up and start managing your fleet.
          </p>
          <div
            className="land-steps-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", textAlign: "left" }}
          >
            {[
              {
                step: "01",
                title: "Register your company",
                desc: "Create your FleetIQ account, add your company details, and choose the plan that fits your operation.",
                color: "#4F46E5",
              },
              {
                step: "02",
                title: "Add drivers & vehicles",
                desc: "Onboard your drivers, set their rates and documents. Register your vehicles with full specs and insurance info.",
                color: "#0891b2",
              },
              {
                step: "03",
                title: "Operate & pay",
                desc: "Drivers submit timesheets, you approve and pay — while the platform tracks compliance, maintenance, and costs automatically.",
                color: "#7c3aed",
              },
            ].map((s, i) => (
              <div key={s.step} className="land-reveal" style={{ background: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transitionDelay: `${i * 0.12}s` }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: s.color, textTransform: "uppercase", marginBottom: "16px" }}>
                  Step {s.step}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: "12px" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="land-section" style={{ backgroundColor: "#fff", padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "12px" }}>
              PRICING
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
              Pay for what you use. No hidden fees, no long-term contracts.
            </p>
          </div>
          <div
            className="land-plans-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "start" }}
          >
            {plans.map((plan, i) => (
              <div key={plan.name} className={`land-plan-card land-reveal${plan.highlight ? " highlight" : ""}`} style={{ position: "relative", transitionDelay: `${i * 0.1}s` }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#4F46E5", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 18px", borderRadius: "20px", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: "8px" }}>{plan.name}</h3>
                  <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6, margin: "0 0 20px" }}>{plan.desc}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "42px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: "16px", color: "#6b7280", fontWeight: 500 }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#374151" }}>
                      <FaCheckCircle size={15} style={{ color: "#4F46E5", marginTop: "1px", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="land-plan-btn"
                  style={{
                    background: plan.highlight ? "#4F46E5" : "#f9fafb",
                    color: plan.highlight ? "#fff" : "#111827",
                    border: plan.highlight ? "none" : "1px solid #e5e7eb",
                    boxShadow: plan.highlight ? "0 4px 14px rgba(79,70,229,0.35)" : "none",
                    marginTop: "12px",
                  }}
                  onClick={() => navigate("/company-register")}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "32px" }}>
            All plans include a free trial. Need a custom plan?{" "}
            <span
              style={{ color: "#4F46E5", cursor: "pointer", fontWeight: 600 }}
              onClick={() => navigate("/contact-us")}
            >
              Contact us
            </span>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="land-section" style={{ backgroundColor: "#F9FAFB", padding: "96px 48px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "12px" }}>
              FAQ
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#111827", marginTop: 0, letterSpacing: "-0.5px" }}>
              Common questions
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, i) => (
              <div key={i} className="land-faq-item">
                <button className="land-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <FaAngleDown
                    size={16}
                    style={{
                      color: "#6b7280", flexShrink: 0, marginLeft: "12px",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div className="land-faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="land-section" style={{ backgroundColor: "#0F172A", padding: "108px 48px", textAlign: "center" }}>
        <div className="land-reveal" style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", backgroundColor: "rgba(79,70,229,0.2)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "100px", padding: "5px 16px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.8px", color: "#A5B4FC", marginBottom: "24px", textTransform: "uppercase" }}>
            <FaTruck size={11} />
            Ready to modernize your fleet?
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, color: "#fff", marginBottom: "20px", lineHeight: 1.1, marginTop: 0, letterSpacing: "-1px" }}>
            Your entire fleet operation — one platform
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.55)", marginBottom: "44px", lineHeight: 1.65 }}>
            Join fleet operators who manage drivers, vehicles, and payments without the chaos. Start your free trial today.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="land-cta-btn-primary" onClick={() => navigate("/company-register")}>
              Start Free Trial
            </button>
            <button className="land-cta-btn-outline" onClick={() => navigate("/login")}>
              Log In to Your Fleet
            </button>
          </div>
          <p style={{ marginTop: "24px", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="land-footer"
        style={{
          backgroundColor: "#0F172A",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px", opacity: 0.6 }}>
          <FaTruck size={16} style={{ color: "#818CF8" }} />
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <span
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", cursor: "pointer", transition: "color 0.2s" }}
            onClick={() => navigate("/login")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            Log In
          </span>
          <span
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", cursor: "pointer", transition: "color 0.2s" }}
            onClick={() => navigate("/file-application")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            Driver Application
          </span>
          <span
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", cursor: "pointer", transition: "color 0.2s" }}
            onClick={() => navigate("/pricing")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            Pricing
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          © {new Date().getFullYear()} FleetIQ. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
