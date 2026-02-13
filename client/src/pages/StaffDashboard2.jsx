import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

import {
  fetchTickets,
  updateTicket,
  updateTicketLine,
} from "../api/staffTicketApi";
import { fetchTables, assignTable } from "../api/staffTableApi";
import { fetchServiceRequests, updateServiceRequest } from "../api/servicesApi";
import { closeTab } from "../api/staffTabApi";

import { useRealtime } from "../contexts/RealtimeContext.jsx";

import {
  Bell,
  Check,
  Clock,
  RefreshCw,
  User,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* utils */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function timeAgoFromISO(iso) {
  if (!iso) return "";
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  return `${minutes} mins ago`;
}

function statusStyle(status) {
  const s = String(status || "NEW").toUpperCase();
  if (s === "DONE") {
    return {
      icon: Check,
      wrap: "border-emerald-500/20 bg-emerald-500/5",
      tile: "bg-emerald-500/15",
      iconColor: "text-emerald-600",
      label: "Done",
    };
  }
  if (s === "PREPARING") {
    return {
      icon: UtensilsCrossed,
      wrap: "border-yellow-500/20 bg-yellow-500/5",
      tile: "bg-yellow-500/15",
      iconColor: "text-yellow-700",
      label: "Preparing",
    };
  }
  return {
    icon: Bell,
    wrap: "border-primary/30 bg-primary/5",
    tile: "bg-primary/20",
    iconColor: "text-primary",
    label: "Pending",
  };
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const rt = useRealtime();

  const [tickets, setTickets] = useState([]);
  const [tables, setTables] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const [joinUrl, setJoinUrl] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [assignedTable, setAssignedTable] = useState(null);

  const [error, setError] = useState("");

  const [showDone, setShowDone] = useState(false);
  const [doneMinutes, setDoneMinutes] = useState(120);
  const [filter, setFilter] = useState("all");

  const loadTickets = useCallback(async () => {
    try {
      const params = showDone
        ? { includeDone: 1, doneMinutes }
        : { includeDone: 0 };
      const data = await fetchTickets(params);
      setTickets(data.tickets || []);
    } catch (e) {
      setError(e.message);
    }
  }, [showDone, doneMinutes]);

  const loadFreeTables = useCallback(async () => {
    try {
      const data = await fetchTables("FREE");
      setTables(data.tables || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadServiceRequests = useCallback(async () => {
    try {
      const data = await fetchServiceRequests({ status: "OPEN" });
      setServiceRequests(data.requests || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // initial load
  useEffect(() => {
    loadTickets();
    loadFreeTables();
    loadServiceRequests();
  }, [loadTickets, loadFreeTables, loadServiceRequests]);

  // register realtime handlers 
   useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: loadTickets,
      reloadServices: loadServiceRequests,
      reloadTables: loadFreeTables,
    });

    return () => rt.unregisterStaff(id);
  }, [rt, loadTickets, loadServiceRequests, loadFreeTables]);


  async function handleAssign(table) {
    setError("");
    try {
      const data = await assignTable(table.id);
      setJoinUrl(data.joinUrl);
      setJoinCode(data.code);
      setAssignedTable(data.table);
      loadFreeTables();
    } catch (e) {
      setError(e.message);
    }
  }

  async function setStatus(ticketId, status) {
    try {
      await updateTicket(ticketId, { status });
      loadTickets();
    } catch (e) {
      setError(e.message);
    }
  }

  async function setEta(ticketId, etaMinutes) {
    try {
      await updateTicket(ticketId, { etaMinutes });
      loadTickets();
    } catch (e) {
      setError(e.message);
    }
  }

  const pendingCount = useMemo(
    () => tickets.filter((t) => String(t.status || "").toUpperCase() !== "DONE").length,
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "done") return tickets.filter((t) => t.status === "DONE");
    if (filter === "preparing") return tickets.filter((t) => t.status === "PREPARING");
    return tickets.filter((t) => !["DONE", "PREPARING"].includes(t.status));
  }, [tickets, filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">Staff Dashboard</div>
              <div className="text-xs text-muted-foreground">Reception & Tickets</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" /> Staff
          </div>
        </div>
      </header> */}

      <main className="flex-1 flex flex-col">
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span className="font-semibold">Active Tickets</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={loadTickets}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error ? <div className="px-4 pt-3 text-sm text-destructive">{error}</div> : null}

        {/* Free tables + QR */}
        <div className="px-4 pt-4 grid gap-4 md:grid-cols-2">
          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Free Tables</h2>
              <Button variant="secondary" size="sm" onClick={loadFreeTables}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {tables.length === 0 ? (
              <div className="mt-3 text-sm text-muted-foreground">No free tables.</div>
            ) : (
              <div className="mt-4 space-y-2">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-3"
                  >
                    <div className="font-medium">Table {t.number}</div>
                    <Button size="sm" onClick={() => handleAssign(t)}>
                      Assign + QR
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">QR for Guests</h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <QrCode className="h-4 w-4" /> Invite
              </div>
            </div>

            {!joinUrl ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Assign a table to generate a QR invite.
              </div>
            ) : (
              <div className="mt-4">
                <div className="text-sm text-muted-foreground">
                  Assigned:{" "}
                  <span className="font-semibold text-foreground">
                    Table {assignedTable?.number}
                  </span>
                </div>

                <div className="mt-3 inline-block rounded-2xl border border-border/50 bg-background p-3">
                  <QRCodeCanvas value={joinUrl} size={220} />
                </div>

                <div className="mt-3 break-all text-xs text-muted-foreground">{joinUrl}</div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setJoinUrl("");
                    setAssignedTable(null);
                    setJoinCode("");
                  }}
                >
                  Clear QR
                </Button>
              </div>
            )}

            {joinCode && (
              <div className="mt-3 rounded-xl border border-border/50 bg-background p-3 text-center">
                <div className="text-sm text-muted-foreground">Or enter code</div>
                <div className="mt-1 text-2xl font-semibold tracking-widest">{joinCode}</div>
              </div>
            )}
          </div>
        </div>

        {/* Service Requests */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Service Requests</h2>
            <Button variant="secondary" size="sm" onClick={loadServiceRequests}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {serviceRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground">No open requests.</div>
            ) : (
              serviceRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-card p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      Table {r.table?.number ?? "?"} · {r.type}
                    </div>

                    {r.note ? (
                      <div className="text-sm text-muted-foreground break-words">{r.note}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No note</div>
                    )}

                    <div className="mt-1 text-xs text-muted-foreground">{timeAgoFromISO(r.createdAt)}</div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await updateServiceRequest(r.id, { status: "IN_PROGRESS" });
                          loadServiceRequests();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      In progress
                    </Button>

                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await updateServiceRequest(r.id, { status: "DONE" });
                          loadServiceRequests();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets */}
        <div className="px-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Tickets</h2>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showDone}
                  onChange={(e) => setShowDone(e.target.checked)}
                />
                Show completed
              </label>

              {showDone && (
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
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {["all", "pending", "preparing", "done"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Check className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm">No tickets in this view</p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const tabId = t.tab?._id || t.tab;
              const tabStatus = t.tab?.status;

              const st = statusStyle(t.status);
              const Icon = st.icon;

              return (
                <div key={t._id} className={cn("bg-card rounded-xl p-4 border shadow-soft transition-all", st.wrap)}>
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", st.tile)}>
                      <Icon className={cn("w-6 h-6", st.iconColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Table {t.tab?.table?.number ?? "?"}
                          </h3>
                          <p className="text-sm text-primary font-medium">
                            {st.label} · {t.station || "KITCHEN"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" />
                          {timeAgoFromISO(t.createdAt)}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {String(t.status).toUpperCase() !== "PREPARING" && (
                          <Button size="sm" variant="secondary" onClick={() => setStatus(t._id, "PREPARING")}>
                            Preparing
                          </Button>
                        )}

                        {String(t.status).toUpperCase() !== "DONE" && (
                          <Button size="sm" onClick={() => setStatus(t._id, "DONE")}>
                            <Check className="h-4 w-4" />
                            Done
                          </Button>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        {(t.lines || []).map((l, idx) => (
                          <div
                            key={l._id || idx}
                            className="flex items-center justify-between gap-3 rounded-lg bg-secondary/30 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-foreground">
                                {l.nameSnap} {l.qty > 1 ? `×${l.qty}` : ""}
                                <span className="ml-2 text-xs text-muted-foreground">({l.status || "NEW"})</span>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 px-3"
                                disabled={!l._id || (l.status || "NEW") === "PREPARING"}
                                onClick={() => updateTicketLine(t._id, l._id, { status: "PREPARING" })}
                              >
                                Prep
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 px-3"
                                disabled={!l._id || (l.status || "NEW") === "DONE"}
                                onClick={() => updateTicketLine(t._id, l._id, { status: "DONE" })}
                              >
                                Done
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">ETA:</span>
                        {[5, 10, 15, 20].map((m) => (
                          <Button key={m} size="sm" variant="secondary" onClick={() => setEta(t._id, m)}>
                            {m}m
                          </Button>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => setEta(t._id, null)}>
                          Clear
                        </Button>
                      </div>

                      {tabStatus === "OPEN" && (
                        <Button className="mt-4 w-full" onClick={() => navigate(`/staff/pay/${tabId}`)}>
                          Take Payment
                        </Button>
                      )}

                      {tabStatus === "PAID" && (
                        <Button
                          variant="outline"
                          className="mt-4 w-full border-destructive/40 text-destructive"
                          onClick={() => closeTab(tabId)}
                        >
                          Close Tab
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
