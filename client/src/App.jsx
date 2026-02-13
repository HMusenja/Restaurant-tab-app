// import { Routes, Route, Navigate } from "react-router-dom";
// import TableGuestPage from "./pages/TableGuestPage.jsx";
// import StaffDashboard from "./pages/StaffDashboard.jsx";
// import JoinPage from "./pages/JoinPage.jsx";
// import EnterCodePage from "./pages/EnterCodePage.jsx";
// import StaffPaymentPage from "./pages/StaffPaymentPage.jsx";

import AppRoutes2 from "./routes/AppRoutes2";

export default function App() {
  return (
    // <Routes>
    //   <Route path="/" element={<Navigate to="/t/TABLE-01" replace />} />
    //   <Route path="/t/:token" element={<TableGuestPage />} />
    //   <Route path="/staff" element={<StaffDashboard />} />
    //   <Route path="/join" element={<JoinPage />} />
    //   <Route path="/enter-code" element={<EnterCodePage />} />
    //   <Route path="/staff/pay/:tabId" element={<StaffPaymentPage />} />
    // </Routes>

    <>
      <AppRoutes2 />
    </>
  );
}
