import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_ROLES = ["admin", "company_admin", "dispatcher"];

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: "admin" | "driver";
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // allowedRoles is used for routes that require a specific role (e.g. /select-org → admin only)
  if (allowedRoles && !allowedRoles.includes(user.role ?? "")) {
    // Redirect to the appropriate home for the user's actual role
    if (user.role === "driver") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/admin-home" replace />;
  }

  const isAdmin = ADMIN_ROLES.includes(user.role ?? "");

  if (requiredRole === "admin") {
    if (!isAdmin) {
      // Driver trying to access an admin route — send to driver dashboard
      return <Navigate to="/dashboard" replace />;
    }
    // Platform-level admin (no org) trying to access org-scoped admin pages
    // must first select an org via /select-org
    if (user.role === "admin" && !user.organizationId) {
      return <Navigate to="/select-org" replace />;
    }
  }

  if (requiredRole === "driver" && user.role !== "driver") {
    return <Navigate to="/admin-home" replace />;
  }

  return children;
};

export default ProtectedRoute;
