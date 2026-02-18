// src/hooks/useReservationsManager.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useRealtime } from "@/contexts/RealtimeContext";
import { socket } from "@/realtime/socket";

import { useReservationsContext, RES_TYPES } from "@/contexts/reservations/ReservationsContext";
import {
  loadTables as loadTablesAction,
  loadReservationsByScope,
  createReservationAction,
  updateReservationAction,
  seatReservationAction,
  cancelReservationAction,
} from "@/contexts/reservations/reservations.actions";

/* --------------------------- date/time utils --------------------------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function ymdLocal(d = new Date()) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function addDaysYMD(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(12, 0, 0, 0);
  dt.setDate(dt.getDate() + days);
  return ymdLocal(dt);
}

export function roundToNext15Min(d = new Date()) {
  const dt = new Date(d);
  const mins = dt.getMinutes();
  const rounded = Math.ceil(mins / 15) * 15;
  if (rounded === 60) {
    dt.setHours(dt.getHours() + 1);
    dt.setMinutes(0, 0, 0);
  } else {
    dt.setMinutes(rounded, 0, 0);
  }
  return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

export function buildISOFromLocalDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

export function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE");
}

/* --------------------------- reservation utils --------------------------- */

export function normalizeReservation(r) {
  const tableId = String(r?.table?._id || r?.table?.id || r?.table || "");
  const tableNumber = r?.table?.number ?? null;

  return {
    id: String(r._id || r.id),
    tableId,
    tableNumber,
    name: r.name || "",
    phone: r.phone || "",
    partySize: Number(r.partySize || 0),
    reservedFor: r.reservedFor,
    status: String(r.status || "BOOKED").toUpperCase(),
    notes: r.notes || "",
    createdAt: r.createdAt || null,
    updatedAt: r.updatedAt || null,
  };
}

export function matchesSearch(r, q) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  if (!s) return true;

  const table = r.tableNumber != null ? `table ${pad2(r.tableNumber)}` : "";
  return (
    r.name.toLowerCase().includes(s) ||
    r.phone.toLowerCase().includes(s) ||
    table.includes(s) ||
    String(r.tableNumber || "").includes(s)
  );
}

/**
 * Time warning pills:
 * show warnings only for reservations happening TODAY (local)
 */
export function timeSignal(reservedForISO) {
  if (!reservedForISO) return { kind: "none", label: "" };

  const now = new Date();
  const r = new Date(reservedForISO);

  if (ymdLocal(r) !== ymdLocal(now)) return { kind: "none", label: "" };

  const diffMin = Math.floor((r.getTime() - now.getTime()) / 60000);

  if (diffMin > 60) return { kind: "none", label: "" };
  if (diffMin > 0) return { kind: "upcoming", label: `Upcoming in ${diffMin}m` };

  const late = Math.abs(diffMin);
  if (late <= 15) return { kind: "late", label: `Late ${late}m` };
  return { kind: "overdue", label: `Late ${late}m` };
}

/* ------------------------------------------------------------------ */
/* Hook */
/* ------------------------------------------------------------------ */

export const STATUS_FILTERS = ["ALL", "BOOKED", "SEATED", "CANCELLED", "NO_SHOW"];
export const SCOPE_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "next7", label: "Next 7 days" },
  { value: "next30", label: "Next 30 days" },
];

