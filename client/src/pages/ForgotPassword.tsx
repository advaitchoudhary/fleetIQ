import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaTruck, FaArrowRight } from "react-icons/fa";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "13px 14px 13px 44px",
    borderRadius: "10px",
    border: `1.5px solid ${focusedField === field ? "#7B6CF6" : "rgba(255,255,255,0.08)"}`,
    fontSize: "14px",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    background: "#1A2235",
    transition: "border-color 0.2s",
    fontFamily: "Inter, system-ui, sans-serif",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#090D18",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Back to login */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "Inter, system-ui, sans-serif",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          ← Back to Login
        </button>

        {/* Card */}
        <div
          style={{
            background: "#0F1629",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "36px 32px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #4F46E5, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTruck size={16} color="#fff" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              Fleet<span style={{ color: "#818CF8" }}>IQ</span>
            </span>
          </div>

          {submitted ? (
            /* Success state */
            <div>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  background: "rgba(123,108,246,0.12)",
                  border: "1px solid rgba(123,108,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  fontSize: "24px",
                }}
              >
                📬
              </div>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.3px",
                }}
              >
                Check your inbox
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                If <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong> is registered, you'll
                receive a password reset link shortly. The link expires in 1 hour.
              </p>
              <p style={{ margin: "0 0 24px", fontSize: "13px", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                Didn't receive it? Check your spam folder or try again with a different email address.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#7B6CF6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  boxShadow: "0 4px 20px rgba(123,108,246,0.35)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6D5EE8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#7B6CF6")}
              >
                Back to Login
              </button>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "28px" }}>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Forgot Password
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Error */}
                {error && (
                  <div
                    style={{
                      color: "#F87171",
                      fontSize: "13px",
                      padding: "10px 14px",
                      backgroundColor: "rgba(248,113,113,0.08)",
                      borderRadius: "8px",
                      border: "1px solid rgba(248,113,113,0.25)",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(255,255,255,0.25)",
                        pointerEvents: "none",
                        fontSize: "13px",
                        fontStyle: "normal",
                      }}
                    >
                      @
                    </span>
                    <input
                      type="email"
                      placeholder="admin@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required
                      style={inputStyle("email")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: loading ? "#4A3FA0" : "#7B6CF6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "Inter, system-ui, sans-serif",
                    boxShadow: "0 4px 20px rgba(123,108,246,0.35)",
                    transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <FaArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
