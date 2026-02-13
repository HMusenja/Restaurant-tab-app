import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR } from "@/utils/financeFormatters"; 

export default function KpiCard({ title, kpi, rangeLabel }) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
        {rangeLabel && (
          <div className="text-xs text-muted-foreground">
            {rangeLabel}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">
          {formatEUR(kpi?.grossCents)}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Subtotal: {formatEUR(kpi?.subtotalCents)}</span>
          <span>•</span>
          <span>Tips: {formatEUR(kpi?.tipsCents)}</span>
        </div>

        <div className="flex gap-2 text-xs">
          <Badge variant="secondary">{kpi?.count ?? 0} tabs</Badge>
          <Badge variant="secondary">
            Avg {formatEUR(kpi?.avgCents)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
