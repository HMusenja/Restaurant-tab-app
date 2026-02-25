import { useEffect } from "react";
import { RefreshCw, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useServices } from "@/contexts/ServiceContext";
import ServiceCard from "@/components/service/ServiceCard";

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap border",
        active
          ? "bg-primary/20 text-[hsl(40,20%,95%)] border-primary/25"
          : "bg-[hsl(40,20%,95%)/4%] text-[hsl(40,10%,70%)] border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/6%]"
      )}
    >
      {children}
    </button>
  );
}

export default function StaffRequestsPage() {
  const { requests, loading, error, query, setQuery, reload, setStatus } =
    useServices();

  useEffect(() => {
    // 🔥 IMPORTANT: use ACTIVE so IN_PROGRESS stays visible
    setQuery((q) => ({ ...q, status: "ACTIVE" }));
  }, [setQuery]);

  const count = Array.isArray(requests) ? requests.length : 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.28em] uppercase text-primary/70">
            AfroAsiatique
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[hsl(40,20%,95%)]">
              Service Requests
            </h2>
            <Badge className="rounded-full bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]">
              {count}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-[hsl(40,10%,60%)]">
            Track, acknowledge, and complete guest requests
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => reload()}
          className="rounded-2xl text-[hsl(40,20%,92%)] hover:bg-[hsl(40,20%,95%)/8%]"
        >
          <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ACTIVE", "OPEN", "IN_PROGRESS", "DONE"].map((s) => (
          <FilterPill
            key={s}
            active={query.status === s}
            onClick={() => setQuery((q) => ({ ...q, status: s }))}
          >
            {s.replace("_", " ")}
          </FilterPill>
        ))}
      </div>

      {/* Status messages */}
      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-4 py-6 text-sm text-[hsl(40,10%,60%)]">
          Loading…
        </div>
      ) : null}

      {/* List */}
      <div className="space-y-3">
        {!loading && count === 0 ? (
          <div className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-4 py-10 text-center">
            <div className="text-sm font-medium text-[hsl(40,20%,92%)]">
              No requests in this view
            </div>
            <div className="mt-1 text-xs text-[hsl(40,10%,60%)]">
              You’re all caught up.
            </div>
          </div>
        ) : (
          requests.map((r) => (
            <ServiceCard
              key={r.id}
              request={r}
              variant="staff"
              onSetStatus={setStatus}
              showTable
            />
          ))
        )}
      </div>
    </div>
  );
}
