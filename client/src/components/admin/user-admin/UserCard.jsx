// src/components/admin/UserCard.jsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminPanelClass } from "@/lib/adminUi";

export default function UserCard({ user, onToggle, onOpen }) {
  const displayName = user?.name || user?.email?.split("@")?.[0] || "User";
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";

  const isActive = user?.isActive !== false; // safe default

  return (
    <div
      className={cn(
        adminPanelClass(),
        "p-4 cursor-pointer",
        "hover:bg-[hsl(220,20%,10%)]/50 transition",
      )}
      onClick={() => onOpen?.(user)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.(user)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-[hsl(40,20%,95%)/8%] border border-[hsl(40,20%,95%)/10%] flex items-center justify-center shrink-0">
            <UserIcon className="h-5 w-5 text-[hsl(40,20%,85%)]" />
          </div>

          <div className="min-w-0">
            <div className="font-medium truncate text-[hsl(40,20%,92%)]">{displayName}</div>
            <div className="text-sm text-[hsl(40,10%,60%)] truncate">{user?.email || "—"}</div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,70%)]"
              >
                {roleLabel}
              </Badge>

              <Badge
                className={cn(
                  isActive
                    ? "bg-success/15 text-success border border-success/20"
                    : "bg-destructive/15 text-destructive border border-destructive/20",
                )}
              >
                {isActive ? "Active" : "Disabled"}
              </Badge>

              {user?.isDeleted ? (
                <Badge className="bg-[hsl(0,0%,100%)/6%] text-[hsl(40,10%,60%)] border border-[hsl(40,20%,95%)/10%]">
                  Deleted
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          className="rounded-2xl shrink-0"
          variant={isActive ? "destructive" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(user?._id);
          }}
        >
          {isActive ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}