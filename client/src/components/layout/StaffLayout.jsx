import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import StaffSidebar from "@/components/staff-layout/StaffSidebar";
import StaffTopbar from "@/components/staff-layout/StaffTopbar";
import StaffMobileNav from "@/components/staff-layout/StaffMobileNav";
import { buildStaffNav, getStaffTitle } from "@/components/staff-layout/staffNav";

export default function StaffLayout() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nav = useMemo(() => {
    if (!user) return [];
    return buildStaffNav(user);
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  const title = getStaffTitle(pathname);

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Staff";
  const displayEmail = user?.email || "";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";

  const restaurantName = "AfroAsiatique";
  const platformName = "AtUrService";
  const statusItems = null;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Background layers */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient: lighter in light mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

        {/* Soft blobs: slightly reduced in light mode */}
        <div className="absolute -top-24 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl dark:bg-primary/10" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-primary/8 blur-3xl dark:bg-primary/10" />

        {/* ✅ Vignette: very subtle in light, stronger in dark */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.10)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="flex min-h-screen">
        <StaffSidebar
          restaurantName={restaurantName}
          platformName={platformName}
          roleLabel={displayRole}
          userName={displayName}
          userEmail={displayEmail}
          nav={nav}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <StaffTopbar
            title={title}
            userName={displayName}
            roleLabel={displayRole}
            restaurantName={restaurantName}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            statusItems={statusItems}
          />

          <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6">
            {/* ✅ Stage wrapper: more solid in light mode, glass in dark */}
            <div className="min-h-[calc(100vh-8rem)] rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-sm dark:bg-background/45 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <div className="p-3 md:p-5">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      <StaffMobileNav
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        nav={nav}
        userName={displayName}
        roleLabel={displayRole}
        restaurantName={restaurantName}
        platformName={platformName}
      />
    </div>
  );
}