// src/components/admin/finance/MoneyTooltip.jsx
import { formatEUR } from "@/utils/financeFormatters";
import { cn } from "@/lib/utils";

export default function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  // Support both shapes:
  // - trend rows have grossEUR/subtotalEUR/tipsEUR
  // - other responses might carry grossCents/subtotalCents/tipsCents
  const p = payload[0]?.payload || {};
  const gross = p.grossCents ?? p.grossEUR;
  const subtotal = p.subtotalCents ?? p.subtotalEUR;
  const tips = p.tipsCents ?? p.tipsEUR;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-background/90 backdrop-blur",
        "p-3 shadow-soft text-xs",
      )}
    >
      <div className="font-medium mb-2">{label}</div>

      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Gross</span>
          <span className="font-medium tabular-nums">{formatEUR(gross)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatEUR(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Tips</span>
          <span className="tabular-nums">{formatEUR(tips)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Tabs</span>
          <span className="tabular-nums">{p.count ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}