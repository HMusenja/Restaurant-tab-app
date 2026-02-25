// src/components/admin/finance/FinanceRangeCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FinanceRangeCard({
  from,
  to,
  groupBy,
  setFrom,
  setTo,
  setGroupBy,
  reload,
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Range</span>
          <Button variant="secondary" onClick={reload}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={cn(
              "h-10 rounded-xl border border-border/50 bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={cn(
              "h-10 rounded-xl border border-border/50 bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Group</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className={cn(
              "h-10 rounded-xl border border-border/50 bg-background px-3 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          >
            <option value="day">Day</option>
            <option value="week">Week (Mon)</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground sm:ml-auto">
          Tip: use <b>Year</b> for months, <b>Month</b> for Monday weeks.
        </div>
      </CardContent>
    </Card>
  );
}