
// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "60px 20px", textAlign: "center", fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Something went wrong.</h1>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;