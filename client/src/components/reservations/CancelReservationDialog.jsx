import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatTime } from "@/hooks/useReservationsManager";
import { pad2 } from "./reservation-ui";

export default function CancelReservationDialog({
  open,
  onOpenChange,
  busy,
  selected,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-3xl border border-border bg-card text-foreground shadow-xl dark:bg-[hsl(222,18%,9%)] dark:text-[hsl(40,30%,92%)] dark:border-[hsl(40,30%,85%)/12%] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle>Cancel reservation?</DialogTitle>
          <DialogDescription>
            This will mark the reservation as cancelled. This action is
            typically irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm">
          {selected ? (
            <div className="space-y-1">
              <div className="font-medium">{selected.name}</div>
              <div className="text-muted-foreground">
                {formatDate(selected.reservedFor)} • {formatTime(selected.reservedFor)} •{" "}
                Table {selected.tableNumber != null ? pad2(selected.tableNumber) : "—"}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No reservation selected.</div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Keep
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={busy || !selected}
          >
            {busy ? "Cancelling…" : "Cancel reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}