import { useEffect, useMemo, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchTables } from "@/api/staffTableApi";
import { useRealtime } from "@/contexts/RealtimeContext";

const statusColors = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  reserved: "bg-warning/20 text-warning border-warning/30",
};

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

// map backend -> UI
function toUiTable(t) {
  const isOccupied = t.status === "OCCUPIED";
  const activeTabObj =
    t.activeTab && typeof t.activeTab === "object" ? t.activeTab : null;

  return {
    id: t.id || t._id,
    name: `Table ${String(t.number).padStart(2, "0")}`,
    status: isOccupied ? "occupied" : "available",

    // guests will come next (see below)
    guests: typeof t.guestCount === "number" ? t.guestCount : null,

    // ✅ NEW
    tabTotalLabel: activeTabObj ? formatEUR(activeTabObj.totalCents) : null,
  };
}

export function TablesOverview() {
  const realtime = useRealtime();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadTables = useCallback(async () => {
    setError("");
    try {
      const data = await fetchTables(); // expects { tables: [...] }
      const rows = (data?.tables ?? []).map(toUiTable);
      setTables(rows);
    } catch (e) {
      setError(e?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    reloadTables();
  }, [reloadTables]);

  // realtime: register staff and let provider call reloadTables on events
  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables,
      // keep these null to avoid unnecessary work here
      reloadTickets: null,
      reloadServices: null,
    });

    return () => realtime.unregisterStaff(id);
  }, [realtime, reloadTables]);

  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const an = Number(String(a.name).replace(/\D/g, "")) || 0;
      const bn = Number(String(b.name).replace(/\D/g, "")) || 0;
      return an - bn;
    });
  }, [tables]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Table Status</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="space-y-2">
            <div className="text-sm text-destructive">{error}</div>
            <button
              className="rounded-md border px-3 py-1 text-sm"
              onClick={() => {
                setLoading(true);
                reloadTables();
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedTables.map((table) => (
              <div
                key={table.id}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all overflow-hidden cursor-pointer hover:scale-[1.02]",
                  statusColors[table.status],
                )}
                onClick={() => {
                  // Step 4 will navigate to detail route
                  // For now, keep as a no-op or console log
                  // console.log("Clicked table", table.id);
                }}
              >
                <div className="mb-2 space-y-1">
                  {/* Line 1: Table name */}
                  <div className="text-sm font-semibold leading-none">
                    {table.name}
                  </div>

                  {/* Line 2: Status badge */}
                  <Badge
                    variant="outline"
                    className="w-fit text-[11px] px-2 py-0.5 capitalize"
                  >
                    {table.status}
                  </Badge>
                </div>

                {table.status === "occupied" && (
                  <div className="space-y-1">
                    {/* guests not available yet -> hide gracefully */}
                    {typeof table.guests === "number" ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{table.guests} guests</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Active tab: {table.activeTab ? "Yes" : "—"}
                      </div>
                    )}

                    {/* tabTotal not available yet -> hide gracefully */}
                    {table.tabTotalLabel ? (
                      <div className="text-sm font-medium">
                        {table.tabTotalLabel}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">—</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
