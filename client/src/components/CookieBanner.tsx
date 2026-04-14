import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "fleetiq_cookie_consent";

const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#0A0F1E",
        borderTop: "1px solid rgba(79,70,229,0.35)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: "13px", color: "#d1d5db", lineHeight: 1.6, flex: 1, minWidth: "240px" }}>
        We use strictly necessary cookies to keep you signed in and maintain your session.
        No advertising or tracking cookies are used.{" "}
        <button
          onClick={() => navigate("/privacy")}
          style={{
            background: "none",
            border: "none",
            color: "#818CF8",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            padding: 0,
            textDecoration: "underline",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Privacy Policy
        </button>
      </p>

      <button
        onClick={accept}
        style={{
          background: "linear-gradient(135deg, #4F46E5, #7c3aed)",
          border: "none",
          color: "#fff",
          borderRadius: "8px",
          padding: "9px 22px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Inter, system-ui, sans-serif",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Got it
      </button>
    </div>
  );
};

export default CookieBanner;
