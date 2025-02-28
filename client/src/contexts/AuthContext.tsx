import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  email: string;
  role: "admin" | "driver" | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const login = (email: string, password: string) => {
    if (email === "admin@gmail.com" && password === "admin123") {
      setUser({ email, role: "admin" });
      navigate("/drivers");
    } else if (email === "driver@gmail.com" && password === "driver123") {
      setUser({ email, role: "driver" });
      navigate("/dashboard");
    } else {
      alert("Invalid email or password");
    }
  };

  const logout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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