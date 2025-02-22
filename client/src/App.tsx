import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Accounts from "./pages/Accounts";
import ContactUs from "./pages/ContactUs";
import Reports from "./pages/Invoice";
import Logout from "./pages/Logout";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/drivers" element={<Drivers />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  );
};

export default App;