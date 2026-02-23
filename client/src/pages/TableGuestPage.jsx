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

  // ✅ TabContext is now the source of truth for tab + table
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

  // ✅ Menu loads from context
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // ✅ Realtime registration uses TabContext.refresh() with mutation gating
  useEffect(() => {
    if (!table?.id) return;

    const id = rt.registerGuest({
      tableId: table.id,
      reloadTab: async () => {
        // Prevent “stale reload fights” while user is mutating cart or sending ticket
        if (isMutatingRef?.current) return;
        await refresh();
      },
      reloadTickets: loadTickets,
      reloadServices: loadRequests,
      reloadMenu: () => loadMenu(),
    });

    return () => rt.unregisterGuest(id);
  }, [rt, table?.id, refresh, isMutatingRef, loadTickets, loadRequests, loadMenu]);

  // ✅ Add item uses TabContext action (authoritative server replace inside provider)
  async function handleAdd(menuItemId, qty = 1) {
    clearError?.();
    try {
      await addItem(menuItemId, qty);
      setCartOpen(true);
    } catch (e) {
      // error is usually set inside provider, but keep safe fallback
      console.warn(e);
    }
  }

  const itemCount = useMemo(() => {
    return (tab?.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
  }, [tab?.items]);

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

  if (status === "loading" && !table) {
    return <div className="p-6">Connecting to table…</div>;
  }

  if (isClosedSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background via-secondary/40 to-background p-6">
        <div className="max-w-md text-center space-y-4 rounded-2xl bg-card shadow-soft border border-border p-6">
          <div className="text-2xl font-semibold">Thanks for visiting! 🙌</div>
          <div className="text-sm text-muted-foreground">
            Your table has been closed. You’ll be redirected shortly.
          </div>

          <button
            className="mt-2 text-sm font-medium text-primary hover:underline"
            onClick={() => navigate("/join", { replace: true })}
          >
            Go now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background via-secondary/40 to-background overflow-hidden">
      <TopBar
        tableNumber={table?.number}
        itemCount={itemCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className="mx-auto w-full max-w-4xl px-4 pt-4 space-y-6">
        <div className="animate-[fadeIn_.2s_ease-out]">
          <OrderStatusPanel tickets={tickets} />
        </div>

        {error ? (
          <div className="rounded-xl bg-destructive/10 text-destructive p-3 text-sm border border-destructive/20">
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

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-4xl px-4">
          <div className="animate-[fadeIn_.3s_ease-out] h-full">
            <MenuPanel menu={menuItems} onAdd={handleAdd} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setServiceModalOpen(true)}
        className="fixed bottom-14 right-4 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated ring-1 ring-white/30 hover:brightness-110 active:scale-[0.98]"
        aria-label="Request service"
      >
        <Bell className="h-6 w-6" />
      </button>

      {/* ✅ CartDrawer no longer receives tab/setTab/setError/sendingRef */}
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
        // If your modal needs ensureTabOpen, TabContext should provide ensureTabOpen().
        // For now, keep it simple: refresh() guarantees you have a tab.
        ensureTabOpen={async () => {
          await refresh();
          return tab; // provider should ideally return the latest tab
        }}
      />
    </div>
  );
}
