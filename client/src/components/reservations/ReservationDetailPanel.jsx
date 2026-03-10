import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  pad2,
  glassInputClass,
  statusBadgeClass,
  timePillClass,
} from "./reservation-ui";
import {
  formatDate,
  formatTime,
  timeSignal,
} from "@/hooks/useReservationsManager";

export default function ReservationDetailPanel({
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
  const occupied = selected.tableId && occupiedTableIds.has(selected.tableId);
  const tSig = timeSignal(selected.reservedFor);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-lg font-semibold text-foreground dark:text-[hsl(40,20%,95%)]">
                {editForm.name || "Reservation"}
              </div>

              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  statusBadgeClass(selected.status)
                )}
              >
                {selected.status.toLowerCase().replace("_", " ")}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-primary/80" />
                {formatDate(selected.reservedFor)}
              </span>

              <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                •
              </span>

              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-4 h-4 text-primary/80" />
                {formatTime(selected.reservedFor)}
              </span>

              <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                •
              </span>

              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4 text-primary/80" />
                {selected.partySize}
              </span>

              {scope !== "day" ? (
                <>
                  <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                    •
                  </span>
                  <Badge className="rounded-full bg-muted/50 border border-border text-muted-foreground text-xs dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]">
                    Range view
                  </Badge>
                </>
              ) : null}

              {tSig.kind !== "none" ? (
                <>
                  <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                    •
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      timePillClass(tSig.kind)
                    )}
                  >
                    {tSig.label}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <Badge className="shrink-0 rounded-full bg-muted/50 border border-border text-muted-foreground text-xs dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]">
            {selected.tableNumber != null ? `Table ${pad2(selected.tableNumber)}` : "Table —"}
          </Badge>
        </div>

        {occupied ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Table is currently occupied — seating from here will fail until the
              table is freed.
            </div>
          </div>
        ) : null}

        {selected.status !== "BOOKED" ? (
          <div className="rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(40,20%,95%)/4%] dark:text-[hsl(40,10%,70%)]">
            Only <span className="font-medium">BOOKED</span> reservations can be
            edited or cancelled.
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                Date
              </label>
              <input
                type="date"
                className={glassInputClass()}
                value={editForm.date}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, date: e.target.value }))
                }
                disabled={selected.status !== "BOOKED"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                Time
              </label>
              <input
                type="time"
                className={glassInputClass()}
                value={editForm.time}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, time: e.target.value }))
                }
                disabled={selected.status !== "BOOKED"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              Table
            </label>
            <Select
              value={editForm.tableId}
              onValueChange={(value) =>
                setEditForm((prev) => ({ ...prev, tableId: value }))
              }
              disabled={selected.status !== "BOOKED" || loadingTables}
            >
              <SelectTrigger className="rounded-2xl border-border bg-muted/40 text-foreground dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(40,20%,95%)/4%] dark:text-[hsl(40,20%,92%)]">
                <SelectValue
                  placeholder={loadingTables ? "Loading tables…" : "Select a table"}
                />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.label}
                    {String(table.backendStatus).toUpperCase() === "OCCUPIED"
                      ? " • occupied"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                Party size
              </label>
              <input
                type="number"
                min="1"
                className={glassInputClass()}
                value={editForm.partySize}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, partySize: e.target.value }))
                }
                disabled={selected.status !== "BOOKED"}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                Phone
              </label>
              <input
                className={glassInputClass()}
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                disabled={selected.status !== "BOOKED"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              Name
            </label>
            <input
              className={glassInputClass()}
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={selected.status !== "BOOKED"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              Notes
            </label>
            <textarea
              rows={3}
              className={cn(glassInputClass(), "min-h-[92px] py-3")}
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              disabled={selected.status !== "BOOKED"}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 pt-0">
        <Separator className="my-3 bg-border/60 dark:bg-[hsl(40,20%,95%)/10%]" />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            className="flex-1 rounded-2xl"
            onClick={onSave}
            disabled={!isDirty || busySave || selected.status !== "BOOKED"}
            title={
              selected.status !== "BOOKED"
                ? "Only BOOKED reservations can be edited"
                : undefined
            }
          >
            {busySave ? "Saving…" : "Save"}
          </Button>

          <Button
            variant="secondary"
            className="rounded-2xl bg-card/80 border border-border hover:bg-muted/60 dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:hover:bg-[hsl(40,20%,95%)/10%]"
            onClick={onSeat}
            disabled={selected.status !== "BOOKED" || occupied}
            title={occupied ? "Table occupied" : "Seat reservation"}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Seat
          </Button>

          <Button
            variant="destructive"
            className="rounded-2xl"
            onClick={onAskCancel}
            disabled={selected.status !== "BOOKED"}
            title={
              selected.status !== "BOOKED"
                ? "Only BOOKED can be cancelled"
                : "Cancel"
            }
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          Tip: You allow multiple reservations per table/day — time is what
          matters. Keep bookings spaced sensibly.
        </div>
      </div>
    </div>
  );
}