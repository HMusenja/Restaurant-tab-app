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
  
  // ⏳ wait for getMe()
  if (loading) return null;

  // 🔒 not logged in
  if (!user) return <Navigate to="/login" replace />;

  // 🔐 force password change
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
 
 

  
  const title = getStaffTitle(pathname);

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Staff";
  const displayEmail = user?.email || "";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";



  // Brand
  const restaurantName = "AfroAsiatique";
  const platformName = "AtUrService";

    const statusItems = null;

  return (
    <div className="min-h-screen w-full bg-[hsl(220,20%,8%)] text-[hsl(40,20%,95%)]">
      {/* Landing-inspired background layers */}
      <div className="fixed inset-0 -z-10">
        {/* Optional image layer (uncomment if you want the same photo vibe as landing) */}
        {/* <img src="/hero-bg.jpeg" alt="" className="w-full h-full object-cover opacity-20" /> */}

        {/* Rich gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,20%,5%)/85%] via-[hsl(220,20%,6%)/75%] to-[hsl(220,20%,5%)/95%]" />
        <div className="absolute -top-24 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />

        {/* subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <StaffSidebar
          restaurantName={restaurantName}
          platformName={platformName}
          roleLabel={displayRole}
          userName={displayName}
          userEmail={displayEmail}
          nav={nav}
        />

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          <StaffTopbar
            title={title}
            userName={displayName}
            roleLabel={displayRole}
            restaurantName={restaurantName}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
             statusItems={statusItems}
          />

          {/* Content area: keep pages unchanged; just give them a better stage */}
          <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6">
            {/* Optional: consistent “stage” card wrapper for POS feel (safe; no logic change) */}
            <div className="min-h-[calc(100vh-8rem)] rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <div className="p-3 md:p-5">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav + More sheet */}
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
