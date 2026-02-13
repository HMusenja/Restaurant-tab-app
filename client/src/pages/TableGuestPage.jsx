import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell } from "lucide-react";

import { addItemToTab } from "../api/guestApi";
import { fetchTableTickets } from "../api/guestTicketsApi";
import { fetchMenu } from "../api/menuApi";

import { useTableSession } from "../hooks/useTableSession.js";
import { useRealtime } from "../contexts/RealtimeContext.jsx";
import { optimisticAddToTab } from "@/utils/tabOptimistic";

import TopBar from "../components/guest/TopBar.jsx";
import MenuPanel from "@/components/menu/MenuPanel";
import TabSummaryCard from "../components/guest/TabSummaryCard.jsx";
import CartDrawer from "../components/guest/CartDrawer.jsx";
import OrderStatusPanel from "../components/guest/OrderStatusPanel.jsx";
import RequestServiceModal from "../components/guest/RequestServiceModal.jsx";
import { fetchServiceRequests } from "@/api/servicesApi";
import ServiceCard from "@/components/service/ServiceCard";

export default function TableGuestPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const rt = useRealtime();

  const {
    loading,
    error,
    setError,
    table,
    tab,
    setTab,
    ensureTabOpen,
    silentReload,
  } = useTableSession(token);

  const [tickets, setTickets] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);

  const addingRef = useRef(false);
  const redirectTimer = useRef(null);

  const loadRequests = useCallback(async () => {
    if (!table?.id) return;

    setReqLoading(true);
    try {
      const data = await fetchServiceRequests({ status: "ACTIVE" });
      const all = data?.requests ?? [];
      const filtered = all.filter(
        (r) =>
          String(r.table?.id || r.table?._id || r.table) === String(table.id),
      );
      setRequests(filtered);
    } catch (e) {
      console.warn("Failed to load requests", e);
    } finally {
      setReqLoading(false);
    }
  }, [table?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const loadTickets = useCallback(async () => {
    try {
      const data = await fetchTableTickets(token);

      const normalized = (data.tickets || []).map((t) => ({
        _id: t._id,
        status: t.status,
        station: t.station || "KITCHEN",
        etaMinutes: t.etaMinutes ?? null,
        createdAt: t.createdAt,
        lines: (t.items || []).map((it, idx) => ({
          _id: `${t._id}-${idx}`,
          nameSnap: it.name,
          qty: it.qty,
          status: it.status || t.status,
        })),
      }));

      setTickets(normalized);
    } catch (e) {
      console.warn(e);
    }
  }, [token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Menu load
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchMenu();
        if (alive) setMenu(data.items || []);
      } catch (e) {
        setError(e.message || "Failed to load menu");
      }
    })();

    return () => {
      alive = false;
    };
  }, [setError]);

  // ✅ Realtime registration (store id)
  useEffect(() => {
    if (!table?.id) return;

    const id = rt.registerGuest({
      tableId: table.id,
      reloadTab: async () => {
        if (addingRef.current) return;
        await silentReload();
      },
      reloadTickets: loadTickets,
      reloadServices: loadRequests,
    });

    return () => rt.unregisterGuest(id);
  }, [rt, table?.id, silentReload, loadTickets]);

  async function handleAdd(menuItemId, qty = 1) {
    setError("");
    if (addingRef.current) return;

    addingRef.current = true;

    const before = tab ? JSON.parse(JSON.stringify(tab)) : null;

    try {
      const t = await ensureTabOpen();

      const mi = menu.find((x) => String(x._id) === String(menuItemId));
      if (mi) {
        setTab((prev) => optimisticAddToTab(prev || t, { menuItem: mi, qty }));
        setCartOpen(true);
      }

      const data = await addItemToTab(t._id, menuItemId, qty);

      setTab(data.tab);
      setCartOpen(true);
    } catch (e) {
      if (before) setTab(before);
      setError(e.message || "Failed to add item");
    } finally {
      addingRef.current = false;
    }
  }

  const itemCount = useMemo(() => {
    return (tab?.items || []).reduce((sum, it) => sum + it.qty, 0);
  }, [tab]);

  const isClosedSession =
    tab?.status === "CLOSED" || (!tab && table?.status === "FREE");

  useEffect(() => {
    if (!isClosedSession) return;

    if (redirectTimer.current) clearTimeout(redirectTimer.current);

    redirectTimer.current = setTimeout(() => {
      navigate("/join", { replace: true });
    }, 60_000);

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [isClosedSession, navigate]);

  if (loading && !table) return <div className="p-6">Connecting to table…</div>;

  if (isClosedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <div className="text-2xl font-semibold">Thanks for visiting! 🙌</div>
          <div className="text-sm opacity-70">
            Your table has been closed. You’ll be redirected shortly.
          </div>

          <button
            className="mt-4 underline text-sm"
            onClick={() => navigate("/join", { replace: true })}
          >
            Go now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar
        tableNumber={table?.number}
        itemCount={itemCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className="mx-auto max-w-4xl w-full px-4 pt-4">
        <OrderStatusPanel tickets={tickets} />
        {error ? <div className="pt-3 text-red-600">{error}</div> : null}
      </div>
      <div className="mx-auto max-w-4xl w-full px-4 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Requests</div>
          <button
            className="text-sm underline opacity-70"
            onClick={loadRequests}
            type="button"
          >
            Refresh
          </button>
        </div>

        {reqLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No active requests.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <ServiceCard
                key={r.id}
                request={r}
                variant="guest"
                showTable={false}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pt-4">
        <MenuPanel menu={menu} onAdd={handleAdd} />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-4">
        <TabSummaryCard
          tab={tab}
          onViewCart={() => setCartOpen(true)}
          onRequestBill={() => setServiceModalOpen(true)}
        />
      </div>

      <button
        type="button"
        onClick={() => setServiceModalOpen(true)}
        className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg active:scale-[0.98]"
        aria-label="Request service"
      >
        <Bell className="h-6 w-6" />
      </button>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        tab={tab}
        setTab={setTab}
        setError={setError}
      />

      <RequestServiceModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        tableId={table?.id}
        ensureTabOpen={ensureTabOpen}
      />
    </div>
  );
}
