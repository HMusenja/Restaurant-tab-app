import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal, UtensilsCrossed } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function mobileTabClass(isActive) {
  return cn(
    "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition-colors w-full",
    isActive
      ? "text-primary"
      : "text-[hsl(40,10%,70%)] hover:text-[hsl(40,20%,92%)]"
  );
}

function sheetLinkClass({ isActive }) {
  return cn(
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors border",
    isActive
      ? "bg-primary/20 text-primary-foreground border-primary/25"
      : "text-[hsl(40,10%,70%)] hover:bg-[hsl(40,20%,95%)/6%] hover:text-[hsl(40,20%,92%)] border-transparent"
  );
}

export default function StaffMobileNav({
  open,
  onOpenChange,
  nav,
  userName,
  roleLabel,
  restaurantName = "AfroAsiatique",
  platformName = "AtUrService",
}) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Bottom ops bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/70 backdrop-blur-xl">
        <div className="h-16 px-2 flex items-stretch gap-1">
          {nav.mobilePrimary.map((item) => {
            const Icon = item.icon;
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={() => mobileTabClass(active)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className={mobileTabClass(open)}
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* More menu sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[320px] sm:w-[360px] bg-[hsl(220,20%,6%)] text-[hsl(40,20%,95%)] border-[hsl(40,20%,95%)/10%]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="text-[hsl(40,20%,95%)]">Staff Menu</span>
              <span className="text-xs text-primary/70">{roleLabel}</span>
            </SheetTitle>
          </SheetHeader>

          {/* Brand block */}
          <div className="mt-4 rounded-2xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold tracking-tight truncate">{restaurantName}</div>
                <div className="text-[11px] tracking-[0.28em] uppercase text-primary/70 truncate">
                  {platformName}
                </div>
              </div>
            </div>

            <Separator className="my-3 bg-[hsl(40,20%,95%)/10%]" />

            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-xs text-[hsl(40,10%,60%)]">Signed in</div>
          </div>

          <Separator className="my-4 bg-[hsl(40,20%,95%)/10%]" />

          <div className="space-y-5">
            {nav.groups.map((group) => (
              <div key={group.id}>
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/60">
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
                        className={sheetLinkClass}
                        onClick={() => onOpenChange(false)}
                      >
                        <Icon className="h-4 w-4 text-primary/90" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
