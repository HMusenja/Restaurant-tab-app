import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDateTime } from "@/utils/financeFormatters";

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
          className="rounded-xl border bg-card p-3 flex justify-between"
        >
          <div>
            <div className="font-medium">
              Table {r.tableNumber ?? "?"}
              <span className="text-muted-foreground"> · </span>
              {formatDateTime(r.paidAt)}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                Subtotal {formatEUR(r.subtotalCents)}
              </Badge>
              <Badge variant="secondary">
                Tip {formatEUR(r.tipsCents)}
              </Badge>
              <Badge>Total {formatEUR(r.grossCents)}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
