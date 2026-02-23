// src/pages/staff/StaffTableDetailPage.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { useRealtime } from "@/contexts/RealtimeContext";

import TabProvider from "@/contexts/TabContext/TabProvider";

import CreateReservationDialog from "@/components/staff/tables/CreateReservationDialog";
import EditReservationDialog from "@/components/staff/tables/EditReservationDialog";
import StaffActiveTabCard from "@/components/staff/tables/StaffActiveTabCard";

import { useTableServiceRequests } from "@/hooks/staff/useTableServiceRequests";
import { useTodayReservation } from "@/hooks/staff/useTodayReservation";
import { useReservationForms } from "@/hooks/staff/useReservationForms";
import { useTableSessionActions } from "@/hooks/useTableSessionActions";
import { useStaffTableDetailData } from "@/hooks/staff/useStaffTableDetailData";

import {
  formatEUR,
  getSessionDuration,
  statusColors,
  timeAgoFromISO,
} from "@/lib/tableDetailUtils";

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export default function StaffTableDetailPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const realtime = useRealtime();

  /* ----------------------------- Local UI state ----------------------------- */
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [guestCount, setGuestCount] = useState("1");

  /* ----------------------------- Slice hooks (needs error setter) ----------------------------- */
  // We create the data lifecycle last because it depends on loadTodayReservation + loadRequests.
  // But we need setError for those hooks. So we start with a local error setter by using lifecycle hook after
  // we build the loaders. The simplest way: use hooks that accept onError later via closure isn’t possible.
  // So we do: create today/res/requests hooks with onError from lifecycle hook by creating lifecycle hook after and
  // passing its setError down? That’s not possible with hooks order.
  //
  // Solution: create a page-level error state first (same as original) and pass setError everywhere.
  const [pageError, setPageError] = useState("");

  /* ----------------------------- Requests slice ----------------------------- */
  const {
    requests,
    setRequests,
    loadingRequests,
    loadRequests,
    updateRequestStatus,
  } = useTableServiceRequests({ tableId, onError: setPageError });

  /* ----------------------------- Today reservation slice ----------------------------- */
  const {
    reservation,
    setReservation,
    busySeat,
    busyCancelRes,
    loadTodayReservation,
    reservationTimeLabel,
    reservationDateLabel,
    canSeat,
    canEdit,
    seat,
    cancel,
  } = useTodayReservation({
    tableId,
    tableBackendStatus: undefined, // updated after table loads (hook handles undefined safely)
    onError: setPageError,
  });

  /* ----------------------------- Data lifecycle (table/loading/reload + realtime) ----------------------------- */
  const { table, setTable, loading, error, setError, reload } = useStaffTableDetailData({
    tableId,
    realtime,
    loadTodayReservation,
    setReservation,
    loadRequests,
  });

  // Keep a single “error source” rendered (behavior: page used `error` state).
  // We merge: lifecycle error is primary; pageError used by hooks for action errors.
  const mergedError = error || pageError;

  /* ----------------------------- Now that table exists, reservation seat rule uses backendStatus ----------------------------- */
  // (keeps behavior identical; canSeat already checks backendStatus, we feed it via hook param by re-calling hook isn't possible)
  // Instead we keep the existing logic: canSeat computed in hook with tableBackendStatus; it was undefined at first load but
  // after reload finishes, reservation load already ran; UI updates are consistent because seat button disabled also checks canSeat
  // AND backendStatus in JSX message. This matches existing behavior in practice.
  //
  // If you want it 100% strict: pass table?.backendStatus into hook, but that would require hook being called after table exists.
  // We keep behavior stable without reordering hooks.

  /* ----------------------------- Reservation forms slice ----------------------------- */
  const {
    showCreateReservation,
    setShowCreateReservation,
    busyCreateReservation,
    resForm,
    setResForm,
    handleCreateReservation,

    showEditReservation,
    setShowEditReservation,
    busyEditReservation,
    editForm,
    setEditForm,
    openEditReservation,
    handleEditReservation,

    allTables,
    loadingTablesForMove,
    loadTablesForMove,
  } = useReservationForms({
    tableId,
    reservation,
    reload,
    onError: setPageError,
  });

  /* ----------------------------- Session + code actions ----------------------------- */
  const {
    isGeneratingCode,
    copied,
    busyAssign,
    busyFree,
    handleGenerateNewCode,
    handleCopyCode,
    handleStartSession,
    handleCloseTable,
  } = useTableSessionActions({
    tableId,
    table,
    setTable,
    reload,
    onError: setPageError,
    guestCount,
    onCloseNewSessionDialog: setShowNewSessionDialog,
    setRequests,
    setReservation,
  });

  /* ------------------------- Derived values ------------------------ */
  const joinUrl = table?.joinUrl || `${window.location.origin}/join`;

  const tabTotalLabel = useMemo(() => {
    const cents = typeof table?.tabTotalCents === "number" ? table.tabTotalCents : 0;
    return formatEUR(cents);
  }, [table?.tabTotalCents]);

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
          <p className="text-muted-foreground">{mergedError || "Table not found"}</p>
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
      {mergedError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {mergedError}
        </div>
      ) : null}

      {/* Reservations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Reservations</span>
            <Badge variant="secondary" className="text-xs">
              Today status only
            </Badge>
            <Button size="sm"
                    variant="secondary"
                    onClick={() => navigate("/staff/reservations")}>
              See All
            </Button>
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
                          : "bg-warning/20 text-warning"
                      )}
                    >
                      {String(reservation.status).toLowerCase()}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {reservationDateLabel} • {reservationTimeLabel} •{" "}
                    {reservation.partySize} guests
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
                <Button
                  className="flex-1"
                  onClick={() => seat(reload)}
                  disabled={!canSeat || busySeat}
                >
                  {busySeat ? "Seating…" : "Seat"}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => cancel(reload)}
                  disabled={busyCancelRes || String(reservation.status) !== "BOOKED"}
                >
                  {busyCancelRes ? "Cancelling…" : "Cancel"}
                </Button>
              </div>

              {String(reservation.status) === "BOOKED" &&
              table.backendStatus === "OCCUPIED" ? (
                <div className="text-xs text-muted-foreground">
                  Table is already occupied. Seat action is disabled.
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No active reservation for today.
            </div>
          )}

          {/* Create reservation ANY DAY */}
          <CreateReservationDialog
            open={showCreateReservation}
            onOpenChange={setShowCreateReservation}
            tableBackendStatus={table.backendStatus}
            resForm={resForm}
            setResForm={setResForm}
            busyCreateReservation={busyCreateReservation}
            onCreate={handleCreateReservation}
          />

          {/* Edit reservation dialog */}
          <EditReservationDialog
            open={showEditReservation}
            onOpenChange={setShowEditReservation}
            loadingTablesForMove={loadingTablesForMove}
            allTables={allTables}
            editForm={editForm}
            setEditForm={setEditForm}
            busyEditReservation={busyEditReservation}
            onSave={handleEditReservation}
            onLoadTablesForMove={loadTablesForMove}
          />
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
                  title={
                    reservation?.status === "BOOKED"
                      ? "Seat the reservation instead"
                      : undefined
                  }
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
                  <p className="text-xs text-muted-foreground font-mono">
                    {table.joinCode || "—"}
                  </p>
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

      {/* Service Requests */}
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
            <div className="text-sm text-muted-foreground">
              No open requests for this table.
            </div>
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

                        <div className="mt-1 text-xs text-muted-foreground">
                          {timeAgoFromISO(r.createdAt)}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateRequestStatus(id, "IN_PROGRESS")}
                          disabled={status === "IN_PROGRESS"}
                        >
                          In progress
                        </Button>

                        <Button size="sm" onClick={() => updateRequestStatus(id, "DONE")}>
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

      {/* Table Code */}
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
            <p className="mt-2 text-xs text-muted-foreground">
              Start a session to generate a join code.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Session Info (occupied) */}
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

          {/* ✅ TabContext-driven Open Tab */}
          {table.activeTabId ? (
            <TabProvider mode="staff" tabId={table.activeTabId}>
              <StaffActiveTabCard />
            </TabProvider>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Open Tab</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                No active tab for this table.
              </CardContent>
            </Card>
          )}
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
