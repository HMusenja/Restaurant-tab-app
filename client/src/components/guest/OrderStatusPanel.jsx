import { useMemo, useState } from "react";
import { Clock, ChefHat, Bell, CheckCircle2 } from "lucide-react";

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
 * Code A-style status config (visual only).
 * Uses your ticket statuses: NEW / PREPARING / DONE.
 */
const statusConfig = {
  NEW: {
    icon: Clock,
    bgColor: "bg-black/5",
    textColor: "text-black",
    borderColor: "border-black/10",
    label: "Sent",
  },
  PREPARING: {
    icon: ChefHat,
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-500/20",
    label: "Preparing",
  },
  READY: {
    icon: Bell,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-500/20",
    label: "Ready",
  },
  DONE: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-500/20",
    label: "Delivered",
  },
};

function getConfig(status) {
  return statusConfig[status] || statusConfig.NEW;
}

export default function OrderStatusPanel({ tickets, hideDoneAfterMinutes = 10 }) {
  const [showCompleted, setShowCompleted] = useState(false);

  const now = Date.now();

  const { visibleTickets, hiddenCount } = useMemo(() => {
    const cutoffMs = hideDoneAfterMinutes * 60 * 1000;

    const isHiddenDone = (t) => {
      if (t.status !== "DONE") return false;
      if (!t.createdAt) return false; // if missing, don’t hide
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Status</h2>
        <div className="text-sm text-gray-500">
          {visibleTickets.length} ticket(s)
        </div>
      </div>

      {/* Hidden completed banner */}
      {hiddenCount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-600">
            {hiddenCount} completed ticket(s) hidden
          </div>
          <button
            onClick={() => setShowCompleted((s) => !s)}
            className="text-xs font-semibold text-black underline underline-offset-2"
          >
            {showCompleted ? "Hide completed" : "Show completed"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {visibleTickets.length === 0 ? (
        <div className="mt-3 text-sm text-gray-600">
          No tickets sent yet. Add items and press <b>Send to Service</b>.
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
                  "rounded-lg border p-4 animate-[fadeIn_.2s_ease-out]",
                  cfg.bgColor,
                  cfg.borderColor,
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {/* Code A icon bubble */}
                  <div className={["rounded-full p-2", cfg.bgColor].join(" ")}>
                    <Icon className={["h-5 w-5", cfg.textColor].join(" ")} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={["font-semibold", cfg.textColor].join(" ")}>
                          {cfg.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t.station || "KITCHEN"}
                        </p>
                      </div>

                      {/* ETA */}
                      <div className="text-right">
                        {t.etaMinutes != null ? (
                          <div className="text-sm font-semibold text-gray-900">
                            ETA {t.etaMinutes}m
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">ETA —</div>
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
                          <span className="min-w-0 flex-1 truncate text-gray-800">
                            {l.nameSnap}
                            {l.qty > 1 ? ` ×${l.qty}` : ""}
                          </span>
                          <span className="shrink-0 text-xs text-gray-500">
                            {l.status || "NEW"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Timestamp */}
                    <div className="mt-3 text-sm text-gray-500">
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
  );
}
