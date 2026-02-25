import {
  LayoutDashboard,
  BellRing,
  Table2,
  Ticket,
  Settings,
  Shield,
  UtensilsCrossed,
} from "lucide-react";

export function getStaffTitle(pathname) {
  if (pathname === "/staff") return "Overview";
  if (pathname.startsWith("/staff/requests")) return "Service Requests";
  if (pathname.startsWith("/staff/tables")) return "Tables";
  if (pathname.startsWith("/staff/tickets")) return "Tickets";
  if (pathname.startsWith("/staff/settings")) return "Settings";
  if (pathname.startsWith("/staff/pay")) return "Payment";
  if (pathname.startsWith("/staff/reservations")) return "Reservations";
  if (pathname.startsWith("/staff/menu")) return "Menu Management";
  if (pathname.startsWith("/staff/users")) return "User Management";
  if (pathname.startsWith("/staff/finance")) return "Finance";
  return "Staff";
}

export function buildStaffNav(user) {
  const isAdmin = user?.role === "admin";

  const operations = [
    { to: "/staff", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/staff/requests", label: "Requests", icon: BellRing },
    { to: "/staff/tables", label: "Tables", icon: Table2 },
    { to: "/staff/tickets", label: "Tickets", icon: Ticket },
    { to: "/staff/reservations", label: "Reservations", icon: Settings },
    { to: "/staff/settings", label: "Settings", icon: Settings },
  ];

  const admin = isAdmin
    ? [
        { to: "/staff/menu", label: "Menu Management", icon: UtensilsCrossed },
        { to: "/staff/users", label: "User Management", icon: Shield },
        { to: "/staff/finance", label: "Finance", icon: Shield },
      ]
    : [];

  return {
    isAdmin,
    groups: [
      { id: "ops", title: "Operations", items: operations },
      ...(admin.length ? [{ id: "admin", title: "Administration", items: admin }] : []),
    ],
    mobilePrimary: [
      { to: "/staff", end: true, label: "Overview", icon: LayoutDashboard },
      { to: "/staff/tables", label: "Tables", icon: Table2 },
      { to: "/staff/tickets", label: "Tickets", icon: Ticket },
      { to: "/staff/requests", label: "Requests", icon: BellRing },
    ],
  };
}

