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

  // Match current behavior: render nothing if empty
  if (!tab || (due === 0 && total === 0)) return null;

  return (
    <div className="safe-bottom fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-4xl px-4">
        <div className="overflow-hidden rounded-t-3xl border border-border bg-card shadow-lg backdrop-blur">
          {/* Collapsed Header */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between bg-primary px-4 py-3 text-primary-foreground"
            type="button"
          >
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-5 w-5" />
              Total Due
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{formatEUR(due)}</span>
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
              "overflow-hidden bg-card transition-all duration-300 ease-in-out",
              open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
            ].join(" ")}
          >
            <div className="space-y-4 border-t border-border px-4 py-4">
              {/* Breakdown */}
              <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    {formatEUR(tab?.subtotalCents || 0)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip</span>
                  <span className="text-foreground">
                    {tab?.tip?.type === "PERCENT"
                      ? `${tab.tip.value || 0}%`
                      : formatEUR(tab?.tip?.value || 0)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
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
                  className="flex-1 rounded-2xl"
                  type="button"
                >
                  <Receipt className="h-4 w-4" />
                  Request Bill
                </Button>

                <Button
                  onClick={onViewCart}
                  disabled={!onViewCart}
                  className="flex-1 rounded-2xl shadow-sm"
                  type="button"
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