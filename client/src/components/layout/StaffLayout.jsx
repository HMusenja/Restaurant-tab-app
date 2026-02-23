import { Outlet, NavLink, useLocation, Navigate } from "react-router-dom";
import {
  User,
  LayoutDashboard,
  BellRing,
  Table2,
  Ticket,
  Settings,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useStaffTitle(pathname) {
  if (pathname === "/staff") return "Overview";
  if (pathname.startsWith("/staff/requests")) return "Service Requests";
  if (pathname.startsWith("/staff/tables")) return "Tables";
  if (pathname.startsWith("/staff/tickets")) return "Tickets";
  if (pathname.startsWith("/staff/settings")) return "Settings";
  if (pathname.startsWith("/staff/pay")) return "Payment";
   if (pathname.startsWith("/staff/reservations")) return "Reservations";
  return "Staff";
}

export default function StaffLayout() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  // ⏳ wait for getMe()
  if (loading) {
    return null; // or spinner
  }

  // 🔒 not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 force password change
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  console.log("🛡️ StaffLayout guard", {
    mustChangePassword: user?.mustChangePassword,
  });
  const title = useStaffTitle(pathname);

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Staff";
  const displayEmail = user?.email || "";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";
  console.log("USER:", displayName, displayEmail, displayRole);

  const linkClass = ({ isActive }) =>
    cn(
      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
    );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="px-4 py-4 border-b border-border">
          <div className="text-sm font-semibold">AtUrService</div>
          <div className="text-xs text-muted-foreground">{displayRole}</div>
        </div>

        <nav className="p-3 space-y-1">
          <NavLink to="/staff" end className={linkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </NavLink>

          <NavLink to="/staff/requests" className={linkClass}>
            <BellRing className="h-4 w-4" />
            Requests
          </NavLink>

          <NavLink to="/staff/tables" className={linkClass}>
            <Table2 className="h-4 w-4" />
            Tables
          </NavLink>

          <NavLink to="/staff/tickets" className={linkClass}>
            <Ticket className="h-4 w-4" />
            Tickets
          </NavLink>
          <NavLink to="/staff/reservations" className={linkClass}>
            <Settings className="h-4 w-4" />
            Reservations
          </NavLink>

          <NavLink to="/staff/settings" className={linkClass}>
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          {user.role === "admin" && (
            <NavLink to="/staff/menu" className={linkClass}>
              <UtensilsCrossed className="h-4 w-4" />
              Menu Management
            </NavLink>
          )}
          {user.role === "admin" && (
            <NavLink to="/staff/users" className={linkClass}>
              <Shield className="h-4 w-4" />
              User Management
            </NavLink>
          )}
             {user.role === "admin" && (
            <NavLink to="/staff/finance" className={linkClass}>
              <Shield className="h-4 w-4" />
              Finance
            </NavLink>
          )}
        </nav>

        {/* Signed-in user */}
        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {displayEmail}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4">
          <div className="md:hidden">
            <NavLink to="/staff" className="text-sm font-semibold">
              Staff
            </NavLink>
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          {/* Header user pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-sm font-small">{displayRole}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
