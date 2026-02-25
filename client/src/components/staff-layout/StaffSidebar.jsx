import { NavLink } from "react-router-dom";
import { User, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function navLinkClass({ isActive }) {
  return cn(
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/20 text-primary-foreground border border-primary/25 shadow-sm"
      : "text-[hsl(40,10%,70%)] hover:bg-[hsl(40,20%,95%)/6%] hover:text-[hsl(40,20%,92%)] border border-transparent"
  );
}

export default function StaffSidebar({
  restaurantName = "AfroAsiatique",
  platformName = "AtUrService",
  roleLabel,
  userName,
  userEmail,
  nav,
}) {
  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/70 backdrop-blur-xl">
      {/* Brand */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 backdrop-blur flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight text-[hsl(40,20%,95%)] truncate">
                  {restaurantName}
                </div>
                <div className="text-[11px] tracking-[0.28em] uppercase text-primary/70 truncate">
                  {platformName}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-[hsl(40,10%,60%)]">
              Role: <span className="text-[hsl(40,20%,85%)] font-medium">{roleLabel}</span>
            </div>
          </div>

          {/* “status dot” vibe */}
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/80 ring-4 ring-primary/15" />
        </div>
      </div>

      <Separator className="bg-[hsl(40,20%,95%)/10%]" />

      {/* Nav */}
      <nav className="p-3 space-y-5">
        {nav.groups.map((group) => (
          <div key={group.id}>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/60">
              {group.title}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                    <Icon className="h-4 w-4 text-primary/90" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Signed-in user */}
      <div className="mt-auto p-4">
        <Separator className="bg-[hsl(40,20%,95%)/10%]" />
        <div className="pt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] flex items-center justify-center">
            <User className="h-4 w-4 text-[hsl(40,10%,75%)]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[hsl(40,20%,92%)] truncate">
              {userName}
            </div>
            <div className="text-xs text-[hsl(40,10%,60%)] truncate">{userEmail}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

