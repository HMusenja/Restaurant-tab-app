import { useCallback, useEffect, useRef, useState } from "react";
import { fetchActiveTab, openTab } from "../api/guestApi";

export function useTableSession(token) {
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState(null);
  const [tab, setTab] = useState(null);
  const [error, setError] = useState("");

  const silentReloadInFlight = useRef(false);
  const hasLoadedOnce = useRef(false);

  const loadActiveTab = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const data = await fetchActiveTab(token);

        setTable(data.table);
        setTab(data.tab);
        hasLoadedOnce.current = true;
        return data;
      } catch (e) {
        if (!silent) {
          setError(e.message || "Failed to load table session");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token],
  );

  const silentReload = useCallback(async () => {
    if (silentReloadInFlight.current) return;

    silentReloadInFlight.current = true;
    try {
      return await loadActiveTab({ silent: true });
    } finally {
      silentReloadInFlight.current = false;
    }
  }, [loadActiveTab]);

  const reload = useCallback(async () => {
    return loadActiveTab();
  }, [loadActiveTab]);

  const ensureTabOpen = useCallback(async () => {
    if (tab?._id) return tab;

    const data = await openTab(token);
    setTable(data.table);
    setTab(data.tab);
    return data.tab;
  }, [tab, token]);

  useEffect(() => {
    loadActiveTab();
  }, [loadActiveTab]);

  return {
    loading: loading && !hasLoadedOnce.current, // 🔥 key improvement
    error,
    setError,
    table,
    tab,
    setTab,
    reload,
    silentReload,
    ensureTabOpen,
  };
}
