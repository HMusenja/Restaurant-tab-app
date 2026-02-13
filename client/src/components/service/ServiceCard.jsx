// src/components/service/ServiceCard.jsx
import { Bell, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function timeAgoFromISO(iso) {
  if (!iso) return "—";
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1m ago";
  return `${minutes}m ago`;
}

function statusBadgeClass(status) {
  const s = String(status || "OPEN").toUpperCase();
  if (s === "DONE") return "bg-muted text-muted-foreground";
  if (s === "IN_PROGRESS") return "bg-warning/20 text-warning";
  return "bg-primary/20 text-primary"; // OPEN
}

export default function ServiceCard({
  request,
  variant = "guest", // "guest" | "staff" | "admin"
  onSetStatus, // only for staff/admin
  showTable = true,
}) {
  const id = request?.id || request?._id;
  const type = String(request?.type || "REQUEST").toUpperCase();
  const status = String(request?.status || "OPEN").toUpperCase();
  const note = request?.note || "";
  const createdAt = request?.createdAt;

  const tableNumber = request?.table?.number;
  const tableLabel = tableNumber
    ? `Table ${String(tableNumber).padStart(2, "0")}`
    : "Table ?";

  const canAct = variant !== "guest";

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {showTable ? (
                <span>
                  {tableLabel} · {type}
                </span>
              ) : (
                <span>{type}</span>
              )}
            </div>

            <Badge className={cn("text-xs", statusBadgeClass(status))}>
              {status}
            </Badge>
          </div>

          <div className="mt-1 text-sm text-muted-foreground break-words">
            {note || "No note"}
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeAgoFromISO(createdAt)}
          </div>
        </div>

        {/* ✅ Actions ONLY for staff/admin */}
        {canAct ? (
          <div className="flex gap-2 shrink-0">
            {status === "OPEN" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSetStatus?.(id, "IN_PROGRESS")}
              >
                In progress
              </Button>
            ) : null}

            {status !== "DONE" ? (
              <Button size="sm" onClick={() => onSetStatus?.(id, "DONE")}>
                Done
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
