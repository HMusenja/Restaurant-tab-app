import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, MoreVertical, RefreshCw, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { fetchTables, assignTable, createTable } from "@/api/staffTableApi";
import { useRealtime } from "@/contexts/RealtimeContext";

const statusColors = {
  available: "border-success/25 bg-success/10 hover:bg-success/15",
  occupied: "border-primary/25 bg-primary/10 hover:bg-primary/15",
  reserved: "border-warning/25 bg-warning/10 hover:bg-warning/15",
};

const statusBadgeVariants = {
  available: "bg-success/10 text-success border-success/20",
  occupied: "bg-primary/10 text-primary border-primary/20",
  reserved: "bg-warning/10 text-warning border-warning/20",
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

  if (backendStatus === "OCCUPIED" || reservationStatus === "SEATED") {
    status = "occupied";
  } else if (backendStatus === "RESERVED" || reservationStatus === "BOOKED") {
    status = "reserved";
  }

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

function StatsTiles({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="rounded-2xl border border-success/20 bg-success/10 backdrop-blur">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{stats.available}</div>
          <div className="text-xs tracking-[0.18em] uppercase text-success/80">
            Available
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-primary/20 bg-primary/10 backdrop-blur">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.occupied}</div>
          <div className="text-xs tracking-[0.18em] uppercase text-primary/80">
            Occupied
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-warning/20 bg-warning/10 backdrop-blur">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{stats.reserved}</div>
          <div className="text-xs tracking-[0.18em] uppercase text-warning/80">
            Reserved
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptySelectionPanel() {
  return (
    <Card
      className={cn(
        "rounded-2xl overflow-hidden",
        "border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl",
        "shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base text-[hsl(40,20%,95%)]">
              AfroAsiatique
            </CardTitle>
            <div className="text-xs text-[hsl(40,10%,60%)]">
              Select a table to preview
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] p-4 text-sm text-[hsl(40,10%,70%)]">
          On tablet/desktop, you’ll get a quick preview panel here. On mobile,
          tap a table to open details.
        </div>
      </CardContent>
    </Card>
  );
}

function SelectionPanel({ table, onOpenDetails, onAssign }) {
  const badgeClass = statusBadgeVariants[table.status] || statusBadgeVariants.available;

  return (
    <Card
      className={cn(
        "rounded-2xl overflow-hidden",
        "border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl",
        "shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base text-[hsl(40,20%,95%)]">
              {table.name}
            </CardTitle>
            <div className="mt-1 text-xs text-[hsl(40,10%,60%)] font-mono">
              Code: {table.code}
            </div>
          </div>

          <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold capitalize", badgeClass)}>
            {table.status}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] p-4 space-y-2">
          {table.status === "reserved" && table.reservation ? (
            <>
              <div className="text-sm font-semibold text-[hsl(40,20%,95%)]">
                {table.reservation.name} • {table.reservation.partySize} guests
              </div>
              <div className="text-xs text-[hsl(40,10%,60%)]">
                For:{" "}
                {new Date(table.reservation.reservedFor).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-xs text-[hsl(40,10%,60%)]">
                Reservation: {table.reservation.status}
              </div>
            </>
          ) : table.status === "occupied" ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(40,10%,60%)]">Guests</span>
                <span className="inline-flex items-center gap-2 font-semibold text-[hsl(40,20%,95%)]">
                  <Users className="h-4 w-4 text-primary/80" />
                  {typeof table.guests === "number" ? table.guests : "—"}
                </span>
              </div>

              <Separator className="bg-[hsl(40,20%,95%)/10%]" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(40,10%,60%)]">Tab total</span>
                <span className="font-semibold text-[hsl(40,20%,95%)]">
                  {typeof table.tabTotalCents === "number"
                    ? formatEUR(table.tabTotalCents)
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(40,10%,60%)]">Session</span>
                <span className="font-semibold text-[hsl(40,20%,95%)]">
                  {getSessionDuration(table.assignedAt)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm text-[hsl(40,10%,70%)]">
              This table is free. You can assign it when guests arrive.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button className="rounded-2xl" onClick={onOpenDetails}>
            Open details
          </Button>

          {table.status === "available" ? (
            <Button
              variant="secondary"
              className="rounded-2xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
              onClick={onAssign}
            >
              Assign table
            </Button>
          ) : null}
        </div>

        <div className="text-[11px] text-[hsl(40,10%,55%)] tracking-[0.18em] uppercase">
          AfroAsiatique • Live Ops
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffTablesPage() {
  const realtime = useRealtime();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState("all"); // all | available | occupied | reserved
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI-only: selection for desktop split view (does not replace routing)
  const [selectedId, setSelectedId] = useState(null);

  const reloadTables = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const data = await fetchTables();
      const mapped = (data?.tables ?? []).map(toUiTable);
      setTables(mapped);
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

  const selectedTable = useMemo(() => {
    if (!selectedId) return null;
    return tables.find((t) => t.id === selectedId) || null;
  }, [tables, selectedId]);

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
    <div className="space-y-5">
      {/* POS-ish page header row (keeps your actions) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.28em] uppercase text-primary/70">
            AfroAsiatique
          </div>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[hsl(40,20%,95%)]">
            Floor — Tables
          </h2>
          <div className="mt-1 text-xs text-[hsl(40,10%,60%)]">
            Assign, monitor, and open table sessions
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={reloadTables}
            disabled={loading}
            aria-label="Refresh tables"
            className="h-9 w-9 rounded-xl text-[hsl(40,20%,92%)] hover:bg-[hsl(40,20%,95%)/8%]"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>

          <Button size="sm" className="rounded-2xl" onClick={handleCreateTable}>
            <Plus className="w-4 h-4 mr-1" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsTiles stats={stats} />

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Split view: stack on mobile, 2 columns on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* LEFT: filters + grid */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["all", "available", "occupied", "reserved"].map((f) => (
                <FilterPill key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f}
                </FilterPill>
              ))}
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {loading ? (
              <div className="col-span-full py-10 text-sm text-[hsl(40,10%,60%)]">
                Loading…
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="col-span-full py-10 text-sm text-[hsl(40,10%,60%)]">
                No tables in this category.
              </div>
            ) : (
              filteredTables.map((table) => {
                const isSelected = selectedId === table.id;

                return (
                  <Card
                    key={table.id}
                    onClick={() => {
                      // UI-only selection for split view + keep navigation unchanged
                      setSelectedId(table.id);
                      navigate(`/staff/tables/${table.id}`);
                    }}
                    className={cn(
                      "cursor-pointer transition-all rounded-2xl border",
                      "bg-[hsl(40,20%,95%)/4%] border-[hsl(40,20%,95%)/10%]",
                      "hover:bg-[hsl(40,20%,95%)/6%]",
                      statusColors[table.status],
                      isSelected && "ring-2 ring-primary/35"
                    )}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base text-[hsl(40,20%,95%)]">
                          {table.name}
                        </CardTitle>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-[hsl(40,20%,92%)] hover:bg-[hsl(40,20%,95%)/8%]"
                              onClick={(e) => {
                                // ensure menu click doesn't navigate
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
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

                            {table.status === "available" ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAssign(table.id);
                                }}
                              >
                                Assign Table
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize w-fit",
                          statusBadgeVariants[table.status]
                        )}
                      >
                        {table.status}
                      </span>

                      <div className="text-xs text-[hsl(40,10%,60%)] font-mono">
                        Code: {table.code}
                      </div>

                      {table.status === "reserved" && table.reservation ? (
                        <div className="pt-2 border-t border-[hsl(40,20%,95%)/10%] space-y-1">
                          <div className="text-sm font-medium text-[hsl(40,20%,95%)]">
                            {table.reservation.name} • {table.reservation.partySize} guests
                          </div>
                          <div className="text-xs text-[hsl(40,10%,60%)]">
                            For:{" "}
                            {new Date(table.reservation.reservedFor).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-[hsl(40,10%,60%)]">
                            Reservation: {table.reservation.status}
                          </div>
                        </div>
                      ) : null}

                      {table.status === "occupied" ? (
                        <div className="pt-2 border-t border-[hsl(40,20%,95%)/10%] space-y-1">
                          <div className="flex items-center gap-2 text-sm text-[hsl(40,20%,92%)]">
                            <Users className="w-4 h-4 text-primary/80" />
                            <span>
                              {typeof table.guests === "number" ? `${table.guests} guests` : "—"}
                            </span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-[hsl(40,10%,60%)]">Tab:</span>
                            <span className="font-semibold text-[hsl(40,20%,95%)]">
                              {typeof table.tabTotalCents === "number"
                                ? formatEUR(table.tabTotalCents)
                                : "—"}
                            </span>
                          </div>

                          <div className="text-xs text-[hsl(40,10%,60%)]">
                            Session: {getSessionDuration(table.assignedAt)}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: selection panel (lg+) */}
        <div className="hidden lg:block">
          <div className="sticky top-[4.5rem] space-y-3">
            {selectedTable ? (
              <SelectionPanel
                table={selectedTable}
                onOpenDetails={() => navigate(`/staff/tables/${selectedTable.id}`)}
                onAssign={() => handleAssign(selectedTable.id)}
              />
            ) : (
              <EmptySelectionPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
