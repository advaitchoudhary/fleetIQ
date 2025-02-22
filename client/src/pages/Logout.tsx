import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear user authentication state (if using localStorage/sessionStorage)
    localStorage.removeItem("isAuthenticated"); // If storing login state
    sessionStorage.removeItem("isAuthenticated");

    // Redirect to login page
    navigate("/");
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h2>Logging out...</h2>
    </div>
  );
};

// Define Styles
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: "#555",
  },
};

export default Logout;