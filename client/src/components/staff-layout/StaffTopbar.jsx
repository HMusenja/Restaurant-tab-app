import { NavLink, useNavigate } from "react-router-dom";
import { User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import StaffStatusStrip from "./StaffStatusStrip";
import NotificationBell from "@/components/notifications/NotificationBell";

import { useAuth } from "@/contexts/AuthContext";

export default function StaffTopbar({
  title,
  userName,
  roleLabel,
  onOpenMobileMenu,
  restaurantName = "AfroAsiatique",
  statusItems,
}) {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-14 border-b backdrop-blur-xl",
        // ✅ light mode
        "border-border bg-background/70 text-foreground",
        // ✅ dark mode (keep your original vibe)
        "dark:bg-[hsl(220,20%,6%)]/70",
      )}
    >
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
          className={cn(
            "md:hidden text-sm font-semibold tracking-tight text-primary",
          )}
        >
          {restaurantName}
        </NavLink>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-semibold truncate">
            {title}
          </h1>
          <StaffStatusStrip items={statusItems} />
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User pill */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer",
                "bg-card/70 border-border",
                "dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%]",
              )}
            >
              <User className="w-4 h-4 text-primary" />

              <span
                className={cn(
                  "text-sm font-medium max-w-[10rem] truncate",
                  "text-foreground",
                  "dark:text-[hsl(40,20%,92%)]",
                )}
              >
                {userName}
              </span>

              <span
                className={cn(
                  "hidden sm:inline text-xs",
                  "text-muted-foreground",
                  "dark:text-[hsl(40,10%,60%)]",
                )}
              >
                {roleLabel}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
