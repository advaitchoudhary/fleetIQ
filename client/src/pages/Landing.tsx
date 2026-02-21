import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [loginHovered, setLoginHovered] = useState(false);
  const [applicationHovered, setApplicationHovered] = useState(false);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleFileApplication = () => {
    navigate("/file-application");
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <div style={styles.content}>
          {/* Company Logo */}
          <img src={logo} alt="Company Logo" style={styles.logo} />
          
          {/* Welcome Message */}
          <h1 style={styles.title}>Welcome to Premier Choice Employment</h1>
          <p style={styles.description}>
            Your gateway to professional fleet management
          </p>

          {/* Action Buttons */}
          <div style={styles.buttonContainer}>
            <button
              onClick={handleLogin}
              onMouseEnter={() => setLoginHovered(true)}
              onMouseLeave={() => setLoginHovered(false)}
              style={{
                ...styles.loginButton,
                transform: loginHovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: loginHovered
                  ? "0px 6px 16px rgba(79, 70, 229, 0.6)"
                  : "0px 4px 12px rgba(79, 70, 229, 0.4)",
              }}
            >
              Log In
            </button>
            <button
              onClick={handleFileApplication}
              onMouseEnter={() => setApplicationHovered(true)}
              onMouseLeave={() => setApplicationHovered(false)}
              style={{
                ...styles.applicationButton,
                transform: applicationHovered ? "translateY(-2px)" : "translateY(0)",
                backgroundColor: applicationHovered
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(255, 255, 255, 0.1)",
                boxShadow: applicationHovered
                  ? "0px 6px 16px rgba(255, 255, 255, 0.3)"
                  : "none",
              }}
            >
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
    backgroundImage: `url('/fleet.avif')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  overlay: {
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
    transition: "all 0.2s ease",
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
    transition: "all 0.2s ease",
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "0.2px",
    backdropFilter: "blur(8px)",
  },
};

export default Landing;

