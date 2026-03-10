import { useEffect, useState } from "react";
import { Bell, RefreshCw ,ChevronUp, ChevronDown} from "lucide-react";
import ServiceCard from "@/components/service/ServiceCard";

export default function RequestCard({
  requests = [],
  loading = false,
  onRefresh,
  autoOpenOnNew = true,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpenOnNew && requests.length > 0) {
      setOpen(true);
    }
  }, [requests.length, autoOpenOnNew]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border p-4 bg-card shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-primary px-4 py-3 text-primary-foreground rounded-lg"
        type="button"
      >
        <div className="flex items-center gap-2 font-semibold">
          <Bell className="h-4 w-4" />
          Requests
        </div>

         <div className="text-sm ">
           <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                {requests.length}
            </span> Request(s)
        </div>
        
          <div className="flex items-center gap-3">
          <span className="text-lg font-bold"></span>
          {open ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </div>

        {/* <div className="flex items-center gap-3 text-sm">
          {requests.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              {requests.length}
            </span>
          )}
          {open ? "Hide" : "Show"}
        </div> */}
      </button>

      {/* Expandable Content */}
      <div
        className={[
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="space-y-4 border-t border-border bg-card p-4">
          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-xl p-2 text-primary transition-colors hover:bg-muted"
              onClick={onRefresh}
              type="button"
              aria-label="Refresh requests"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
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