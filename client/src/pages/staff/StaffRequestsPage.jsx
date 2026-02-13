import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useServices } from "@/contexts/ServiceContext";
import ServiceCard from "@/components/service/ServiceCard";

export default function StaffRequestsPage() {
  const { requests, loading, error, query, setQuery, reload, setStatus } = useServices();

  useEffect(() => {
    // 🔥 IMPORTANT: use ACTIVE so IN_PROGRESS stays visible
    setQuery((q) => ({ ...q, status: "ACTIVE" }));
  }, [setQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Service Requests</div>
        <Button variant="secondary" size="sm" onClick={() => reload()}>
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {["ACTIVE", "OPEN", "IN_PROGRESS", "DONE"].map((s) => (
          <button
            key={s}
            onClick={() => setQuery((q) => ({ ...q, status: s }))}
            className={
              query.status === s
                ? "px-3 py-2 rounded bg-primary text-primary-foreground"
                : "px-3 py-2 rounded bg-secondary"
            }
          >
            {s}
          </button>
        ))}
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}

      <div className="space-y-2">
        {requests.map((r) => (
          <ServiceCard
            key={r.id}
            request={r}
            variant="staff"
            onSetStatus={setStatus}
            showTable
          />
        ))}
      </div>
    </div>
  );
}
