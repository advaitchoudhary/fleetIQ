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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
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
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "30px",
  },
  logo: {
    maxWidth: "200px",
    width: "100%",
    height: "auto",
    marginBottom: "20px",
    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "10px",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
    lineHeight: "1.2",
  },
  description: {
    fontSize: "1.3rem",
    marginBottom: "20px",
    color: "#e5e7eb",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: "400px",
    marginTop: "20px",
  },
  loginButton: {
    padding: "16px 32px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0px 4px 12px rgba(79, 70, 229, 0.4)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  applicationButton: {
    padding: "16px 32px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    border: "2px solid #fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default Landing;

