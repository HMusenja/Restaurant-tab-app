import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { TabContext } from "./TabContext";
import { initialTabState, tabReducer } from "./tabReducer";

// Guest APIs
import {
  fetchActiveTab,
  openTab,
  addItemToTab,
  updateTabItemQty,
  removeTabItem,
  setTipPercent,
  setTipAmountCents,
} from "@/api/guestApi";

// Staff APIs
import { getTabForStaff } from "@/api/staffTabApi";

// Ticket API
import { createTicket } from "@/api/ticketApi";

import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealtimeContext";

function makeRequestId() {
  return Math.random().toString(36).slice(2);
}

function pickTableIdFromState(state) {
  // Be tolerant (different shapes depending on API)
  const t = state?.table;
  return (
    (t && (t._id || t.id)) ||
    (state?.tab && (state.tab.tableId || state.tab.table || state.tab.table?._id || state.tab.table?.id)) ||
    null
  );
}

/**
 * TabProvider
 * - mode="guest": requires token (tableToken in /t/:token)
 * - mode="staff": requires tabId (activeTabId) and uses Auth token
 */
export default function TabProvider({
  mode,
  token: guestToken,
  tableId: _tableId, // kept for future extensions
  tabId,
  children,
}) {
  const realtime = useRealtime();
  const { token: staffToken } = useAuth();
  const token = mode === "guest" ? guestToken : staffToken;

  const [state, dispatch] = useReducer(tabReducer, {
    ...initialTabState,
    token: token ?? null,
  });

  // Prevent stale reload fights with realtime callbacks
  const isMutatingRef = useRef(false);

  // Abort in-flight loads on scope change / refresh
  const abortRef = useRef(null);

  // Track realtime registration id so we can unregister cleanly
  const rtIdRef = useRef(null);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const normalizeGuestActiveTab = useCallback((res) => {
    // Expected: { table, tab } from GET /tables/:token/active-tab
    // Tolerant fallback: if server returns tab directly
    return {
      table: res?.table ?? null,
      tab: res?.tab ?? (res && res._id ? res : null),
    };
  }, []);

  const refresh = useCallback(async () => {
    // Guard by mode
    if (mode === "guest" && !token) return;
    if (mode === "staff" && !tabId) return;

    // cancel previous load
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const requestId = makeRequestId();
    dispatch({ type: "LOAD_START", requestId });

    try {
      if (mode === "guest") {
        const res = await fetchActiveTab(token, { signal: ac.signal });
        const payload = normalizeGuestActiveTab(res);
        dispatch({ type: "LOAD_SUCCESS", requestId, payload });
        return;
      }

      // STAFF: load by tabId
      // (your getTabForStaff ignores config; that's OK)
      const res = await getTabForStaff(tabId, { signal: ac.signal });

      dispatch({
        type: "LOAD_SUCCESS",
        requestId,
        payload: {
          tab: res?.tab ?? null,
          orderedLines: res?.orderedLines ?? [],
          ticketsCount: typeof res?.ticketsCount === "number" ? res.ticketsCount : 0,
        },
      });
    } catch (e) {
      if (e?.name === "AbortError") return;
      dispatch({
        type: "LOAD_ERROR",
        requestId,
        error: e?.message || "Failed to load tab",
      });
    }
  }, [mode, token, tabId, normalizeGuestActiveTab]);

  // Initial load + scope changes
  useEffect(() => {
    dispatch({ type: "SET_TOKEN", token });
    refresh();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [token, tabId, refresh]);

  /**
   * ✅ Realtime wiring
   * - guest: join table room once we know tableId (from active-tab response)
   * - staff: join staff room and refresh on tab updates via reloadTickets
   */
  useEffect(() => {
    // Always unregister previous registration on any relevant change
    if (rtIdRef.current) {
      if (mode === "guest") realtime.unregisterGuest(rtIdRef.current);
      else realtime.unregisterStaff(rtIdRef.current);
      rtIdRef.current = null;
    }

    // Don’t register if we don’t have enough scope yet
    if (mode === "guest") {
      // We need a real tableId to join table room. It arrives after first refresh.
      const tableId = pickTableIdFromState(state);
      if (!tableId) return;

      const id = realtime.registerGuest({
        tableId,
        // ✅ for guest, changes to tab or tickets should refresh tab/cart
        reloadTab: refresh,
        reloadTickets: refresh,
        reloadServices: null,
        reloadMenu: null,
      });

      rtIdRef.current = id;
      return () => {
        if (rtIdRef.current) realtime.unregisterGuest(rtIdRef.current);
        rtIdRef.current = null;
      };
    }

    // staff mode
    if (!tabId) return;

    const id = realtime.registerStaff({
      // ✅ your RealtimeProvider triggers runStaffTickets() on tab:updated via runStaffAll()
      // so we hang refresh off reloadTickets to get automatic tab updates
      reloadTickets: refresh,
      reloadServices: null,
      reloadTables: null,
      reloadMenu: null,
    });

    rtIdRef.current = id;

    return () => {
      if (rtIdRef.current) realtime.unregisterStaff(rtIdRef.current);
      rtIdRef.current = null;
    };
    // IMPORTANT: include state.table dependency so guest registration happens AFTER first load
  }, [realtime, mode, tabId, refresh, state.table, state.tab]);

  /**
   * ensureTabOpen (guest)
   * If no active tab exists yet, open it, then refresh to get authoritative state.
   */
  const ensureTabOpen = useCallback(async () => {
    if (mode !== "guest") throw new Error("ensureTabOpen only supported for guest mode");
    if (!token) throw new Error("Missing table token");

    if (state.tab?._id) return state.tab;

    isMutatingRef.current = true;
    try {
      const res = await openTab(token);
      const openedTab = res?.tab ?? res;

      if (openedTab?._id) dispatch({ type: "SET_TAB", tab: openedTab });

      await refresh();
      return openedTab;
    } finally {
      isMutatingRef.current = false;
    }
  }, [mode, token, state.tab?._id, refresh]);

  // --- Mutations (authoritative replace) ---
  const withMutationGate = useCallback(
    async (fn) => {
      clearError();
      isMutatingRef.current = true;
      try {
        return await fn();
      } catch (e) {
        dispatch({
          type: "LOAD_ERROR",
          requestId: state.activeRequestId ?? "mut",
          error: e?.message || "Action failed",
        });
        throw e;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [clearError, state.activeRequestId],
  );

  // Guest cart actions
  const addItem = useCallback(
    async (menuItemId, qty = 1) =>
      withMutationGate(async () => {
        const t = await ensureTabOpen();
        const data = await addItemToTab(t._id, menuItemId, qty);
        dispatch({ type: "SET_TAB", tab: data?.tab ?? data });
      }),
    [withMutationGate, ensureTabOpen],
  );

  const updateQty = useCallback(
    async (menuItemId, qty) =>
      withMutationGate(async () => {
        if (!state.tab?._id) throw new Error("No active tab");
        const data = await updateTabItemQty(state.tab._id, menuItemId, qty);
        dispatch({ type: "SET_TAB", tab: data?.tab ?? data });
      }),
    [withMutationGate, state.tab?._id],
  );

  const removeItem = useCallback(
    async (menuItemId) =>
      withMutationGate(async () => {
        if (!state.tab?._id) throw new Error("No active tab");
        const data = await removeTabItem(state.tab._id, menuItemId);
        dispatch({ type: "SET_TAB", tab: data?.tab ?? data });
      }),
    [withMutationGate, state.tab?._id],
  );

  const setTipPct = useCallback(
    async (pct) =>
      withMutationGate(async () => {
        if (!state.tab?._id) throw new Error("No active tab");
        const data = await setTipPercent(state.tab._id, pct);
        dispatch({ type: "SET_TAB", tab: data?.tab ?? data });
      }),
    [withMutationGate, state.tab?._id],
  );

  const setTipAmt = useCallback(
    async (cents) =>
      withMutationGate(async () => {
        if (!state.tab?._id) throw new Error("No active tab");
        const data = await setTipAmountCents(state.tab._id, cents);
        dispatch({ type: "SET_TAB", tab: data?.tab ?? data });
      }),
    [withMutationGate, state.tab?._id],
  );

  const createTicketAndClear = useCallback(
    async () =>
      withMutationGate(async () => {
        if (!state.tab?._id) throw new Error("No active tab");
        await createTicket(state.tab._id);
        await refresh();
      }),
    [withMutationGate, state.tab?._id, refresh],
  );

  const value = useMemo(
    () => ({
      status: state.status,
      error: state.error,
      token: state.token,
      table: state.table,
      tab: state.tab,
      orderedLines: state.orderedLines,
      ticketsCount: state.ticketsCount,

      clearError,

      refresh,
      ensureTabOpen,

      addItem,
      updateQty,
      removeItem,

      setTipPercent: setTipPct,
      setTipAmountCents: setTipAmt,

      createTicketAndClear,

      isMutatingRef,
    }),
    [
      state.status,
      state.error,
      state.token,
      state.table,
      state.tab,
      state.orderedLines,
      state.ticketsCount,
      clearError,
      refresh,
      ensureTabOpen,
      addItem,
      updateQty,
      removeItem,
      setTipPct,
      setTipAmt,
      createTicketAndClear,
    ],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
