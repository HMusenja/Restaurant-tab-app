import { ShoppingBag, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export default function TabSummaryCard({ tab, onViewCart, onRequestBill }) {
  const due = tab?.amountDueCents || 0;
  const total = tab?.totalCents || 0;

  // Match Code A behavior: render nothing if empty
  if (!tab || (due === 0 && total === 0)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom animate-slide-up">
      <div className="p-4">
        {/* Top summary row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="font-medium">
              Total Due
            </span>
          </div>

          <span className="text-lg font-bold text-primary">
            {formatEUR(due)}
          </span>
        </div>

        {/* Compact breakdown (kept from Code B logic) */}
        <div className="mb-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {formatEUR(tab?.subtotalCents || 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Tip</span>
            <span className="font-medium">
              {tab?.tip?.type === "PERCENT"
                ? `${tab.tip.value || 0}%`
                : formatEUR(tab?.tip?.value || 0)}
            </span>
          </div>

          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">
              {formatEUR(tab?.totalCents || 0)}
            </span>
          </div>
        </div>

        {/* Actions — shadcn Buttons (exactly like Code A) */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onRequestBill}
            disabled={!onRequestBill}
            className="flex-1"
          >
            <Receipt className="h-4 w-4" />
            Request Bill
          </Button>

          <Button
            onClick={onViewCart}
            disabled={!onViewCart}
            className="flex-1"
          >
            <ShoppingBag className="h-4 w-4" />
            View Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
