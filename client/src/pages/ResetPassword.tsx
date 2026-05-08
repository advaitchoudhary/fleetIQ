import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";
import { FaTruck, FaArrowRight } from "react-icons/fa";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "13px 14px",
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

    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, password });
      setSuccess(true);
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

          {success ? (
            /* Success state */
            <div>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  fontSize: "24px",
                }}
              >
                ✓
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
                Password Reset
              </h2>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.6,
                }}
              >
                Your password has been reset successfully. You can now sign in with your new password.
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6D5EE8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#7B6CF6")}
              >
                <span>Go to Login</span>
                <FaArrowRight size={13} />
              </button>
            </div>
          ) : !token ? (
            /* Missing token state */
            <div>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.3px",
                }}
              >
                Invalid Link
              </h2>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.6,
                }}
              >
                This reset link is missing a token. Please use the link from your email or request a new one.
              </p>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
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
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6D5EE8")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#7B6CF6")}
              >
                Request New Reset Link
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
                  Set New Password
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                  Choose a strong password — at least 8 characters.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Error banner */}
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

                {/* New Password */}
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
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("password")}
                  />
                  {password.length > 0 && password.length < 8 && (
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#F87171" }}>
                      {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
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
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("confirm")}
                  />
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#F87171" }}>
                      Passwords do not match
                    </div>
                  )}
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
                    <span>Resetting...</span>
                  ) : (
                    <>
                      <span>Reset Password</span>
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

export default ResetPassword;
