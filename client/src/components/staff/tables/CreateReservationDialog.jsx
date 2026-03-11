import { AlertTriangle, UserPlus } from "lucide-react";

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

import {
  staffDialogContentClass,
  staffFieldClass,
  staffTextareaClass,
} from "@/lib/staffUi";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  name: "",
  phone: "",
  partySize: "2",
  date: "",
  time: "",
  notes: "",
};

function FieldLabel({ children }) {
  return (
    <label className="text-sm font-medium tracking-wide text-foreground">
      {children}
    </label>
  );
}

export default function CreateReservationDialog({
  open,
  onOpenChange,
  tableBackendStatus,
  resForm = EMPTY_FORM,
  setResForm,
  busyCreateReservation = false,
  onCreate,
  showTrigger = true,
  triggerClassName = "",
}) {
  const isOccupied = String(tableBackendStatus).toUpperCase() === "OCCUPIED";

  const form = { ...EMPTY_FORM, ...(resForm || {}) };

  const updateField = (key, value) => {
    if (typeof setResForm !== "function") return;
    setResForm((prev) => ({
      ...EMPTY_FORM,
      ...(prev || {}),
      [key]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full rounded-2xl", triggerClassName)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Reservation
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent
        className={cn(
          staffDialogContentClass(),
          "w-[calc(100vw-1rem)] max-w-lg rounded-3xl border-border/70"
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            Create Reservation
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            Staff can reserve for any day, including when the table is currently occupied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <FieldLabel>Name</FieldLabel>
            <input
              className={staffFieldClass()}
              placeholder="Guest name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Phone</FieldLabel>
            <input
              className={staffFieldClass()}
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Party Size</FieldLabel>
              <input
                type="number"
                min="1"
                className={staffFieldClass()}
                placeholder="2"
                value={form.partySize}
                onChange={(e) => updateField("partySize", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                className={staffFieldClass()}
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Time</FieldLabel>
              <input
                type="time"
                className={staffFieldClass()}
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Status</FieldLabel>
              <div
                className={cn(
                  "flex h-11 items-center rounded-2xl border px-4 text-sm font-medium",
                  isOccupied
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {isOccupied ? "Table currently occupied" : "Table available"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>Notes</FieldLabel>
            <textarea
              className={staffTextareaClass()}
              placeholder="Optional notes (e.g. birthday, window seat)"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          {isOccupied ? (
            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-3 py-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>
                  This table is currently occupied. You can still create a reservation
                  for later today or a future date. Reservation time is what matters.
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
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