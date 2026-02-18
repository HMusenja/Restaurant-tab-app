import { useState } from "react";
import { ShoppingBag, Receipt, ChevronUp, ChevronDown } from "lucide-react";
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

   const [open, setOpen] = useState(false);

  // Match Code A behavior: render nothing if empty
  if (!tab || (due === 0 && total === 0)) return null;

   return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="rounded-t-3xl border border-border bg-card shadow-elevated overflow-hidden">
          
          {/* Collapsed Header */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground"
          >
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-5 w-5" />
              Total Due
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">
                {formatEUR(due)}
              </span>
              {open ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </button>

          {/* Expandable Content */}
          <div
            className={[
              "transition-all duration-300 ease-in-out bg-card",
              open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            <div className="px-4 py-4 space-y-4 border-t border-border">
              {/* Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatEUR(tab?.subtotalCents || 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip</span>
                  <span>
                    {tab?.tip?.type === "PERCENT"
                      ? `${tab.tip.value || 0}%`
                      : formatEUR(tab?.tip?.value || 0)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total</span>
                  <span>{formatEUR(total)}</span>
                </div>
              </div>

              {/* Actions */}
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
        </div>
      </div>
    </div>
  );
}