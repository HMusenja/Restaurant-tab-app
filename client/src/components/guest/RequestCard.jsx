import { useEffect, useState } from "react";
import { Bell,RefreshCw } from "lucide-react";
import ServiceCard from "@/components/service/ServiceCard";

export default function RequestCard({
  requests = [],
  loading = false,
  onRefresh,
  autoOpenOnNew = true,
}) {
  const [open, setOpen] = useState(false);

  // Auto-open when requests appear
  useEffect(() => {
    if (autoOpenOnNew && requests.length > 0) {
      setOpen(true);
    }
  }, [requests.length, autoOpenOnNew]);

  return (
    <div className="rounded-2xl border border-border shadow-soft overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground"
      >
        <div className="flex items-center gap-2 font-semibold">
          <Bell className="h-4 w-4" />
          Requests
        </div>

        <div className="flex items-center gap-3 text-sm">
          {requests.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {requests.length}
            </span>
          )}
          {open ? "Hide" : "Show"}
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={[
          "transition-all duration-300 ease-in-out",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="p-4 space-y-4 border-t border-border bg-card">
          <div className="flex justify-end">
            <button
              className="text-sm text-primary font-medium hover:underline"
              onClick={onRefresh}
              type="button"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No active requests.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <ServiceCard
                  key={r.id}
                  request={r}
                  variant="guest"
                  showTable={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
