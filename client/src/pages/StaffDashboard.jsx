import { useCallback, useEffect, useState } from "react";

import { OverviewStats } from "@/components/staff/OverviewStats";
import { RequestsCard } from "@/components/staff/RequestsCard";
import { TablesOverview } from "@/components/staff/TablesOverview";

import { fetchServiceRequests, updateServiceRequest } from "@/api/servicesApi";
import { useRealtime } from "@/contexts/RealtimeContext.jsx";



export default function StaffDashboardPage() {
  const rt = useRealtime();

  const [requests, setRequests] = useState([]);
  const [err, setErr] = useState("");

  const loadRequests = useCallback(async () => {
    setErr("");
    try {
      // We want OPEN + IN_PROGRESS for the card (active stuff).
      // Backend only supports filtering by single status; easiest is fetch all active + sort.
      const [openRes, progRes] = await Promise.all([
        fetchServiceRequests({ status: "ACTIVE" }),
        fetchServiceRequests({ status: "IN_PROGRESS" }),
      ]);

      const combined = [...(openRes.requests || []), ...(progRes.requests || [])];

      // sort newest first
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRequests(combined);
    } catch (e) {
      setErr(e?.message || "Failed to load requests");
    }
  }, []);

  // initial load
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // realtime: reload requests whenever staff services change
  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: null,
      reloadServices: loadRequests,
      reloadTables: null,
    });

    return () => rt.unregisterStaff(id);
  }, [rt, loadRequests]);

  const onAcknowledge = useCallback(
    async (id) => {
      try {
        await updateServiceRequest(id, { status: "IN_PROGRESS" });
        // optimistic refresh (realtime also triggers, but this makes it instant)
        loadRequests();
      } catch (e) {
        setErr(e?.message || "Failed to acknowledge request");
      }
    },
    [loadRequests],
  );

  const onComplete = useCallback(
    async (id) => {
      try {
        await updateServiceRequest(id, { status: "DONE" });
        loadRequests();
      } catch (e) {
        setErr(e?.message || "Failed to complete request");
      }
    },
    [loadRequests],
  );

  return (
     <div className="space-y-6">
        <OverviewStats />

        {err ? <div className="text-sm text-destructive">{err}</div> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <RequestsCard
            requests={requests}
            onAcknowledge={onAcknowledge}
            onComplete={onComplete}
          />

          <TablesOverview />
        </div>
      </div>
    
  );
}
