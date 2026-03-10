import { NavLink } from "react-router-dom";
import { User, UtensilsCrossed } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function navLinkClass({ isActive }) {
  return cn(
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors border",
    isActive
      ? cn(
          // ✅ light mode active
          "bg-primary/10 text-foreground border-primary/25 shadow-sm",
          // ✅ dark mode active (keeps your vibe)
          "dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/25"
        )
      : cn(
          // ✅ light mode inactive
          "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          // ✅ dark mode inactive (your old values)
          "dark:text-[hsl(40,10%,70%)] dark:hover:bg-[hsl(40,20%,95%)/6%] dark:hover:text-[hsl(40,20%,92%)]"
        )
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
    <aside
      className={cn(
        "hidden md:flex w-72 flex-col border-r backdrop-blur-xl",
        // ✅ light mode
        "border-border bg-card/70",
        // ✅ dark mode (original vibe)
        "border-border dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/70"
      )}
    >
      {/* Brand */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 backdrop-blur flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight  text-foreground dark:text-[hsl(40,20%,95%)] truncate">
                  {restaurantName}
                </div>
                <div className="text-[11px] tracking-[0.28em] uppercase text-primary/70 truncate">
                  {platformName}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              Role:{" "}
              <span className="text-foreground font-medium dark:text-[hsl(40,20%,85%)]">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* “status dot” vibe */}
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/80 ring-4 ring-primary/15" />
        </div>
      </div>

      <Separator className="bg-border/60 dark:bg-[hsl(40,20%,95%)/10%]" />

      {/* Nav */}
      <nav className="p-3 space-y-5">
        {nav?.groups?.map((group) => (
          <div key={group.id}>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70 dark:text-primary/60">
              {group.title}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={navLinkClass}
                  >
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
        <Separator className="bg-border/60 dark:bg-[hsl(40,20%,95%)/10%]" />
        <div className="pt-4 flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-2xl border flex items-center justify-center",
              // ✅ light mode
              "bg-background/60 border-border",
              // ✅ dark mode
              "dark:bg-[hsl(40,20%,95%)/6%]border-border dark:border-[hsl(40,20%,95%)/10%]"
            )}
          >
            <User className="h-4 w-4 text-muted-foreground dark:text-[hsl(40,10%,75%)]" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground dark:text-[hsl(40,20%,92%)] truncate">
              {userName}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground dark:text-[hsl(40,10%,60%)] truncate">
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}