import { useMemo, useState, useEffect } from "react";
import { Clock, ChefHat, Bell, CheckCircle2,ChevronUp, ChevronDown,ShoppingBag } from "lucide-react";

function formatTime(iso) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * Visual config only.
 * Uses ticket statuses: NEW / PREPARING / READY / DONE.
 */
const statusConfig = {
  NEW: {
    icon: Clock,
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
    label: "Sent",
  },
  PREPARING: {
    icon: ChefHat,
    bgColor: "bg-warning/15",
    textColor: "text-warning",
    borderColor: "border-warning/20",
    label: "Preparing",
  },
  READY: {
    icon: Bell,
    bgColor: "bg-success/15",
    textColor: "text-success",
    borderColor: "border-success/20",
    label: "Ready",
  },
  DONE: {
    icon: CheckCircle2,
    bgColor: "bg-success/10",
    textColor: "text-success",
    borderColor: "border-success/15",
    label: "Delivered",
  },
};

function getConfig(status) {
  return statusConfig[status] || statusConfig.NEW;
}

export default function OrderStatusPanel({
  tickets,
  hideDoneAfterMinutes = 10,
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(Date.now());
   const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { visibleTickets, hiddenCount } = useMemo(() => {
    const cutoffMs = hideDoneAfterMinutes * 60 * 1000;

    const isHiddenDone = (t) => {
      if (t.status !== "DONE") return false;
      if (!t.createdAt) return false;
      const ageMs = now - new Date(t.createdAt).getTime();
      return ageMs > cutoffMs;
    };

    const hidden = tickets.filter(isHiddenDone).length;

    const visible = showCompleted
      ? tickets
      : tickets.filter((t) => !isHiddenDone(t));

    return { visibleTickets: visible, hiddenCount: hidden };
  }, [tickets, showCompleted, hideDoneAfterMinutes, now]);

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      {/* Collapsed Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-primary px-4 py-3 text-primary-foreground rounded-lg"
        type="button"
      >
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingBag className="h-5 w-5" />
          Order Status
        </div>
         <div className="text-sm ">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              {visibleTickets.length}
            </span> Ticket(s)
          </div>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold"></span>
          {open ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </div>
      </button>

      {/*Expandalble Content */}
      {/* Header */}
      <div
        className={[
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
     

        {/* Hidden completed banner */}
        {hiddenCount > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">
              {hiddenCount} completed ticket(s) hidden
            </div>

            <button
              onClick={() => setShowCompleted((s) => !s)}
              className="text-xs font-semibold text-foreground underline underline-offset-2"
              type="button"
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {visibleTickets.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            No tickets sent yet. Add items and press{" "}
            <span className="font-semibold text-foreground">
              Send to Service
            </span>
            .
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visibleTickets.map((t) => {
              const cfg = getConfig(t.status);
              const Icon = cfg.icon;

              return (
                <div
                  key={t._id}
                  className={[
                    "animate-[fadeIn_.2s_ease-out] rounded-2xl border p-4",
                    cfg.bgColor,
                    cfg.borderColor,
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon bubble */}
                    <div
                      className={[
                        "rounded-full border p-2",
                        cfg.bgColor,
                        cfg.borderColor,
                      ].join(" ")}
                    >
                      <Icon className={["h-5 w-5", cfg.textColor].join(" ")} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className={["font-semibold", cfg.textColor].join(
                              " ",
                            )}
                          >
                            {cfg.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.station || "KITCHEN"}
                          </p>
                        </div>

                        {/* ETA */}
                        <div className="text-right">
                          {t.etaMinutes != null ? (
                            <div className="text-sm font-semibold text-foreground">
                              ETA {t.etaMinutes}m
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              ETA —
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lines */}
                      <div className="mt-3 space-y-1 text-sm">
                        {(t.lines || []).map((l, idx) => (
                          <div
                            key={l._id || idx}
                            className="flex items-start justify-between gap-3"
                          >
                            <span className="min-w-0 flex-1 truncate text-foreground">
                              {l.nameSnap}
                              {l.qty > 1 ? ` ×${l.qty}` : ""}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {l.status || "NEW"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Timestamp */}
                      <div className="mt-3 text-sm text-muted-foreground">
                        Sent at {formatTime(t.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
