import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { API_BASE_URL } from "../utils/env";// Update as per your backend URL

interface User {
  id?: string;
  email: string;
  name?: string;
  role: "admin" | "company_admin" | "dispatcher" | "driver" | null;
  organizationId?: string | null;
  driverId?: string | null;
  orgName?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginDirect: (token: string, user: User) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  switchOrg: (orgId: string, orgName: string) => Promise<void>;
  exitOrg: () => void;
  isInsideOrg: boolean;
  activeOrgName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Reactive org-context state so Navbar re-renders when switchOrg/exitOrg is called
  const [isInsideOrg, setIsInsideOrg] = useState<boolean>(
    () => !!localStorage.getItem("superadmin_token")
  );
  const [activeOrgName, setActiveOrgName] = useState<string | null>(
    () => localStorage.getItem("active_org_name")
  );

  const navigate = useNavigate();

  // Keep axios Authorization header in sync with token — only re-runs when user changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [user]);

  useEffect(() => {
    // Store user in localStorage whenever it changes
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const loginDirect = async (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, user } = response.data;

      await loginDirect(token, user);

      // Navigate based on role
      if (user.role === "admin") {
        navigate("/select-org");
      } else if (["company_admin", "dispatcher"].includes(user.role)) {
        navigate("/admin-home");
      } else if (user.role === "driver") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      // Re-throw so the calling component (Login.tsx) can handle the error display
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsInsideOrg(false);
    setActiveOrgName(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("active_org_name");
    delete axios.defaults.headers.common["Authorization"];
    // Navigation is handled by the Logout page component after calling this function.
    // Do not call navigate() here to avoid a double-navigation race condition.
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Password changed successfully!");
    } catch (error) {
      console.error("Password change error:", error);
      alert("Failed to change password");
    }
  };

  const switchOrg = async (orgId: string, orgName: string) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) throw new Error("No active session token to switch org");
    localStorage.setItem("superadmin_token", currentToken);
    const res = await axios.post(`${API_BASE_URL}/auth/switch-org`, { orgId });
    const { token } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("active_org_name", orgName);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser((u) => ({ ...u!, organizationId: orgId }));
    setIsInsideOrg(true);
    setActiveOrgName(orgName);
    navigate("/admin-home");
  };

  const exitOrg = () => {
    const orig = localStorage.getItem("superadmin_token");
    if (!orig) {
      // No superadmin token means we're not inside an org — just navigate back
      navigate("/select-org");
      return;
    }
    localStorage.setItem("token", orig);
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("active_org_name");
    axios.defaults.headers.common["Authorization"] = `Bearer ${orig}`;
    setUser((u) => ({ ...u!, organizationId: undefined }));
    setIsInsideOrg(false);
    setActiveOrgName(null);
    navigate("/select-org");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDirect, logout, changePassword, switchOrg, exitOrg, isInsideOrg, activeOrgName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
