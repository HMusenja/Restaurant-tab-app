// src/components/staff/tables/EditReservationDialog.jsx
import { Button } from "@/components/ui/button";
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

export default function EditReservationDialog({
  open,
  onOpenChange,
  loadingTablesForMove,
  allTables,
  editForm,
  setEditForm,
  busyEditReservation,
  onSave,
  onLoadTablesForMove,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) onLoadTablesForMove?.();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>
            Move table, adjust time/date, or edit guest details.
          </DialogDescription>
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
                <SelectValue
                  placeholder={loadingTablesForMove ? "Loading tables…" : "Select a table"}
                />
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
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, partySize: e.target.value }))
                }
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={busyEditReservation}>
            {busyEditReservation ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
