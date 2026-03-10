import {
  Clock,
  Droplets,
  HelpCircle,
  Receipt,
  MessageSquare,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const serviceIcons = {
  water: Droplets,
  help: HelpCircle,
  bill: Receipt,
  other: MessageSquare,
};

const serviceLabels = {
  water: "Water",
  help: "Help",
  bill: "Bill",
  other: "Other",
};

function normalizeType(type) {
  const t = String(type || "").toUpperCase();
  if (t === "WATER") return "water";
  if (t === "HELP") return "help";
  if (t === "BILL") return "bill";
  return "other";
}

function normalizeStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "pending";
  if (s === "IN_PROGRESS") return "acknowledged";
  if (s === "DONE") return "completed";
  return String(status || "pending").toLowerCase();
}

function normalizeRequest(r) {
  const id = r.id || r._id;
  const type = normalizeType(r.type);
  const status = normalizeStatus(r.status);

  const tableName =
    r.tableName ||
    (r.table?.number != null
      ? `Table ${String(r.table.number).padStart(2, "0")}`
      : "Table ?");

  return {
    id,
    type,
    status,
    createdAt: r.createdAt,
    note: r.note || "",
    tableName,
  };
}

function timeAgoSmart(date) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(ms)) return "";
  if (ms < 0) return "Just now";

  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function typePillClass(type) {
  // Theme-aware tints: light uses tokens, dark keeps your amber/grey system.
  switch (type) {
    case "water":
      return "bg-primary/10 border-primary/20 text-primary/80";
    case "help":
      return cn(
        "bg-muted/50 border-border text-muted-foreground",
        "dark:bg-[hsl(40,20%,95%)/6%] border-border dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]"
      );
    case "bill":
      return "bg-warning/10 border-warning/20 text-warning";
    default:
      return cn(
        "bg-muted/50 border-border text-muted-foreground",
        "dark:bg-[hsl(40,20%,95%)/6%] border-border dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]"
      );
  }
}

export function RequestsCard({ requests, onAcknowledge, onComplete }) {
  const normalized = (requests || []).map(normalizeRequest);

  // newest 5 not completed
  const activeRequests = normalized
    .filter((r) => r.status !== "completed")
    .slice(0, 5);

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
        // ✅ light mode
        "border-border bg-card/85 shadow-sm",
        // ✅ dark mode (keep your original vibe)
        "border-border dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/45",
        "dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base md:text-lg text-foreground text-foreground dark:text-[hsl(40,20%,95%)]">
            Recent Requests
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground dark:
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            AfroAsiatique • Service queue
          </div>
        </div>

        <Badge
          className={cn(
            "rounded-full border",
            // ✅ light mode
            "bg-card/90 border-border text-muted-foreground",
            // ✅ dark mode
            "dark:bg-[hsl(40,20%,95%)/6%]border-border dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]"
          )}
        >
          {activeRequests.length} active
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {activeRequests.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border py-8 text-center",
              // ✅ light
              "border-border bg-muted/30",
              // ✅ dark
              "border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%]"
            )}
          >
            <Check className="h-9 w-9 mx-auto mb-2 opacity-60 text-primary" />
            <p className="text-sm font-medium text-foreground dark:text-[hsl(40,20%,92%)]">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground dark:
text-muted-foreground dark:text-[hsl(40,10%,60%)] mt-1">
              No pending requests right now.
            </p>
          </div>
        ) : (
          activeRequests.map((request) => {
            const Icon = serviceIcons[request.type] || MessageSquare;
            const isPending = request.status === "pending";
            const isAck = request.status === "acknowledged";

            return (
              <div
                key={request.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-2xl border transition-colors",
                  // ✅ light default
                  "bg-background/60 border-border hover:bg-muted/60",
                  // ✅ dark default (original)
                  "bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] border-border dark:border-[hsl(40,20%,95%)/10%]",
                  // pending highlight
                  isPending && "bg-primary/10 border-primary/20"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border",
                    isPending
                      ? "bg-primary/15 border-primary/25"
                      : cn(
                          "bg-card/70 border-border",
                          "dark:bg-[hsl(40,20%,95%)/6%] border-border dark:border-[hsl(40,20%,95%)/10%]"
                        )
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isPending
                        ? "text-primary"
                        : "text-muted-foreground dark:text-[hsl(40,10%,75%)]"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-foreground text-foreground dark:text-[hsl(40,20%,95%)] truncate">
                      {request.tableName}
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        typePillClass(request.type)
                      )}
                    >
                      {serviceLabels[request.type] || "Other"}
                    </span>

                    {isAck ? (
                      <span className="hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-success/10 border-success/20 text-success">
                        acknowledged
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground dark:
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgoSmart(request.createdAt)}
                    </span>

                    {request.note ? (
                      <span className="truncate text-muted-foreground/90 dark:text-[hsl(40,10%,55%)]">
                        • {request.note}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  variant={isPending ? "default" : "success"}
                  className={cn(
                    "rounded-xl shadow-sm",
                    // ✅ light mode: use border tokens
                    "border border-border",
                    // ✅ dark mode: keep your old border tint
                    "border-border dark:border-[hsl(40,20%,95%)/10%]"
                  )}
                  onClick={() =>
                    isPending ? onAcknowledge(request.id) : onComplete(request.id)
                  }
                  aria-label={isPending ? "Acknowledge request" : "Complete request"}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}