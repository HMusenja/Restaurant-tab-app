// src/pages/staff/ManageReservationsPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  ArrowLeft,
  Plus,
  Search,
  CalendarDays,
  Clock,
  Users,
  Phone,
  Pencil,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useRealtime } from "@/contexts/RealtimeContext";
import { socket } from "@/realtime/socket";

import {
  useReservationsContext,
  RES_TYPES,
} from "@/contexts/reservations/ReservationsContext";
import {
  loadTables,
  loadReservationsByScope,
  createReservationAction,
  updateReservationAction,
  seatReservationAction,
  cancelReservationAction,
} from "@/contexts/reservations/reservations.actions";

import {
  SCOPE_OPTIONS,
  ymdLocal,
  addDaysYMD,
  roundToNext15Min,
  formatDate,
  formatTime,
  timeSignal,
  buildISOFromLocalDateTime,
  matchesSearch,
} from "@/hooks/useReservationsManager";

/* ------------------------------------------------------------------ */
/* UI helpers */
/* ------------------------------------------------------------------ */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function statusBadgeClass(status) {
  const s = String(status).toUpperCase();
  if (s === "SEATED") return "bg-primary/20 text-primary";
  if (s === "BOOKED") return "bg-warning/20 text-warning";
  if (s === "CANCELLED") return "bg-destructive/15 text-destructive";
  if (s === "NO_SHOW") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function timePillClass(kind) {
  if (kind === "upcoming") return "bg-warning/15 text-warning";
  if (kind === "late") return "bg-destructive/10 text-destructive";
  if (kind === "overdue") return "bg-destructive/15 text-destructive";
  return "hidden";
}

/* ------------------------------------------------------------------ */
/* Components */
/* ------------------------------------------------------------------ */

function PageHeader({ onBack, onRefresh, refreshing, onCreate }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <div className="flex-1">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <div className="text-sm text-muted-foreground">
          Manage bookings across all tables • Seat, edit, and cancel
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
        <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
      </Button>

      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        Create
      </Button>
    </div>
  );
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {error}
    </div>
  );
}

function StatsStrip({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
        <div className="text-xs text-muted-foreground">Booked</div>
        <div className="text-lg font-semibold text-warning">{stats.BOOKED}</div>
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <div className="text-xs text-muted-foreground">Seated</div>
        <div className="text-lg font-semibold text-primary">{stats.SEATED}</div>
      </div>
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
        <div className="text-xs text-muted-foreground">Cancelled</div>
        <div className="text-lg font-semibold text-destructive">
          {stats.CANCELLED}
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <div className="text-xs text-muted-foreground">No-show</div>
        <div className="text-lg font-semibold">{stats.NO_SHOW}</div>
      </div>
    </div>
  );
}

function StickyControls({
  selectedDate,
  setSelectedDate,
  scope,
  setScope,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statusChips = [],
  stats,
}) {
  return (
    <Card className="sticky top-2  border-border/60 bg-background/80 backdrop-blur">
      <CardContent className="p-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />

            <input
              type="date"
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={scope !== "day"}
              title={
                scope !== "day"
                  ? "Scope is a range — switch to Day to pick a date"
                  : undefined
              }
            />

            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={
                  selectedDate === ymdLocal() && scope === "day"
                    ? "default"
                    : "secondary"
                }
                onClick={() => {
                  setScope("day");
                  setSelectedDate(ymdLocal());
                }}
              >
                Today
              </Button>

              <Button
                size="sm"
                variant={
                  selectedDate === addDaysYMD(ymdLocal(), 1) && scope === "day"
                    ? "default"
                    : "secondary"
                }
                onClick={() => {
                  setScope("day");
                  setSelectedDate(addDaysYMD(ymdLocal(), 1));
                }}
              >
                Tomorrow
              </Button>

              <Button
                size="sm"
                variant={scope === "next7" ? "default" : "secondary"}
                onClick={() => setScope("next7")}
              >
                Next 7
              </Button>

              <Button
                size="sm"
                variant={scope === "next30" ? "default" : "secondary"}
                onClick={() => setScope("next30")}
              >
                Next 30
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                placeholder="Search by name, phone, table…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusChips.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <StatsStrip stats={stats} />
      </CardContent>
    </Card>
  );
}

