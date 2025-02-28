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