export function useReservationsManager() {
  const navigate = useNavigate();
  const realtime = useRealtime();

  const { state, dispatch } = useReservationsContext();

  // Local UI-only state (keep it here for now)
  const [isMobile, setIsMobile] = useState(false);
  const [openMobileDetail, setOpenMobileDetail] = useState(false);

  // keep selection stable across reload
  const lastSelectedRef = useRef(null);
  useEffect(() => {
    lastSelectedRef.current = state.selectedId;
  }, [state.selectedId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // setters (dispatch-based) - page API stays the same
  const setSelectedDate = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { selectedDate: v } }),
    [dispatch],
  );
  const setScope = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { scope: v } }),
    [dispatch],
  );
  const setStatusFilter = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { statusFilter: v } }),
    [dispatch],
  );
  const setSearch = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_CONTROLS, payload: { search: v } }),
    [dispatch],
  );

  const setSelectedId = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_SELECTED_ID, payload: v }),
    [dispatch],
  );

  const setError = useCallback(
    (v) => dispatch({ type: RES_TYPES.LIST_ERROR, payload: v || "" }),
    [dispatch],
  );

  // dialogs
  const setOpenCreate = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_DIALOGS, payload: { openCreate: !!v } }),
    [dispatch],
  );
  const setOpenCancelConfirm = useCallback(
    (v) => dispatch({ type: RES_TYPES.SET_DIALOGS, payload: { openCancelConfirm: !!v } }),
    [dispatch],
  );

  // computed set -> matches existing hook signature
  const occupiedTableIds = useMemo(() => new Set(state.occupiedTableIds || []), [state.occupiedTableIds]);

  const loadTables = useCallback(async () => {
    await loadTablesAction(dispatch);
  }, [dispatch]);

  const loadReservations = useCallback(
    async (opts = { keepSelection: true }) => {
      setError("");
      await loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      });

      // selection restore behavior (same as before)
      const list = state.reservations; // NOTE: state updates async; we re-evaluate in effect below
      if (!opts.keepSelection) {
        // handled by effect below for correctness
      } else {
        // handled by effect below
      }

      return list;
    },
    [dispatch, state.scope, state.selectedDate, setError],
  );

  // initial load tables
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // reload when selectedDate or scope changes
  useEffect(() => {
    loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate })
      .then(() => {
        // after reservations are in state, apply selection rules
        // keep selection if possible
        const list = (state.reservations || []).slice();
        if (lastSelectedRef.current) {
          const stillThere = list.some((r) => r.id === lastSelectedRef.current);
          if (stillThere) {
            dispatch({ type: RES_TYPES.SET_SELECTED_ID, payload: lastSelectedRef.current });
            return;
          }
        }
        if (!isMobile && list.length > 0) dispatch({ type: RES_TYPES.SET_SELECTED_ID, payload: list[0].id });
        else dispatch({ type: RES_TYPES.SET_SELECTED_ID, payload: null });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedDate, state.scope, dispatch, isMobile]);

  // realtime
  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables: null,
      reloadTickets: null,
      reloadServices: null,
    });

    const onRes = () =>
      loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate }).catch(() => {});
    const onTables = () => loadTablesAction(dispatch).catch(() => {});

    socket.on("reservations:updated", onRes);
    socket.on("tables:updated", onTables);

    return () => {
      socket.off("reservations:updated", onRes);
      socket.off("tables:updated", onTables);
      realtime.unregisterStaff(id);
    };
  }, [realtime, dispatch, state.scope, state.selectedDate]);

  const filtered = useMemo(() => {
    return (state.reservations || []).filter((r) => {
      if (state.statusFilter !== "ALL" && r.status !== state.statusFilter) return false;
      if (!matchesSearch(r, state.search)) return false;
      return true;
    });
  }, [state.reservations, state.statusFilter, state.search]);

  const stats = useMemo(() => {
    const base = { BOOKED: 0, SEATED: 0, CANCELLED: 0, NO_SHOW: 0 };
    for (const r of state.reservations || []) {
      const s = r.status;
      if (base[s] != null) base[s] += 1;
    }
    return base;
  }, [state.reservations]);

  const selected = useMemo(() => {
    return (
      filtered.find((r) => r.id === state.selectedId) ||
      (state.reservations || []).find((r) => r.id === state.selectedId) ||
      null
    );
  }, [filtered, state.reservations, state.selectedId]);

  // edit form derived from selected (still local for now)
  const [editForm, setEditForm] = useState(null);
  useEffect(() => {
    if (!selected) {
      setEditForm(null);
      return;
    }
    const d = new Date(selected.reservedFor);
    setEditForm({
      id: selected.id,
      tableId: selected.tableId || "",
      name: selected.name || "",
      phone: selected.phone || "",
      partySize: String(selected.partySize || "2"),
      date: ymdLocal(d),
      time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
      notes: selected.notes || "",
      status: selected.status,
    });
  }, [selected]);

  const isDirty = useMemo(() => {
    if (!selected || !editForm) return false;
    const selectedDT = new Date(selected.reservedFor);
    const selectedDateStr = ymdLocal(selectedDT);
    const selectedTimeStr = `${pad2(selectedDT.getHours())}:${pad2(selectedDT.getMinutes())}`;

    return (
      editForm.tableId !== (selected.tableId || "") ||
      editForm.name !== (selected.name || "") ||
      editForm.phone !== (selected.phone || "") ||
      String(editForm.partySize) !== String(selected.partySize || "") ||
      editForm.date !== selectedDateStr ||
      editForm.time !== selectedTimeStr ||
      editForm.notes !== (selected.notes || "")
    );
  }, [selected, editForm]);

  const handleSelectRow = useCallback(
    (id) => {
      setSelectedId(id);
      if (isMobile) setOpenMobileDetail(true);
    },
    [isMobile, setSelectedId],
  );

  // create form (still local)
  const [createForm, setCreateForm] = useState({
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: state.selectedDate,
    time: roundToNext15Min(),
    notes: "",
  });

  // keep createForm.date in sync when selectedDate changes
  useEffect(() => {
    setCreateForm((p) => ({ ...p, date: state.selectedDate }));
  }, [state.selectedDate]);

  const openCreateDialog = useCallback(() => {
    const firstTableId = state.tables?.[0]?.id || "";
    setCreateForm({
      tableId: firstTableId,
      name: "",
      phone: "",
      partySize: "2",
      date: state.selectedDate,
      time: roundToNext15Min(),
      notes: "",
    });
    setOpenCreate(true);
  }, [state.tables, state.selectedDate, setOpenCreate]);

  const handleCreate = useCallback(async () => {
    setError("");
    const party = Number(createForm.partySize);

    if (
      !createForm.tableId ||
      !createForm.name.trim() ||
      !createForm.phone.trim() ||
      !party ||
      !createForm.date ||
      !createForm.time
    ) {
      toast.error("Fill table, name, phone, party size, date and time");
      return;
    }

    try {
      await createReservationAction(dispatch, {
        tableId: createForm.tableId,
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(createForm.date, createForm.time),
        notes: createForm.notes?.trim() || "",
      });

      toast.success("Reservation created");
      setOpenCreate(false);

      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      setError(e?.message || "Failed to create reservation");
    }
  }, [dispatch, createForm, state.scope, state.selectedDate, setOpenCreate, setError]);

  const handleSave = useCallback(async () => {
    if (!selected || !editForm) return;
    if (selected.status !== "BOOKED") {
      toast.error("Only BOOKED reservations can be edited");
      return;
    }

    const party = Number(editForm.partySize);
    if (
      !editForm.tableId ||
      !editForm.name.trim() ||
      !editForm.phone.trim() ||
      !party ||
      !editForm.date ||
      !editForm.time
    ) {
      toast.error("Fill table, name, phone, party size, date and time");
      return;
    }

    setError("");
    try {
      await updateReservationAction(dispatch, editForm.id, {
        tableId: editForm.tableId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(editForm.date, editForm.time),
        notes: editForm.notes ?? "",
      });

      toast.success("Reservation updated");
      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      setError(e?.message || "Failed to update reservation");
    }
  }, [dispatch, selected, editForm, state.scope, state.selectedDate, setError]);

  const handleSeatById = useCallback(
    async (reservationId) => {
      const r =
        (state.reservations || []).find((x) => x.id === reservationId) ||
        filtered.find((x) => x.id === reservationId);
      if (!r) return;
      if (r.status !== "BOOKED") return;

      if (r.tableId && occupiedTableIds.has(r.tableId)) {
        toast.error("Table is currently occupied. Free it before seating this reservation.");
        return;
      }

      try {
        await seatReservationAction(dispatch, r.id);

        toast("Reservation seated", {
          description: r.tableNumber != null ? `Table ${pad2(r.tableNumber)}` : "Table",
          action: {
            label: "View table",
            onClick: () => navigate(`/staff/tables/${r.tableId}`),
          },
        });

        await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
        await loadTablesAction(dispatch);
      } catch (e) {
        setError(e?.message || "Failed to seat reservation");
      }
    },
    [dispatch, state.reservations, filtered, occupiedTableIds, navigate, state.scope, state.selectedDate, setError],
  );

  const askCancel = useCallback(() => {
    if (!selected) return;
    setOpenCancelConfirm(true);
  }, [selected, setOpenCancelConfirm]);

  const confirmCancel = useCallback(async () => {
    if (!selected) return;

    if (selected.status !== "BOOKED") {
      toast.error("Only BOOKED reservations can be cancelled");
      setOpenCancelConfirm(false);
      return;
    }

    setError("");
    try {
      await cancelReservationAction(dispatch, selected.id);
      toast.success("Reservation cancelled");
      setOpenCancelConfirm(false);
      await loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate });
    } catch (e) {
      setError(e?.message || "Failed to cancel reservation");
    }
  }, [dispatch, selected, state.scope, state.selectedDate, setOpenCancelConfirm, setError]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadReservationsByScope(dispatch, { scope: state.scope, selectedDate: state.selectedDate }),
      loadTablesAction(dispatch),
    ]);
  }, [dispatch, state.scope, state.selectedDate]);

  const statusChips = useMemo(() => {
    return STATUS_FILTERS.map((s) => ({
      key: s,
      label: s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase().replace("_", "-"),
    }));
  }, []);

  return {
    // filters
    selectedDate: state.selectedDate,
    setSelectedDate,
    scope: state.scope,
    setScope,
    statusFilter: state.statusFilter,
    setStatusFilter,
    search: state.search,
    setSearch,

    // data
    loading: state.loading,
    loadingTables: state.loadingTables,
    error: state.error,
    setError,
    reservations: state.reservations,
    filtered,
    stats,
    selectedId: state.selectedId,
    setSelectedId,
    selected,
    tables: state.tables,
    occupiedTableIds,

    // mobile
    isMobile,
    openMobileDetail,
    setOpenMobileDetail,

    // edit
    editForm,
    setEditForm,
    isDirty,
    busySave: state.busySave,
    handleSave,

    // create
    openCreate: state.openCreate,
    setOpenCreate,
    busyCreate: state.busyCreate,
    createForm,
    setCreateForm,
    openCreateDialog,
    handleCreate,

    // cancel
    openCancelConfirm: state.openCancelConfirm,
    setOpenCancelConfirm,
    busyCancel: state.busyCancel,
    askCancel,
    confirmCancel,

    // actions
    loadReservations,
    loadTables,
    refreshAll,
    handleSelectRow,
    handleSeatById,

    // navigation helper
    navigate,
  };
}