function ReservationsList({
  loading,
  filtered,
  headerLabel,
  onRefresh,
  refreshing,
  renderRow,
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{headerLabel}</span>

          <Button size="sm" variant="ghost" onClick={onRefresh}>
            <RefreshCw
              className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading reservations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-sm text-muted-foreground">
            No reservations match your filters.
          </div>
        ) : (
          filtered.map(renderRow)
        )}
      </CardContent>
    </Card>
  );
}

function ReservationRow({
  r,
  selected,
  scope,
  occupiedTableIds,
  onSelect,
  onSeat,
  onEdit,
  onCancel,
}) {
  const tSig = timeSignal(r.reservedFor);
  const selectedRow = selected;

  const occupied = r.tableId && occupiedTableIds.has(r.tableId);
  const canSeat = r.status === "BOOKED" && !occupied;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full rounded-xl border px-3 py-3 transition outline-none",
        "cursor-pointer select-none",
        selectedRow
          ? "border-primary/50 bg-primary/5"
          : "border-border/60 hover:bg-muted/40",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {scope !== "day" ? (
              <Badge variant="secondary" className="text-xs">
                {formatDate(r.reservedFor)}
              </Badge>
            ) : null}

            <div className="text-base font-semibold tabular-nums">
              {formatTime(r.reservedFor)}
            </div>

            <Badge className={cn("capitalize", statusBadgeClass(r.status))}>
              {r.status.toLowerCase().replace("_", " ")}
            </Badge>

            <Badge variant="secondary" className="text-xs">
              {r.tableNumber != null
                ? `Table ${pad2(r.tableNumber)}`
                : "Table —"}
            </Badge>

            {tSig.kind !== "none" ? (
              <Badge className={cn("text-xs", timePillClass(tSig.kind))}>
                {tSig.label}
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-medium truncate">{r.name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {r.partySize}
            </span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {r.phone || "—"}
            </span>

            {r.notes ? (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="truncate">📝 Notes</span>
              </>
            ) : null}

            {occupied ? (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Table occupied
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSeat();
            }}
            disabled={!canSeat}
            title={
              !canSeat
                ? occupied
                  ? "Table occupied"
                  : "Only BOOKED can be seated"
                : "Seat"
            }
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Seat
          </Button>

          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            title="Cancel"
          >
            <XCircle className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  selected,
  editForm,
  setEditForm,
  tables,
  occupiedTableIds,
  loadingTables,
  scope,
  isDirty,
  busySave,
  onSave,
  onSeat,
  onAskCancel,
}) {
  if (!selected || !editForm) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Select a reservation to view details.
      </div>
    );
  }

  const occupied = selected.tableId && occupiedTableIds.has(selected.tableId);
  const tSig = timeSignal(selected.reservedFor);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {editForm.name || "Reservation"}
              </div>
              <Badge className={cn("capitalize", statusBadgeClass(selected.status))}>
                {selected.status.toLowerCase().replace("_", " ")}
              </Badge>
            </div>

            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {formatDate(selected.reservedFor)}
              </span>

              <span className="text-muted-foreground">•</span>

              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-4 h-4" />
                {formatTime(selected.reservedFor)}
              </span>

              <span className="text-muted-foreground">•</span>

              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                {selected.partySize}
              </span>

              {scope !== "day" ? (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="text-xs">
                    Range view
                  </Badge>
                </>
              ) : null}

              {tSig.kind !== "none" ? (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge className={cn("text-xs", timePillClass(tSig.kind))}>
                    {tSig.label}
                  </Badge>
                </>
              ) : null}
            </div>
          </div>

          <Badge variant="secondary" className="text-xs shrink-0">
            {selected.tableNumber != null ? `Table ${pad2(selected.tableNumber)}` : "Table —"}
          </Badge>
        </div>

        {occupied ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Table is currently occupied — seating from here will fail until the table is freed.
            </div>
          </div>
        ) : null}

        {selected.status !== "BOOKED" ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
            Only <span className="font-medium">BOOKED</span> reservations can be edited or cancelled.
          </div>
        ) : null}

        {/* Form */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editForm.date}
                onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                disabled={selected.status !== "BOOKED"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Time</label>
              <input
                type="time"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editForm.time}
                onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))}
                disabled={selected.status !== "BOOKED"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Table</label>
            <Select
              value={editForm.tableId}
              onValueChange={(v) => setEditForm((p) => ({ ...p, tableId: v }))}
              disabled={selected.status !== "BOOKED" || loadingTables}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTables ? "Loading tables…" : "Select a table"} />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                    {String(t.backendStatus).toUpperCase() === "OCCUPIED" ? " • occupied" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Party size</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editForm.partySize}
                onChange={(e) => setEditForm((p) => ({ ...p, partySize: e.target.value }))}
                disabled={selected.status !== "BOOKED"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                disabled={selected.status !== "BOOKED"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              disabled={selected.status !== "BOOKED"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              disabled={selected.status !== "BOOKED"}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 pt-0">
        <Separator className="my-3" />
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            onClick={onSave}
            disabled={!isDirty || busySave || selected.status !== "BOOKED"}
            title={selected.status !== "BOOKED" ? "Only BOOKED reservations can be edited" : undefined}
          >
            {busySave ? "Saving…" : "Save"}
          </Button>

          <Button
            variant="secondary"
            onClick={onSeat}
            disabled={selected.status !== "BOOKED" || occupied}
            title={occupied ? "Table occupied" : "Seat reservation"}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Seat
          </Button>

          <Button
            variant="destructive"
            onClick={onAskCancel}
            disabled={selected.status !== "BOOKED"}
            title={selected.status !== "BOOKED" ? "Only BOOKED can be cancelled" : "Cancel"}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Tip: You allow multiple reservations per table/day — time is what matters. Keep bookings spaced sensibly.
        </div>
      </div>
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  busy,
  tables,
  occupiedTableIds,
  loadingTables,
  createForm,
  setCreateForm,
  onCreate,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create reservation</DialogTitle>
          <DialogDescription>
            Reserve any table for any day. Multiple bookings per table/day are allowed — time matters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Time</label>
              <input
                type="time"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.time}
                onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Table</label>
            <Select
              value={createForm.tableId}
              onValueChange={(v) => setCreateForm((p) => ({ ...p, tableId: v }))}
              disabled={loadingTables}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTables ? "Loading tables…" : "Select a table"} />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                    {String(t.backendStatus).toUpperCase() === "OCCUPIED" ? " • occupied" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {createForm.tableId && occupiedTableIds.has(createForm.tableId) ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <AlertTriangle className="w-4 h-4" />
                Table is currently occupied — booking is OK; seating happens later when free.
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Party size</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.partySize}
                onChange={(e) => setCreateForm((p) => ({ ...p, partySize: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.phone}
                onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={createForm.notes}
              onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelConfirmDialog({ open, onOpenChange, busy, selected, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel reservation?</DialogTitle>
          <DialogDescription>
            This will mark the reservation as cancelled. This action is typically irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm">
          {selected ? (
            <div className="space-y-1">
              <div className="font-medium">{selected.name}</div>
              <div className="text-muted-foreground">
                {formatDate(selected.reservedFor)} • {formatTime(selected.reservedFor)} • Table{" "}
                {selected.tableNumber != null ? pad2(selected.tableNumber) : "—"}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No reservation selected.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy || !selected}>
            {busy ? "Cancelling…" : "Cancel reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

const STATUS_FILTERS = ["ALL", "BOOKED", "SEATED", "CANCELLED", "NO_SHOW"];

export default function ManageReservationsPage() {
  const navigate = useNavigate();
  const realtime = useRealtime();
  const { state, dispatch } = useReservationsContext();

  // mobile UI only
  const [isMobile, setIsMobile] = useState(false);
  const [openMobileDetail, setOpenMobileDetail] = useState(false);

  // selection sticky
  const lastSelectedRef = useRef(null);
  useEffect(() => {
    lastSelectedRef.current = state.selectedId;
  }, [state.selectedId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const occupiedTableIds = useMemo(() => new Set(state.occupiedTableIds || []), [state.occupiedTableIds]);

  // setters
  const setSelectedDate = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { selectedDate: v } }),
    [dispatch],
  );
  const setScope = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { scope: v } }),
    [dispatch],
  );
  const setStatusFilter = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { statusFilter: v } }),
    [dispatch],
  );
  const setSearch = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { search: v } }),
    [dispatch],
  );

  const setSelectedId = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_SELECTED_ID, payload: v }),
    [dispatch],
  );

  const setOpenCreate = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_DIALOGS, payload: { openCreate: !!v } }),
    [dispatch],
  );
  const setOpenCancelConfirm = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_DIALOGS, payload: { openCancelConfirm: !!v } }),
    [dispatch],
  );

  // local forms
  const [editForm, setEditForm] = useState(null);
  const [createForm, setCreateForm] = useState({
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: state.selectedDate,
    time: roundToNext15Min(),
    notes: "",
  });

  // keep createForm.date in sync
  useEffect(() => {
    setCreateForm((p) => ({ ...p, date: state.selectedDate }));
  }, [state.selectedDate]);

  const statusChips = useMemo(() => {
    return STATUS_FILTERS.map((s) => ({
      key: s,
      label: s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase().replace("_", "-"),
    }));
  }, []);

  const filtered = useMemo(() => {
    return (state.reservations || []).filter((r) => {
      if (state.statusFilter !== "ALL" && r.status !== state.statusFilter) return false;
      if (!matchesSearch(r, state.search)) return false;
      return true;
    });
  }, [state.reservations, state.statusFilter, state.search]);

  const stats = useMemo(() => {
    const base = { BOOKED: 0, SEATED: 0, CANCELLED: 0, NO_SHOW: 0 };
    for (const r of state.reservations || []) {
      if (base[r.status] != null) base[r.status] += 1;
    }
    return base;
  }, [state.reservations]);

  const selected = useMemo(() => {
    return (
      filtered.find((r) => r.id === state.selectedId) ||
      (state.reservations || []).find((r) => r.id === state.selectedId) ||
      null
    );
  }, [filtered, state.reservations, state.selectedId]);

  // derive edit form from selected
  useEffect(() => {
    if (!selected) {
      setEditForm(null);
      return;
    }
    const d = new Date(selected.reservedFor);
    setEditForm({
      id: selected.id,
      tableId: selected.tableId || "",
      name: selected.name || "",
      phone: selected.phone || "",
      partySize: String(selected.partySize || "2"),
      date: ymdLocal(d),
      time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
      notes: selected.notes || "",
      status: selected.status,
    });
  }, [selected]);

  const isDirty = useMemo(() => {
    if (!selected || !editForm) return false;
    const selectedDT = new Date(selected.reservedFor);
    const selectedDateStr = ymdLocal(selectedDT);
    const selectedTimeStr = `${pad2(selectedDT.getHours())}:${pad2(selectedDT.getMinutes())}`;

    return (
      editForm.tableId !== (selected.tableId || "") ||
      editForm.name !== (selected.name || "") ||
      editForm.phone !== (selected.phone || "") ||
      String(editForm.partySize) !== String(selected.partySize || "") ||
      editForm.date !== selectedDateStr ||
      editForm.time !== selectedTimeStr ||
      editForm.notes !== (selected.notes || "")
    );
  }, [selected, editForm]);

  // loaders
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate }),
      loadTables(dispatch),
    ]);
  }, [dispatch, state.scope, state.selectedDate]);

  // initial
  useEffect(() => {
    loadTables(dispatch).catch(() => {});
  }, [dispatch]);

  // reload when selectedDate/scope changes
  useEffect(() => {
    loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate })
      .then(() => {
        // selection rules
        const list = state.reservations || [];
        if (lastSelectedRef.current) {
          const stillThere = list.some((r) => r.id === lastSelectedRef.current);
          if (stillThere) {
            setSelectedId(lastSelectedRef.current);
            return;
          }
        }
        if (!isMobile && list.length > 0) setSelectedId(list[0].id);
        else setSelectedId(null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedDate, state.scope, dispatch, isMobile]);

  // realtime
  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables: null,
      reloadTickets: null,
      reloadServices: null,
    });

    const onRes = () =>
      loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      }).catch(() => {});
    const onTables = () => loadTables(dispatch).catch(() => {});

    socket.on("reservations:updated", onRes);
    socket.on("tables:updated", onTables);

    return () => {
      socket.off("reservations:updated", onRes);
      socket.off("tables:updated", onTables);
      realtime.unregisterStaff(id);
    };
  }, [realtime, dispatch, state.scope, state.selectedDate]);

  // actions
  const handleSelectRow = useCallback(
    (id) => {
      setSelectedId(id);
      if (isMobile) setOpenMobileDetail(true);
    },
    [isMobile, setSelectedId],
  );

  const openCreateDialog = useCallback(() => {
    const firstTableId = state.tables?.[0]?.id || "";
    setCreateForm({
      tableId: firstTableId,
      name: "",
      phone: "",
      partySize: "2",
      date: state.selectedDate,
      time: roundToNext15Min(),
      notes: "",
    });
    setOpenCreate(true);
  }, [state.tables, state.selectedDate, setOpenCreate]);

  const handleCreate = useCallback(async () => {
    const party = Number(createForm.partySize);

    if (
      !createForm.tableId ||
      !createForm.name.trim() ||
      !createForm.phone.trim() ||
      !party ||
      !createForm.date ||
      !createForm.time
    ) {
      toast.error("Fill table, name, phone, party size, date and time");
      return;
    }

    try {
      await createReservationAction(dispatch, {
        tableId: createForm.tableId,
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(createForm.date, createForm.time),
        notes: createForm.notes?.trim() || "",
      });

      toast.success("Reservation created");
      setOpenCreate(false);

      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      toast.error(e?.message || "Failed to create reservation");
    }
  }, [dispatch, createForm, state.scope, state.selectedDate, setOpenCreate]);

  const handleSave = useCallback(async () => {
    if (!selected || !editForm) return;

    if (selected.status !== "BOOKED") {
      toast.error("Only BOOKED reservations can be edited");
      return;
    }

    const party = Number(editForm.partySize);
    if (
      !editForm.tableId ||
      !editForm.name.trim() ||
      !editForm.phone.trim() ||
      !party ||
      !editForm.date ||
      !editForm.time
    ) {
      toast.error("Fill table, name, phone, party size, date and time");
      return;
    }

    try {
      await updateReservationAction(dispatch, editForm.id, {
        tableId: editForm.tableId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(editForm.date, editForm.time),
        notes: editForm.notes ?? "",
      });

      toast.success("Reservation updated");
      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      toast.error(e?.message || "Failed to update reservation");
    }
  }, [dispatch, selected, editForm, state.scope, state.selectedDate]);

  const handleSeatById = useCallback(
    async (reservationId) => {
      const r =
        (state.reservations || []).find((x) => x.id === reservationId) ||
        filtered.find((x) => x.id === reservationId);

      if (!r) return;
      if (r.status !== "BOOKED") return;

      if (r.tableId && occupiedTableIds.has(r.tableId)) {
        toast.error("Table is currently occupied. Free it before seating this reservation.");
        return;
      }

      try {
        await seatReservationAction(dispatch, r.id);

        toast("Reservation seated", {
          description: r.tableNumber != null ? `Table ${pad2(r.tableNumber)}` : "Table",
          action: {
            label: "View table",
            onClick: () => navigate(`/staff/tables/${r.tableId}`),
          },
        });

        await Promise.all([
          loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate }),
          loadTables(dispatch),
        ]);
      } catch (e) {
        toast.error(e?.message || "Failed to seat reservation");
      }
    },
    [dispatch, state.reservations, filtered, occupiedTableIds, navigate, state.scope, state.selectedDate],
  );

  const askCancel = useCallback(() => {
    if (!selected) return;
    setOpenCancelConfirm(true);
  }, [selected, setOpenCancelConfirm]);

  const confirmCancel = useCallback(async () => {
    if (!selected) return;

    if (selected.status !== "BOOKED") {
      toast.error("Only BOOKED reservations can be cancelled");
      setOpenCancelConfirm(false);
      return;
    }

    try {
      await cancelReservationAction(dispatch, selected.id);
      toast.success("Reservation cancelled");
      setOpenCancelConfirm(false);
      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      toast.error(e?.message || "Failed to cancel reservation");
    }
  }, [dispatch, selected, state.scope, state.selectedDate, setOpenCancelConfirm]);

  const headerLabel = useMemo(() => {
    const scopeLabel =
      state.scope === "day"
        ? state.selectedDate
        : state.scope === "next7"
          ? `From ${state.selectedDate} • next 7 days`
          : `From ${state.selectedDate} • next 30 days`;

    const count = state.loading ? "Loading…" : `${filtered.length} reservations`;
    return `${count} • ${scopeLabel}`;
  }, [state.loading, filtered.length, state.scope, state.selectedDate]);

  const renderRow = (r) => (
    <ReservationRow
      key={r.id}
      r={r}
      selected={r.id === state.selectedId}
      scope={state.scope}
      occupiedTableIds={occupiedTableIds}
      onSelect={() => handleSelectRow(r.id)}
      onSeat={() => handleSeatById(r.id)}
      onEdit={() => {
        setSelectedId(r.id);
        if (isMobile) setOpenMobileDetail(true);
      }}
      onCancel={() => {
        setSelectedId(r.id);
        setOpenCancelConfirm(true);
      }}
    />
  );

  return (
    <div className="space-y-4">
      <PageHeader
        onBack={() => navigate("/staff/tables")}
        onRefresh={refreshAll}
        refreshing={state.loading || state.loadingTables}
        onCreate={openCreateDialog}
      />

      <ErrorBanner error={state.error} />

      <StickyControls
        selectedDate={state.selectedDate}
        setSelectedDate={setSelectedDate}
        scope={state.scope}
        setScope={setScope}
        search={state.search}
        setSearch={setSearch}
        statusFilter={state.statusFilter}
        setStatusFilter={setStatusFilter}
        statusChips={statusChips}
        stats={stats}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-4">
        <ReservationsList
          loading={state.loading}
          filtered={filtered}
          headerLabel={headerLabel}
          onRefresh={refreshAll}
          refreshing={state.loading}
          renderRow={renderRow}
        />

        <Card className="border-border/60 hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DetailPanel
              selected={selected}
              editForm={editForm}
              setEditForm={setEditForm}
              tables={state.tables}
              occupiedTableIds={occupiedTableIds}
              loadingTables={state.loadingTables}
              scope={state.scope}
              isDirty={isDirty}
              busySave={state.busySave}
              onSave={handleSave}
              onSeat={() => (selected ? handleSeatById(selected.id) : null)}
              onAskCancel={askCancel}
            />
          </CardContent>
        </Card>
      </div>

      {/* Mobile details */}
      <Dialog open={openMobileDetail} onOpenChange={setOpenMobileDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservation</DialogTitle>
            <DialogDescription>View and manage the selected reservation</DialogDescription>
          </DialogHeader>

          <div className="-mx-6">
            <DetailPanel
              selected={selected}
              editForm={editForm}
              setEditForm={setEditForm}
              tables={state.tables}
              occupiedTableIds={occupiedTableIds}
              loadingTables={state.loadingTables}
              scope={state.scope}
              isDirty={isDirty}
              busySave={state.busySave}
              onSave={handleSave}
              onSeat={() => (selected ? handleSeatById(selected.id) : null)}
              onAskCancel={askCancel}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <CreateDialog
        open={state.openCreate}
        onOpenChange={setOpenCreate}
        busy={state.busyCreate}
        tables={state.tables}
        occupiedTableIds={occupiedTableIds}
        loadingTables={state.loadingTables}
        createForm={createForm}
        setCreateForm={setCreateForm}
        onCreate={handleCreate}
      />

      {/* Cancel confirm */}
      <CancelConfirmDialog
        open={state.openCancelConfirm}
        onOpenChange={setOpenCancelConfirm}
        busy={state.busyCancel}
        selected={selected}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
