import React from "react";

const Trips: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1>Trips Page</h1>
      <p>View and manage trip details here.</p>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
};

export default Trips;