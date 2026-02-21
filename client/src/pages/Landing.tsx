import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes landingBgZoom {
          from { transform: scale(1.05); }
          to { transform: scale(1); }
        }
        @keyframes landingFadeIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landingLogoIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        [data-land-bg] {
          animation: landingBgZoom 1.2s ease-out both;
        }
        [data-land-logo] {
          animation: landingLogoIn 0.7s ease-out both;
          animation-delay: 0.15s;
        }
        [data-land-title] {
          animation: landingFadeIn 0.6s ease-out both;
          animation-delay: 0.35s;
        }
        [data-land-desc] {
          animation: landingFadeIn 0.6s ease-out both;
          animation-delay: 0.5s;
        }
        [data-land-btn-login] {
          animation: landingFadeIn 0.5s ease-out both;
          animation-delay: 0.65s;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease !important;
        }
        [data-land-btn-login]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.55) !important;
        }
        [data-land-btn-login]:active {
          transform: translateY(0) !important;
        }
        [data-land-btn-apply] {
          animation: landingFadeIn 0.5s ease-out both;
          animation-delay: 0.8s;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease !important;
        }
        [data-land-btn-apply]:hover {
          transform: translateY(-2px) !important;
          background-color: rgba(255, 255, 255, 0.22) !important;
          box-shadow: 0 6px 16px rgba(255, 255, 255, 0.15) !important;
        }
        [data-land-btn-apply]:active {
          transform: translateY(0) !important;
        }
        @media (max-width: 640px) {
          [data-land-title] { font-size: 28px !important; }
          [data-land-desc] { font-size: 15px !important; }
          [data-land-content] { padding: 0 16px !important; }
          [data-land-btn-container] { max-width: 100% !important; }
        }
      `}</style>
      <div style={styles.bgImage} data-land-bg />
      <div style={styles.overlay}>
        <div style={styles.content} data-land-content>
          <img src={logo} alt="Company Logo" style={styles.logo} data-land-logo />
          <h1 style={styles.title} data-land-title>Welcome to Premier Choice Employment</h1>
          <p style={styles.description} data-land-desc>
            Your gateway to professional fleet management
          </p>
          <div style={styles.buttonContainer} data-land-btn-container>
            <button onClick={() => navigate("/login")} style={styles.loginButton} data-land-btn-login>
              Log In
            </button>
            <button onClick={() => navigate("/file-application")} style={styles.applicationButton} data-land-btn-apply>
              File Driver Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url('/fleet.avif')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    zIndex: 0,
  },
  overlay: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(2px)",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  content: {
    textAlign: "center",
    color: "#fff",
    maxWidth: "560px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  logo: {
    maxWidth: "180px",
    width: "100%",
    height: "auto",
    marginBottom: "12px",
    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
  },
  title: {
    fontSize: "40px",
    fontWeight: 700,
    marginBottom: "4px",
    marginTop: 0,
    textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
    lineHeight: "1.15",
    letterSpacing: "-0.5px",
  },
  description: {
    fontSize: "18px",
    marginBottom: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
    fontWeight: 400,
    lineHeight: "1.5",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "360px",
    marginTop: "24px",
  },
  loginButton: {
    padding: "14px 32px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.2px",
  },
  applicationButton: {
    padding: "14px 32px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.2px",
    backdropFilter: "blur(8px)",
  },
};

export default Landing;
