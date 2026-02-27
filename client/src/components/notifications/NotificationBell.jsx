import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationsContext";
import NotificationsDrawer from "./NotificationsDrawer";

export default function NotificationBell({ className }) {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const count = Number(unreadCount || 0);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn("relative rounded-xl", className)}
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />

        {count > 0 ? (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-5 h-5 px-1",
              "rounded-full text-[11px] font-semibold",
              "bg-primary text-primary-foreground",
              "flex items-center justify-center",
              "shadow-sm"
            )}
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Button>

      <NotificationsDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}