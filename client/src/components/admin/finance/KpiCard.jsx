// src/components/admin/finance/KpiCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR } from "@/utils/financeFormatters";
import { cn } from "@/lib/utils";

export default function KpiCard({ title, kpi, rangeLabel }) {
  const count = kpi?.count ?? 0;

  return (
    <Card className={cn("shadow-soft", "border-border/60 bg-card/70 backdrop-blur")}>
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {rangeLabel ? (
          <div className="text-xs text-muted-foreground">{rangeLabel}</div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-2xl font-bold tabular-nums">
          {formatEUR(kpi?.grossCents)}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">Subtotal: {formatEUR(kpi?.subtotalCents)}</span>
          <span>•</span>
          <span className="tabular-nums">Tips: {formatEUR(kpi?.tipsCents)}</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="bg-muted/30 border border-border/60">
            {count} tabs
          </Badge>
          <Badge variant="secondary" className="bg-muted/30 border border-border/60">
            Avg {formatEUR(kpi?.avgCents)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}