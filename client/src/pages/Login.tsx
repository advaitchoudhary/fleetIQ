import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/env";
import axios from "axios";


const Login: React.FC = () => {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, [role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const loginUrl = role === "driver" ? `${API_BASE_URL}/drivers/login` : `${API_BASE_URL}/auth/login`;
    const payload = role === "driver"
      ? { username: email.trim(), password: password.trim() }
      : { email: email.trim(), password: password.trim() };

    try {
      const response = await axios.post(loginUrl, payload);
      const { token, driver } = response.data;

      localStorage.setItem("token", token);

      if (role === "admin") {
        await login(email.trim(), password.trim()); // Admin flow → existing login handles redirect
      } else {
        // Normalize driver user object
        const driverUser = {
          id: driver.id,
          username: driver.username,
          name: driver.name,
          email: driver.email,
          role: driver.role,
        };
        localStorage.setItem("user", JSON.stringify(driverUser));
        console.log("Driver login successful. Token and user stored.");

        // Auto-redirect driver to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid credentials or login failed.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <h1 style={styles.title}>Welcome to the Driver Portal</h1>
        <p style={styles.description}>
          Manage your trips, track your hours, and stay updated with important information.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
          </select>
          {role === "driver" ? (
            <input
              type="text"
              placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          ) : (
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative" as const,
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
    padding: "40px",
    borderRadius: "10px",
    textAlign: "center" as const,
    color: "#fff",
    maxWidth: "400px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  description: {
    fontSize: "1.2rem",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  input: {
    width: "92%",
    padding: "12px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "5px",
    fontSize: "16px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fff",
    color: "#111827",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "5px",
    fontSize: "16px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#fff",
    color: "#111827",
  },
  button: {
    padding: "12px",
    backgroundColor: "#4F46E5",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "18px",
    transition: "background 0.3s ease",
  },
};

export default Login;