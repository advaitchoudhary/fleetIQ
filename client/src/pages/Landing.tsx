import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTruck, FaUsers, FaFileAlt, FaCreditCard, FaCalendarAlt,
  FaShieldAlt, FaTools, FaChartBar, FaCheckCircle, FaArrowRight,
  FaCar, FaGasPump, FaClipboardList, FaBell, FaBuilding,
  FaAngleDown, FaChevronDown, FaQuoteLeft, FaRobot,
  FaMapMarkerAlt,
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
    { icon: <FaClipboardList size={16} />, text: "Driver notes, warnings & incident log" },
    { icon: <FaShieldAlt size={16} />, text: "Document & licence expiry dashboard" },
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
    { icon: <FaMapMarkerAlt size={16} />, text: "Live GPS tracking & real-time admin map" },
    { icon: <FaCalendarAlt size={16} />, text: "Scheduling calendar & job dispatch" },
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
        "Driver notes, warnings & incident log",
        "Licence & document expiry dashboard",
        "Stripe driver payouts",
        "Payment history & invoicing",
      ],
      cta: "Get Started",
      highlight: false,
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
        "Live GPS tracking & admin map",
        "Scheduling calendar & job dispatch",
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
        "Everything in Vehicle & Fleet Operations",
        "Driver ↔ Vehicle assignment",
        "IFTA mileage & fuel tax reporting",
        "Multi-company support",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlight: true,
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
        .land-nav-link {
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65);
          cursor: pointer; text-decoration: none; transition: color 0.2s;
          font-family: Inter, system-ui, sans-serif; background: none; border: none; padding: 0;
        }
        .land-nav-link:hover { color: #fff; }
        .land-nav-btn-outline {
          padding: 9px 20px; background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,0.25); border-radius: 8px;
          cursor: pointer; font-size: 14px; font-weight: 500;
          font-family: Inter, system-ui, sans-serif;
          transition: background 0.2s, border-color 0.2s;
        }
        .land-nav-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.5); }
        .land-nav-btn-primary {
          padding: 9px 20px; background: #4F46E5; color: #fff; border: none;
          border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 14px rgba(79,70,229,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .land-nav-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(79,70,229,0.6); }

        /* ── Hero ── */
        .land-hero-btn-primary {
          padding: 15px 36px; background: #4F46E5; color: #fff; border: none;
          border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(79,70,229,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .land-hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,70,229,0.65); }
        .land-hero-btn-outline {
          padding: 15px 36px; background: rgba(255,255,255,0.07); color: #fff;
          border: 1px solid rgba(255,255,255,0.25); border-radius: 10px;
          cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          backdrop-filter: blur(8px);
          transition: background 0.2s, transform 0.2s, border-color 0.2s;
        }
        .land-hero-btn-outline:hover { background: rgba(255,255,255,0.14); transform: translateY(-2px); border-color: rgba(255,255,255,0.45); }

        /* ── Dashboard card mock ── */
        .land-dashboard-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(24px);
          box-shadow: 0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* ── Feature check items ── */
        .land-check-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(79,70,229,0.06); border: 1px solid rgba(79,70,229,0.15);
          font-size: 14px; color: #374151; font-weight: 500;
          transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .land-check-item:hover { background: rgba(79,70,229,0.1); border-color: rgba(79,70,229,0.3); box-shadow: 0 2px 12px rgba(79,70,229,0.1); }

        /* ── Feature cards ── */
        .land-feature-card {
          background: #fff; border-radius: 16px; padding: 32px 28px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
          position: relative; overflow: hidden;
        }
        .land-feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%;
          border-radius: 16px 0 0 16px;
        }
        .land-feature-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #d1d5db; }

        /* ── Pricing cards ── */
        .land-plan-card {
          background: #fff; border-radius: 20px; padding: 40px 32px;
          border: 1.5px solid #e5e7eb;
          transition: box-shadow 0.25s, transform 0.25s;
          display: flex; flex-direction: column;
        }
        .land-plan-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.1); transform: translateY(-4px); }
        .land-plan-card.highlight {
          background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
          border-color: transparent;
          box-shadow: 0 20px 60px rgba(79,70,229,0.4);
        }
        .land-plan-btn {
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          cursor: pointer; font-size: 15px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: auto;
        }
        .land-plan-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }

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
          border: 1px solid rgba(255,255,255,0.25); border-radius: 10px;
          cursor: pointer; font-size: 16px; font-weight: 600;
          font-family: Inter, system-ui, sans-serif;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .land-cta-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.5); transform: translateY(-2px); }

        /* ── FAQ ── */
        .land-faq-item {
          border: 1px solid #e5e7eb; border-radius: 14px;
          overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; background: #fff;
        }
        .land-faq-item:hover { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(79,70,229,0.08); }
        .land-faq-btn {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 22px 28px; background: transparent; border: none; cursor: pointer;
          font-size: 15px; font-weight: 600; color: #111827;
          font-family: Inter, system-ui, sans-serif; text-align: left;
          transition: background 0.2s;
        }
        .land-faq-btn:hover { background: #fafafa; }
        .land-faq-answer {
          padding: 0 28px 22px; font-size: 14px; color: #6b7280; line-height: 1.7;
        }

        /* ── Testimonial cards ── */
        .land-testimonial-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 36px 32px;
          backdrop-filter: blur(20px);
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .land-testimonial-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.4);
          border-color: rgba(129,140,248,0.3);
        }

        /* ── Step cards ── */
        .land-step-card {
          background: #fff; border-radius: 18px; padding: 36px 28px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          text-align: center;
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .land-step-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.09); transform: translateY(-4px); }

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
          50%       { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes land-orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes land-chevronFade {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.55; }
        }

        /* ── Hero direct animations ── */
        .land-hero-badge  { animation: land-fadeInDown 0.55s 0.15s ease-out both; }
        .land-hero-h1     { animation: land-fadeInUp 0.65s 0.3s ease-out both; }
        .land-hero-p      { animation: land-fadeInUp 0.55s 0.5s ease-out both; }
        .land-hero-btns   { animation: land-fadeInUp 0.5s 0.65s ease-out both; }
        .land-hero-trust  { animation: land-fadeInUp 0.45s 0.82s ease-out both; }
        .land-hero-right  { animation: land-fadeInRight 0.7s 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .land-orb-1       { animation: land-orbFloat 8s ease-in-out infinite; }
        .land-orb-2       { animation: land-orbFloat 11s 2s ease-in-out infinite; }
        .land-orb-3       { animation: land-orbFloat 9s 4s ease-in-out infinite; }
        .land-scroll-hint { animation: land-scrollBounce 2.2s 1.5s ease-in-out infinite; }
        .land-chevron-1   { animation: land-chevronFade 2s 0s ease-in-out infinite; }
        .land-chevron-2   { animation: land-chevronFade 2s 0.3s ease-in-out infinite; }
        .land-chevron-3   { animation: land-chevronFade 2s 0.6s ease-in-out infinite; }

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
        @media (max-width: 1024px) {
          .land-hero-grid { grid-template-columns: 1fr !important; }
          .land-hero-right { display: none !important; }
        }
        @media (max-width: 900px) {
          .land-nav { padding: 14px 20px !important; }
          .land-nav-links { display: none !important; }
          .land-hero-heading { font-size: 38px !important; letter-spacing: -1px !important; }
          .land-hero-sub { font-size: 17px !important; }
          .land-section { padding: 64px 20px !important; }
          .land-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .land-features-grid { grid-template-columns: 1fr 1fr !important; }
          .land-deep-grid { grid-template-columns: 1fr !important; }
          .land-plans-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin: 0 auto !important; }
          .land-footer-inner { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .land-steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .land-testimonials-grid { grid-template-columns: 1fr !important; max-width: 480px !important; margin: 0 auto !important; }
        }
        @media (max-width: 480px) {
          .land-hero-heading { font-size: 30px !important; }
          .land-features-grid { grid-template-columns: 1fr !important; }
          .land-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .land-steps-grid { grid-template-columns: 1fr !important; }
          .land-hero-btns-inner { flex-direction: column !important; align-items: stretch !important; }
          .land-hero-btns-inner button { text-align: center !important; justify-content: center !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className="land-nav"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 48px",
          backgroundColor: scrolled ? "rgba(10,15,30,0.98)" : "rgba(10,15,30,0.85)",
          backdropFilter: "blur(18px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.06)",
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <FaTruck size={22} style={{ color: "#818CF8" }} />
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            Fleet<span style={{ color: "#818CF8" }}>IQ</span>
          </span>
        </div>

        {/* Centre nav links */}
        <div className="land-nav-links" style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <button className="land-nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            Features
          </button>
          <button className="land-nav-link" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
            Pricing
          </button>
          <button className="land-nav-link" onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>
            FAQ
          </button>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="land-nav-btn-outline" onClick={() => navigate("/login")}>Log In</button>
          <button className="land-nav-btn-primary" onClick={() => navigate("/register")}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Dark gradient background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0A0F1E 0%, #0F172A 40%, #1A0B3E 100%)",
          zIndex: 0,
        }} />

        {/* Orb blobs */}
        <div className="land-orb-1" style={{
          position: "absolute", top: "-120px", left: "-100px", width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)",
          filter: "blur(60px)", zIndex: 1, pointerEvents: "none",
        }} />
        <div className="land-orb-2" style={{
          position: "absolute", bottom: "-80px", right: "-60px", width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)",
          filter: "blur(80px)", zIndex: 1, pointerEvents: "none",
        }} />
        <div className="land-orb-3" style={{
          position: "absolute", top: "40%", left: "38%", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
          filter: "blur(50px)", zIndex: 1, pointerEvents: "none",
        }} />

        {/* Hero content */}
        <div
          className="land-hero-grid"
          style={{
            position: "relative", zIndex: 2,
            maxWidth: "1200px", margin: "0 auto", width: "100%",
            padding: "120px 48px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "center",
          }}
        >
          {/* LEFT column */}
          <div>
            {/* Badge */}
            <div className="land-hero-badge" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              backgroundColor: "rgba(79,70,229,0.2)", border: "1px solid rgba(129,140,248,0.35)",
              borderRadius: "100px", padding: "6px 18px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px",
              color: "#A5B4FC", marginBottom: "28px", textTransform: "uppercase",
            }}>
              <FaTruck size={11} />
              Fleet Operations Platform
            </div>

            {/* H1 */}
            <h1
              className="land-hero-heading land-hero-h1"
              style={{
                fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 800, lineHeight: 1.05,
                marginBottom: "24px", letterSpacing: "-2px", marginTop: 0, color: "#fff",
              }}
            >
              Run a smarter fleet.{" "}
              <span style={{
                background: "linear-gradient(90deg, #818CF8, #C4B5FD)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                FleetIQ.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="land-hero-sub land-hero-p"
              style={{
                fontSize: "18px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
                marginBottom: "44px", fontWeight: 400, marginTop: 0,
              }}
            >
              Unify driver management, vehicle operations, timesheets, and Stripe-powered payouts — in one purpose-built platform for modern fleet operators.
            </p>

            {/* CTA Buttons */}
            <div className="land-hero-btns" style={{ marginBottom: "28px" }}>
              <div className="land-hero-btns-inner" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <button className="land-hero-btn-primary" onClick={() => navigate("/register")}>
                  Start Free Trial
                </button>
                <button className="land-hero-btn-outline" onClick={() => navigate("/login")}>
                  Log In to Dashboard
                </button>
              </div>
            </div>

            {/* Trust line */}
            <p className="land-hero-trust" style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.2px", margin: 0 }}>
              No credit card required · Cancel anytime · Stripe-powered payouts
            </p>
          </div>

          {/* RIGHT column — glassmorphism dashboard preview */}
          <div className="land-hero-right">
            <div className="land-dashboard-card">
              {/* Card header */}
              <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444" }} />
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f59e0b" }} />
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                  Fleet Dashboard
                </span>
              </div>

              {/* Stat rows */}
              {[
                { label: "Active Drivers", value: "24", badge: "Active", bc: "#d1fae5", tc: "#059669" },
                { label: "Pending Timesheets", value: "7", badge: "Review", bc: "#fef3c7", tc: "#d97706" },
                { label: "Payouts This Month", value: "$18,430", badge: "Sent", bc: "#ede9fe", tc: "#7c3aed" },
                { label: "Vehicles Road-Ready", value: "31 / 34", badge: "Good", bc: "#d1fae5", tc: "#059669" },
                { label: "Docs Expiring Soon", value: "2", badge: "Action", bc: "#fee2e2", tc: "#dc2626" },
              ].map((row, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.05)", borderRadius: "10px",
                  padding: "13px 16px", marginBottom: "8px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{row.value}</span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px",
                      background: row.bc, color: row.tc, textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>{row.badge}</span>
                  </div>
                </div>
              ))}

              {/* Bottom summary */}
              <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                <div style={{
                  flex: 1, padding: "14px", textAlign: "center",
                  background: "rgba(79,70,229,0.15)", borderRadius: "10px",
                  border: "1px solid rgba(79,70,229,0.25)",
                }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Stripe Status</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#A5B4FC" }}>Connected</div>
                </div>
                <div style={{
                  flex: 1, padding: "14px", textAlign: "center",
                  background: "rgba(16,185,129,0.12)", borderRadius: "10px",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Compliance</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#34d399" }}>94% OK</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="land-scroll-hint"
          onClick={() => document.getElementById("land-next")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            position: "absolute", bottom: "32px", left: "50%",
            transform: "translateX(-50%)", zIndex: 2,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Scroll</span>
          <FaChevronDown className="land-chevron-1" size={16} style={{ color: "rgba(255,255,255,0.7)", display: "block" }} />
          <FaChevronDown className="land-chevron-2" size={16} style={{ color: "rgba(255,255,255,0.7)", display: "block", marginTop: "-6px" }} />
          <FaChevronDown className="land-chevron-3" size={16} style={{ color: "rgba(255,255,255,0.7)", display: "block", marginTop: "-6px" }} />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section id="land-next" style={{ backgroundColor: "#0F172A", padding: "60px 48px", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
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
              <div style={{
                fontSize: "46px", fontWeight: 800, lineHeight: 1, color: "#fff",
                background: "linear-gradient(135deg, #818CF8, #C4B5FD)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>{stat.value}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU GET — overview cards ── */}
      <section id="features" className="land-section" style={{ backgroundColor: "#F8FAFC", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-reveal" style={{ textAlign: "center", marginBottom: "68px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
              WHAT YOU GET
            </p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: "16px", color: "#111827", marginTop: 0, letterSpacing: "-0.5px" }}>
              One platform. Every operation.
            </h2>
            <p style={{ fontSize: "18px", color: "#6B7280", maxWidth: "520px", margin: "0 auto", lineHeight: 1.65 }}>
              Stop juggling spreadsheets and disconnected tools. FleetIQ brings your entire operation under one roof.
            </p>
          </div>
          <div
            className="land-features-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}
          >
            {[
              {
                icon: <FaUsers size={20} style={{ color: "#4F46E5" }} />,
                title: "Driver Management",
                desc: "Digital applications, onboarding, and profiles for every driver. Track compliance, documents, rates, and work status from one dashboard.",
                iconBg: "#eef2ff", borderColor: "#4F46E5", path: "/register",
              },
              {
                icon: <FaTruck size={20} style={{ color: "#0891b2" }} />,
                title: "Vehicle Operations",
                desc: "Full vehicle registry with maintenance scheduling, DVIR inspections, fuel analytics, parts inventory, and job dispatch — all linked to your fleet.",
                iconBg: "#e0f2fe", borderColor: "#0891b2", path: "/register",
              },
              {
                icon: <FaFileAlt size={20} style={{ color: "#059669" }} />,
                title: "Digital Timesheets",
                desc: "Drivers submit hours from any device. Admins review, approve, and auto-calculate payouts in seconds. No paper, no back-and-forth.",
                iconBg: "#d1fae5", borderColor: "#059669", path: "/register",
              },
              {
                icon: <FaCreditCard size={20} style={{ color: "#7c3aed" }} />,
                title: "Driver Payouts",
                desc: "Stripe-powered direct deposits. Select a pay period, review auto-totals, and pay drivers — all from within the platform.",
                iconBg: "#ede9fe", borderColor: "#7c3aed", path: "/register",
              },
              {
                icon: <FaBuilding size={20} style={{ color: "#d97706" }} />,
                title: "Multi-Company Support",
                desc: "Manage multiple organizations from a single account. Built for agencies and enterprise operators running multiple fleets.",
                iconBg: "#fef3c7", borderColor: "#d97706", path: "/register",
              },
              {
                icon: <FaMapMarkerAlt size={20} style={{ color: "#dc2626" }} />,
                title: "Live Vehicle Tracking",
                desc: "Real-time GPS tracking with a live admin map, trip history, and polyline replay. Drivers share location from any browser — no hardware required.",
                iconBg: "#fee2e2", borderColor: "#dc2626", path: "/register",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="land-feature-card land-reveal"
                style={{ transitionDelay: `${i * 0.08}s`, cursor: "pointer" }}
                onClick={() => navigate(feature.path)}
              >
                {/* Left colour bar via pseudo-element via inline override */}
                <div style={{
                  position: "absolute", top: 0, left: 0, width: "3px", height: "100%",
                  background: feature.borderColor, borderRadius: "16px 0 0 16px",
                }} />
                <div style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: feature.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "20px",
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px", color: "#111827", marginTop: 0 }}>{feature.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, margin: "0 0 16px" }}>{feature.desc}</p>
                <div style={{ fontSize: "13px", fontWeight: 600, color: feature.borderColor, display: "flex", alignItems: "center", gap: "4px" }}>
                  Learn more <FaArrowRight size={11} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: DRIVER MANAGEMENT ── */}
      <section className="land-section" style={{ backgroundColor: "#fff", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div className="land-reveal-left">
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
                DRIVER MANAGEMENT
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "18px", lineHeight: 1.12, letterSpacing: "-0.5px" }}>
                From application to payroll - fully digital
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.75, marginBottom: "32px" }}>
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
                style={{ marginTop: "36px" }}
                onClick={() => navigate("/login")}
              >
                Explore Driver Tools
              </button>
            </div>
            {/* Visual panel */}
            <div className="land-reveal-right" style={{
              background: "linear-gradient(135deg, #0F172A, #1e1b4b)",
              borderRadius: "20px", padding: "36px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px" }}>Drivers Overview</span>
              </div>
              {[
                { label: "Active Drivers", value: "24", badge: "active", badgeColor: "#d1fae5", badgeText: "#059669" },
                { label: "Pending Timesheets", value: "7", badge: "review", badgeColor: "#fef3c7", badgeText: "#d97706" },
                { label: "Payouts This Month", value: "$18,430", badge: "sent", badgeColor: "#ede9fe", badgeText: "#7c3aed" },
                { label: "Docs Missing", value: "2", badge: "action needed", badgeColor: "#fee2e2", badgeText: "#dc2626" },
              ].map((row, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: "10px",
                  padding: "14px 16px", marginBottom: "10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{row.value}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: row.badgeColor, color: row.badgeText, textTransform: "uppercase", letterSpacing: "0.4px" }}>{row.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: VEHICLE OPERATIONS ── */}
      <section className="land-section" style={{ backgroundColor: "#F8FAFC", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            {/* Visual panel — left */}
            <div className="land-reveal-left" style={{
              background: "linear-gradient(135deg, #0F172A, #1e1b4b)",
              borderRadius: "20px", padding: "36px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px" }}>Fleet Status</span>
              </div>
              {[
                { label: "Unit #104 — Oil Change Due", status: "due soon", sc: "#fef3c7", tc: "#d97706" },
                { label: "Unit #87 — Inspection Passed", status: "ok", sc: "#d1fae5", tc: "#059669" },
                { label: "Unit #112 — In Maintenance", status: "in progress", sc: "#e0f2fe", tc: "#0891b2" },
                { label: "Unit #033 — Warranty Expiring", status: "alert", sc: "#fee2e2", tc: "#dc2626" },
              ].map((row, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: "10px",
                  padding: "14px 16px", marginBottom: "10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: row.sc, color: row.tc, textTransform: "uppercase", letterSpacing: "0.4px" }}>{row.status}</span>
                </div>
              ))}
              <div style={{ marginTop: "20px", padding: "16px", background: "rgba(56,189,248,0.08)", borderRadius: "10px", border: "1px solid rgba(56,189,248,0.2)" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Avg Fuel Efficiency</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8" }}>11.4 <span style={{ fontSize: "16px", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>L/100km</span></div>
              </div>
            </div>
            <div className="land-reveal-right">
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#0891b2", marginBottom: "14px" }}>
                VEHICLE OPERATIONS
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "18px", lineHeight: 1.12, letterSpacing: "-0.5px" }}>
                Keep every vehicle road-ready
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.75, marginBottom: "32px" }}>
                From registration to retirement, FleetIQ tracks every vehicle in your fleet. Schedule preventive maintenance, log DVIR inspections, monitor fuel burn, manage parts & warranties, and run IFTA mileage reports — all in one place.
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
                style={{ marginTop: "36px" }}
                onClick={() => navigate("/login")}
              >
                Explore Vehicle Tools
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: PAYMENTS ── */}
      <section className="land-section" style={{ backgroundColor: "#fff", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div className="land-reveal-left">
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#7c3aed", marginBottom: "14px" }}>
                PAYMENTS & BILLING
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "18px", lineHeight: 1.12, letterSpacing: "-0.5px" }}>
                Pay drivers in one click
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.75, marginBottom: "32px" }}>
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
                style={{ marginTop: "36px" }}
                onClick={() => navigate("/login")}
              >
                Explore Payment Tools
              </button>
            </div>
            {/* Visual panel */}
            <div className="land-reveal-right" style={{
              background: "linear-gradient(135deg, #0F172A, #1e1b4b)",
              borderRadius: "20px", padding: "36px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ marginLeft: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px" }}>Payroll — Mar 1–15</span>
              </div>
              {[
                { name: "J. Martinez", period: "Mar 1–15", amount: "$1,840", status: "Paid" },
                { name: "S. Patel", period: "Mar 1–15", amount: "$2,110", status: "Paid" },
                { name: "T. Williams", period: "Mar 1–15", amount: "$1,560", status: "Processing" },
                { name: "R. Chen", period: "Mar 1–15", amount: "$1,980", status: "Pending" },
              ].map((row, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.06)", borderRadius: "10px",
                  padding: "14px 16px", marginBottom: "10px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{row.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{row.period}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#a78bfa" }}>{row.amount}</span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                      background: row.status === "Paid" ? "#d1fae5" : row.status === "Processing" ? "#e0f2fe" : "#fef3c7",
                      color: row.status === "Paid" ? "#059669" : row.status === "Processing" ? "#0891b2" : "#d97706",
                      textTransform: "uppercase", letterSpacing: "0.4px",
                    }}>{row.status}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, padding: "14px", background: "rgba(167,139,250,0.1)", borderRadius: "10px", border: "1px solid rgba(167,139,250,0.2)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Total Sent</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa" }}>$7,490</div>
                </div>
                <div style={{ flex: 1, padding: "14px", background: "rgba(167,139,250,0.1)", borderRadius: "10px", border: "1px solid rgba(167,139,250,0.2)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Drivers Paid</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa" }}>2 / 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ASSISTANT ── */}
      <section className="land-section" style={{ backgroundColor: "#F8FAFC", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            {/* Visual panel */}
            <div className="land-reveal-left" style={{
              background: "linear-gradient(135deg, #0F172A, #1e1b4b)",
              borderRadius: "20px", padding: "36px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(79,70,229,0.3)", border: "1px solid rgba(79,70,229,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FaRobot size={16} color="#818CF8" />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>FleetIQ Assistant</div>
                  <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>● Online</div>
                </div>
              </div>
              {[
                { role: "user", text: "How many vehicles are overdue for maintenance?" },
                { role: "ai", text: "Based on your fleet, 3 vehicles are overdue: Unit #104 (oil change), Unit #207 (brake inspection), and Unit #312 (tire rotation). Head to Preventive Maintenance to generate work orders." },
                { role: "user", text: "Which driver has the most hours this week?" },
                { role: "ai", text: "You can check this in All Timesheets — filter by the current week and sort by total hours to see the breakdown across your team." },
              ].map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", fontSize: "12px", lineHeight: 1.6,
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user" ? "#4F46E5" : "rgba(255,255,255,0.07)",
                    color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {/* Text content */}
            <div className="land-reveal-right">
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
                AI-POWERED
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "18px", lineHeight: 1.12, letterSpacing: "-0.5px" }}>
                Your fleet has an AI assistant built in
              </h2>
              <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.75, marginBottom: "32px" }}>
                Ask anything about your fleet — maintenance schedules, driver status, warranty claims, fuel costs. The FleetIQ Assistant knows your platform inside out and gives instant, role-aware answers.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: <FaRobot size={15} />, text: "Instant answers about vehicles, drivers & maintenance" },
                  { icon: <FaCheckCircle size={15} />, text: "Role-scoped — drivers only see their own data" },
                  { icon: <FaShieldAlt size={15} />, text: "Admins get full fleet-wide context" },
                  { icon: <FaBell size={15} />, text: "Ask about overdue alerts, expiring licences & more" },
                  { icon: <FaCalendarAlt size={15} />, text: "Step-by-step guidance on using any feature" },
                ].map((f, i) => (
                  <div key={i} className="land-check-item">
                    <span style={{ color: "#4F46E5", flexShrink: 0 }}>{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                className="land-hero-btn-primary"
                style={{ marginTop: "36px" }}
                onClick={() => navigate("/register")}
              >
                Try it free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: "relative", padding: "100px 48px", overflow: "hidden" }}>
        {/* Dark gradient background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0A0F1E 0%, #0F172A 50%, #1A0B3E 100%)",
          zIndex: 0,
        }} />
        {/* Subtle orb */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px", height: "400px",
          background: "radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, transparent 70%)",
          filter: "blur(60px)", zIndex: 1, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="land-reveal" style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#818CF8", marginBottom: "14px" }}>
              TESTIMONIALS
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginTop: 0, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Trusted by fleet operators
            </h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", maxWidth: "460px", margin: "0 auto", lineHeight: 1.65 }}>
              Real results from the people running real fleets.
            </p>
          </div>

          <div
            className="land-testimonials-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}
          >
            {[
              {
                quote: "FleetIQ cut our timesheet processing from 2 days to 20 minutes. The Stripe payout integration is flawless.",
                name: "Sarah M.",
                title: "Fleet Manager, Oakville Logistics",
                delay: "0s",
              },
              {
                quote: "Managing 5 companies used to require 3 separate tools. FleetIQ does it all in one dashboard.",
                name: "Raj T.",
                title: "Director of Operations, GTA Transport Group",
                delay: "0.1s",
              },
              {
                quote: "Our drivers love submitting timesheets from their phones. Zero paper, zero excuses.",
                name: "Mike D.",
                title: "Owner, North Shore Freight",
                delay: "0.2s",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="land-testimonial-card land-reveal"
                style={{ transitionDelay: t.delay }}
              >
                <FaQuoteLeft size={22} style={{ color: "#818CF8", marginBottom: "20px", opacity: 0.7 }} />
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, marginBottom: "28px", marginTop: 0, fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #4F46E5, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="land-section" style={{ backgroundColor: "#F8FAFC", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
            HOW IT WORKS
          </p>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", letterSpacing: "-0.5px" }}>
            Up and running in minutes
          </h2>
          <p style={{ fontSize: "17px", color: "#6b7280", marginBottom: "68px", lineHeight: 1.65, maxWidth: "460px", margin: "0 auto 68px" }}>
            No setup fees. No IT required. Just sign up and start managing your fleet.
          </p>
          <div
            className="land-steps-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}
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
                color: "#7c3aed",
              },
              {
                step: "03",
                title: "Run operations",
                desc: "Drivers submit timesheets, vehicles log inspections, and the platform tracks compliance and maintenance automatically.",
                color: "#0891b2",
              },
              {
                step: "04",
                title: "Pay & grow",
                desc: "Review approved timesheets, send Stripe payouts, generate invoices, and scale across multiple companies.",
                color: "#059669",
              },
            ].map((s, i) => (
              <div key={s.step} className="land-step-card land-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div style={{
                  fontSize: "52px", fontWeight: 900, lineHeight: 1, marginBottom: "16px",
                  background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginTop: 0, marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="land-section" style={{ backgroundColor: "#fff", padding: "100px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="land-reveal" style={{ textAlign: "center", marginBottom: "68px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
              PRICING
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: "17px", color: "#6b7280", maxWidth: "440px", margin: "0 auto", lineHeight: 1.65 }}>
              Pay for what you use. No hidden fees, no long-term contracts.
            </p>
          </div>
          <div
            className="land-plans-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "start" }}
          >
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`land-plan-card land-reveal${plan.highlight ? " highlight" : ""}`}
                style={{ position: "relative", transitionDelay: `${i * 0.1}s` }}
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(90deg, #4F46E5, #7c3aed)",
                    color: "#fff", fontSize: "10px", fontWeight: 700,
                    padding: "5px 18px", borderRadius: "20px", letterSpacing: "1px",
                    whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: plan.highlight ? "#fff" : "#111827", marginTop: 0, marginBottom: "8px" }}>{plan.name}</h3>
                  <p style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.7)" : "#6b7280", lineHeight: 1.6, margin: "0 0 22px" }}>{plan.desc}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "46px", fontWeight: 800, color: plan.highlight ? "#fff" : "#111827", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: "16px", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#6b7280", fontWeight: 500 }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <FaCheckCircle size={15} style={{ color: plan.highlight ? "#C4B5FD" : "#4F46E5", marginTop: "1px", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="land-plan-btn"
                  style={{
                    background: plan.highlight ? "#fff" : "#4F46E5",
                    color: plan.highlight ? "#4F46E5" : "#fff",
                    border: "none",
                    boxShadow: plan.highlight ? "0 4px 16px rgba(0,0,0,0.15)" : "0 4px 14px rgba(79,70,229,0.35)",
                    marginTop: "12px",
                  }}
                  onClick={() => navigate("/register")}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", marginTop: "36px" }}>
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
      <section id="faq" className="land-section" style={{ backgroundColor: "#F8FAFC", padding: "100px 48px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div className="land-reveal" style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#4F46E5", marginBottom: "14px" }}>
              FAQ
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#111827", marginTop: 0, letterSpacing: "-0.5px" }}>
              Common questions
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, i) => (
              <div key={i} className="land-faq-item land-reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                <button className="land-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <FaAngleDown
                    size={16}
                    style={{
                      color: "#6b7280", flexShrink: 0, marginLeft: "16px",
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s",
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
      <section style={{ position: "relative", padding: "120px 48px", textAlign: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0A0F1E 0%, #0F172A 40%, #1A0B3E 100%)",
          zIndex: 0,
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px", height: "500px",
          background: "radial-gradient(ellipse, rgba(79,70,229,0.2) 0%, transparent 70%)",
          filter: "blur(60px)", zIndex: 1, pointerEvents: "none",
        }} />
        <div className="land-reveal" style={{ maxWidth: "640px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            backgroundColor: "rgba(79,70,229,0.18)", border: "1px solid rgba(129,140,248,0.3)",
            borderRadius: "100px", padding: "6px 18px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px",
            color: "#A5B4FC", marginBottom: "28px", textTransform: "uppercase",
          }}>
            <FaTruck size={11} />
            Ready to modernize your fleet?
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 50px)", fontWeight: 800, color: "#fff", marginBottom: "20px", lineHeight: 1.08, marginTop: 0, letterSpacing: "-1.5px" }}>
            Your entire fleet operation -{" "}
            <span style={{
              background: "linear-gradient(90deg, #818CF8, #C4B5FD)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              One Platform
            </span>
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", marginBottom: "48px", lineHeight: 1.7 }}>
            Join fleet operators who manage drivers, vehicles, and payments without the chaos. Start your free trial today.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="land-cta-btn-primary" onClick={() => navigate("/register")}>
              Start Free Trial
            </button>
            <button className="land-cta-btn-outline" onClick={() => navigate("/login")}>
              Log In to Your Fleet
            </button>
          </div>
          <p style={{ marginTop: "28px", fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
            No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        backgroundColor: "#0A0F1E",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 48px",
      }}>
        <div
          className="land-footer-inner"
          style={{
            maxWidth: "1200px", margin: "0 auto",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaTruck size={17} style={{ color: "#818CF8" }} />
            <span style={{ fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.3px" }}>
              Fleet<span style={{ color: "#818CF8" }}>IQ</span>
            </span>
          </div>

          {/* Links centre */}
          <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            {[
              { label: "Log In", path: "/login" },

              { label: "Pricing", path: "/pricing" },
              { label: "Terms of Service", path: "/terms" },
              { label: "Privacy Policy", path: "/privacy" },
            ].map((link) => (
              <span
                key={link.label}
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", cursor: "pointer", transition: "color 0.2s" }}
                onClick={() => navigate(link.path)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {link.label}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", margin: 0 }}>
            © {new Date().getFullYear()} FleetIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
