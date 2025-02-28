import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [user, setUser] = useState<User | null>(() => {
    // Retrieve user from localStorage on page load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      return parsedUser.role === "admin" || parsedUser.role === "driver" ? parsedUser : null;
    }
    return null;
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Store user in localStorage whenever it changes
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (email: string, password: string) => {
    if (email === "admin@gmail.com" && password === "admin123") {
      const newUser: User = { email, role: "admin" }; // Explicitly define type
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser)); 
      navigate("/users");
    } else if (email === "driver@gmail.com" && password === "driver123") {
      const newUser: User = { email, role: "driver" }; // Explicitly define type
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser)); 
      navigate("/dashboard");
    } else {
      alert("Invalid email or password");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user"); // Remove user from localStorage
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