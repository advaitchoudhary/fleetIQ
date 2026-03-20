import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_ROLES = ["admin", "company_admin", "super_admin", "dispatcher"];

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: "admin" | "driver";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
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