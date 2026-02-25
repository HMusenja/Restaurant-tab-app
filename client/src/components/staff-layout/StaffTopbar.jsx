import { NavLink } from "react-router-dom";
import { User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StaffStatusStrip from "./StaffStatusStrip";

StaffStatusStrip

export default function StaffTopbar({
  title,
  userName,
  roleLabel,
  onOpenMobileMenu,
    restaurantName = "AfroAsiatique",
  statusItems,
  
}) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border  bg-[hsl(220,20%,6%)]/70 backdrop-blur-xl">
      <div className="h-full px-3 md:px-4 flex items-center gap-3">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="rounded-xl"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile brand shortcut */}
       <NavLink
          to="/staff"
          className={cn("md:hidden text-sm font-semibold tracking-tight text-primary")}
        >
          {restaurantName}
        </NavLink>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
            <StaffStatusStrip items={statusItems} />
        </div>

        {/* User pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%]">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium max-w-[10rem] truncate text-[hsl(40,20%,92%)]">
            {userName}
          </span>
          <span className="hidden sm:inline text-xs text-[hsl(40,10%,60%)]">
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
