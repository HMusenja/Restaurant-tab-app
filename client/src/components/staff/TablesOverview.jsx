import { useEffect, useMemo, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchTables } from "@/api/staffTableApi";
import { useRealtime } from "@/contexts/RealtimeContext";

const statusMeta = {
  available: {
    label: "free",
    tile: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  occupied: {
    label: "occupied",
    tile: "border-primary/25 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  reserved: {
    label: "reserved",
    tile: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
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
    guests: typeof t.guestCount === "number" ? t.guestCount : null,
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
      const data = await fetchTables();
      const rows = (data?.tables ?? []).map(toUiTable);
      setTables(rows);
    } catch (e) {
      setError(e?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadTables();
  }, [reloadTables]);

  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables,
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

  const summary = useMemo(() => {
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const available = tables.filter((t) => t.status === "available").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    return { occupied, available, reserved, total: tables.length };
  }, [tables]);

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
        // ✅ light mode
        "border-border bg-card/85 shadow-sm",
        // ✅ dark mode (original)
        "border-border dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/45",
        "dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base md:text-lg  text-foreground dark:text-[hsl(40,20%,95%)]">
            Table Status
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            AfroAsiatique • Floor overview
          </div>
        </div>

        {!loading ? (
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-primary/10 border border-primary/20 text-primary/80">
              {summary.occupied} occupied
            </Badge>
            <Badge className="rounded-full bg-success/10 border border-success/20 text-success">
              {summary.available} free
            </Badge>
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            Loading…
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>

            <button
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                // ✅ light mode
                "border-border bg-card/90 text-foreground hover:bg-muted/60",
                // ✅ dark mode (original vibe)
                "border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] dark:text-[hsl(40,20%,92%)] dark:hover:bg-[hsl(40,20%,95%)/7%]"
              )}
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
            {sortedTables.map((table) => {
              const meta = statusMeta[table.status] || statusMeta.available;

              return (
                <button
                  key={table.id}
                  type="button"
                  className={cn(
                    "text-left group relative rounded-2xl border p-3 transition-all",
                    // ✅ light mode tile
                    "bg-background/60 border-border hover:bg-muted/60 hover:scale-[1.01] active:scale-[0.99]",
                    // ✅ dark mode tile (original)
                    "bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] border-border dark:border-[hsl(40,20%,95%)/10%] dark:hover:bg-[hsl(40,20%,95%)/6%]"
                  )}
                  onClick={() => {
                    // no behavior change — navigation comes later
                  }}
                >
                  {/* Status strip */}
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 rounded-t-2xl",
                      meta.dot
                    )}
                  />

                  <div className="mb-2 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold leading-none text-foreground dark:text-[hsl(40,20%,95%)]">
                        {table.name}
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                          meta.tile
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {table.status === "occupied" ? (
                    <div className="space-y-1">
                      {typeof table.guests === "number" ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-[hsl(40,10%,70%)]">
                          <Users className="w-3 h-3 text-primary/80" />
                          <span>{table.guests} guests</span>
                        </div>
                      ) : (
                        <div className="text-xs  dark:text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                          Active tab
                        </div>
                      )}

                      <div className="text-sm font-semibold  text-foreground dark:text-[hsl(40,20%,95%)]">
                        {table.tabTotalLabel || "—"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs dark:text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                      Tap to open
                    </div>
                  )}

                  {/* subtle glow on hover */}
                  <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-primary/0 blur-2xl transition-all group-hover:bg-primary/10" />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}