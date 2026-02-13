import { Routes, Route, Navigate } from "react-router-dom";
import TableGuestPage from "@/pages/TableGuestPage.jsx";
import StaffDashboard from "@/pages/StaffDashboard2.jsx";
import JoinPage from "@/pages/JoinPage.jsx";
import EnterCodePage from "@/pages/EnterCodePage.jsx";
import StaffPaymentPage from "@/pages/StaffPaymentPage.jsx";

import StaffLayout from "@/components/layout/StaffLayout.jsx";
import GuestLayout from "@/components/layout/GuestLayout.jsx";

export default function App() {
  return (
    <Routes>
      {/* Guest */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<Navigate to="/join" replace />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/t/:token" element={<TableGuestPage />} />
        <Route path="/enter-code" element={<EnterCodePage />} />
      </Route>

      {/* Staff */}
      <Route element={<StaffLayout />}>
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/pay/:tabId" element={<StaffPaymentPage />} />
      </Route>
    </Routes>
  );
}
