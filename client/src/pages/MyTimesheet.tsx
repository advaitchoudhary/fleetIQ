import React from "react";
import Navbar from "./Navbar";

const MyTimesheet: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h1>My Timesheet Page</h1>
        <p>View and manage timesheet here.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
};

export default MyTimesheet;