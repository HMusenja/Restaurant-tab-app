import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";

// Staff pages
import StaffLayout from "@/components/layout/StaffLayout";
import StaffDashboard from "@/pages/StaffDashboard";
import StaffRequestsPage from "@/pages/staff/StaffRequestsPage.jsx";
import StaffTablesPage from "@/pages/staff/StaffTablesPage.jsx";
import StaffTicketsPage from "@/pages/staff/StaffTicketsPage.jsx";
import StaffSettingsPage from "@/pages/staff/StaffSettingsPage.jsx";

// Existing payment page (optional)
import StaffPaymentPage from "@/pages/StaffPaymentPage.jsx";

// Guest pages...
import GuestShellLayout from "@/components/layout/GuestShellLayout.jsx";
import GuestBareLayout from "@/components/layout/GuestBareLayout.jsx";
import JoinPage from "@/pages/JoinPage.jsx";
import EnterCodePage from "@/pages/EnterCodePage.jsx";
import TableGuestPage from "@/pages/TableGuestPage.jsx";

import StaffTableDetailPage from "@/pages/staff/StaffTableDetailPage";
import StaffLoginPage from "@/pages/StaffLoginPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import StaffUserManagementPage from "@/pages/staff/StaffUserManagementPage";
import AdminFinancePage from "@/pages/admin/AdminFinancePage";
import ManageReservationsPage from "@/pages/staff/ManageReservationsPage";
import MenuManagementPage from "@/pages/staff/MenuManagementPage";

// ✅ NEW: route wrappers
import GuestTabRoute from "@/routes/GuestTabRoute";
import StaffTabRoute from "@/routes/StaffTabRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Guest */}
      <Route element={<GuestShellLayout />}>
        {/* ✅ Wrap TableGuestPage with TabProvider via GuestTabRoute */}
        <Route
          path="/t/:token"
          element={
            <GuestTabRoute>
              <TableGuestPage />
            </GuestTabRoute>
          }
        />
      </Route>

      <Route element={<GuestBareLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/enter-code" element={<EnterCodePage />} />
      </Route>

      {/* Staff */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffDashboard />} />
        <Route path="requests" element={<StaffRequestsPage />} />
        <Route path="tables" element={<StaffTablesPage />} />

        {/* ✅ Wrap StaffTableDetailPage with TabProvider via StaffTabRoute */}
        <Route
          path="tables/:tableId"
          element={
            <StaffTabRoute>
              <StaffTableDetailPage />
            </StaffTabRoute>
          }
        />

        <Route path="tickets" element={<StaffTicketsPage />} />
        <Route path="settings" element={<StaffSettingsPage />} />
        <Route path="reservations" element={<ManageReservationsPage />} />

        {/* admin only */}
        <Route path="users" element={<StaffUserManagementPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="menu" element={<MenuManagementPage />} />

        <Route path="pay/:tabId" element={<StaffPaymentPage />} />
      </Route>

      {/* Staff Login */}
      <Route path="/login" element={<StaffLoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/join" replace />} />
    </Routes>
  );
}
