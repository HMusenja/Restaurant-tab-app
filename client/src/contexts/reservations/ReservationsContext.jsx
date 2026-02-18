import React, { createContext, useContext, useMemo, useReducer } from "react";
import { ymdLocal, normalizeReservation } from "@/hooks/useReservationsManager";

const initialState = {
  // controls (what your page uses)
  selectedDate: ymdLocal(),
  scope: "day", // day | next7 | next30
  statusFilter: "ALL",
  search: "",

  // data
  reservations: [],
  selectedId: null,

  // tables
  tables: [],
  occupiedTableIds: [], // store as array in state (serializable)

  // busy + errors
  loading: true,
  loadingTables: false,
  error: "",

  busyCreate: false,
  busySave: false,
  busyCancel: false,
  busySeat: false,

  // dialogs
  openCreate: false,
  openCancelConfirm: false,

  lastUpdatedAt: null,
};

export const RES_TYPES = {
  SET_CONTROLS: "RES/SET_CONTROLS",
  SET_SELECTED_ID: "RES/SET_SELECTED_ID",

  SET_TABLES: "RES/SET_TABLES",
  SET_OCCUPIED_TABLE_IDS: "RES/SET_OCCUPIED_TABLE_IDS",

  SET_DIALOGS: "RES/SET_DIALOGS",

  LIST_START: "RES/LIST_START",
  LIST_SUCCESS: "RES/LIST_SUCCESS",
  LIST_ERROR: "RES/LIST_ERROR",

  TABLES_START: "RES/TABLES_START",
  TABLES_SUCCESS: "RES/TABLES_SUCCESS",
  TABLES_ERROR: "RES/TABLES_ERROR",

  CREATE_START: "RES/CREATE_START",
  CREATE_DONE: "RES/CREATE_DONE",

  SAVE_START: "RES/SAVE_START",
  SAVE_DONE: "RES/SAVE_DONE",

  CANCEL_START: "RES/CANCEL_START",
  CANCEL_DONE: "RES/CANCEL_DONE",

  SEAT_START: "RES/SEAT_START",
  SEAT_DONE: "RES/SEAT_DONE",

  UPSERT_RESERVATION: "RES/UPSERT_RESERVATION",
};

function getId(x) {
  return String(x?.id || x?._id || "");
}

function upsert(list, raw) {
  const entity = normalizeReservation(raw);
  const id = getId(entity);
  if (!id) return list;

  const idx = list.findIndex((x) => getId(x) === id);
  if (idx === -1) return [entity, ...list];

  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...entity };
  return copy;
}

function reducer(state, action) {
  switch (action.type) {
    case RES_TYPES.SET_CONTROLS:
      return { ...state, ...action.payload };

    case RES_TYPES.SET_SELECTED_ID:
      return { ...state, selectedId: action.payload };

    case RES_TYPES.SET_DIALOGS:
      return { ...state, ...action.payload };

    case RES_TYPES.LIST_START:
      return { ...state, loading: true, error: "" };

    case RES_TYPES.LIST_SUCCESS: {
      const list = (action.payload || []).map(normalizeReservation);
      // sort by reservedFor asc (same as hook)
      list.sort((a, b) => new Date(a.reservedFor) - new Date(b.reservedFor));

      return {
        ...state,
        loading: false,
        reservations: list,
        lastUpdatedAt: Date.now(),
      };
    }

    case RES_TYPES.LIST_ERROR:
      return { ...state, loading: false, error: action.payload || "Failed to load reservations" };

    case RES_TYPES.TABLES_START:
      return { ...state, loadingTables: true };

    case RES_TYPES.TABLES_SUCCESS:
      return { ...state, loadingTables: false, tables: action.payload || [] };

    case RES_TYPES.TABLES_ERROR:
      return { ...state, loadingTables: false };

    case RES_TYPES.SET_OCCUPIED_TABLE_IDS:
      return { ...state, occupiedTableIds: action.payload || [] };

    case RES_TYPES.CREATE_START:
      return { ...state, busyCreate: true, error: "" };

    case RES_TYPES.CREATE_DONE:
      return { ...state, busyCreate: false };

    case RES_TYPES.SAVE_START:
      return { ...state, busySave: true, error: "" };

    case RES_TYPES.SAVE_DONE:
      return { ...state, busySave: false };

    case RES_TYPES.CANCEL_START:
      return { ...state, busyCancel: true, error: "" };

    case RES_TYPES.CANCEL_DONE:
      return { ...state, busyCancel: false };

    case RES_TYPES.SEAT_START:
      return { ...state, busySeat: true, error: "" };

    case RES_TYPES.SEAT_DONE:
      return { ...state, busySeat: false };

    case RES_TYPES.UPSERT_RESERVATION:
      return {
        ...state,
        reservations: upsert(state.reservations, action.payload),
        lastUpdatedAt: Date.now(),
      };

    default:
      return state;
  }
}

const ReservationsContext = createContext(null);

export function ReservationsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
}

export function useReservationsContext() {
  const ctx = useContext(ReservationsContext);
  if (!ctx) throw new Error("useReservationsContext must be used within ReservationsProvider");
  return ctx;
}
