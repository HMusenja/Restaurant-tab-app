import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTabForStaff, payTab, closeTab } from "../api/staffTabApi";
import { Button } from "@/components/ui/button";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function SectionCard({ title, children, description }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm backdrop-blur">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function StaffPaymentPage() {
  const { tabId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState(null);
  const [orderedLines, setOrderedLines] = useState([]);
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await getTabForStaff(tabId);
      setTab(data.tab);
      setOrderedLines(Array.isArray(data.orderedLines) ? data.orderedLines : []);
    } catch (e) {
      setError(e.message || "Failed to load tab");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  const status = tab?.status;
  const tableNumber = tab?.table?.number ?? "?";

  const totalCents = useMemo(() => {
    return tab?.totalCents ?? tab?.subtotalCents ?? 0;
  }, [tab]);

  const cartItems = tab?.items || [];

  const orderedSubtotalCents = useMemo(() => {
    return (orderedLines || []).reduce((sum, l) => {
      const price = l.priceCentsSnap ?? 0;
      const qty = l.qty ?? 0;
      return sum + price * qty;
    }, 0);
  }, [orderedLines]);

  const tipCents = useMemo(() => {
    const due = tab?.amountDueCents ?? 0;
    return null;
  }, [tab]);

  async function handlePay() {
    setError("");
    setBusy(true);
    try {
      const data = await payTab(tabId, method);
      setTab(data.tab);
    } catch (e) {
      setError(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseTab() {
    setError("");
    setBusy(true);
    try {
      await closeTab(tabId);
      await load();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Cannot close tab while requests are still open";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-3xl border border-border/70 bg-card/95 p-6 text-sm text-muted-foreground shadow-sm">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive shadow-sm">
            {error || "Tab not found"}
          </div>
        </div>
      </div>
    );
  }

  const hasAnyLines = (orderedLines?.length || 0) > 0 || (cartItems?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-4">
        {/* Header */}
        <header className="mb-4 rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Payment
              </h1>
              <p className="text-sm text-muted-foreground">Status: {status}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Tab #{tabId}
            </div>
          </div>
        </header>

        {/* Error */}
        {error ? (
          <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Content */}
        <main className="flex-1 space-y-4">
          <SectionCard title="Ordered Items">
            {orderedLines.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                No ordered items yet.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {orderedLines.map((l, idx) => (
                    <div
                      key={String(l.menuItemId || l.nameSnap || idx)}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-muted/20 px-3 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {l.nameSnap || "Item"} {l.qty > 1 ? `×${l.qty}` : ""}
                        </div>
                        <div className="mt-1 text-xs capitalize text-muted-foreground">
                          {String(l.status || "NEW").toLowerCase()}
                        </div>
                      </div>

                      <div className="shrink-0 font-medium text-foreground">
                        {formatEUR((l.priceCentsSnap ?? 0) * (l.qty ?? 0))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                  <span className="text-muted-foreground">Ordered Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatEUR(orderedSubtotalCents)}
                  </span>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Cart (Not Sent Yet)">
            {cartItems.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                Cart is empty.
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((it, idx) => (
                  <div
                    key={String(it.menuItemId || it._id || idx)}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-muted/20 px-3 py-3 text-sm"
                  >
                    <div className="min-w-0 truncate font-medium text-foreground">
                      {it.nameSnap || it.name || "Item"} {it.qty > 1 ? `×${it.qty}` : ""}
                    </div>
                    <div className="shrink-0 font-medium text-foreground">
                      {formatEUR((it.priceCentsSnap ?? it.priceCents ?? 0) * (it.qty || 0))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Totals"
            description="Total due is taken from the tab totals and includes sent orders, any cart items, and any tip already applied."
          >
            <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-4">
              <span className="text-sm text-muted-foreground">Total Due</span>
              <span className="text-lg font-semibold text-foreground">
                {formatEUR(totalCents)}
              </span>
            </div>
          </SectionCard>

          {status === "OPEN" ? (
            <SectionCard title="Payment Method">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={method === "cash" ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setMethod("cash")}
                  >
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={method === "card" ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setMethod("card")}
                  >
                    Card
                  </Button>
                </div>

                <Button
                  className="w-full rounded-2xl"
                  onClick={handlePay}
                  disabled={busy || !hasAnyLines}
                >
                  {busy ? "Processing…" : `Confirm Payment (${formatEUR(totalCents)})`}
                </Button>

                {!hasAnyLines ? (
                  <div className="rounded-2xl bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                    Nothing to pay yet. There are no ordered items and the cart is empty.
                  </div>
                ) : null}
              </div>
            </SectionCard>
          ) : null}

          {status === "PAID" ? (
            <SectionCard title="Close Tab">
              <div className="space-y-3">
                <div className="rounded-2xl bg-success/10 px-3 py-3 text-sm text-muted-foreground">
                  Payment recorded. You can now close the tab and free the table.
                </div>
                <Button
                  className="w-full rounded-2xl"
                  variant="outline"
                  onClick={handleCloseTab}
                  disabled={busy}
                >
                  {busy ? "Closing…" : "Close Tab"}
                </Button>
              </div>
            </SectionCard>
          ) : null}

          {status === "CLOSED" ? (
            <SectionCard title="Tab Closed">
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  This tab is closed.
                </div>
                <Button
                  className="rounded-2xl"
                  variant="secondary"
                  onClick={() => navigate("/staff")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </SectionCard>
          ) : null}
        </main>

        {/* Footer */}
        <footer className="mt-4 flex gap-2 rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm backdrop-blur">
          <Button variant="secondary" className="rounded-2xl" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="secondary" className="rounded-2xl" onClick={load}>
            Refresh
          </Button>
        </footer>
      </div>
    </div>
  );
}