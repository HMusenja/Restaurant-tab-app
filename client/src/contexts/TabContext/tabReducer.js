// src/contexts/TabContext/tabReducer.js

export const initialTabState = {
  status: "idle", // idle | loading | ready | error
  error: null,

  table: null, 
  tab: null, // authoritative tab (includes cart in tab.items)
  orderedLines: [], // staff view
  ticketsCount: 0, // staff view

  // request race protection (for LOAD_* only)
  activeRequestId: null,
  lastLoadedAt: null,

  // optional: helps debug / future multi-scope
  token: null,
};

export function tabReducer(state, action) {
  switch (action.type) {
    case "SET_TOKEN": {
      return { ...state, token: action.token ?? null };
    }

    case "CLEAR_ERROR": {
      return { ...state, error: null };
    }

    case "LOAD_START": {
      return {
        ...state,
        status: "loading",
        error: null,
        activeRequestId: action.requestId,
      };
    }

    case "LOAD_SUCCESS": {
      // ignore stale response
      if (state.activeRequestId !== action.requestId) return state;

      return {
        ...state,
        status: "ready",
        error: null,
         table: action.payload?.table ?? state.table ?? null,
        tab: action.payload?.tab ?? null,
        orderedLines: action.payload?.orderedLines ?? state.orderedLines ?? [],
        ticketsCount:
          typeof action.payload?.ticketsCount === "number"
            ? action.payload.ticketsCount
            : state.ticketsCount ?? 0,
        lastLoadedAt: Date.now(),
      };
    }

    case "LOAD_ERROR": {
      // ignore stale response
      if (state.activeRequestId !== action.requestId) return state;
      return { ...state, status: "error", error: action.error };
    }

    /**
     * ✅ FIX: allow provider to set tab immediately after mutations
     * Server-authoritative replace (used after add/update/remove/tip, etc.)
     */
    case "SET_TAB": {
      return {
        ...state,
        status: state.status === "idle" ? "ready" : state.status,
        error: null,
        tab: action.tab ?? null,
        lastLoadedAt: Date.now(),
      };
    }

    /**
     * Server-authoritative merge (use when realtime events or partial updates arrive)
     */
    case "MERGE_SERVER_SNAPSHOT": {
      const { tab, orderedLines, ticketsCount } = action.payload || {};
      return {
        ...state,
        tab: tab ?? state.tab,
        orderedLines: orderedLines ?? state.orderedLines,
        ticketsCount:
          typeof ticketsCount === "number" ? ticketsCount : state.ticketsCount,
        lastLoadedAt: Date.now(),
      };
    }

    // Local optimistic update for cart
    case "SET_TAB_ITEMS": {
      if (!state.tab) return state;
      return { ...state, tab: { ...state.tab, items: action.items } };
    }

    case "CLEAR_CART": {
      if (!state.tab) return state;
      return { ...state, tab: { ...state.tab, items: [] } };
    }

    default:
      return state;
  }
}
