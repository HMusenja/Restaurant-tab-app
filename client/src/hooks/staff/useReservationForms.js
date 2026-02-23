// src/hooks/staff/useReservationForms.js
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { fetchTables } from "@/api/staffTableApi";
import { createReservation, updateReservation } from "@/api/staffReservationApi";
import {
  buildISOFromLocalDateTime,
  todayYMD,
  toLocalDateYYYYMMDD,
  toLocalTimeHHMM,
} from "@/lib/tableDetailUtils";

export function useReservationForms({ tableId, reservation, reload, onError }) {
  // Create reservation (ANY DAY)
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const [busyCreateReservation, setBusyCreateReservation] = useState(false);
  const [resForm, setResForm] = useState({
    name: "",
    phone: "",
    partySize: "2",
    date: todayYMD(),
    time: toLocalTimeHHMM(new Date()),
    notes: "",
  });

  // Edit reservation (only for BOOKED, any day, move table allowed)
  const [showEditReservation, setShowEditReservation] = useState(false);
  const [busyEditReservation, setBusyEditReservation] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    tableId: "",
    name: "",
    phone: "",
    partySize: "2",
    date: todayYMD(),
    time: toLocalTimeHHMM(new Date()),
    notes: "",
  });

  // table list for moving reservation
  const [allTables, setAllTables] = useState([]);
  const [loadingTablesForMove, setLoadingTablesForMove] = useState(false);

  const loadTablesForMove = useCallback(async () => {
    setLoadingTablesForMove(true);
    try {
      const data = await fetchTables();
      const list = data?.tables ?? [];

      const mapped = list
        .map((t) => ({
          id: String(t.id || t._id),
          number: t.number,
          label: `Table ${String(t.number).padStart(2, "0")}`,
        }))
        .sort((a, b) => a.number - b.number);

      setAllTables(mapped);
    } catch (e) {
      console.warn("Failed to load tables list for moving reservation", e);
      setAllTables([]);
    } finally {
      setLoadingTablesForMove(false);
    }
  }, []);

  const handleCreateReservation = useCallback(async () => {
    onError?.("");
    if (!tableId) return;

    const partySizeNum = Number(resForm.partySize);
    if (
      !resForm.name.trim() ||
      !resForm.phone.trim() ||
      !partySizeNum ||
      !resForm.date ||
      !resForm.time
    ) {
      toast.error("Fill name, phone, party size, date, and time");
      return;
    }

    setBusyCreateReservation(true);
    try {
      const reservedForISO = buildISOFromLocalDateTime(resForm.date, resForm.time);

      await createReservation({
        tableId,
        name: resForm.name.trim(),
        phone: resForm.phone.trim(),
        partySize: partySizeNum,
        reservedFor: reservedForISO,
        notes: resForm.notes?.trim() || "",
      });

      toast.success("Reservation created");
      setShowCreateReservation(false);
      setResForm({
        name: "",
        phone: "",
        partySize: "2",
        date: todayYMD(),
        time: toLocalTimeHHMM(new Date()),
        notes: "",
      });

      await reload();
    } catch (e) {
      onError?.(e?.message || "Failed to create reservation");
    } finally {
      setBusyCreateReservation(false);
    }
  }, [tableId, resForm, reload, onError]);

  const openEditReservation = useCallback(async () => {
    if (!reservation) return;

    if (!allTables.length) await loadTablesForMove();

    setEditForm({
      id: reservation.id,
      tableId: reservation.tableId || tableId,
      name: reservation.name || "",
      phone: reservation.phone || "",
      partySize: String(reservation.partySize ?? "2"),
      date: toLocalDateYYYYMMDD(reservation.reservedFor),
      time: toLocalTimeHHMM(reservation.reservedFor),
      notes: reservation.notes || "",
    });

    setShowEditReservation(true);
  }, [reservation, allTables.length, loadTablesForMove, tableId]);

  const handleEditReservation = useCallback(async () => {
    if (!editForm.id) return;

    const partySizeNum = Number(editForm.partySize);
    if (
      !editForm.name.trim() ||
      !editForm.phone.trim() ||
      !partySizeNum ||
      !editForm.date ||
      !editForm.time ||
      !editForm.tableId
    ) {
      toast.error("Fill name, phone, party size, table, date, and time");
      return;
    }

    setBusyEditReservation(true);
    onError?.("");
    try {
      const reservedForISO = buildISOFromLocalDateTime(editForm.date, editForm.time);

      await updateReservation(editForm.id, {
        tableId: editForm.tableId,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        partySize: partySizeNum,
        reservedFor: reservedForISO,
        notes: editForm.notes ?? "",
      });

      toast.success("Reservation updated");
      setShowEditReservation(false);
      await reload();
    } catch (e) {
      onError?.(e?.message || "Failed to update reservation");
    } finally {
      setBusyEditReservation(false);
    }
  }, [editForm, reload, onError]);

  return {
    // create
    showCreateReservation,
    setShowCreateReservation,
    busyCreateReservation,
    resForm,
    setResForm,
    handleCreateReservation,

    // edit
    showEditReservation,
    setShowEditReservation,
    busyEditReservation,
    editForm,
    setEditForm,
    openEditReservation,
    handleEditReservation,

    // move list
    allTables,
    loadingTablesForMove,
    loadTablesForMove,
  };
}
