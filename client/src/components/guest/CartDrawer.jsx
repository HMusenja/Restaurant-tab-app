import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useTab } from "@/contexts/TabContext/TabContext";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export default function CartDrawer({ open, onClose }) {
  const { showSnackbar } = useSnackbar();

  const {
    tab,
    clearError,
    updateQty,
    removeItem,
    setTipPercent,
    setTipAmountCents,
    createTicketAndClear,
  } = useTab();

  const items = tab?.items || [];
  const [clearing, setClearing] = useState(false);

  async function onUpdateQty(menuItemId, qty) {
    clearError?.();
    try {
      await updateQty(menuItemId, qty);
    } catch (e) {
      showSnackbar({
        type: "error",
        message: "Failed to update item",
        description: e.message || "Please try again.",
      });
    }
  }

  async function onRemove(menuItemId) {
    clearError?.();
    try {
      await removeItem(menuItemId);
    } catch (e) {
      showSnackbar({
        type: "error",
        message: "Failed to remove item",
        description: e.message || "Please try again.",
      });
    }
  }

  async function tipPercent(pct) {
    clearError?.();
    try {
      await setTipPercent(pct);
    } catch (e) {
      showSnackbar({
        type: "error",
        message: "Failed to set tip",
        description: e.message || "Please try again.",
      });
    }
  }

  async function tipAmount(cents) {
    clearError?.();
    try {
      await setTipAmountCents(cents);
    } catch (e) {
      showSnackbar({
        type: "error",
        message: "Failed to set tip",
        description: e.message || "Please try again.",
      });
    }
  }

  async function sendToService() {
    clearError?.();

    try {
      await createTicketAndClear();

      showSnackbar({
        type: "success",
        message: "Order sent to kitchen!",
        description: "You can track progress above in Order Status.",
        action: {
          label: "View status",
          onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
      });

      onClose();
    } catch (e) {
      showSnackbar({
        type: "error",
        message: "Failed to send order",
        description: e.message || "Please try again.",
      });
    }
  }

  const canSend = !!tab?._id && items.length > 0;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl border-x-0 border-b-0 border-t border-border bg-background p-0 shadow-xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Your Table&apos;s Tab
              </SheetTitle>

              <SheetDescription className="sr-only">
                Review items in your cart, adjust quantities, add a tip, and
                send your order.
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="smooth-scroll flex-1 overflow-y-auto px-4 py-4">
            {!tab?._id ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-muted-foreground">
                <ShoppingBag className="mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium text-foreground">No active tab yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add items from the menu to start
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-muted-foreground">
                <ShoppingBag className="mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium text-foreground">Your tab is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add items from the menu
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.menuItemId}
                    className="rounded-3xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold text-foreground">
                          {it.nameSnap}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatEUR(it.priceCentsSnap)} each
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemove(it.menuItemId)}
                        className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-1 py-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            if (it.qty <= 1) onRemove(it.menuItemId);
                            else onUpdateQty(it.menuItemId, it.qty - 1);
                          }}
                          className="h-8 w-8 rounded-full"
                          type="button"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="w-8 text-center font-semibold text-foreground">
                          {it.qty}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            onUpdateQty(it.menuItemId, Math.min(99, it.qty + 1))
                          }
                          className="h-8 w-8 rounded-full"
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <span className="font-bold text-primary">
                        {formatEUR(it.priceCentsSnap * it.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab?._id && (
              <div className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-sm">
                <div className="font-semibold text-foreground">Tip</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 5, 10, 15].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant="secondary"
                      onClick={() => tipPercent(p)}
                      className="rounded-full border border-border"
                    >
                      {p}%
                    </Button>
                  ))}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => tipAmount(200)}
                    className="rounded-full border border-border"
                  >
                    +2€
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => tipAmount(500)}
                    className="rounded-full border border-border"
                  >
                    +5€
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="safe-bottom border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mb-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatEUR(tab?.totalCents || 0)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due</span>
                <span className="font-semibold text-foreground">
                  {formatEUR(tab?.amountDueCents || 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                disabled={clearing || !tab?._id || items.length === 0}
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={async () => {
                  setClearing(true);
                  try {
                    for (const it of items) {
                      await onRemove(it.menuItemId);
                    }
                  } finally {
                    setClearing(false);
                  }
                }}
                type="button"
              >
                Clear Cart
              </Button>

              <Button
                onClick={sendToService}
                className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-sm hover:brightness-110"
                disabled={!canSend}
                type="button"
              >
                Send Order
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}