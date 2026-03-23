import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import FileDriverApplication from "./pages/FileDriverApplication";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Drivers";
import AdminHome from "./pages/AdminHome";
import Profile from "./pages/Profile";
import Enquiries from "./pages/Enquiries";
import ContactUs from "./pages/ContactUs";
import Invoice from "./pages/Invoice";
import Applications from "./pages/AllTimesheets";
import MyInfo from "./pages/MyInfo";
import MyTimesheet from "./pages/MyTimesheet";
import DetailedTimesheet from "./pages/DetailedTimesheet";
import Logout from "./pages/Logout";
import ChangePassword from "./pages/ChangePassword";
import DriverApplications from "./pages/DriverApplications";
import Vehicles from "./pages/Vehicles";
import Maintenance from "./pages/Maintenance";
import Inspections from "./pages/Inspections";
import FuelLogs from "./pages/FuelLogs";
import DriverPayments from "./pages/DriverPayments";
import Parts from "./pages/Parts";
import Warranties from "./pages/Warranties";
import ServiceHistory from "./pages/ServiceHistory";
import CostTracking from "./pages/CostTracking";
import PreventiveMaintenance from "./pages/PreventiveMaintenance";
import Scheduling from "./pages/Scheduling";
import PaymentHistory from "./pages/PaymentHistory";
import Subscription from "./pages/Subscription";
import Pricing from "./pages/Pricing";
import CompanyRegister from "./pages/CompanyRegister";
import OrgSelector from "./pages/OrgSelector";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/file-application" element={<FileDriverApplication />} />

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
            <ProtectedRoute>
              <ContactUs />
            </ProtectedRoute>
          }
        />

        {/* Admin Role Routes */}
        <Route
          path="/admin-home"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminHome />
            </ProtectedRoute>
          }
        />
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
          path="/enquiries"
          element={
            <ProtectedRoute requiredRole="admin">
              <Enquiries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver-applications"
          element={
            <ProtectedRoute requiredRole="admin">
              <DriverApplications />
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
          path="/timesheet/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <DetailedTimesheet />
            </ProtectedRoute>
          }
        />

        {/* Vehicle Management Routes */}
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute requiredRole="admin">
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute requiredRole="admin">
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections"
          element={
            <ProtectedRoute requiredRole="admin">
              <Inspections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-logs"
          element={
            <ProtectedRoute requiredRole="admin">
              <FuelLogs />
            </ProtectedRoute>
          }
        />

        {/* Phase 5 — Fleet Operations */}
        <Route path="/parts" element={<ProtectedRoute requiredRole="admin"><Parts /></ProtectedRoute>} />
        <Route path="/warranties" element={<ProtectedRoute requiredRole="admin"><Warranties /></ProtectedRoute>} />
        <Route path="/service-history" element={<ProtectedRoute requiredRole="admin"><ServiceHistory /></ProtectedRoute>} />
        <Route path="/cost-tracking" element={<ProtectedRoute requiredRole="admin"><CostTracking /></ProtectedRoute>} />
        <Route path="/preventive-maintenance" element={<ProtectedRoute requiredRole="admin"><PreventiveMaintenance /></ProtectedRoute>} />
        <Route path="/scheduling" element={<ProtectedRoute requiredRole="admin"><Scheduling /></ProtectedRoute>} />

        {/* Phase 3 — Driver Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute requiredRole="admin">
              <DriverPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-history"
          element={
            <ProtectedRoute requiredRole="admin">
              <PaymentHistory />
            </ProtectedRoute>
          }
        />

        {/* Phase 4 — Subscription & Billing */}
        <Route
          path="/subscription"
          element={
            <ProtectedRoute requiredRole="admin">
              <Subscription />
            </ProtectedRoute>
          }
        />

        {/* Super-admin org selector */}
        <Route
          path="/select-org"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <OrgSelector />
            </ProtectedRoute>
          }
        />

        {/* Public SaaS pages */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/register" element={<CompanyRegister />} />

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
