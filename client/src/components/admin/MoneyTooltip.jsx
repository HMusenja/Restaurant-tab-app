import { formatEUR } from "@/utils/financeFormatters";

export default function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;

  return (
    <div className="rounded-xl border bg-background p-3 shadow-soft text-xs">
      <div className="font-medium mb-2">{label}</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Gross</span>
          <span>{formatEUR(p.grossCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatEUR(p.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tips</span>
          <span>{formatEUR(p.tipsCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tabs</span>
          <span>{p.count}</span>
        </div>
      </div>
    </div>
  );
}
