import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  useReservationsContext,
  RES_TYPES,
} from "@/contexts/reservations/ReservationsContext";
import {
  loadTables,
  loadReservationsByScope,
  createReservationAction,
  updateReservationAction,
  seatReservationAction,
  cancelReservationAction,
} from "@/contexts/reservations/reservations.actions";

import { useRealtime } from "@/contexts/RealtimeContext";
import { socket } from "@/realtime/socket";

import {
  ymdLocal,
  roundToNext15Min,
  buildISOFromLocalDateTime,
  matchesSearch,
} from "@/hooks/useReservationsManager";

import PageHeader from "@/components/reservations/PageHeader";
import StickyControls from "@/components/reservations/StickyControls";
import ReservationsList from "@/components/reservations/ReservationsList";
import ReservationDetailsCard from "@/components/reservations/ReservationDetailsCard";
import ReservationDetailPanel from "@/components/reservations/ReservationDetailPanel";
import CreateReservationDialog from "@/components/staff/tables/CreateReservationDialog";
import CancelReservationDialog from "@/components/reservations/CancelReservationDialog";
import { pad2 } from "@/components/reservations/reservation-ui";

function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {error}
    </div>
  );
}

const STATUS_FILTERS = ["ALL", "BOOKED", "SEATED", "CANCELLED", "NO_SHOW"];

