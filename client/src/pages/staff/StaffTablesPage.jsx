import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, MoreVertical, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { fetchTables, assignTable, createTable } from "@/api/staffTableApi";
import { useRealtime } from "@/contexts/RealtimeContext";

const statusColors = {
  available: "bg-success/10 border-success/30 hover:bg-success/20",
  occupied: "bg-primary/10 border-primary/30 hover:bg-primary/20",
  reserved: "bg-warning/10 border-warning/20 hover:bg-warning/20",
};

const statusBadgeVariants = {
  available: "bg-success/20 text-success",
  occupied: "bg-primary/20 text-primary",
  reserved: "bg-warning/20 text-warning",
};

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

// backend -> UI mapper (tolerant)
function toUiTable(t) {
  const backendStatus = t.status; // FREE | OCCUPIED | RESERVED
  const reservationStatus = t.reservationStatus; // BOOKED | SEATED | null

  let status = "available";

  // If physically occupied OR reservation seated → occupied
  if (backendStatus === "OCCUPIED" || reservationStatus === "SEATED") {
    status = "occupied";
  }
  // If table reserved OR reservation booked → reserved
  else if (backendStatus === "RESERVED" || reservationStatus === "BOOKED") {
    status = "reserved";
  }

  // activeTab may be string id OR object (if populated)
  const activeTabObj =
    t.activeTab && typeof t.activeTab === "object" ? t.activeTab : null;

  const tabTotalCents =
    activeTabObj?.totalCents ??
    activeTabObj?.totalSubtotalCents ??
    t.tabTotalCents ??
    null;

  return {
    id: t.id || t._id,
    number: t.number,
    name: `Table ${String(t.number).padStart(2, "0")}`,
    status,
    reservation: t.reservation ?? null,
    assignedAt: t.assignedAt ? new Date(t.assignedAt) : null,

    // if you later add joinCode on listTables, this will show automatically
    code: t.code || t.joinCode || "—",

    guests: typeof t.guestCount === "number" ? t.guestCount : null,

    tabTotalCents: typeof tabTotalCents === "number" ? tabTotalCents : null,
  };
}

function getSessionDuration(date) {
  if (!date) return "—";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function StaffTablesPage() {
  const realtime = useRealtime();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState("all"); // all | available | occupied | reserved
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadTables = useCallback(async () => {
    setError("");
    try {
      setLoading(true);

      const data = await fetchTables();
      // optional debug:
      // console.log("fetchTables raw response:", data);

      const mapped = (data?.tables ?? []).map(toUiTable);
      // optional debug:
      // console.log("mapped tables:", mapped);

      setTables(mapped); // ✅ FIX: actually update state
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
      reloadTickets: null,
      reloadServices: null,
    });

    return () => realtime.unregisterStaff(id);
  }, [realtime, reloadTables]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => (filter === "all" ? true : t.status === filter));
  }, [tables, filter]);

  const stats = useMemo(() => {
    return {
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    };
  }, [tables]);

  // optional: assign a FREE table (safe optimistic reload)
  const handleAssign = async (tableId) => {
    try {
      await assignTable(tableId);
      reloadTables();
    } catch (e) {
      setError(e?.message || "Failed to assign table");
    }
  };

  const handleCreateTable = async () => {
    const number = Number(prompt("Enter table number"));
    if (!number) return;

    try {
      await createTable({ number });
      reloadTables();
    } catch (e) {
      setError(e?.message || "Failed to create table");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.available}</div>
            <div className="text-sm text-success/80">Available</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.occupied}</div>
            <div className="text-sm text-primary/80">Occupied</div>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{stats.reserved}</div>
            <div className="text-sm text-warning/80">Reserved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "available", "occupied", "reserved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={reloadTables}
            disabled={loading}
            aria-label="Refresh tables"
            className="h-9 w-9"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>

          <Button size="sm" onClick={handleCreateTable}>
            <Plus className="w-4 h-4 mr-1" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-sm text-muted-foreground">Loading…</div>
        ) : filteredTables.length === 0 ? (
          <div className="col-span-full py-10 text-sm text-muted-foreground">
            No tables in this category.
          </div>
        ) : (
          filteredTables.map((table) => (
            <Card
              key={table.id}
              onClick={() => navigate(`/staff/tables/${table.id}`)}
              className={cn("cursor-pointer transition-all border-2", statusColors[table.status])}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{table.name}</CardTitle>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/staff/tables/${table.id}`);
                        }}
                      >
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-2">
                <Badge className={cn("capitalize", statusBadgeVariants[table.status])}>
                  {table.status}
                </Badge>

                <div className="text-xs text-muted-foreground font-mono">Code: {table.code}</div>

                {table.status === "reserved" && table.reservation ? (
                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <div className="text-sm font-medium">
                      {table.reservation.name} • {table.reservation.partySize} guests
                    </div>
                    <div className="text-xs text-muted-foreground">
                      For:{" "}
                      {new Date(table.reservation.reservedFor).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reservation: {table.reservation.status}
                    </div>
                  </div>
                ) : null}

                {table.status === "occupied" && (
                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="w-3 h-3" />
                      <span>
                        {typeof table.guests === "number" ? `${table.guests} guests` : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tab:</span>
                      <span className="font-semibold">
                        {typeof table.tabTotalCents === "number"
                          ? formatEUR(table.tabTotalCents)
                          : "—"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Session: {getSessionDuration(table.assignedAt)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
