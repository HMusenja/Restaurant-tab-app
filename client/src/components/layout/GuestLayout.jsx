// layouts/GuestLayout.jsx
import { Outlet } from "react-router-dom";

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Guest pages render their own TopBar */}
     <main className="flex-1">
        <Outlet />
      </main>

      {/* Reserved safe-area space for floating buttons */}
      <div className="h-24" />
    </div>
  );
}
