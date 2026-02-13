import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon } from "lucide-react";

export default function UserCard({ user, onToggle,onOpen }) {
  const displayName = user?.name || user?.email?.split("@")[0];
  const roleLabel =
    user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <div
      className="flex items-center justify-between border rounded-xl p-4 bg-card cursor-pointer"
      onClick={() => onOpen?.(user)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.(user)}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <UserIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="font-medium truncate">{displayName}</div>
          <div className="text-sm text-muted-foreground truncate">
            {user.email}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{roleLabel}</Badge>
            <Badge
              variant={user.isActive ? "default" : "destructive"}
            >
              {user.isActive ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        variant={user.isActive ? "destructive" : "default"}
        onClick={(e) => { e.stopPropagation(); onToggle(user._id) }}
      >
        {user.isActive ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
