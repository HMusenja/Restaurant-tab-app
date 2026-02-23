// src/components/staff/tables/CreateReservationDialog.jsx
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CreateReservationDialog({
  open,
  onOpenChange,
  tableBackendStatus,
  resForm,
  setResForm,
  busyCreateReservation,
  onCreate,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onChange={(e) =>
                  setResForm((p) => ({ ...p, partySize: e.target.value }))
                }
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

          {tableBackendStatus === "OCCUPIED" ? (
            <div className="text-xs text-muted-foreground">
              Note: This table is currently occupied. You can still book for later today or
              future days. Reservation time is what matters.
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={busyCreateReservation}>
            {busyCreateReservation ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
