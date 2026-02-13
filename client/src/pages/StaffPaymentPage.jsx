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

export default function StaffPaymentPage() {
  const { tabId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState(null);
  const [method, setMethod] = useState("CASH"); // CASH | CARD
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await getTabForStaff(tabId);
      setTab(data.tab);
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

  const totalCents = useMemo(() => {
    // prefer totalCents but fall back safely
    return tab?.totalCents ?? tab?.subtotalCents ?? 0;
  }, [tab]);

  async function handlePay() {
    setError("");
    setBusy(true);
    try {
      const data = await payTab(tabId, method); // expects { tab }
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
} catch (e) {
  const msg =
    e?.response?.data?.message ||
    "Cannot close tab while requests are still open";

  setError(msg);
} finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  const tableNumber = tab?.table?.number ?? "?";
  const status = tab?.status;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="text-sm">Table {tableNumber}</div>
        <div className="text-lg font-semibold">Payment</div>
        <div className="text-sm opacity-70">Status: {status}</div>
      </div>
  

      {/* Error */}
      {error ? <div className="p-4 text-sm text-red-600">{error}</div> : null}

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Items */}
        <div className="border rounded-xl p-4">
          <div className="font-semibold">Items</div>

          {!tab?.items?.length ? (
            <div className="mt-2 text-sm opacity-70">No items.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {tab.items.map((it, idx) => (
                <div
                  key={it._id || idx}
                  className="flex justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 truncate">
                    {it.nameSnap || it.name || "Item"}{" "}
                    {it.qty > 1 ? `×${it.qty}` : ""}
                  </div>
                  <div className="shrink-0">
                    {formatEUR(
                      (it.priceCentsSnap ?? it.priceCents ?? 0) * (it.qty || 0),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span>Total</span>
            <span className="font-semibold">{formatEUR(totalCents)}</span>
          </div>
        </div>

        {/* Payment method (only if OPEN) */}
        {status === "OPEN" ? (
          <div className="border rounded-xl p-4 space-y-3">
            <div className="font-semibold">Payment Method</div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={method === "CASH" ? "default" : "secondary"}
                onClick={() => setMethod("CASH")}
              >
                Cash
              </Button>
              <Button
                type="button"
                variant={method === "CARD" ? "default" : "secondary"}
                onClick={() => setMethod("CARD")}
              >
                Card
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={handlePay}
              disabled={busy || !tab?.items?.length}
            >
              {busy
                ? "Processing…"
                : `Confirm Payment (${formatEUR(totalCents)})`}
            </Button>
          </div>
        ) : null}

        {/* Close tab (only if PAID) */}
        {status === "PAID" ? (
          <div className="border rounded-xl p-4 space-y-3">
            <div className="text-sm opacity-70">
              Payment recorded. You can now close the tab and free the table.
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleCloseTab}
              disabled={busy}
            >
              {busy ? "Closing…" : "Close Tab"}
            </Button>
          </div>
        ) : null}

        {/* If CLOSED */}
        {status === "CLOSED" ? (
          <div className="border rounded-xl p-4">
            <div className="text-sm opacity-70">This tab is closed.</div>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => navigate("/staff")}
            >
              Back to Dashboard
            </Button>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
