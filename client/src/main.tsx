import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary"; // ✅ Import ErrorBoundary

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ErrorBoundary> {/* ✅ Wrap App with ErrorBoundary */}
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);