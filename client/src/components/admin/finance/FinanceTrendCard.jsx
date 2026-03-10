// src/components/admin/finance/FinanceTrendCard.jsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MoneyTooltip from "./MoneyTooltip";

function metricKey(metric) {
  if (metric === "tips") return "tipsEUR";
  if (metric === "subtotal") return "subtotalEUR";
  return "grossEUR";
}

export default function FinanceTrendCard({
  trend,
  metric,
  groupBy,
  yTick,
  xTick,
}) {
  const data = Array.isArray(trend) ? trend : [];

  return (
    <Card className="shadow-soft min-w-0">
      <CardHeader>
        <CardTitle>Trend ({groupBy})</CardTitle>
      </CardHeader>

      <CardContent className="min-w-0">
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data in range.</div>
        ) : (
          <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" aspect={2.2}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="bucket" tickFormatter={xTick} />

                <YAxis tickFormatter={yTick} />

                <Tooltip content={<MoneyTooltip />} />

                <Area
                  type="monotone"
                  dataKey={metricKey(metric)}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
