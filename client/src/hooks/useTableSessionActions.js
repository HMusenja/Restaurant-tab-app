// src/hooks/staff/useTableSessionActions.js
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { assignTable, freeTable, regenerateTableCode } from "@/api/staffTableApi";

export function useTableSessionActions({
  tableId,
  table,
  setTable,
  reload,
  onError,
  guestCount,
  onCloseNewSessionDialog,
  setRequests,
  setReservation,
}) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busyAssign, setBusyAssign] = useState(false);
  const [busyFree, setBusyFree] = useState(false);

  const handleGenerateNewCode = useCallback(async () => {
    if (!tableId) return;

    setIsGeneratingCode(true);
    onError?.("");

    try {
      const data = await regenerateTableCode(tableId);

      setTable((prev) =>
        prev
          ? {
              ...prev,
              joinCode: data?.code || prev.joinCode,
              joinCodeExpiresAt: data?.joinCodeExpiresAt
                ? new Date(data.joinCodeExpiresAt)
                : prev.joinCodeExpiresAt,
            }
          : prev
      );

      toast.success("New code generated");
    } catch (e) {
      onError?.(e?.message || "Failed to generate new code");
    } finally {
      setIsGeneratingCode(false);
    }
  }, [tableId, setTable, onError]);

  const handleCopyCode = useCallback(async () => {
    if (!table?.joinCode) {
      toast.error("No code yet. Start a session first.");
      return;
    }
    await navigator.clipboard.writeText(table.joinCode);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  }, [table?.joinCode]);

  const handleStartSession = useCallback(async () => {
    if (!tableId) return;

    setBusyAssign(true);
    onError?.("");

    try {
      const maxCap = table?.maxCapacity || 6;
      const guests = Math.max(1, Math.min(Number(guestCount) || 1, maxCap));

      const data = await assignTable(tableId, { guestCount: guests });

      toast.success("Session started");

      setTable((prev) =>
        prev
          ? {
              ...prev,
              status: "occupied",
              assignedAt: new Date(),
              guestCount: guests,
              joinCode: data?.code || prev.joinCode,
              joinUrl: data?.joinUrl || prev.joinUrl,
              activeTabId: data?.tab?._id || data?.tab?.id || prev.activeTabId,
              tabTotalCents: data?.tab?.totalCents ?? prev.tabTotalCents,
            }
          : prev
      );

      onCloseNewSessionDialog?.(false);

      await reload();
    } catch (e) {
      onError?.(e?.message || "Failed to start session");
    } finally {
      setBusyAssign(false);
    }
  }, [
    tableId,
    table?.maxCapacity,
    guestCount,
    setTable,
    reload,
    onError,
    onCloseNewSessionDialog,
  ]);

  const handleCloseTable = useCallback(async () => {
    if (!tableId) return;

    setBusyFree(true);
    onError?.("");

    try {
      await freeTable(tableId);

      setTable((prev) =>
        prev
          ? {
              ...prev,
              status: "available",
              assignedAt: null,
              activeTabId: null,
              tabTotalCents: 0,
              joinCode: null,
              joinCodeExpiresAt: null,
              joinUrl: null,
              guestCount: undefined,
            }
          : prev
      );

      setRequests?.([]);
      setReservation?.(null);

      toast.success("Table closed");
      await reload();
    } catch (e) {
      onError?.(e?.message || "Failed to close table");
    } finally {
      setBusyFree(false);
    }
  }, [tableId, setTable, reload, onError, setRequests, setReservation]);

  return {
    isGeneratingCode,
    copied,
    busyAssign,
    busyFree,
    handleGenerateNewCode,
    handleCopyCode,
    handleStartSession,
    handleCloseTable,
  };
}
