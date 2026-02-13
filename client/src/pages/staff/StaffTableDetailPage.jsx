import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Receipt,
  UserPlus,
  X,
  Download,
  Bell,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  getTableById,
  assignTable,
  freeTable,
  regenerateTableCode,
  fetchTables,
} from "@/api/staffTableApi";
import { getTabForStaff } from "@/api/staffTabApi";

// ✅ services
import { fetchServiceRequests, updateServiceRequest } from "@/api/servicesApi";

// ✅ reservations
import {
  fetchReservations,
  seatReservation,
  cancelReservation,
  createReservation,
  updateReservation,
} from "@/api/staffReservationApi";

import { useRealtime } from "@/contexts/RealtimeContext";

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

const statusColors = {
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

function getSessionDuration(date) {
  if (!date) return "—";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function timeAgoFromISO(iso) {
  if (!iso) return "—";
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1m ago";
  return `${minutes}m ago`;
}

function toUiStatus({ backendStatus, reservationStatus }) {
  // backendStatus: FREE | OCCUPIED | RESERVED
  // reservationStatus: BOOKED | SEATED | null
  if (backendStatus === "OCCUPIED" || reservationStatus === "SEATED") return "occupied";
  // IMPORTANT: your product decision: "Reserved" means reserved for TODAY only
  if (reservationStatus === "BOOKED") return "reserved";
  return "available";
}

function normalizeTable(payload, reservation) {
  const t = payload?.table ?? payload;

  const activeTabObj =
    t?.activeTab && typeof t.activeTab === "object" ? t.activeTab : null;

  const backendStatus = t.status;
  const reservationStatus = reservation?.status ?? null;

  return {
    id: String(t.id || t._id),
    number: t.number,
    name: `Table ${String(t.number).padStart(2, "0")}`,
    status: toUiStatus({ backendStatus, reservationStatus }),
    backendStatus,
    assignedAt: t.assignedAt ? new Date(t.assignedAt) : null,
    guestCount: typeof t.guestCount === "number" ? t.guestCount : undefined,
    joinCode: t.joinCode ?? null,
    joinCodeExpiresAt: t.joinCodeExpiresAt ? new Date(t.joinCodeExpiresAt) : null,
    joinUrl: t.joinUrl ?? null,
    activeTabId: activeTabObj?.id || activeTabObj?._id || null,
    tabTotalCents: activeTabObj?.totalCents ?? 0,
    maxCapacity: t.maxCapacity ?? 6,
  };
}

function normalizeTab(tabData) {
  const tab = tabData?.tab ?? tabData;
  const items = Array.isArray(tab?.items) ? tab.items : [];

  return {
    tabItems: items.map((it, idx) => ({
      id: String(it.menuItemId || idx),
      name: it.nameSnap || "Item",
      quantity: it.qty ?? 1,
      priceCents: it.priceCentsSnap ?? 0,
      addedAt: it.addedAt ? new Date(it.addedAt) : new Date(),
    })),
    totalCents: tab?.totalCents ?? 0,
  };
}

function todayYMD() {
  // local date YYYY-MM-DD (matches listReservations?date=YYYY-MM-DD)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickActiveReservationForTable(reservations, tableId) {
  const now = new Date();

  // active statuses only (TODAY list already)
  const active = (reservations || []).filter((r) => {
    const status = String(r.status || "").toUpperCase();
    if (status !== "BOOKED" && status !== "SEATED") return false;

    const rid = String(r?.table?._id || r?.table?.id || r?.table || "");
    return rid === String(tableId);
  });

  // Priority:
  // 1) SEATED wins
  // 2) else earliest UPCOMING BOOKED (reservedFor >= now) wins
  // 3) else earliest BOOKED wins
  active.sort((a, b) => {
    const aSeated = a.status === "SEATED";
    const bSeated = b.status === "SEATED";
    if (aSeated !== bSeated) return aSeated ? -1 : 1;

    const aT = new Date(a.reservedFor).getTime();
    const bT = new Date(b.reservedFor).getTime();
    const aUpcoming = aT >= now.getTime();
    const bUpcoming = bT >= now.getTime();
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

    return aT - bT;
  });

  return active[0] || null;
}

function toLocalTimeHHMM(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toLocalDateYYYYMMDD(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildISOFromLocalDateTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD
  // timeStr: HH:MM
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(hh || 0, mm || 0, 0, 0);

  return dt.toISOString();
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export default function StaffTableDetailPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const realtime = useRealtime();

  /* ----------------------------- State ----------------------------- */
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [table, setTable] = useState(null);
  const [tab, setTab] = useState({ tabItems: [], totalCents: 0 });

  // ✅ requests
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // ✅ reservation local state (TODAY reservation pick)
  const [reservation, setReservation] = useState(null);
  const [busySeat, setBusySeat] = useState(false);
  const [busyCancelRes, setBusyCancelRes] = useState(false);

  // ✅ Create reservation (ANY DAY)
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const [busyCreateReservation, setBusyCreateReservation] = useState(false);
  const [resForm, setResForm] = useState({
    name: "",
    phone: "",
    partySize: "2",
    date: todayYMD(), // ✅ date picker (NOT only today)
    time: toLocalTimeHHMM(new Date()), // ✅ time picker
    notes: "",
  });

  // ✅ Edit reservation (only for BOOKED, any day, move table allowed)
  const [showEditReservation, setShowEditReservation] = useState(false);
  const [busyEditReservation, setBusyEditReservation] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: todayYMD(),
    time: toLocalTimeHHMM(new Date()),
    notes: "",
  });

  // ✅ table list for moving reservation
  const [allTables, setAllTables] = useState([]);
  const [loadingTablesForMove, setLoadingTablesForMove] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [guestCount, setGuestCount] = useState("1");

  const [busyAssign, setBusyAssign] = useState(false);
  const [busyFree, setBusyFree] = useState(false);

  /* --------------------------- Data load --------------------------- */

  const loadRequests = useCallback(async () => {
    if (!tableId) return;

    setLoadingRequests(true);
    try {
      const data = await fetchServiceRequests({ status: "ACTIVE" });
      const all = data?.requests ?? data?.items ?? [];

      const filtered = all.filter((r) => {
        const rid = String(r?.table?._id || r?.table?.id || r?.table || "");
        return rid && rid === String(tableId);
      });

      setRequests(filtered);
    } catch (e) {
      console.warn("Failed to load requests", e);
    } finally {
      setLoadingRequests(false);
    }
  }, [tableId]);

  const loadReservationForTableToday = useCallback(async () => {
    if (!tableId) return null;

    const date = todayYMD();
    const data = await fetchReservations(date);
    const all = data?.reservations ?? [];
    const active = pickActiveReservationForTable(all, tableId);

    setReservation(
      active
        ? {
            id: String(active._id || active.id),
            tableId: String(active?.table?._id || active?.table?.id || active?.table || tableId),
            name: active.name,
            phone: active.phone,
            partySize: active.partySize,
            reservedFor: active.reservedFor,
            status: active.status,
            notes: active.notes ?? "",
          }
        : null,
    );

    return active || null;
  }, [tableId]);

  const loadTablesForMove = useCallback(async () => {
    setLoadingTablesForMove(true);
    try {
      const data = await fetchTables();
      const list = data?.tables ?? [];
      // normalize minimal fields
      const mapped = list
        .map((t) => ({
          id: String(t.id || t._id),
          number: t.number,
          label: `Table ${String(t.number).padStart(2, "0")}`,
        }))
        .sort((a, b) => a.number - b.number);

      setAllTables(mapped);
    } catch (e) {
      console.warn("Failed to load tables list for moving reservation", e);
      setAllTables([]);
    } finally {
      setLoadingTablesForMove(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!tableId) return;

    setError("");
    try {
      setLoading(true);

      // ✅ load TODAY reservation first so we compute UI status consistently
      let activeRes = null;
      try {
        activeRes = await loadReservationForTableToday();
      } catch (e) {
        console.warn("Failed to load reservations", e);
        setReservation(null);
      }

      const data = await getTableById(tableId);
      const ui = normalizeTable(data, activeRes);
      setTable(ui);

      if (ui.activeTabId) {
        const tabData = await getTabForStaff(ui.activeTabId);
        setTab(normalizeTab(tabData));
      } else {
        setTab({ tabItems: [], totalCents: 0 });
      }

      await loadRequests();
    } catch (e) {
      setError(e?.message || "Failed to load table");
      setTable(null);
    } finally {
      setLoading(false);
    }
  }, [tableId, loadRequests, loadReservationForTableToday]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ✅ realtime wiring (context)
  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables: reload,
      reloadTickets: reload,
      reloadServices: loadRequests,
    });
    return () => realtime.unregisterStaff(id);
  }, [realtime, reload, loadRequests]);

  /* ------------------------- Derived values ------------------------ */

  const joinUrl = table?.joinUrl || `${window.location.origin}/join`;

  const tabTotalLabel = useMemo(() => {
    const cents =
      typeof tab.totalCents === "number" && tab.totalCents > 0
        ? tab.totalCents
        : table?.tabTotalCents;

    return formatEUR(cents || 0);
  }, [tab.totalCents, table?.tabTotalCents]);

  const reservationTimeLabel = useMemo(() => {
    if (!reservation?.reservedFor) return "—";
    return new Date(reservation.reservedFor).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [reservation?.reservedFor]);

  const reservationDateLabel = useMemo(() => {
    if (!reservation?.reservedFor) return "—";
    return new Date(reservation.reservedFor).toLocaleDateString("de-DE");
  }, [reservation?.reservedFor]);

  const canSeat = useMemo(() => {
    if (!reservation) return false;
    if (String(reservation.status) !== "BOOKED") return false;
    // seatReservation will reject if table already OCCUPIED, so disable client-side too:
    if (table?.backendStatus === "OCCUPIED") return false;
    return true;
  }, [reservation, table?.backendStatus]);

  const canEdit = useMemo(() => {
    // backend recommended: edit only BOOKED
    return !!reservation && String(reservation.status) === "BOOKED";
  }, [reservation]);

  /* ---------------------------- Handlers --------------------------- */

  const handleGenerateNewCode = async () => {
    if (!tableId) return;

    setIsGeneratingCode(true);
    setError("");

    try {
      const data = await regenerateTableCode(tableId);

      setTable((prev) =>
        prev
          ? {
              ...prev,
              joinCode: data?.code || prev.joinCode,
              joinCodeExpiresAt: data?.joinCodeExpiresAt
                ? new Date(data.joinCodeExpiresAt)
                : prev.joinCodeExpiresAt,
            }
          : prev,
      );

      toast.success("New code generated");
    } catch (e) {
      setError(e?.message || "Failed to generate new code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!table?.joinCode) {
      toast.error("No code yet. Start a session first.");
      return;
    }
    await navigator.clipboard.writeText(table.joinCode);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSession = async () => {
    setBusyAssign(true);
    setError("");

    try {
      const maxCap = table?.maxCapacity || 6;
      const guests = Math.max(1, Math.min(Number(guestCount) || 1, maxCap));

      const data = await assignTable(tableId, { guestCount: guests });

      toast.success("Session started");

      setTable((prev) =>
        prev
          ? {
              ...prev,
              status: "occupied",
              assignedAt: new Date(),
              guestCount: guests,
              joinCode: data?.code || prev.joinCode,
              joinUrl: data?.joinUrl || prev.joinUrl,
              activeTabId: data?.tab?._id || data?.tab?.id || prev.activeTabId,
            }
          : prev,
      );

      const tabId = data?.tab?._id || data?.tab?.id;
      if (tabId) {
        const tabData = await getTabForStaff(tabId);
        setTab(normalizeTab(tabData));
      }

      setShowNewSessionDialog(false);
      await reload();
    } catch (e) {
      setError(e?.message || "Failed to start session");
    } finally {
      setBusyAssign(false);
    }
  };

  const handleSeatReservation = async () => {
    if (!reservation?.id) return;

    setBusySeat(true);
    setError("");
    try {
      await seatReservation(reservation.id);
      toast.success("Reservation seated");
      await reload();
    } catch (e) {
      setError(e?.message || "Failed to seat reservation");
    } finally {
      setBusySeat(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation?.id) return;

    setBusyCancelRes(true);
    setError("");
    try {
      await cancelReservation(reservation.id);
      toast.success("Reservation cancelled");
      await reload();
    } catch (e) {
      setError(e?.message || "Failed to cancel reservation");
    } finally {
      setBusyCancelRes(false);
    }
  };

  const handleCreateReservation = async () => {
    setError("");
    if (!tableId) return;

    const partySizeNum = Number(resForm.partySize);
    if (
      !resForm.name.trim() ||
      !resForm.phone.trim() ||
      !partySizeNum ||
      !resForm.date ||
      !resForm.time
    ) {
      toast.error("Fill name, phone, party size, date, and time");
      return;
    }

    setBusyCreateReservation(true);
    try {
      const reservedForISO = buildISOFromLocalDateTime(resForm.date, resForm.time);

      await createReservation({
        tableId, // may be occupied: allowed (your choice 4.B)
        name: resForm.name.trim(),
        phone: resForm.phone.trim(),
        partySize: partySizeNum,
        reservedFor: reservedForISO,
        notes: resForm.notes?.trim() || "",
      });

      toast.success("Reservation created");
      setShowCreateReservation(false);
      setResForm({
        name: "",
        phone: "",
        partySize: "2",
        date: todayYMD(),
        time: toLocalTimeHHMM(new Date()),
        notes: "",
      });

      // if created for TODAY for this table, it'll show + mark reserved
      await reload();
    } catch (e) {
      setError(e?.message || "Failed to create reservation");
    } finally {
      setBusyCreateReservation(false);
    }
  };

  const openEditReservation = async () => {
    if (!reservation) return;

    // Load tables only when needed
    if (!allTables.length) {
      await loadTablesForMove();
    }

    setEditForm({
      id: reservation.id,
      tableId: reservation.tableId || tableId,
      name: reservation.name || "",
      phone: reservation.phone || "",
      partySize: String(reservation.partySize ?? "2"),
      date: toLocalDateYYYYMMDD(reservation.reservedFor),
      time: toLocalTimeHHMM(reservation.reservedFor),
      notes: reservation.notes || "",
    });

    setShowEditReservation(true);
  };

  const handleEditReservation = async () => {
    if (!editForm.id) return;

    const partySizeNum = Number(editForm.partySize);
    if (
      !editForm.name.trim() ||
      !editForm.phone.trim() ||
      !partySizeNum ||
      !editForm.date ||
      !editForm.time ||
      !editForm.tableId
    ) {
      toast.error("Fill name, phone, party size, table, date, and time");
      return;
    }

    setBusyEditReservation(true);
    setError("");
    try {
      const reservedForISO = buildISOFromLocalDateTime(editForm.date, editForm.time);

      await updateReservation(editForm.id, {
        tableId: editForm.tableId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        partySize: partySizeNum,
        reservedFor: reservedForISO,
        notes: editForm.notes ?? "",
      });

      toast.success("Reservation updated");
      setShowEditReservation(false);

      await reload();
    } catch (e) {
      setError(e?.message || "Failed to update reservation");
    } finally {
      setBusyEditReservation(false);
    }
  };

  const handleCloseTable = async () => {
    setBusyFree(true);
    setError("");
    try {
      await freeTable(tableId);

      setTable((prev) =>
        prev
          ? {
              ...prev,
              status: "available",
              assignedAt: null,
              activeTabId: null,
              tabTotalCents: 0,
              joinCode: null,
              joinCodeExpiresAt: null,
              joinUrl: null,
              guestCount: undefined,
            }
          : prev,
      );

      setTab({ tabItems: [], totalCents: 0 });
      setRequests([]);
      setReservation(null);

      toast.success("Table closed");
      await reload();
    } catch (e) {
      setError(e?.message || "Failed to close table");
    } finally {
      setBusyFree(false);
    }
  };

  async function handleRequestStatus(requestId, status) {
    setError("");
    try {
      await updateServiceRequest(requestId, { status });
      setRequests((prev) =>
        status === "DONE"
          ? prev.filter((r) => String(r._id || r.id) !== String(requestId))
          : prev.map((r) =>
              String(r._id || r.id) === String(requestId) ? { ...r, status } : r,
            ),
      );
      toast.success(status === "DONE" ? "Request done" : "Marked in progress");
    } catch (e) {
      setError(e?.message || "Failed to update request");
      loadRequests();
    }
  }

  /* --------------------------- Render guards ----------------------- */

  if (!tableId) {
    return (
      <div title="Table">
        <div className="p-6 text-sm text-muted-foreground">Missing table id.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div title="Loading…">
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div title="Table Not Found">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">{error || "Table not found"}</p>
          <Button onClick={() => navigate("/staff/tables")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tables
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ JSX ------------------------------ */

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/staff/tables")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{table.name}</h1>
          <Badge className={cn("capitalize mt-1", statusColors[table.status])}>
            {table.status}
          </Badge>
        </div>

        <Button variant="ghost" size="icon" onClick={reload} aria-label="Refresh">
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* ✅ Reservation (TODAY only status impact, but we allow creating/editing any day) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Reservations</span>
            <Badge variant="secondary" className="text-xs">
              Today status only
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {reservation ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{reservation.name}</div>
                    <Badge
                      className={cn(
                        "capitalize",
                        reservation.status === "SEATED"
                          ? "bg-primary/20 text-primary"
                          : "bg-warning/20 text-warning",
                      )}
                    >
                      {String(reservation.status).toLowerCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reservationDateLabel} • {reservationTimeLabel} • {reservation.partySize} guests
                  </div>
                  <div className="text-sm text-muted-foreground">{reservation.phone}</div>
                  {reservation.notes ? (
                    <div className="text-sm text-muted-foreground break-words mt-1">
                      {reservation.notes}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openEditReservation}
                    disabled={!canEdit}
                    title={!canEdit ? "Only BOOKED reservations can be edited" : undefined}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSeatReservation} disabled={!canSeat || busySeat}>
                  {busySeat ? "Seating…" : "Seat"}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelReservation}
                  disabled={busyCancelRes || String(reservation.status) !== "BOOKED"}
                >
                  {busyCancelRes ? "Cancelling…" : "Cancel"}
                </Button>
              </div>

              {String(reservation.status) === "BOOKED" && table.backendStatus === "OCCUPIED" ? (
                <div className="text-xs text-muted-foreground">
                  Table is already occupied. Seat action is disabled.
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No active reservation for today.</div>
          )}

          {/* Create reservation ANY DAY */}
          <Dialog open={showCreateReservation} onOpenChange={setShowCreateReservation}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Reservation (any day)
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reservation</DialogTitle>
                <DialogDescription>
                  Staff can reserve for any day (including when table is occupied).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={resForm.name}
                    onChange={(e) => setResForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={resForm.phone}
                    onChange={(e) => setResForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Party Size</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={resForm.partySize}
                      onChange={(e) => setResForm((p) => ({ ...p, partySize: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={resForm.date}
                      onChange={(e) => setResForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Time</label>
                  <input
                    type="time"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={resForm.time}
                    onChange={(e) => setResForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={resForm.notes}
                    onChange={(e) => setResForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>

                {table.backendStatus === "OCCUPIED" ? (
                  <div className="text-xs text-muted-foreground">
                    Note: This table is currently occupied. You can still book for later today or future days.
                    Reservation time is what matters.
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateReservation(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReservation} disabled={busyCreateReservation}>
                  {busyCreateReservation ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit reservation dialog */}
          <Dialog
            open={showEditReservation}
            onOpenChange={(open) => {
              setShowEditReservation(open);
              if (open) loadTablesForMove();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Reservation</DialogTitle>
                <DialogDescription>Move table, adjust time/date, or edit guest details.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Table</label>
                  <Select
                    value={editForm.tableId}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, tableId: v }))}
                    disabled={loadingTablesForMove}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTablesForMove ? "Loading tables…" : "Select a table"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allTables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Party Size</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editForm.partySize}
                      onChange={(e) => setEditForm((p) => ({ ...p, partySize: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editForm.date}
                      onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Time</label>
                  <input
                    type="time"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={editForm.time}
                    onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditReservation(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditReservation} disabled={busyEditReservation}>
                  {busyEditReservation ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {table.status === "available" ? (
          <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
            <DialogTrigger asChild>
              <Button className="h-auto py-4 flex-col gap-2">
                <UserPlus className="w-5 h-5" />
                <span>Start Session</span>
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Session</DialogTitle>
                <DialogDescription>Open {table.name} for guests</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Guests</label>
                  <Select value={guestCount} onValueChange={setGuestCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(table.maxCapacity)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} {i === 0 ? "guest" : "guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {reservation?.status === "BOOKED" ? (
                  <div className="text-xs text-muted-foreground">
                    This table has a booked reservation today. Consider using “Seat” instead.
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartSession}
                  disabled={busyAssign || reservation?.status === "BOOKED"}
                  title={reservation?.status === "BOOKED" ? "Seat the reservation instead" : undefined}
                >
                  {busyAssign ? "Starting…" : "Start Session"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="destructive"
            className="h-auto py-4 flex-col gap-2"
            onClick={handleCloseTable}
            disabled={busyFree}
          >
            <X className="w-5 h-5" />
            <span>{busyFree ? "Closing…" : "Close Table"}</span>
          </Button>
        )}

        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <QrCode className="w-5 h-5" />
              <span>Show QR</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Table QR Code</DialogTitle>
              <DialogDescription>Guests can scan this to join {table.name}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border-2 border-border">
                <div className="text-center space-y-2">
                  <QrCode className="w-24 h-24 mx-auto text-foreground" />
                  <p className="text-xs text-muted-foreground font-mono">{table.joinCode || "—"}</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Join URL:</p>
                <p className="text-xs text-muted-foreground break-all">{joinUrl}</p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.message("QR download placeholder");
                  setShowQRDialog(false);
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(joinUrl);
                  toast.success("URL copied");
                }}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ Service Requests Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Requests
            </span>
            <Button variant="ghost" size="sm" onClick={loadRequests}>
              <RefreshCw className={cn("w-4 h-4 mr-1", loadingRequests && "animate-spin")} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loadingRequests ? (
            <div className="text-sm text-muted-foreground">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No open requests for this table.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((r, idx) => {
                const id = r._id || r.id;
                const status = String(r.status || "OPEN").toUpperCase();
                const type = String(r.type || "REQUEST").toUpperCase();
                const note = r.note || "";

                return (
                  <div key={id || idx} className="rounded-xl border border-border/50 bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {type}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {status}
                          </Badge>
                        </div>

                        {note ? (
                          <div className="text-sm text-muted-foreground break-words">{note}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No note</div>
                        )}

                        <div className="mt-1 text-xs text-muted-foreground">{timeAgoFromISO(r.createdAt)}</div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRequestStatus(id, "IN_PROGRESS")}
                          disabled={status === "IN_PROGRESS"}
                        >
                          In progress
                        </Button>

                        <Button size="sm" onClick={() => handleRequestStatus(id, "DONE")}>
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Code Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Table Code</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyCode} disabled={!table.joinCode}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateNewCode}
                disabled={isGeneratingCode || table.status !== "occupied"}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", isGeneratingCode && "animate-spin")} />
                Regenerate
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-2xl font-bold tracking-widest text-center">
              {table.joinCode || "—"}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyCode} disabled={!table.joinCode}>
              {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
          {table.status !== "occupied" ? (
            <p className="mt-2 text-xs text-muted-foreground">Start a session to generate a join code.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Session Info (if occupied) */}
      {table.status === "occupied" ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold">{table.guestCount ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold">{getSessionDuration(table.assignedAt)}</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold">{tabTotalLabel}</p>
                  <p className="text-xs text-muted-foreground">Tab Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Open Tab
                <Badge variant="secondary">{tab.tabItems.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tab.tabItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No items yet</p>
              ) : (
                <div className="space-y-3">
                  {tab.tabItems.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {item.quantity}x {item.name}
                          </p>
                        </div>
                        <p className="font-semibold">{formatEUR(item.priceCents * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-semibold">Total</p>
                    <p className="text-xl font-bold">{tabTotalLabel}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Table Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Table Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Table ID</span>
            <span className="font-medium">{table.id}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Capacity</span>
            <span className="font-medium">{table.maxCapacity} guests</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Status</span>
            <Badge className={cn("capitalize", statusColors[table.status])}>{table.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
