// src/hooks/staff/useStaffTableDetailData.js
import { useCallback, useEffect, useState } from "react";

import { getTableById } from "@/api/staffTableApi";
import { normalizeTable } from "@/lib/tableDetailUtils";

export function useStaffTableDetailData({
  tableId,
  realtime,
  loadTodayReservation, // must return activeRes for normalizeTable
  setReservation, // used to clear on reservation fetch error
  loadRequests,
}) {
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!tableId) return;

    setError("");
    try {
      setLoading(true);

      let activeRes = null;
      try {
        activeRes = await loadTodayReservation?.();
      } catch (e) {
        console.warn("Failed to load reservations", e);
        setReservation?.(null);
      }

      const data = await getTableById(tableId);
      const ui = normalizeTable(data, activeRes);
      setTable(ui);

      await loadRequests?.();
    } catch (e) {
      setError(e?.message || "Failed to load table");
      setTable(null);
    } finally {
      setLoading(false);
    }
  }, [tableId, loadTodayReservation, loadRequests, setReservation]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!realtime) return;

    const id = realtime.registerStaff({
      reloadTables: reload,
      reloadTickets: reload,
      reloadServices: loadRequests || reload,
      reloadMenu: null,
    });

    return () => realtime.unregisterStaff(id);
  }, [realtime, reload, loadRequests]);

  return {
    table,
    setTable,
    loading,
    error,
    setError,
    reload,
  };
}
