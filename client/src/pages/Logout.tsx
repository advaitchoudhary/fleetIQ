import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import AuthContext

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout(); // Call logout function to clear localStorage and auth state
    navigate("/");
  }, [logout, navigate]);

  return (
    <div style={styles.container}>
      <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>Logging out...</h2>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#6b7280",
    backgroundColor: "#f4f6f8",
  },
};

export default Logout;