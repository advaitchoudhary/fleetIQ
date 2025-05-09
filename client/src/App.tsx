import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Drivers";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import Invoice from "./pages/Invoice";
import Applications from "./pages/AllTimesheets";
import MyInfo from "./pages/MyInfo";
import MyTimesheet from "./pages/MyTimesheet";
import UploadDispatchSheet from "./pages/UploadDipatchSheet";
import Logout from "./pages/Logout";
import ChangePassword from "./pages/ChangePassword";
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

        <Route
          path="/contact-us"
          element={
            <ProtectedRoute requiredRole="driver">
              <ContactUs />
            </ProtectedRoute>
          }
        />

        {/* Admin Role Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <Users />
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

        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-info"
          element={
            <ProtectedRoute requiredRole="driver">
              <MyInfo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/uploadDispatchDetails"
          element={
            <ProtectedRoute requiredRole="admin">
              <UploadDispatchSheet />
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

        {/* Change Password Route */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
