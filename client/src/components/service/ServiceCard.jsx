// src/components/service/ServiceCard.jsx
import { Bell, Clock, CheckCircle2, Loader2 } from "lucide-react";
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

function statusMeta(status) {
  const s = String(status || "OPEN").toUpperCase();

  if (s === "DONE") {
    return {
      label: "DONE",
      pill: "bg-success/10 border-success/20 text-success",
      icon: CheckCircle2,
      row: "opacity-80",
    };
  }

  if (s === "IN_PROGRESS") {
    return {
      label: "IN PROGRESS",
      pill: "bg-warning/10 border-warning/20 text-warning",
      icon: Loader2,
      row: "ring-1 ring-warning/20",
    };
  }

  // OPEN
  return {
    label: "OPEN",
    pill: "bg-primary/10 border-primary/20 text-primary",
    icon: Bell,
    row: "ring-1 ring-primary/20",
  };
}

function typeMeta(type) {
  const t = String(type || "REQUEST").toUpperCase();

  // Optional “soft” tint per type. Safe default if backend adds more types.
  if (t === "WATER") return "bg-primary/10 border-primary/20 text-primary/80";
  if (t === "BILL") return "bg-warning/10 border-warning/20 text-warning";
  if (t === "HELP") return "bg-[hsl(40,20%,95%)/6%] border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]";

  return "bg-[hsl(40,20%,95%)/6%] border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]";
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

  const sm = statusMeta(status);
  const TypeIcon = sm.icon || Bell;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-3",
        "border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl",
        "shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
        sm.row
      )}
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("h-9 w-9 rounded-2xl border flex items-center justify-center", sm.pill)}>
                <TypeIcon
                  className={cn(
                    "h-4 w-4",
                    status === "IN_PROGRESS" ? "animate-spin" : ""
                  )}
                />
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-sm text-[hsl(40,20%,95%)] truncate">
                  {showTable ? `${tableLabel} · ${type}` : type}
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-[hsl(40,10%,60%)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgoFromISO(createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pills */}
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                sm.pill
              )}
            >
              {sm.label}
            </span>

            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                typeMeta(type)
              )}
            >
              {type}
            </span>
          </div>

          {/* Note */}
          <div className="mt-2 text-sm text-[hsl(40,10%,70%)] break-words">
            {note || <span className="text-[hsl(40,10%,55%)]">No note</span>}
          </div>
        </div>

        {/* ✅ Actions ONLY for staff/admin */}
        {canAct ? (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {status === "OPEN" ? (
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
                onClick={() => onSetStatus?.(id, "IN_PROGRESS")}
              >
                In progress
              </Button>
            ) : null}

            {status !== "DONE" ? (
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => onSetStatus?.(id, "DONE")}
              >
                Done
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* bottom hairline for POS feel */}
      <div className="mt-3 h-px w-full bg-[hsl(40,20%,95%)/8%]" />

      <div className="mt-3 flex items-center justify-between text-[11px] text-[hsl(40,10%,55%)]">
        <span className="tracking-[0.18em] uppercase">AfroAsiatique</span>
        <span className="text-primary/70">Live</span>
      </div>
    </div>
  );
}
