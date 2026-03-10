import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell } from "lucide-react";

import { fetchTableTickets } from "../api/guestTicketsApi";
import { fetchServiceRequests } from "@/api/servicesApi";

import { useRealtime } from "../contexts/RealtimeContext.jsx";
import { useMenu } from "@/contexts/MenuContext";
import { useTab } from "@/contexts/TabContext/TabContext";

import TopBar from "../components/guest/TopBar.jsx";
import MenuPanel from "@/components/menu/MenuPanel";
import TabSummaryCard from "../components/guest/TabSummaryCard.jsx";
import CartDrawer from "../components/guest/CartDrawer.jsx";
import OrderStatusPanel from "../components/guest/OrderStatusPanel.jsx";
import RequestServiceModal from "../components/guest/RequestServiceModal.jsx";
import RequestCard from "../components/guest/RequestCard.jsx";

export default function TableGuestPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const rt = useRealtime();

  // TabContext is the source of truth for tab + table
  const {
    status,
    error,
    clearError,
    table,
    tab,
    refresh,
    addItem,
    isMutatingRef,
  } = useTab();

  const { items: menuItems, loadMenu } = useMenu();

  const [tickets, setTickets] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);

  const redirectTimer = useRef(null);

  const loadRequests = useCallback(async () => {
    if (!table?.id) return;

    setReqLoading(true);
    try {
      const data = await fetchServiceRequests({ status: "ACTIVE" });
      const all = data?.requests ?? [];
      const filtered = all.filter(
        (r) =>
          String(r.table?.id || r.table?._id || r.table) === String(table.id)
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

  // Menu loads from context
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Realtime registration uses TabContext.refresh() with mutation gating
  useEffect(() => {
    if (!table?.id) return;

    const id = rt.registerGuest({
      tableId: table.id,
      reloadTab: async () => {
        if (isMutatingRef?.current) return;
        await refresh();
      },
      reloadTickets: loadTickets,
      reloadServices: loadRequests,
      reloadMenu: () => loadMenu(),
    });

    return () => rt.unregisterGuest(id);
  }, [rt, table?.id, refresh, isMutatingRef, loadTickets, loadRequests, loadMenu]);

  async function handleAdd(menuItemId, qty = 1) {
    clearError?.();
    try {
      await addItem(menuItemId, qty);
      setCartOpen(true);
    } catch (e) {
      console.warn(e);
    }
  }

  const itemCount = useMemo(() => {
    return (tab?.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
  }, [tab?.items]);

  console.log("TableGuestPage session check", {
  tableStatus: table?.status,
  tabStatus: tab?.status,
  table,
  tab,
});

  const isClosedSession =
    tab?.status === "CLOSED" || (!tab && table?.status === "FREE");
  console.log("isClosedSession =", isClosedSession);

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

  if (status === "loading" && !table) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="text-lg font-semibold text-foreground">
              Connecting to table…
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we load your table session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isClosedSession) {
   return (
  <div className="min-h-screen bg-background text-foreground">
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 p-6">
      <div className="max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-lg backdrop-blur-sm">
        <div className="text-2xl font-semibold text-foreground">
          Thanks for visiting! 🙌
        </div>

        <div className="text-sm text-muted-foreground">
          Your table has been closed. You’ll be redirected shortly.
        </div>

        <button
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
          onClick={() => navigate("/join", { replace: true })}
          type="button"
        >
          Go now
        </button>
      </div>
    </div>
  </div>
);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
        <TopBar
          tableNumber={table?.number}
          itemCount={itemCount}
          onOpenCart={() => setCartOpen(true)}
        />

        <div className="mx-auto w-full max-w-4xl px-4 pt-4">
          <div className="space-y-6">
            <div className="animate-[fadeIn_.2s_ease-out]">
              <OrderStatusPanel tickets={tickets} />
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="animate-[fadeIn_.25s_ease-out]">
              <RequestCard
                requests={requests}
                loading={reqLoading}
                onRefresh={loadRequests}
                autoOpenOnNew
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-4xl px-4">
            <div className="h-full animate-[fadeIn_.3s_ease-out] pt-6">
              <MenuPanel menu={menuItems} onAdd={handleAdd} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setServiceModalOpen(true)}
          className="fixed bottom-14 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg ring-1 ring-black/5 transition-transform hover:brightness-110 active:scale-[0.98] dark:ring-white/10"
          aria-label="Request service"
        >
          <Bell className="h-5 w-5" />
        </button>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

        <TabSummaryCard
          tab={tab}
          onViewCart={() => setCartOpen(true)}
          onRequestBill={() => setServiceModalOpen(true)}
        />

        <RequestServiceModal
          open={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          tableId={table?.id}
          ensureTabOpen={async () => {
            await refresh();
            return tab;
          }}
        />
      </div>
    </div>
  );
}