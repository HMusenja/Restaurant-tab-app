import { RES_TYPES } from "./ReservationsContext";
import { fetchTables } from "@/api/staffTableApi";
import {
  fetchReservations,
  createReservation,
  updateReservation,
  seatReservation,
  cancelReservation,
} from "@/api/staffReservationApi";
import { addDaysYMD } from "@/hooks/useReservationsManager";

function msg(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

// tables loader (keeps your existing table mapping)
export async function loadTables(dispatch) {
  dispatch({ type: RES_TYPES.TABLES_START });
  try {
    const data = await fetchTables();
    const list = (data?.tables ?? []).map((t) => ({
      id: String(t.id || t._id),
      number: t.number,
      label: `Table ${String(t.number).padStart(2, "0")}`,
      backendStatus: t.status,
    }));
    list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

    const occupied = list
      .filter((t) => String(t.backendStatus).toUpperCase() === "OCCUPIED")
      .map((t) => t.id);

    dispatch({ type: RES_TYPES.TABLES_SUCCESS, payload: list });
    dispatch({ type: RES_TYPES.SET_OCCUPIED_TABLE_IDS, payload: occupied });

    return { tables: list, occupiedTableIds: occupied };
  } catch (err) {
    dispatch({ type: RES_TYPES.TABLES_ERROR });
    // do not hard-fail UI; keep it non-blocking like your hook
    console.warn("Failed to load tables", err);
    throw err;
  }
}

// reservations loader (supports day/next7/next30)
export async function loadReservationsByScope(dispatch, { scope, selectedDate }) {
  dispatch({ type: RES_TYPES.LIST_START });
  try {
    let all = [];

    if (scope === "day") {
      const data = await fetchReservations(selectedDate);
      all = data?.reservations ?? [];
    } else {
      const days = scope === "next7" ? 7 : 30;
      const dates = Array.from({ length: days }, (_, i) => addDaysYMD(selectedDate, i));

      const results = await Promise.all(
        dates.map((d) => fetchReservations(d).catch(() => ({ reservations: [] }))),
      );

      all = results.flatMap((r) => r?.reservations ?? []);
    }

    dispatch({ type: RES_TYPES.LIST_SUCCESS, payload: all });
    return all;
  } catch (err) {
    dispatch({ type: RES_TYPES.LIST_ERROR, payload: msg(err, "Failed to load reservations") });
    throw err;
  }
}

export async function createReservationAction(dispatch, body) {
  dispatch({ type: RES_TYPES.CREATE_START });
  try {
    const data = await createReservation(body);
    const r = data?.reservation ?? data;
    dispatch({ type: RES_TYPES.UPSERT_RESERVATION, payload: r });
    dispatch({ type: RES_TYPES.CREATE_DONE });
    return r;
  } catch (err) {
    dispatch({ type: RES_TYPES.LIST_ERROR, payload: msg(err, "Failed to create reservation") });
    dispatch({ type: RES_TYPES.CREATE_DONE });
    throw err;
  }
}

export async function updateReservationAction(dispatch, id, body) {
  dispatch({ type: RES_TYPES.SAVE_START });
  try {
    const data = await updateReservation(id, body);
    const r = data?.reservation ?? data;
    dispatch({ type: RES_TYPES.UPSERT_RESERVATION, payload: r });
    dispatch({ type: RES_TYPES.SAVE_DONE });
    return r;
  } catch (err) {
    dispatch({ type: RES_TYPES.LIST_ERROR, payload: msg(err, "Failed to update reservation") });
    dispatch({ type: RES_TYPES.SAVE_DONE });
    throw err;
  }
}

export async function cancelReservationAction(dispatch, id) {
  dispatch({ type: RES_TYPES.CANCEL_START });
  try {
    const data = await cancelReservation(id);
    const r = data?.reservation ?? data;
    dispatch({ type: RES_TYPES.UPSERT_RESERVATION, payload: r });
    dispatch({ type: RES_TYPES.CANCEL_DONE });
    return r;
  } catch (err) {
    dispatch({ type: RES_TYPES.LIST_ERROR, payload: msg(err, "Failed to cancel reservation") });
    dispatch({ type: RES_TYPES.CANCEL_DONE });
    throw err;
  }
}

export async function seatReservationAction(dispatch, id) {
  dispatch({ type: RES_TYPES.SEAT_START });
  try {
    const data = await seatReservation(id);
    const r = data?.reservation ?? data;
    dispatch({ type: RES_TYPES.UPSERT_RESERVATION, payload: r });
    dispatch({ type: RES_TYPES.SEAT_DONE });
    return r;
  } catch (err) {
    dispatch({ type: RES_TYPES.LIST_ERROR, payload: msg(err, "Failed to seat reservation") });
    dispatch({ type: RES_TYPES.SEAT_DONE });
    throw err;
  }
}
