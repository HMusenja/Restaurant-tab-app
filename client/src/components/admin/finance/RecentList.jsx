// src/components/admin/finance/RecentList.jsx
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDateTime } from "@/utils/financeFormatters";
import { cn } from "@/lib/utils";

function metricBadgeClass(variant) {
  // slightly stronger contrast than default "secondary" when you’re in dark/glass UIs
  if (variant === "total") return "bg-primary/15 text-primary border border-primary/20";
  return "bg-muted/30 text-foreground/80 border border-border/60";
}

export default function RecentList({ rows, emptyLabel }) {
  if (!rows?.length) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.tabId}
          className={cn(
            "rounded-2xl border border-border/60 bg-card/70 backdrop-blur",
            "p-3 sm:p-4",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium truncate">
                Table {r.tableNumber ?? "?"}
                <span className="text-muted-foreground"> · </span>
                <span className="text-muted-foreground">{formatDateTime(r.paidAt)}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge className={metricBadgeClass("sub")}>
                  Subtotal {formatEUR(r.subtotalCents)}
                </Badge>
                <Badge className={metricBadgeClass("sub")}>
                  Tip {formatEUR(r.tipsCents)}
                </Badge>
                <Badge className={metricBadgeClass("total")}>
                  Total {formatEUR(r.grossCents)}
                </Badge>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-xs text-muted-foreground">Gross</div>
              <div className="font-semibold tabular-nums">
                {formatEUR(r.grossCents)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}