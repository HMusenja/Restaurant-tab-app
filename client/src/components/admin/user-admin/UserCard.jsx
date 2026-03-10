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

  const isDeleted = Boolean(user?.deletedAt) || Boolean(user?.isDeleted);

  const isActive =
    typeof user?.active === "boolean"
      ? user.active
      : typeof user?.isActive === "boolean"
        ? user.isActive
        : typeof user?.enabled === "boolean"
          ? user.enabled
          : typeof user?.disabled === "boolean"
            ? !user.disabled
            : true;

  return (
    <div
      className={cn(
        adminPanelClass(),
        "cursor-pointer p-4 transition hover:bg-muted/40"
      )}
      onClick={() => onOpen?.(user)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen?.(user);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{displayName}</div>
            <div className="truncate text-sm text-muted-foreground">
              {user?.email || "—"}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border border-border bg-muted/40 text-muted-foreground"
              >
                {roleLabel}
              </Badge>

              <Badge
                className={cn(
                  isActive
                    ? "border border-success/20 bg-success/15 text-success"
                    : "border border-destructive/20 bg-destructive/15 text-destructive"
                )}
              >
                {isActive ? "Active" : "Disabled"}
              </Badge>

              {isDeleted ? (
                <Badge
                  variant="secondary"
                  className="border border-border bg-muted/40 text-muted-foreground"
                >
                  Deleted
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          className="shrink-0"
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