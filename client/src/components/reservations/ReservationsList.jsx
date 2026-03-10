import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassCardClass } from "./reservation-ui";
import ReservationRow from "./ReservationRow";

export default function ReservationsList({
  loading,
  reservations,
  headerLabel,
  onRefresh,
  refreshing,
  selectedId,
  scope,
  occupiedTableIds,
  onSelectRow,
  onSeatRow,
  onEditRow,
  onCancelRow,
}) {
  return (
    <Card className={glassCardClass()}>
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="pb-2">
        <CardTitle className="flex items-start sm:items-center justify-between gap-3 text-base">
          <span className="text-foreground dark:text-[hsl(40,20%,95%)]">
            {headerLabel}
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            className="shrink-0 rounded-2xl hover:bg-muted/60 dark:hover:bg-[hsl(40,20%,95%)/8%]"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-10 text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            Loading reservations…
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-10 text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            No reservations match your filters.
          </div>
        ) : (
          reservations.map((reservation) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              selected={reservation.id === selectedId}
              scope={scope}
              occupiedTableIds={occupiedTableIds}
              onSelect={() => onSelectRow(reservation.id)}
              onSeat={() => onSeatRow(reservation.id)}
              onEdit={() => onEditRow(reservation.id)}
              onCancel={() => onCancelRow(reservation.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}