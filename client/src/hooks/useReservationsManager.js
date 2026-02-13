// src/hooks/useReservationsManager.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useRealtime } from "@/contexts/RealtimeContext";
import { socket } from "@/realtime/socket";

import { fetchTables } from "@/api/staffTableApi";
import {
  fetchReservations,
  createReservation,
  updateReservation,
  seatReservation,
  cancelReservation,
} from "@/api/staffReservationApi";

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
 * Best UX: show warnings only for reservations happening TODAY (local),
 * even when viewing Next 7/30.
 */
export function timeSignal(reservedForISO) {
  if (!reservedForISO) return { kind: "none", label: "" };

  const now = new Date();
  const r = new Date(reservedForISO);

  // Only warn for today's reservations
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

  const [selectedDate, setSelectedDate] = useState(ymdLocal());
  const [scope, setScope] = useState("day"); // day | next7 | next30
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState("");

  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [tables, setTables] = useState([]);
  const [occupiedTableIds, setOccupiedTableIds] = useState(new Set());

  // dialogs & busy flags
  const [openCreate, setOpenCreate] = useState(false);
  const [busyCreate, setBusyCreate] = useState(false);
  const [openCancelConfirm, setOpenCancelConfirm] = useState(false);
  const [busyCancel, setBusyCancel] = useState(false);
  const [busySave, setBusySave] = useState(false);

  // mobile
  const [isMobile, setIsMobile] = useState(false);
  const [openMobileDetail, setOpenMobileDetail] = useState(false);

  // keep selection stable across reload
  const lastSelectedRef = useRef(null);
  useEffect(() => {
    lastSelectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const data = await fetchTables();
      const list = (data?.tables ?? []).map((t) => ({
        id: String(t.id || t._id),
        number: t.number,
        label: `Table ${pad2(t.number)}`,
        backendStatus: t.status,
      }));
      list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      setTables(list);

      const occ = new Set(
        list
          .filter((t) => String(t.backendStatus).toUpperCase() === "OCCUPIED")
          .map((t) => t.id),
      );
      setOccupiedTableIds(occ);
    } catch (e) {
      console.warn("Failed to load tables", e);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const fetchByScope = useCallback(async () => {
    if (scope === "day") {
      const data = await fetchReservations(selectedDate);
      return (data?.reservations ?? []).map(normalizeReservation);
    }

    const days = scope === "next7" ? 7 : 30;
    const dates = Array.from({ length: days }, (_, i) => addDaysYMD(selectedDate, i));

    const results = await Promise.all(
      dates.map((d) => fetchReservations(d).catch(() => ({ reservations: [] }))),
    );

    return results.flatMap((r) => (r?.reservations ?? [])).map(normalizeReservation);
  }, [scope, selectedDate]);

  const loadReservations = useCallback(
    async (opts = { keepSelection: true }) => {
      setError("");
      try {
        setLoading(true);

        let list = await fetchByScope();

        // sort by reservedFor asc
        list.sort(
          (a, b) => new Date(a.reservedFor).getTime() - new Date(b.reservedFor).getTime(),
        );

        setReservations(list);

        // restore selection if possible
        if (opts.keepSelection && lastSelectedRef.current) {
          const stillThere = list.some((r) => r.id === lastSelectedRef.current);
          if (stillThere) {
            setSelectedId(lastSelectedRef.current);
            return;
          }
        }

        if (!isMobile && list.length > 0) setSelectedId(list[0].id);
        else setSelectedId(null);
      } catch (e) {
        setError(e?.message || "Failed to load reservations");
        setReservations([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchByScope, isMobile],
  );

  // initial
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // reload when selectedDate or scope changes
  useEffect(() => {
    loadReservations({ keepSelection: false });
  }, [selectedDate, scope, loadReservations]);

  // realtime
  useEffect(() => {
    const id = realtime.registerStaff({
      reloadTables: null,
      reloadTickets: null,
      reloadServices: null,
    });

    const onRes = () => loadReservations({ keepSelection: true });
    const onTables = () => loadTables();

    socket.on("reservations:updated", onRes);
    socket.on("tables:updated", onTables);

    return () => {
      socket.off("reservations:updated", onRes);
      socket.off("tables:updated", onTables);
      realtime.unregisterStaff(id);
    };
  }, [realtime, loadReservations, loadTables]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!matchesSearch(r, search)) return false;
      return true;
    });
  }, [reservations, statusFilter, search]);

  const stats = useMemo(() => {
    const base = { BOOKED: 0, SEATED: 0, CANCELLED: 0, NO_SHOW: 0 };
    for (const r of reservations) {
      const s = r.status;
      if (base[s] != null) base[s] += 1;
    }
    return base;
  }, [reservations]);

  const selected = useMemo(() => {
    return (
      filtered.find((r) => r.id === selectedId) ||
      reservations.find((r) => r.id === selectedId) ||
      null
    );
  }, [filtered, reservations, selectedId]);

  // edit form derived from selected
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
    [isMobile],
  );

  // create form
  const [createForm, setCreateForm] = useState({
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: selectedDate,
    time: roundToNext15Min(),
    notes: "",
  });

  const openCreateDialog = useCallback(() => {
    const firstTableId = tables[0]?.id || "";
    setCreateForm({
      tableId: firstTableId,
      name: "",
      phone: "",
      partySize: "2",
      date: selectedDate,
      time: roundToNext15Min(),
      notes: "",
    });
    setOpenCreate(true);
  }, [tables, selectedDate]);

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

    setBusyCreate(true);
    try {
      await createReservation({
        tableId: createForm.tableId,
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(createForm.date, createForm.time),
        notes: createForm.notes?.trim() || "",
      });

      toast.success("Reservation created");
      setOpenCreate(false);

      // refresh current view
      await loadReservations({ keepSelection: true });
    } catch (e) {
      setError(e?.message || "Failed to create reservation");
    } finally {
      setBusyCreate(false);
    }
  }, [createForm, loadReservations]);

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

    setBusySave(true);
    setError("");
    try {
      await updateReservation(editForm.id, {
        tableId: editForm.tableId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        partySize: party,
        reservedFor: buildISOFromLocalDateTime(editForm.date, editForm.time),
        notes: editForm.notes ?? "",
      });

      toast.success("Reservation updated");
      await loadReservations({ keepSelection: true });
    } catch (e) {
      setError(e?.message || "Failed to update reservation");
    } finally {
      setBusySave(false);
    }
  }, [selected, editForm, loadReservations]);

  const handleSeatById = useCallback(
    async (reservationId) => {
      const r =
        reservations.find((x) => x.id === reservationId) ||
        filtered.find((x) => x.id === reservationId);
      if (!r) return;
      if (r.status !== "BOOKED") return;

      if (r.tableId && occupiedTableIds.has(r.tableId)) {
        toast.error("Table is currently occupied. Free it before seating this reservation.");
        return;
      }

      try {
        await seatReservation(r.id);

        toast("Reservation seated", {
          description: r.tableNumber != null ? `Table ${pad2(r.tableNumber)}` : "Table",
          action: {
            label: "View table",
            onClick: () => navigate(`/staff/tables/${r.tableId}`),
          },
        });

        await loadReservations({ keepSelection: true });
        await loadTables();
      } catch (e) {
        setError(e?.message || "Failed to seat reservation");
      }
    },
    [reservations, filtered, occupiedTableIds, navigate, loadReservations, loadTables],
  );

  const askCancel = useCallback(() => {
    if (!selected) return;
    setOpenCancelConfirm(true);
  }, [selected]);

  const confirmCancel = useCallback(async () => {
    if (!selected) return;

    if (selected.status !== "BOOKED") {
      toast.error("Only BOOKED reservations can be cancelled");
      setOpenCancelConfirm(false);
      return;
    }

    setBusyCancel(true);
    setError("");
    try {
      await cancelReservation(selected.id);
      toast.success("Reservation cancelled");
      setOpenCancelConfirm(false);
      await loadReservations({ keepSelection: false });
    } catch (e) {
      setError(e?.message || "Failed to cancel reservation");
    } finally {
      setBusyCancel(false);
    }
  }, [selected, loadReservations]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadReservations({ keepSelection: true }), loadTables()]);
  }, [loadReservations, loadTables]);

  const statusChips = useMemo(() => {
    return STATUS_FILTERS.map((s) => ({
      key: s,
      label: s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase().replace("_", "-"),
    }));
  }, []);

  return {
    // filters
    selectedDate,
    setSelectedDate,
    scope,
    setScope,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,

    // data
    loading,
    loadingTables,
    error,
    setError,
    reservations,
    filtered,
    stats,
    selectedId,
    setSelectedId,
    selected,
    tables,
    occupiedTableIds,

    // mobile
    isMobile,
    openMobileDetail,
    setOpenMobileDetail,

    // edit
    editForm,
    setEditForm,
    isDirty,
    busySave,
    handleSave,

    // create
    openCreate,
    setOpenCreate,
    busyCreate,
    createForm,
    setCreateForm,
    openCreateDialog,
    handleCreate,

    // cancel
    openCancelConfirm,
    setOpenCancelConfirm,
    busyCancel,
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
