import React from "react";

const ContactUs: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1>Contact Us Page</h1>
      <p>Contact support for any queries or assistance.</p>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center" as const,
  },
};

export default ContactUs;