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
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role ?? "")) {
    return <Navigate to="/admin-home" />;
  }

  const isAdmin = ADMIN_ROLES.includes(user.role ?? "");

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  if (requiredRole === "driver" && user.role !== "driver") {
    return <Navigate to="/admin-home" />;
  }

  return children;
};

export default ProtectedRoute;
