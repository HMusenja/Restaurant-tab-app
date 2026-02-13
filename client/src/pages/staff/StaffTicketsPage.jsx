import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ChefHat, Check, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { fetchTickets, updateTicket, updateTicketLine } from "@/api/staffTicketApi";
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

// backend: NEW | PREPARING | DONE
function uiStatusFromBackend(status) {
  const s = String(status || "NEW").toUpperCase();
  if (s === "DONE") return "delivered";
  if (s === "PREPARING") return "preparing";
  return "new";
}

const statusConfig = {
  new: { label: "New", color: "bg-destructive/20 text-destructive", icon: AlertCircle },
  preparing: { label: "Preparing", color: "bg-warning/20 text-warning", icon: ChefHat },
  delivered: { label: "Done", color: "bg-muted text-muted-foreground", icon: Check },
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
  const tableName = tableNumber ? `Table ${String(tableNumber).padStart(2, "0")}` : "Table ?";

  const lines = Array.isArray(t.lines) ? t.lines : [];
  const items = lines.map((l, idx) => ({
    id: l._id || String(idx),
    name: l.nameSnap || "Item",
    quantity: l.qty ?? 1,
    notes: l.note || l.notes || "",
    lineStatus: String(l.status || "NEW").toUpperCase(),
  }));

  const priority = uiStatus === "new" && (t.priority === true || items.some((x) => x.lineStatus !== "DONE"));

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
    raw: t,
  };
}

/* ---------------------------- component --------------------------- */

export default function StaffTicketsPage() {
  const navigate = useNavigate();
  const rt = useRealtime();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // dashboard-style filters
  const [filter, setFilter] = useState("all"); // all | pending | preparing | done
  const [showDone, setShowDone] = useState(false);
  const [doneMinutes, setDoneMinutes] = useState(120);

  const loadTickets = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const params = showDone ? { includeDone: 1, doneMinutes } : { includeDone: 0 };
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

  // realtime wiring
  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: loadTickets,
      reloadServices: null,
      reloadTables: null,
    });
    return () => rt.unregisterStaff(id);
  }, [rt, loadTickets]);

  const pendingCount = useMemo(
    () => tickets.filter((t) => String(t.backendStatus).toUpperCase() !== "DONE").length,
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "done") return tickets.filter((t) => t.backendStatus === "DONE");
    if (filter === "preparing") return tickets.filter((t) => t.backendStatus === "PREPARING");
    // pending
    return tickets.filter((t) => !["DONE", "PREPARING"].includes(t.backendStatus));
  }, [tickets, filter]);

  const setStatus = useCallback(
    async (ticketId, backendStatus) => {
      setError("");
      try {
        await updateTicket(ticketId, { status: backendStatus });
        // optimistic update
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, backendStatus, status: uiStatusFromBackend(backendStatus) }
              : t,
          ),
        );
      } catch (e) {
        setError(e?.message || "Failed to update ticket");
        loadTickets();
      }
    },
    [loadTickets],
  );

  const setEta = useCallback(
    async (ticketId, etaMinutes) => {
      setError("");
      try {
        await updateTicket(ticketId, { etaMinutes });
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, etaMinutes } : t)));
      } catch (e) {
        setError(e?.message || "Failed to update ETA");
        loadTickets();
      }
    },
    [loadTickets],
  );

  const setLineStatus = useCallback(
    async (ticketId, lineId, backendStatus) => {
      setError("");
      try {
        await updateTicketLine(ticketId, lineId, { status: backendStatus });
        setTickets((prev) =>
          prev.map((t) => {
            if (t.id !== ticketId) return t;
            return {
              ...t,
              items: t.items.map((it) => (it.id === lineId ? { ...it, lineStatus: backendStatus } : it)),
            };
          }),
        );
      } catch (e) {
        setError(e?.message || "Failed to update item");
        loadTickets();
      }
    },
    [loadTickets],
  );

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Active Tickets</span>
          {pendingCount > 0 ? <Badge>{pendingCount}</Badge> : null}
        </div>

        <Button variant="ghost" size="sm" onClick={loadTickets}>
          <Clock className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* show done + time window */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          Show completed
        </label>

        {showDone ? (
          <select
            value={doneMinutes}
            onChange={(e) => setDoneMinutes(Number(e.target.value))}
            className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
          >
            <option value={30}>Last 30 min</option>
            <option value={60}>Last 1 hour</option>
            <option value={120}>Last 2 hours</option>
            <option value={360}>Last 6 hours</option>
          </select>
        ) : null}
      </div>

      {/* Filters (dashboard-style) */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "preparing", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Tickets Grid */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Check className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No tickets in this view</p>
              <p className="text-sm">You’re all caught up</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status]?.icon || Check;
              const nextBackendStatus = getNextBackendStatus(ticket.status);
              const actionLabel = getActionLabel(ticket.status);

              return (
                <Card
                  key={ticket.id}
                  className={cn(
                    "transition-all",
                    ticket.priority && ticket.status === "new" && "ring-2 ring-destructive/50",
                  )}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {ticket.tableName}
                        {ticket.priority ? (
                          <Badge variant="destructive" className="text-xs">
                            Priority
                          </Badge>
                        ) : null}
                      </CardTitle>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {timeAgoFromISO(ticket.createdAtISO)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("w-fit", statusConfig[ticket.status]?.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[ticket.status]?.label || "Unknown"}
                      </Badge>

                      {ticket.etaMinutes ? (
                        <Badge variant="secondary" className="text-xs">
                          ETA {ticket.etaMinutes}m
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    {/* Lines */}
                    <div className="space-y-2">
                      {ticket.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.quantity}x {item.name}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({item.lineStatus})
                              </span>
                            </div>
                            {item.notes ? (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.notes}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3"
                              disabled={!item.id || item.lineStatus === "PREPARING"}
                              onClick={() => setLineStatus(ticket.id, item.id, "PREPARING")}
                            >
                              Prep
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3"
                              disabled={!item.id || item.lineStatus === "DONE"}
                              onClick={() => setLineStatus(ticket.id, item.id, "DONE")}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ticket status progression */}
                    {nextBackendStatus && actionLabel ? (
                      <Button className="w-full mt-4" onClick={() => setStatus(ticket.id, nextBackendStatus)}>
                        {actionLabel}
                      </Button>
                    ) : null}

                    {/* ETA controls */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">ETA:</span>
                      {[5, 10, 15, 20].map((m) => (
                        <Button key={m} size="sm" variant="secondary" onClick={() => setEta(ticket.id, m)}>
                          {m}m
                        </Button>
                      ))}
                      <Button size="sm" variant="secondary" onClick={() => setEta(ticket.id, null)}>
                        Clear
                      </Button>
                    </div>

                    {/* Payment logic (same as dashboard) */}
                    {ticket.tabId && ticket.tabStatus === "OPEN" ? (
                      <Button className="mt-4 w-full" onClick={() => navigate(`/staff/pay/${ticket.tabId}`)}>
                        Take Payment
                      </Button>
                    ) : null}

                    {ticket.tabId && ticket.tabStatus === "PAID" ? (
                      <Button
                        variant="outline"
                        className="mt-4 w-full border-destructive/40 text-destructive"
                        onClick={async () => {
                          try {
                            await closeTab(ticket.tabId);
                            loadTickets();
                          } catch (e) {
                             setError(e?.message || "Cannot close tab while requests are open");
                          }
                        }}
                      >
                        Close Tab
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
