import { useMemo } from "react";
import { Bell, CheckCheck, Trash2, Eraser, Dot } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useNotifications } from "@/contexts/NotificationsContext";

function formatTime(iso) {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function atKey(at) {
  try {
    if (!at) return "";
    return new Date(at).toISOString();
  } catch {
    return "";
  }
}

function severityBadge(severity) {
  const s = String(severity || "normal");
  if (s === "urgent") {
    return {
      label: "Urgent",
      className: "bg-destructive/15 text-destructive border border-destructive/25",
    };
  }
  return {
    label: "Info",
    className: "bg-primary/10 text-primary border border-primary/20",
  };
}

export default function NotificationsDrawer({ open, onOpenChange }) {
  const {
    notifications,
    unreadCount,
    highlightMap,
    loadingInbox,
    busy,
    error,
    loadNotifications,
    loadMore,
    markRead,
    markAllRead,
    clearRead,
    clearAll,
  } = useNotifications();

  const items = useMemo(() => notifications || [], [notifications]);
  const readCount = items.filter((n) => !!n.readAt).length;

  const onOpen = (next) => {
    onOpenChange?.(next);
    if (next) loadNotifications({ reset: true, limit: 30 });
  };

  return (
    <Sheet open={open} onOpenChange={onOpen}>
      <SheetContent
        side="right"
        className={cn(
          "w-[92vw] sm:w-[420px]",
          "bg-[hsl(220,20%,6%)]/85 backdrop-blur-xl",
          "border-l border-border",
          "text-[hsl(40,20%,92%)]"
        )}
      >
        <SheetHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2 text-[hsl(40,20%,92%)]">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary border border-primary/25">
                  {unreadCount} unread
                </span>
              )}
            </SheetTitle>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              disabled={busy || unreadCount === 0}
              className="rounded-xl"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearRead}
              disabled={busy || readCount === 0}
              className="rounded-xl"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear read
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={busy || items.length === 0}
              className="rounded-xl text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>

          {error && <div className="text-sm text-destructive pt-1">{error}</div>}
        </SheetHeader>

        <Separator className="my-3 bg-border/60" />

        <div className="h-[calc(100vh-8rem)] overflow-y-auto pr-1">
          {!loadingInbox && items.length === 0 && (
            <div className="text-sm text-muted-foreground py-10 text-center">
              You're all caught up 🎉
            </div>
          )}

          <ul className="space-y-2">
            {items.map((n) => {
              const isUnread = !n.readAt;
              const sev = severityBadge(n.severity);

              // ✅ only deltas (avoid repeating created)
              const updates = (n?.metadata?.updates || []).filter((u) => u?.kind !== "created");

              // ✅ only latest update (single pill)
              const latest = updates.length ? updates[updates.length - 1] : null;

              const latestKey = atKey(latest?.at);
              const shouldHighlight =
                !!latest &&
                !!highlightMap?.[n._id] &&
                latestKey &&
                latestKey === highlightMap[n._id];

              return (
                <li
                  key={n._id}
                  className={cn(
                    "rounded-2xl border p-3 transition-all",
                    "bg-[hsl(40,20%,95%)/5%] border-[hsl(40,20%,95%)/10%]",
                    isUnread && "ring-1 ring-primary/25",
                    n.severity === "urgent" && "border-destructive/25"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isUnread ? (
                        <Dot className="h-6 w-6 text-primary" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 mt-2 ml-2" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "text-sm font-semibold truncate",
                                isUnread ? "text-[hsl(40,20%,96%)]" : "text-muted-foreground"
                              )}
                            >
                              {n.title}
                            </h3>
                            <Badge
                              className={cn("h-5 px-2 text-[11px] rounded-full", sev.className)}
                            >
                              {sev.label}
                            </Badge>
                          </div>

                          {/* Current snapshot */}
                          <p
                            className={cn(
                              "mt-1 text-sm leading-snug",
                              isUnread ? "text-[hsl(40,20%,88%)]" : "text-muted-foreground"
                            )}
                          >
                            {n.message}
                          </p>

                          {/* ✅ Only latest delta update */}
                          {latest?.text && (
                            <div
                              className={cn(
                                "relative mt-2 text-xs rounded-lg px-2 py-1 border transition-all",
                                "bg-[hsl(220,20%,10%)]/40 border-[hsl(40,20%,95%)/10%]",
                                "text-[hsl(40,20%,82%)]",
                                shouldHighlight &&
                                  "border-primary/40 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_18px_rgba(255,180,60,0.18)]"
                              )}
                            >
                              {shouldHighlight && (
                                <span
                                  className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                                    "bg-primary/60"
                                  )}
                                />
                              )}
                              <span className={cn(shouldHighlight && "pl-1")}>{latest.text}</span>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-muted-foreground">
                            {formatTime(n.createdAt)}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            disabled={!isUnread}
                            onClick={() => markRead(n._id)}
                          >
                            {isUnread ? "Mark read" : "Read"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {loadMore && (
            <div className="py-4 flex justify-center">
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={loadMore}
                disabled={loadingInbox}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}