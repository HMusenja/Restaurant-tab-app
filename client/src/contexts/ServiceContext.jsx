import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchServiceRequests, updateServiceRequest } from "@/api/servicesApi";
import { useRealtime } from "@/contexts/RealtimeContext";

const ServiceContext = createContext(null);

function normalizeRequest(r) {
  // Your backend returns:
  // { id, type, status, note, createdAt, updatedAt, table: {id, number}, tab }
  return {
    id: String(r.id || r._id),
    type: String(r.type || "").toUpperCase(),
    status: String(r.status || "").toUpperCase(),
    note: r.note || "",
    createdAt: r.createdAt || null,
    updatedAt: r.updatedAt || null,
    table: r.table
      ? { id: String(r.table.id || r.table._id), number: r.table.number }
      : null,
    tab: r.tab || null,
    raw: r,
  };
}

export function ServiceProvider({ children }) {
  const rt = useRealtime();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // global query state (used by StaffRequestsPage most often)
  // default ACTIVE so OPEN + IN_PROGRESS are visible
  const [query, setQuery] = useState({
    status: "ACTIVE", // ACTIVE | OPEN | IN_PROGRESS | DONE
    type: "", // optional: BILL | WATER | HELP | OTHER
    sinceMinutes: 360,
  });

  // avoid overlapping reload races
  const inflight = useRef(0);

  const reload = useCallback(
    async (overrides = {}) => {
      const q = { ...query, ...overrides };
      setError("");
      setLoading(true);

      const myRun = ++inflight.current;

      try {
        const data = await fetchServiceRequests({
          ...(q.status ? { status: q.status } : {}),
          ...(q.type ? { type: q.type } : {}),
          ...(q.sinceMinutes != null ? { sinceMinutes: q.sinceMinutes } : {}),
        });

        // ignore older responses
        if (myRun !== inflight.current) return;

        setRequests((data?.requests ?? []).map(normalizeRequest));
      } catch (e) {
        if (myRun !== inflight.current) return;
        setError(e?.message || "Failed to load service requests");
      } finally {
        if (myRun === inflight.current) setLoading(false);
      }
    },
    [query],
  );

  // update request status with optimistic UI
  const setStatus = useCallback(
    async (id, status) => {
      setError("");
      const next = String(status || "").toUpperCase();

      // optimistic update
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));

      try {
        await updateServiceRequest(id, { status: next });
        // we can reload to ensure filters apply correctly (ACTIVE etc.)
        // but keep it light: only reload if it might disappear from current view
        if (query.status && query.status !== "ALL") {
          // if query is ACTIVE and we set DONE, it should disappear -> reload
          if (query.status === "ACTIVE" && next === "DONE") {
            reload();
          }
          // if query is OPEN and we set IN_PROGRESS, it should disappear -> reload
          if (query.status === "OPEN" && next !== "OPEN") {
            reload();
          }
        }
      } catch (e) {
        setError(e?.message || "Failed to update request");
        reload(); // rollback by refetch
      }
    },
    [query.status, reload],
  );

  // initial load + whenever query changes
  useEffect(() => {
    reload();
  }, [reload]);

  // realtime wiring (one place for whole app)
  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: null,
      reloadTables: null,
      reloadServices: () => reload(),
    });
    return () => rt.unregisterStaff(id);
  }, [rt, reload]);

  const value = useMemo(
    () => ({
      requests,
      loading,
      error,

      // filters/query
      query,
      setQuery, // allow pages to change global filters
      reload, // allow manual reload or per-page overrides

      // actions
      setStatus,
    }),
    [requests, loading, error, query, reload, setStatus],
  );

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useServices() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices must be used inside <ServiceProvider />");
  return ctx;
}
