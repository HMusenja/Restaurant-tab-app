import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ChefHat,
  Check,
  AlertCircle,
  RefreshCw,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  fetchTickets,
  updateTicket,
  updateTicketLine,
} from "@/api/staffTicketApi";
import { closeTab } from "@/api/staffTabApi";
import { useRealtime } from "@/contexts/RealtimeContext";

/* ----------------------------- helpers ---------------------------- */

function timeAgoFromISO(iso) {
  if (!iso) return "—";
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1m ago";
  return `${minutes}m ago`;
}

function uiStatusFromBackend(status) {
  const s = String(status || "NEW").toUpperCase();
  if (s === "DONE") return "delivered";
  if (s === "PREPARING") return "preparing";
  return "new";
}

const statusConfig = {
  new: {
    label: "New",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
  },
  preparing: {
    label: "Preparing",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: ChefHat,
  },
  delivered: {
    label: "Done",
    color: "bg-success/10 text-success border-success/20",
    icon: Check,
  },
};

function getNextBackendStatus(uiStatus) {
  switch (uiStatus) {
    case "new":
      return "PREPARING";
    case "preparing":
      return "DONE";
    default:
      return null;
  }
}

function getActionLabel(uiStatus) {
  switch (uiStatus) {
    case "new":
      return "Start Preparing";
    case "preparing":
      return "Mark Done";
    default:
      return null;
  }
}

function toUiTicket(t) {
  const uiStatus = uiStatusFromBackend(t.status);

  const tableNumber = t?.tab?.table?.number;
  const tableName = tableNumber
    ? `Table ${String(tableNumber).padStart(2, "0")}`
    : "Table ?";

  const lines = Array.isArray(t.lines) ? t.lines : [];

  const items = lines.map((l, idx) => ({
    id: l._id || String(idx),
    name: l.nameSnap || "Item",
    quantity: l.qty ?? 1,
    notes: l.note || l.notes || "",
    lineStatus: String(l.status || "NEW").toUpperCase(),
  }));

  const priority =
    uiStatus === "new" &&
    (t.priority === true || items.some((x) => x.lineStatus !== "DONE"));

  const tabId = t?.tab?._id || t?.tab || null;
  const tabStatus = t?.tab?.status || null;

  return {
    id: t._id,
    tableName,
    createdAtISO: t.createdAt,
    status: uiStatus,
    backendStatus: String(t.status || "NEW").toUpperCase(),
    station: t.station || "KITCHEN",
    etaMinutes: typeof t.etaMinutes === "number" ? t.etaMinutes : null,
    items,
    priority,
    tabId,
    tabStatus,
  };
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap border",
        active
          ? "bg-primary/20 text-foreground border-primary/25"
          : "bg-muted/40 border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------- component --------------------------- */

export default function StaffTicketsPage() {
  const navigate = useNavigate();
  const rt = useRealtime();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [doneMinutes, setDoneMinutes] = useState(120);

  const loadTickets = useCallback(async () => {
    setError("");
    try {
      setLoading(true);

      const params = showDone
        ? { includeDone: 1, doneMinutes }
        : { includeDone: 0 };

      const data = await fetchTickets(params);
      setTickets((data?.tickets ?? []).map(toUiTicket));
    } catch (e) {
      setError(e?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [showDone, doneMinutes]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: loadTickets,
      reloadServices: null,
      reloadTables: null,
    });
    return () => rt.unregisterStaff(id);
  }, [rt, loadTickets]);

  const pendingCount = useMemo(
    () =>
      tickets.filter((t) => String(t.backendStatus).toUpperCase() !== "DONE")
        .length,
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "done")
      return tickets.filter((t) => t.backendStatus === "DONE");
    if (filter === "preparing")
      return tickets.filter((t) => t.backendStatus === "PREPARING");
    return tickets.filter(
      (t) => !["DONE", "PREPARING"].includes(t.backendStatus),
    );
  }, [tickets, filter]);

  const setStatus = async (ticketId, backendStatus) => {
    try {
      await updateTicket(ticketId, { status: backendStatus });

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                backendStatus,
                status: uiStatusFromBackend(backendStatus),
              }
            : t,
        ),
      );
    } catch {
      loadTickets();
    }
  };

  const setEta = async (ticketId, etaMinutes) => {
    try {
      await updateTicket(ticketId, { etaMinutes });

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, etaMinutes } : t)),
      );
    } catch {
      loadTickets();
    }
  };

  const setLineStatus = async (ticketId, lineId, backendStatus) => {
    try {
      await updateTicketLine(ticketId, lineId, { status: backendStatus });

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                items: t.items.map((i) =>
                  i.id === lineId ? { ...i, lineStatus: backendStatus } : i,
                ),
              }
            : t,
        ),
      );
    } catch {
      loadTickets();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.28em] uppercase text-primary/70">
            AfroAsiatique
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />

            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">
              Kitchen Tickets
            </h2>

            {pendingCount > 0 && (
              <Badge className="rounded-full bg-primary/10 border border-primary/20 text-primary/80">
                {pendingCount}
              </Badge>
            )}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            Start prep, mark items, and close tabs when paid
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={loadTickets}
          className="rounded-2xl"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-1", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "preparing", "done"].map((f) => (
          <FilterPill
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </FilterPill>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => {
            const StatusIcon = statusConfig[ticket.status]?.icon || Check;
            const nextBackendStatus = getNextBackendStatus(ticket.status);
            const actionLabel = getActionLabel(ticket.status);

            return (
              <Card
                key={ticket.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border bg-card/85 backdrop-blur-xl shadow-sm",
                  "dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/45",
                  ticket.priority && "ring-2 ring-destructive/40",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-foreground">
                    {ticket.tableName}
                    <Badge>{statusConfig[ticket.status]?.label}</Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                  {ticket.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-muted/40 px-3 py-3"
                    >
                      <div className="space-y-3">
                        {/* Item text */}
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug break-words">
                            {item.quantity}x {item.name}
                          </div>

                          {item.notes && (
                            <div className="text-xs text-muted-foreground mt-1 break-words">
                              {item.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setLineStatus(ticket.id, item.id, "PREPARING")
                            }
                          >
                            Prep
                          </Button>

                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              setLineStatus(ticket.id, item.id, "DONE")
                            }
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {nextBackendStatus && (
                    <Button
                      className="w-full mt-3"
                      onClick={() => setStatus(ticket.id, nextBackendStatus)}
                    >
                      {actionLabel}
                    </Button>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[5, 10, 15].map((m) => (
                      <Button
                        key={m}
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => setEta(ticket.id, m)}
                      >
                        {m}m
                      </Button>
                    ))}
                  </div>

                  {ticket.tabId && ticket.tabStatus === "OPEN" && (
                    <Button
                      className="w-full mt-3"
                      onClick={() => navigate(`/staff/pay/${ticket.tabId}`)}
                    >
                      Take Payment
                    </Button>
                  )}

                  {ticket.tabId && ticket.tabStatus === "PAID" && (
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={async () => {
                        await closeTab(ticket.tabId);
                        loadTickets();
                      }}
                    >
                      Close Tab
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
