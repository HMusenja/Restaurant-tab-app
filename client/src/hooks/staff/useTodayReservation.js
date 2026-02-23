// src/hooks/staff/useTodayReservation.js
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { fetchReservations, seatReservation, cancelReservation } from "@/api/staffReservationApi";
import { pickActiveReservationForTable, todayYMD } from "@/lib/tableDetailUtils";

export function useTodayReservation({ tableId, tableBackendStatus, onError }) {
  const [reservation, setReservation] = useState(null);
  const [busySeat, setBusySeat] = useState(false);
  const [busyCancelRes, setBusyCancelRes] = useState(false);

  const loadTodayReservation = useCallback(async () => {
    if (!tableId) return null;

    const date = todayYMD();
    const data = await fetchReservations(date);
    const all = data?.reservations ?? [];
    const active = pickActiveReservationForTable(all, tableId);

    setReservation(
      active
        ? {
            id: String(active._id || active.id),
            tableId: String(
              active?.table?._id || active?.table?.id || active?.table || tableId
            ),
            name: active.name,
            phone: active.phone,
            partySize: active.partySize,
            reservedFor: active.reservedFor,
            status: active.status,
            notes: active.notes ?? "",
          }
        : null
    );

    return active || null; // IMPORTANT: reload uses this for normalizeTable()
  }, [tableId]);

  const reservationTimeLabel = useMemo(() => {
    if (!reservation?.reservedFor) return "—";
    return new Date(reservation.reservedFor).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [reservation?.reservedFor]);

  const reservationDateLabel = useMemo(() => {
    if (!reservation?.reservedFor) return "—";
    return new Date(reservation.reservedFor).toLocaleDateString("de-DE");
  }, [reservation?.reservedFor]);

  const canSeat = useMemo(() => {
    if (!reservation) return false;
    if (String(reservation.status) !== "BOOKED") return false;
    if (tableBackendStatus === "OCCUPIED") return false;
    return true;
  }, [reservation, tableBackendStatus]);

  const canEdit = useMemo(() => {
    return !!reservation && String(reservation.status) === "BOOKED";
  }, [reservation]);

  // To avoid circular deps, seat/cancel accept reloadFn
  const seat = useCallback(
    async (reloadFn) => {
      if (!reservation?.id) return;

      setBusySeat(true);
      onError?.("");
      try {
        await seatReservation(reservation.id);
        toast.success("Reservation seated");
        await reloadFn?.();
      } catch (e) {
        onError?.(e?.message || "Failed to seat reservation");
      } finally {
        setBusySeat(false);
      }
    },
    [reservation?.id, onError]
  );

  const cancel = useCallback(
    async (reloadFn) => {
      if (!reservation?.id) return;

      setBusyCancelRes(true);
      onError?.("");
      try {
        await cancelReservation(reservation.id);
        toast.success("Reservation cancelled");
        await reloadFn?.();
      } catch (e) {
        onError?.(e?.message || "Failed to cancel reservation");
      } finally {
        setBusyCancelRes(false);
      }
    },
    [reservation?.id, onError]
  );

  return {
    reservation,
    setReservation,
    busySeat,
    busyCancelRes,
    loadTodayReservation,
    reservationTimeLabel,
    reservationDateLabel,
    canSeat,
    canEdit,
    seat,
    cancel,
  };
}
