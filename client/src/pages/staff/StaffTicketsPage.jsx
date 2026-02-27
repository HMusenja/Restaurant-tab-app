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

// backend: NEW | PREPARING | DONE
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
    raw: t,
  };
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap border",
        active
          ? "bg-primary/20 text-[hsl(40,20%,95%)] border-primary/25"
          : "bg-[hsl(40,20%,95%)/4%] text-[hsl(40,10%,70%)] border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/6%]",
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

  const [filter, setFilter] = useState("all"); // all | pending | preparing | done
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

  const setStatus = useCallback(
    async (ticketId, backendStatus) => {
      setError("");
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
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, etaMinutes } : t)),
        );
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
              items: t.items.map((it) =>
                it.id === lineId ? { ...it, lineStatus: backendStatus } : it,
              ),
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs tracking-[0.28em] uppercase text-primary/70">
            AfroAsiatique
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[hsl(40,20%,95%)]">
              Kitchen Tickets
            </h2>
            {pendingCount > 0 ? (
              <Badge className="rounded-full bg-primary/10 border border-primary/20 text-primary/80">
                {pendingCount}
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 text-xs text-[hsl(40,10%,60%)]">
            Start prep, mark items, and close tabs when paid
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={loadTickets}
          className="rounded-2xl text-[hsl(40,20%,92%)] hover:bg-[hsl(40,20%,95%)/8%]"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-1", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-between gap-3">
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

        <div className="flex flex-col items-center gap-3">
          {/* <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-[hsl(40,10%,70%)]">
              Show Completed
            </span>
            <button
              onClick={() => setShowDone((prev) => !prev)}
              className={cn(
                "relative inline-flex h-3 w-7 items-center rounded-full transition-colors duration-300 border",
                showDone ? "bg-primary" : "bg-[hsl(40,20%,95%)/10%]",
              )}
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-300",
                  showDone ? "translate-x-4" : "translate-x-1",
                )}
              />
            </button>
          </div> */}
          <div className="flex items-center justify-between sm:justify-start gap-3 rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-3 py-2 w-full sm:w-auto">
            <Switch
              checked={showDone}
              onCheckedChange={(value) => setShowDone(value)}
            />
            <span className="text-sm text-[hsl(40,10%,70%)]">
              Show Completed
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              showDone ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <Timer className="h-4 w-4 text-primary/80" />
            <select
              value={doneMinutes}
              onChange={(e) => setDoneMinutes(Number(e.target.value))}
              className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-3 py-2 text-sm text-[hsl(38,44%,7%)]"
            >
              <option value={30}>Last 30 min</option>
              <option value={60}>Last 1 hour</option>
              <option value={120}>Last 2 hours</option>
              <option value={360}>Last 6 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Tickets */}
      {loading ? (
        <div className="rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-4 py-6 text-sm text-[hsl(40,10%,60%)]">
          Loading…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] py-16 text-center">
              <Check className="w-14 h-14 mx-auto mb-3 opacity-40 text-primary" />
              <p className="text-lg font-semibold text-[hsl(40,20%,92%)]">
                No tickets in this view
              </p>
              <p className="text-sm text-[hsl(40,10%,60%)]">
                You’re all caught up
              </p>
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
                    "relative overflow-hidden rounded-2xl",
                    "border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl",
                    "shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
                    ticket.priority &&
                      ticket.status === "new" &&
                      "ring-2 ring-destructive/40",
                  )}
                >
                  <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2 text-[hsl(40,20%,95%)]">
                        {ticket.tableName}
                        {ticket.priority ? (
                          <Badge variant="destructive" className="text-xs">
                            Priority
                          </Badge>
                        ) : null}
                      </CardTitle>

                      <div className="flex items-center gap-1 text-xs text-[hsl(40,10%,60%)]">
                        <Clock className="w-3 h-3" />
                        {timeAgoFromISO(ticket.createdAtISO)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
                          statusConfig[ticket.status]?.color,
                        )}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[ticket.status]?.label || "Unknown"}
                      </span>

                      {ticket.etaMinutes ? (
                        <Badge className="rounded-full bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)] text-xs">
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
                          className="flex items-start justify-between gap-2 rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(40,20%,95%)] truncate">
                              {item.quantity}x {item.name}
                              <span className="ml-2 text-xs text-[hsl(40,10%,60%)]">
                                ({item.lineStatus})
                              </span>
                            </div>
                            {item.notes ? (
                              <div className="text-xs text-[hsl(40,10%,60%)] truncate">
                                {item.notes}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3 rounded-xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
                              disabled={
                                !item.id || item.lineStatus === "PREPARING"
                              }
                              onClick={() =>
                                setLineStatus(ticket.id, item.id, "PREPARING")
                              }
                            >
                              Prep
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3 rounded-xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
                              disabled={!item.id || item.lineStatus === "DONE"}
                              onClick={() =>
                                setLineStatus(ticket.id, item.id, "DONE")
                              }
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Ticket status progression */}
                    {nextBackendStatus && actionLabel ? (
                      <Button
                        className="w-full mt-4 rounded-2xl"
                        onClick={() => setStatus(ticket.id, nextBackendStatus)}
                      >
                        {actionLabel}
                      </Button>
                    ) : null}

                    {/* ETA controls */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-[hsl(40,10%,60%)]">
                        ETA:
                      </span>
                      {[5, 10, 15, 20].map((m) => (
                        <Button
                          key={m}
                          size="sm"
                          variant="secondary"
                          className="rounded-xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
                          onClick={() => setEta(ticket.id, m)}
                        >
                          {m}m
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl bg-[hsl(40,20%,95%)/6%] border border-[hsl(40,20%,95%)/10%] hover:bg-[hsl(40,20%,95%)/10%]"
                        onClick={() => setEta(ticket.id, null)}
                      >
                        Clear
                      </Button>
                    </div>

                    {/* Payment logic (unchanged) */}
                    {ticket.tabId && ticket.tabStatus === "OPEN" ? (
                      <Button
                        className="mt-4 w-full rounded-2xl"
                        onClick={() => navigate(`/staff/pay/${ticket.tabId}`)}
                      >
                        Take Payment
                      </Button>
                    ) : null}

                    {ticket.tabId && ticket.tabStatus === "PAID" ? (
                      <Button
                        variant="outline"
                        className="mt-4 w-full rounded-2xl border-destructive/40 text-destructive"
                        onClick={async () => {
                          try {
                            await closeTab(ticket.tabId);
                            loadTickets();
                          } catch (e) {
                            setError(
                              e?.message ||
                                "Cannot close tab while requests are open",
                            );
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
