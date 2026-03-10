import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  pad2,
  statusBadgeClass,
  timePillClass,
} from "./reservation-ui";
import {
  formatDate,
  formatTime,
  timeSignal,
} from "@/hooks/useReservationsManager";

export default function ReservationRow({
  reservation,
  selected,
  scope,
  occupiedTableIds,
  onSelect,
  onSeat,
  onEdit,
  onCancel,
}) {
  const r = reservation;
  const tSig = timeSignal(r.reservedFor);
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
        "w-full rounded-2xl border px-3 py-3 transition outline-none cursor-pointer select-none",
        selected
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-background/60 hover:bg-muted/50 dark:border-[hsl(40,30%,85%)/12%] dark:bg-[hsl(222,18%,13%)] dark:hover:bg-[hsl(222,18%,16%)]"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {scope !== "day" ? (
              <Badge className="rounded-full bg-muted/50 border border-border text-muted-foreground text-xs dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]">
                {formatDate(r.reservedFor)}
              </Badge>
            ) : null}

            <div className="text-base font-semibold tabular-nums text-foreground dark:text-[hsl(40,20%,95%)]">
              {formatTime(r.reservedFor)}
            </div>

            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                statusBadgeClass(r.status)
              )}
            >
              {String(r.status).toLowerCase().replace("_", " ")}
            </span>

            <Badge className="rounded-full bg-muted/50 border border-border text-muted-foreground text-xs dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]">
              {r.tableNumber != null ? `Table ${pad2(r.tableNumber)}` : "Table —"}
            </Badge>

            {tSig.kind !== "none" ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  timePillClass(tSig.kind)
                )}
              >
                {tSig.label}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
            <span className="font-semibold break-words text-foreground dark:text-[hsl(40,20%,95%)]">
              {r.name}
            </span>
            <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
              •
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground dark:text-[hsl(40,10%,70%)]">
              <Users className="w-3.5 h-3.5" />
              {r.partySize}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            <span className="inline-flex items-center gap-1 break-all">
              <Phone className="w-3.5 h-3.5" />
              {r.phone || "—"}
            </span>

            {r.notes ? (
              <>
                <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                  •
                </span>
                <span className="truncate">📝 Notes</span>
              </>
            ) : null}

            {occupied ? (
              <>
                <span className="text-muted-foreground/70 dark:text-[hsl(40,10%,55%)]">
                  •
                </span>
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Table occupied
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            size="sm"
            className="rounded-xl h-9"
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
            className="rounded-xl h-9 w-9 bg-card/80 border border-border hover:bg-muted/60 dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:hover:bg-[hsl(40,20%,95%)/10%]"
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
            className="rounded-xl h-9 w-9 hover:bg-muted/60 dark:hover:bg-[hsl(40,20%,95%)/8%]"
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