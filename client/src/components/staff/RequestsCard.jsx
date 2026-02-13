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
  // already-ui?
  return String(status || "pending").toLowerCase();
}

function normalizeRequest(r) {
  // Backend shape: { id, type, status, createdAt, table: { number } }
  // UI shape: { id, type, status, createdAt, tableName }
  const id = r.id || r._id;
  const type = normalizeType(r.type);
  const status = normalizeStatus(r.status);

  const tableName =
    r.tableName ||
    (r.table?.number != null ? `Table ${String(r.table.number).padStart(2, "0")}` : "Table ?");

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

  // future clock drift
  if (ms < 0) return "Just now";

  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RequestsCard({ requests, onAcknowledge, onComplete }) {
  // const getTimeAgo = (date) => {
  //   if (!date) return "";
  //   const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  //   if (minutes < 1) return "Just now";
  //   if (minutes === 1) return "1m ago";
  //   return `${minutes}m ago`;
  // };

  const normalized = (requests || []).map(normalizeRequest);

  // show newest 5 that are not completed
  const activeRequests = normalized
    .filter((r) => r.status !== "completed")
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Requests</CardTitle>
        <Badge variant="secondary">{activeRequests.length} active</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {activeRequests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          activeRequests.map((request) => {
            const Icon = serviceIcons[request.type] || MessageSquare;
            const isPending = request.status === "pending";

            return (
              <div
                key={request.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  isPending
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isPending ? "bg-primary/20" : "bg-secondary"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isPending ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{request.tableName}</span>
                    <Badge
                      variant={isPending ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {serviceLabels[request.type] || "Other"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAgoSmart(request.createdAt)}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isPending ? "default" : "success"}
                  onClick={() =>
                    isPending
                      ? onAcknowledge(request.id)
                      : onComplete(request.id)
                  }
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
