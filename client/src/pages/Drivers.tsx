import React from "react";

const Drivers: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1>Drivers Page</h1>
      <p>Manage and view driver information here.</p>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
};

export default Drivers;