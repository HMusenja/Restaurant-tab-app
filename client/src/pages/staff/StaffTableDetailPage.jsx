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
  Download,
  Bell,
  Pencil,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

function GlassCard({ className, ...props }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
        "border-border bg-card/85 shadow-sm",
        "dark:border-[hsl(40,20%,95%)/10%]",
        "dark:bg-[hsl(220,20%,6%)]/45",
        "dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  );
}

function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-foreground dark:text-[hsl(40,20%,95%)]">
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 dark:border-primary/25 dark:bg-primary/15">
            <Icon className="h-4 w-4 text-primary" />
          </span>
        ) : null}
        <span className="text-base font-semibold">{children}</span>
      </span>
      {right}
    </div>
  );
}

export default function StaffTableDetailPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const realtime = useRealtime();

  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showCloseWarningDialog, setShowCloseWarningDialog] = useState(false);
  const [guestCount, setGuestCount] = useState("1");
  const [pageError, setPageError] = useState("");

  const {
    requests,
    setRequests,
    loadingRequests,
    loadRequests,
    updateRequestStatus,
  } = useTableServiceRequests({ tableId, onError: setPageError });

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
    tableBackendStatus: undefined,
    onError: setPageError,
  });

  const { table, setTable, loading, error, reload } = useStaffTableDetailData({
    tableId,
    realtime,
    loadTodayReservation,
    setReservation,
    loadRequests,
  });

  const mergedError = error || pageError;

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

  const {
    isGeneratingCode,
    copied,
    busyAssign,
    busyFree,
    handleGenerateNewCode,
    handleCopyCode,
    handleStartSession,
    handleCloseTable,
    handleForceCloseTable,
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

  const joinUrl = table?.joinUrl || `${window.location.origin}/join`;

  const tabTotalLabel = useMemo(() => {
    const cents =
      typeof table?.tabTotalCents === "number" ? table.tabTotalCents : 0;
    return formatEUR(cents);
  }, [table?.tabTotalCents]);

  const tableStatus = String(table?.status || "").toUpperCase();
  const isTableFree = tableStatus === "FREE" || tableStatus === "AVAILABLE";
  const isTableOccupied = tableStatus === "OCCUPIED";

  const activeTabId = table?.activeTab?.id || table?.activeTabId || null;

  const activeTabStatus = String(
    table?.activeTab?.status ||
      table?.activeTabStatus ||
      table?.tabStatus ||
      ""
  ).toUpperCase();

  const hasActiveTab = Boolean(activeTabId);

  const requiresPaymentFirst =
    hasActiveTab && (activeTabStatus === "OPEN" || activeTabStatus === "");

  function handlePrimaryCloseAction() {
    if (requiresPaymentFirst) {
      setShowCloseWarningDialog(true);
      return;
    }

    handleCloseTable();
  }

  async function handleCloseAnyway() {
    await handleForceCloseTable();
    setShowCloseWarningDialog(false);
  }

  function handleGoToPayment() {
    if (!activeTabId) {
      toast.error("Active tab not found.");
      return;
    }
    setShowCloseWarningDialog(false);
    navigate(`/staff/pay/${activeTabId}`);
    //  onClick={() => navigate(`/staff/pay/${tabId}`)}
  }

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
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <p className="text-muted-foreground">{mergedError || "Table not found"}</p>
          <Button onClick={() => navigate("/staff/tables")} className="rounded-2xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tables
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/staff/tables")}
            className="rounded-xl"
            aria-label="Back to tables"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.28em] text-primary/70">
              AfroAsiatique
            </div>

            <h1 className="truncate text-lg font-bold tracking-tight text-foreground dark:text-[hsl(40,20%,95%)] md:text-2xl">
              {table.name}
            </h1>

            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                  statusColors[table.status]
                )}
              >
                {table.status}
              </Badge>

              <span className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                Code:{" "}
                <span className="font-mono text-foreground dark:text-[hsl(40,20%,92%)]">
                  {table.joinCode || "—"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={reload}
          aria-label="Refresh"
          className="rounded-xl"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {mergedError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mergedError}
        </div>
      ) : null}

      <Dialog open={showCloseWarningDialog} onOpenChange={setShowCloseWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Open tab detected
            </DialogTitle>
            <DialogDescription>
              This table still has an open tab. You can go to payment first, or close the table anyway.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-foreground">
            <div className="font-medium">Current tab status: {activeTabStatus || "OPEN"}</div>
            <div className="mt-1 text-muted-foreground">
              Closing anyway will force-end the session and close the active tab.
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setShowCloseWarningDialog(false)}
              type="button"
            >
              Cancel
            </Button>

            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={handleGoToPayment}
              type="button"
            >
              Go to Payment
            </Button>

            <Button
              variant="destructive"
              className="rounded-2xl"
              onClick={handleCloseAnyway}
              disabled={busyFree}
              type="button"
            >
              {busyFree ? "Closing…" : "Close Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={UtensilsCrossed}
                right={
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-muted/40 border border-border text-muted-foreground text-[11px] dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]">
                      Today only
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-2xl"
                      onClick={() => navigate("/staff/reservations")}
                    >
                      See All
                    </Button>
                  </div>
                }
              >
                Reservations
              </SectionTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {reservation ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground dark:text-[hsl(40,20%,95%)] truncate">
                          {reservation.name}
                        </div>

                        <Badge
                          className={cn(
                            "capitalize rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            reservation.status === "SEATED"
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-warning/10 border-warning/20 text-warning"
                          )}
                        >
                          {String(reservation.status).toLowerCase()}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        {reservationDateLabel} • {reservationTimeLabel} • {reservation.partySize} guests
                      </div>

                      <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        {reservation.phone}
                      </div>

                      {reservation.notes ? (
                        <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)] break-words mt-1">
                          {reservation.notes}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-2xl"
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
                      className="flex-1 rounded-2xl"
                      onClick={() => seat(reload)}
                      disabled={!canSeat || busySeat}
                    >
                      {busySeat ? "Seating…" : "Seat"}
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      onClick={() => cancel(reload)}
                      disabled={busyCancelRes || String(reservation.status) !== "BOOKED"}
                    >
                      {busyCancelRes ? "Cancelling…" : "Cancel"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(40,20%,95%)/4%] dark:text-[hsl(40,10%,70%)]">
                  No active reservation for today.
                </div>
              )}

              <CreateReservationDialog
                open={showCreateReservation}
                onOpenChange={setShowCreateReservation}
                tableBackendStatus={table.backendStatus}
                resForm={resForm}
                setResForm={setResForm}
                busyCreateReservation={busyCreateReservation}
                onCreate={handleCreateReservation}
              />

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
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            {isTableFree ? (
              <Dialog
                open={showNewSessionDialog}
                onOpenChange={setShowNewSessionDialog}
              >
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-2xl w-full justify-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <UserPlus className="h-5 w-5" />
                    <span className="font-semibold">Start Session</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start New Session</DialogTitle>
                    <DialogDescription>
                      Open {table.name} for guests
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Number of Guests
                      </label>
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
                        This table has a booked reservation today. Consider
                        using “Seat” instead.
                      </div>
                    ) : null}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => setShowNewSessionDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="rounded-2xl"
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
                variant={requiresPaymentFirst ? "default" : "destructive"}
                className="h-auto py-4 flex-col gap-2 rounded-2xl"
                onClick={handlePrimaryCloseAction}
                disabled={busyFree}
                type="button"
              >
                <span>{busyFree ? "Closing…" : "Close Table"}</span>

                {requiresPaymentFirst ? (
                  <span className="text-xs opacity-80">
                    Open tab detected
                  </span>
                ) : null}
              </Button>
            )}

            <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 rounded-2xl border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] hover:bg-[hsl(40,20%,95%)/7%]"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Show QR</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Table QR Code</DialogTitle>
                  <DialogDescription>
                    Guests can scan this to join {table.name}
                  </DialogDescription>
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
                    <p className="text-xs text-muted-foreground break-all">
                      {joinUrl}
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.message("QR download placeholder");
                      setShowQRDialog(false);
                    }}
                    className="flex-1 rounded-2xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(joinUrl);
                      toast.success("URL copied");
                    }}
                    className="flex-1 rounded-2xl"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={Bell}
                right={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadRequests}
                    className="rounded-2xl text-foreground hover:bg-muted"
                  >
                    <RefreshCw
                      className={cn(
                        "w-4 h-4 mr-1",
                        loadingRequests && "animate-spin",
                      )}
                    />
                    Refresh
                  </Button>
                }
              >
                Requests
              </SectionTitle>
            </CardHeader>

            <CardContent>
              {loadingRequests ? (
                <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                  Loading requests…
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] p-4 text-sm text-[hsl(40,10%,70%)]">
                  No open requests for this table.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r, idx) => {
                    const id = r._id || r.id;
                    const status = String(r.status || "OPEN").toUpperCase();
                    const type = String(r.type || "REQUEST").toUpperCase();
                    const note = r.note || "";

                    const statusPill =
                      status === "DONE"
                        ? "bg-success/10 border-success/20 text-success"
                        : status === "IN_PROGRESS"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-warning/10 border-warning/20 text-warning";

                    return (
                      <div
                        key={id || idx}
                        className="rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-[hsl(40,20%,95%)]">
                              {type}
                              <span
                                className={cn(
                                  "ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                  statusPill,
                                )}
                              >
                                {status}
                              </span>
                            </div>

                            {note ? (
                              <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)] break-words">
                                {note}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                                No note
                              </div>
                            )}

                            <div className="mt-1 text-xs text-[hsl(40,10%,55%)]">
                              {timeAgoFromISO(r.createdAt)}
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-2xl"
                              onClick={() => updateRequestStatus(id, "IN_PROGRESS")}
                              disabled={status === "IN_PROGRESS"}
                            >
                              In progress
                            </Button>

                            <Button
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => updateRequestStatus(id, "DONE")}
                            >
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
          </GlassCard>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[4.5rem] self-start">
          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle
                icon={QrCode}
                right={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-2xl text-foreground hover:bg-muted"
                      onClick={handleCopyCode}
                      disabled={!table.joinCode}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-2xl text-foreground hover:bg-muted"
                      onClick={handleGenerateNewCode}
                      disabled={isGeneratingCode || !isTableOccupied}
                    >
                      <RefreshCw
                        className={cn(
                          "w-4 h-4 mr-1",
                          isGeneratingCode && "animate-spin",
                        )}
                      />
                      Regen
                    </Button>
                  </div>
                }
              >
                Table Code
              </SectionTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] px-4 py-3 font-mono text-2xl font-bold tracking-widest text-center text-[hsl(40,20%,95%)]">
                  {table.joinCode || "—"}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-2xl border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] hover:bg-[hsl(40,20%,95%)/7%]"
                  onClick={handleCopyCode}
                  disabled={!table.joinCode}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {!isTableOccupied ? (
                <p className="mt-2 text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                  Start a session to generate a join code.
                </p>
              ) : null}
            </CardContent>
          </GlassCard>

          {isTableOccupied ? (
            <>
              <GlassCard>
                <CardHeader className="pb-3">
                  <SectionTitle icon={Receipt}>Current Session</SectionTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="min-w-0 space-y-1 rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] p-3">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="kpi-value font-bold text-[hsl(40,20%,95%)]">
                        {table.guestCount ?? "—"}
                      </p>
                      <p className="kpi-label text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        Guests
                      </p>
                    </div>

                    <div className="min-w-0 space-y-1 rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] p-3">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="kpi-value font-bold text-[hsl(40,20%,95%)]">
                        {getSessionDuration(table.assignedAt)}
                      </p>
                      <p className="kpi-label text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        Duration
                      </p>
                    </div>

                    <div className="min-w-0 space-y-1 rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%] bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] p-3">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <p
                        className={cn(
                          "kpi-value font-bold text-[hsl(40,20%,95%)]",
                          "max-w-full",
                        )}
                        title={String(tabTotalLabel || "")}
                      >
                        {tabTotalLabel}
                      </p>
                      <p className="kpi-label text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                        Total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>

              {activeTabId ? (
                <TabProvider mode="staff" tabId={activeTabId}>
                  <StaffActiveTabCard />
                </TabProvider>
              ) : (
                <GlassCard>
                  <CardHeader className="pb-3">
                    <SectionTitle icon={Receipt}>Open Tab</SectionTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                    No active tab for this table.
                  </CardContent>
                </GlassCard>
              )}
            </>
          ) : null}

          <GlassCard>
            <CardHeader className="pb-3">
              <SectionTitle icon={UtensilsCrossed}>
                Table Information
              </SectionTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                  Table ID
                </span>
                <span className="font-medium text-[hsl(40,20%,95%)] break-all">
                  {table.id}
                </span>
              </div>
              <Separator className="bg-[hsl(40,20%,95%)/10%]" />
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                  Max Capacity
                </span>
                <span className="font-medium text-[hsl(40,20%,95%)]">
                  {table.maxCapacity} guests
                </span>
              </div>
              <Separator className="bg-[hsl(40,20%,95%)/10%]" />
              <div className="flex justify-between items-center gap-3">
                <span className="text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                  Current Status
                </span>
                <Badge
                  className={cn(
                    "capitalize rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    statusColors[table.status],
                  )}
                >
                  {table.status}
                </Badge>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}