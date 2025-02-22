import React from "react";

const Accounts: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1>Accounts Page</h1>
      <p>Manage financial accounts and billing details here.</p>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
};

export default Accounts;