import React from "react";
import Navbar from "./Navbar";

const Accounts: React.FC = () => {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.title}>Accounts Page</h1>
        <p style={styles.description}>Manage financial accounts and billing details here.</p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "60px 20px",
    textAlign: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "8px",
    letterSpacing: "-0.3px",
  },
  description: {
    fontSize: "15px",
    color: "#6b7280",
  },
};

export default Accounts;