export default function ManageReservationsPage() {
  const navigate = useNavigate();
  const realtime = useRealtime();
  const { state, dispatch } = useReservationsContext();

  const [openMobileDetail, setOpenMobileDetail] = useState(false);
  const lastSelectedRef = useRef(null);

  useEffect(() => {
    lastSelectedRef.current = state.selectedId;
  }, [state.selectedId]);

  const occupiedTableIds = useMemo(
    () => new Set(state.occupiedTableIds || []),
    [state.occupiedTableIds]
  );

  const setSelectedDate = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_CONTROLS,
        payload: { selectedDate: value },
      }),
    [dispatch]
  );

  const setScope = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_CONTROLS,
        payload: { scope: value },
      }),
    [dispatch]
  );

  const setStatusFilter = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_CONTROLS,
        payload: { statusFilter: value },
      }),
    [dispatch]
  );

  const setSearch = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_CONTROLS,
        payload: { search: value },
      }),
    [dispatch]
  );

  const setSelectedId = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_SELECTED_ID,
        payload: value,
      }),
    [dispatch]
  );

  const setOpenCreate = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_DIALOGS,
        payload: { openCreate: !!value },
      }),
    [dispatch]
  );

  const setOpenCancelConfirm = useCallback(
    (value) =>
      dispatch({
        type: RES_TYPES.SET_DIALOGS,
        payload: { openCancelConfirm: !!value },
      }),
    [dispatch]
  );

  const [editForm, setEditForm] = useState(null);

  const [createForm, setCreateForm] = useState({
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: state.selectedDate,
    time: roundToNext15Min(),
    notes: "",
  });

  useEffect(() => {
    setCreateForm((prev) => ({ ...prev, date: state.selectedDate }));
  }, [state.selectedDate]);

  const statusChips = useMemo(() => {
    return STATUS_FILTERS.map((status) => ({
      key: status,
      label:
        status === "ALL"
          ? "All"
          : status[0] + status.slice(1).toLowerCase().replace("_", "-"),
    }));
  }, []);

  const filtered = useMemo(() => {
    return (state.reservations || []).filter((reservation) => {
      if (
        state.statusFilter !== "ALL" &&
        reservation.status !== state.statusFilter
      ) {
        return false;
      }

      if (!matchesSearch(reservation, state.search)) {
        return false;
      }

      return true;
    });
  }, [state.reservations, state.statusFilter, state.search]);

  const stats = useMemo(() => {
    const base = { BOOKED: 0, SEATED: 0, CANCELLED: 0, NO_SHOW: 0 };

    for (const reservation of state.reservations || []) {
      if (base[reservation.status] != null) {
        base[reservation.status] += 1;
      }
    }

    return base;
  }, [state.reservations]);

  const selected = useMemo(() => {
    return (
      filtered.find((reservation) => reservation.id === state.selectedId) ||
      (state.reservations || []).find(
        (reservation) => reservation.id === state.selectedId
      ) ||
      null
    );
  }, [filtered, state.reservations, state.selectedId]);

  useEffect(() => {
    if (!selected) {
      setEditForm(null);
      return;
    }

    const reservedDate = new Date(selected.reservedFor);

    setEditForm({
      id: selected.id,
      tableId: selected.tableId || "",
      name: selected.name || "",
      phone: selected.phone || "",
      partySize: String(selected.partySize || "2"),
      date: ymdLocal(reservedDate),
      time: `${pad2(reservedDate.getHours())}:${pad2(
        reservedDate.getMinutes()
      )}`,
      notes: selected.notes || "",
      status: selected.status,
    });
  }, [selected]);

  const isDirty = useMemo(() => {
    if (!selected || !editForm) return false;

    const selectedDT = new Date(selected.reservedFor);
    const selectedDateStr = ymdLocal(selectedDT);
    const selectedTimeStr = `${pad2(selectedDT.getHours())}:${pad2(
      selectedDT.getMinutes()
    )}`;

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

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      }),
      loadTables(dispatch),
    ]);
  }, [dispatch, state.scope, state.selectedDate]);

  useEffect(() => {
    loadTables(dispatch).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    loadReservationsByScope(dispatch, {
      scope: state.scope,
      selectedDate: state.selectedDate,
    })
      .then(() => {
        const list = state.reservations || [];
        const currentId = lastSelectedRef.current;

        if (currentId && list.some((reservation) => reservation.id === currentId)) {
          setSelectedId(currentId);
        } else {
          setSelectedId(null);
        }
      })
      .catch(() => {});
  }, [state.selectedDate, state.scope, dispatch, setSelectedId]);

  useEffect(() => {
    const registrationId = realtime.registerStaff({
      reloadTables: null,
      reloadTickets: null,
      reloadServices: null,
    });

    const onReservationsUpdated = () =>
      loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      }).catch(() => {});

    const onTablesUpdated = () => loadTables(dispatch).catch(() => {});

    socket.on("reservations:updated", onReservationsUpdated);
    socket.on("tables:updated", onTablesUpdated);

    return () => {
      socket.off("reservations:updated", onReservationsUpdated);
      socket.off("tables:updated", onTablesUpdated);
      realtime.unregisterStaff(registrationId);
    };
  }, [realtime, dispatch, state.scope, state.selectedDate]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setOpenMobileDetail(false);
  }, [setSelectedId]);

  const handleDialogOpenChange = useCallback(
    (open) => {
      setOpenMobileDetail(open);
      if (!open) {
        setSelectedId(null);
      }
    },
    [setSelectedId]
  );

  const handleSelectRow = useCallback(
    (id) => {
      setSelectedId(id);

      if (window.innerWidth < 768) {
        setOpenMobileDetail(true);
      }
    },
    [setSelectedId]
  );

  const handleEditRow = useCallback(
    (id) => {
      setSelectedId(id);

      if (window.innerWidth < 768) {
        setOpenMobileDetail(true);
      }
    },
    [setSelectedId]
  );

  const handleCancelRow = useCallback(
    (id) => {
      setSelectedId(id);
      setOpenCancelConfirm(true);
    },
    [setSelectedId, setOpenCancelConfirm]
  );

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

      await loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      });
    } catch (error) {
      toast.error(error?.message || "Failed to create reservation");
    }
  }, [dispatch, createForm, state.scope, state.selectedDate, setOpenCreate]);

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

      await loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      });
    } catch (error) {
      toast.error(error?.message || "Failed to update reservation");
    }
  }, [dispatch, selected, editForm, state.scope, state.selectedDate]);

  const handleSeatById = useCallback(
    async (reservationId) => {
      const reservation =
        (state.reservations || []).find((item) => item.id === reservationId) ||
        filtered.find((item) => item.id === reservationId);

      if (!reservation) return;
      if (reservation.status !== "BOOKED") return;

      if (reservation.tableId && occupiedTableIds.has(reservation.tableId)) {
        toast.error(
          "Table is currently occupied. Free it before seating this reservation."
        );
        return;
      }

      try {
        await seatReservationAction(dispatch, reservation.id);

        toast("Reservation seated", {
          description:
            reservation.tableNumber != null
              ? `Table ${pad2(reservation.tableNumber)}`
              : "Table",
          action: {
            label: "View table",
            onClick: () => navigate(`/staff/tables/${reservation.tableId}`),
          },
        });

        await Promise.all([
          loadReservationsByScope(dispatch, {
            scope: state.scope,
            selectedDate: state.selectedDate,
          }),
          loadTables(dispatch),
        ]);
      } catch (error) {
        toast.error(error?.message || "Failed to seat reservation");
      }
    },
    [
      dispatch,
      state.reservations,
      filtered,
      occupiedTableIds,
      navigate,
      state.scope,
      state.selectedDate,
    ]
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

    try {
      await cancelReservationAction(dispatch, selected.id);
      toast.success("Reservation cancelled");
      setOpenCancelConfirm(false);

      await loadReservationsByScope(dispatch, {
        scope: state.scope,
        selectedDate: state.selectedDate,
      });

      clearSelection();
    } catch (error) {
      toast.error(error?.message || "Failed to cancel reservation");
    }
  }, [
    dispatch,
    selected,
    state.scope,
    state.selectedDate,
    setOpenCancelConfirm,
    clearSelection,
  ]);

  const headerLabel = useMemo(() => {
    const scopeLabel =
      state.scope === "day"
        ? state.selectedDate
        : state.scope === "next7"
          ? `From ${state.selectedDate} • next 7 days`
          : `From ${state.selectedDate} • next 30 days`;

    const count = state.loading ? "Loading…" : `${filtered.length} reservations`;
    return `${count} • ${scopeLabel}`;
  }, [state.loading, filtered.length, state.scope, state.selectedDate]);

  return (
    <div className="space-y-4">
      <PageHeader
        onBack={() => navigate("/staff/tables")}
        onRefresh={refreshAll}
        refreshing={state.loading || state.loadingTables}
        onCreate={openCreateDialog}
      />

      <ErrorBanner error={state.error} />

      <StickyControls
        selectedDate={state.selectedDate}
        setSelectedDate={setSelectedDate}
        scope={state.scope}
        setScope={setScope}
        search={state.search}
        setSearch={setSearch}
        statusFilter={state.statusFilter}
        setStatusFilter={setStatusFilter}
        statusChips={statusChips}
        stats={stats}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
        <div className="space-y-4">
          <ReservationsList
            loading={state.loading}
            reservations={filtered}
            headerLabel={headerLabel}
            onRefresh={refreshAll}
            refreshing={state.loading}
            selectedId={state.selectedId}
            scope={state.scope}
            occupiedTableIds={occupiedTableIds}
            onSelectRow={handleSelectRow}
            onSeatRow={handleSeatById}
            onEditRow={handleEditRow}
            onCancelRow={handleCancelRow}
          />

          {selected && editForm ? (
            <ReservationDetailsCard
              className="hidden md:block xl:hidden"
              onClose={clearSelection}
            >
              <ReservationDetailPanel
                selected={selected}
                editForm={editForm}
                setEditForm={setEditForm}
                tables={state.tables}
                occupiedTableIds={occupiedTableIds}
                loadingTables={state.loadingTables}
                scope={state.scope}
                isDirty={isDirty}
                busySave={state.busySave}
                onSave={handleSave}
                onSeat={() => handleSeatById(selected.id)}
                onAskCancel={askCancel}
              />
            </ReservationDetailsCard>
          ) : null}
        </div>

        {selected && editForm ? (
          <ReservationDetailsCard
            className="hidden xl:block"
            onClose={clearSelection}
          >
            <ReservationDetailPanel
              selected={selected}
              editForm={editForm}
              setEditForm={setEditForm}
              tables={state.tables}
              occupiedTableIds={occupiedTableIds}
              loadingTables={state.loadingTables}
              scope={state.scope}
              isDirty={isDirty}
              busySave={state.busySave}
              onSave={handleSave}
              onSeat={() => handleSeatById(selected.id)}
              onAskCancel={askCancel}
            />
          </ReservationDetailsCard>
        ) : null}
      </div>

      <CreateReservationDialog
        open={state.openCreate}
        onOpenChange={setOpenCreate}
        busy={state.busyCreate}
        tables={state.tables}
        occupiedTableIds={occupiedTableIds}
        loadingTables={state.loadingTables}
        createForm={createForm}
        setCreateForm={setCreateForm}
        onCreate={handleCreate}
      />

      <CancelReservationDialog
        open={state.openCancelConfirm}
        onOpenChange={setOpenCancelConfirm}
        busy={state.busyCancel}
        selected={selected}
        onConfirm={confirmCancel}
      />

      <DialogMobileDetail
        open={openMobileDetail && !!selected}
        onOpenChange={handleDialogOpenChange}
        selected={selected}
        editForm={editForm}
        setEditForm={setEditForm}
        tables={state.tables}
        occupiedTableIds={occupiedTableIds}
        loadingTables={state.loadingTables}
        scope={state.scope}
        isDirty={isDirty}
        busySave={state.busySave}
        onSave={handleSave}
        onSeat={() => (selected ? handleSeatById(selected.id) : null)}
        onAskCancel={askCancel}
      />
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DialogMobileDetail({
  open,
  onOpenChange,
  selected,
  editForm,
  setEditForm,
  tables,
  occupiedTableIds,
  loadingTables,
  scope,
  isDirty,
  busySave,
  onSave,
  onSeat,
  onAskCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-3xl border border-border bg-card text-foreground shadow-xl md:hidden dark:bg-[hsl(222,18%,9%)] dark:text-[hsl(40,30%,92%)] dark:border-[hsl(40,30%,85%)/12%] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]">
        <DialogHeader>
          <DialogTitle>Reservation</DialogTitle>
          <DialogDescription>
            View and manage the selected reservation
          </DialogDescription>
        </DialogHeader>

        {selected && editForm ? (
          <div className="-mx-2 sm:-mx-6 max-h-[70vh] overflow-y-auto">
            <ReservationDetailPanel
              selected={selected}
              editForm={editForm}
              setEditForm={setEditForm}
              tables={tables}
              occupiedTableIds={occupiedTableIds}
              loadingTables={loadingTables}
              scope={scope}
              isDirty={isDirty}
              busySave={busySave}
              onSave={onSave}
              onSeat={onSeat}
              onAskCancel={onAskCancel}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}