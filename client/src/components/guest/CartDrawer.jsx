import {
  updateTabItemQty,
  removeTabItem,
  setTipPercent,
  setTipAmountCents,
} from "../../api/guestApi";
import { createTicket } from "../../api/ticketApi";

import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { useSnackbar } from "@/contexts/SnackbarContext";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export default function CartDrawer({ open, onClose, tab, setTab, setError }) {
const { showSnackbar } = useSnackbar();

  async function updateQty(menuItemId, qty) {
    setError("");
    try {
      const data = await updateTabItemQty(tab._id, menuItemId, qty);
      setTab(data.tab);
    } catch (e) {
      setError(e.message || "Failed to update item");
    }
  }

  async function remove(menuItemId) {
    setError("");
    try {
      const data = await removeTabItem(tab._id, menuItemId);
      setTab(data.tab);
    } catch (e) {
      setError(e.message || "Failed to remove item");
    }
  }

  async function tipPercent(pct) {
    setError("");
    try {
      const data = await setTipPercent(tab._id, pct);
      setTab(data.tab);
    } catch (e) {
      setError(e.message || "Failed to set tip");
    }
  }

  async function tipAmount(cents) {
    setError("");
    try {
      const data = await setTipAmountCents(tab._id, cents);
      setTab(data.tab);
    } catch (e) {
      setError(e.message || "Failed to set tip");
    }
  }

  const items = tab?.items || [];

  async function sendToService() {
  setError("");

  try {
    const data = await createTicket(tab._id);
    if (data?.tab) setTab(data.tab);

    showSnackbar({
      type: "success",
      message: "Order sent to kitchen!",
      description: "You can track progress above in Order Status.",
      action: {
        label: "View status",
        onClick: () =>
          window.scrollTo({ top: 0, behavior: "smooth" }),
      },
    });

    onClose();
  } catch (e) {
    setError(e.message || "Failed to send order");

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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 bg-background">
        <div className="flex h-full flex-col">
          {/* Header (Code A style) */}
          <SheetHeader className="border-b border-border px-4 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Your Table&apos;s Tab
              </SheetTitle>
              <SheetDescription className="sr-only">
                Review items in your cart, adjust quantities, add a tip, and
                send your order to service.
              </SheetDescription>

              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 smooth-scroll">
            {!tab?._id ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium">No active tab yet</p>
                <p className="mt-1 text-sm">Add items from the menu to start</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="mb-4 h-16 w-16 opacity-30" />
                <p className="text-lg font-medium">Your tab is empty</p>
                <p className="mt-1 text-sm">Add items from the menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.menuItemId}
                    className="rounded-lg border border-border/50 bg-card p-4 shadow-soft"
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
                        onClick={() => remove(it.menuItemId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty pill (Code A style) */}
                      <div className="flex items-center gap-3 rounded-full bg-secondary p-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            if (it.qty <= 1) remove(it.menuItemId);
                            else updateQty(it.menuItemId, it.qty - 1);
                          }}
                          className="h-8 w-8 rounded-full"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="w-8 text-center font-semibold">
                          {it.qty}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            updateQty(it.menuItemId, Math.min(99, it.qty + 1))
                          }
                          className="h-8 w-8 rounded-full"
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

            {/* Tip section (keeps your behavior, styled to match A) */}
            {tab?._id && (
              <div className="mt-6 rounded-lg border border-border/50 bg-card p-4 shadow-soft">
                <div className="font-semibold text-foreground">Tip</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[0, 5, 10, 15].map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant="secondary"
                      onClick={() => tipPercent(p)}
                      className="rounded-full"
                    >
                      {p}%
                    </Button>
                  ))}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => tipAmount(200)}
                    className="rounded-full"
                  >
                    +2€
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => tipAmount(500)}
                    className="rounded-full"
                  >
                    +5€
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Code A style bottom block) */}
          <div className="safe-bottom border-t border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">
                {formatEUR(tab?.totalCents || 0)}
              </span>
            </div>

            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due</span>
              <span className="font-semibold">
                {formatEUR(tab?.amountDueCents || 0)}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // UI-only clear behavior: remove each item via your existing API
                  // (keeps backend logic; no new endpoints assumed)
                  items.forEach((it) => remove(it.menuItemId));
                }}
                disabled={!tab?._id || items.length === 0}
              >
                Clear Cart
              </Button>

              <Button
                onClick={sendToService}
               className="flex-1 bg-gradient-to-r from-primary to-accent hover:brightness-110"
                disabled={!canSend}
                

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
