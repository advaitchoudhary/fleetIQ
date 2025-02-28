import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import ContactUs from "./pages/ContactUs";
import Invoice from "./pages/Invoice";
import Applications from "./pages/Applications";
import MyTimesheet from "./pages/MyTimesheet";
import Logout from "./pages/Logout";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Driver Role Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="driver">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-timesheet"
          element={
            <ProtectedRoute requiredRole="driver">
              <MyTimesheet />
            </ProtectedRoute>
          }
        />

        {/* Admin Role Routes */}
        <Route
          path="/drivers"
          element={
            <ProtectedRoute requiredRole="admin">
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute requiredRole="admin">
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice"
          element={
            <ProtectedRoute requiredRole="admin">
              <Invoice />
            </ProtectedRoute>
          }
        />

        {/* Routes accessible to both */}
        <Route
          path="/contact-us"
          element={
            <ProtectedRoute requiredRole="driver">
              <ContactUs />
            </ProtectedRoute>
          }
        />

        {/* Logout Route */}
        <Route
          path="/logout"
          element={
            <ProtectedRoute>
              <Logout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;