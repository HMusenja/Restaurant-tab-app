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

import { staffDialogContentClass, staffFieldClass, staffTextareaClass } from "@/lib/staffUi";

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
      <DialogContent className={staffDialogContentClass()}>
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription className="text-[hsl(40,10%,65%)]">
            Move table, adjust time/date, or edit guest details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Table</label>
            <Select
              value={editForm.tableId}
              onValueChange={(v) => setEditForm((p) => ({ ...p, tableId: v }))}
              disabled={loadingTablesForMove}
            >
              <SelectTrigger className={staffFieldClass("py-0 h-10")}>
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
            <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Name</label>
            <input
              className={staffFieldClass()}
              placeholder="Guest name"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Phone</label>
            <input
              className={staffFieldClass()}
              placeholder="Phone number"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Party Size</label>
              <input
                type="number"
                min="1"
                className={staffFieldClass()}
                value={editForm.partySize}
                onChange={(e) => setEditForm((p) => ({ ...p, partySize: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Date</label>
              <input
                type="date"
                className={staffFieldClass()}
                value={editForm.date}
                onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Time</label>
            <input
              type="time"
              className={staffFieldClass()}
              value={editForm.time}
              onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(40,10%,70%)]">Notes</label>
            <textarea
              className={staffTextareaClass()}
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