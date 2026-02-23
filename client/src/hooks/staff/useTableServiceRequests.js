// src/hooks/staff/useTableServiceRequests.js
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fetchServiceRequests, updateServiceRequest } from "@/api/servicesApi";

export function useTableServiceRequests({ tableId, onError }) {
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!tableId) return;

    setLoadingRequests(true);
    try {
      const data = await fetchServiceRequests({ status: "ACTIVE" });
      const all = data?.requests ?? data?.items ?? [];

      const filtered = all.filter((r) => {
        const rid = String(r?.table?._id || r?.table?.id || r?.table || "");
        return rid && rid === String(tableId);
      });

      setRequests(filtered);
    } catch (e) {
      console.warn("Failed to load requests", e);
    } finally {
      setLoadingRequests(false);
    }
  }, [tableId]);

  const updateRequestStatus = useCallback(
    async (requestId, status) => {
      onError?.("");
      try {
        await updateServiceRequest(requestId, { status });

        setRequests((prev) =>
          status === "DONE"
            ? prev.filter((r) => String(r._id || r.id) !== String(requestId))
            : prev.map((r) =>
                String(r._id || r.id) === String(requestId) ? { ...r, status } : r
              )
        );

        toast.success(status === "DONE" ? "Request done" : "Marked in progress");
      } catch (e) {
        onError?.(e?.message || "Failed to update request");
        loadRequests();
      }
    },
    [loadRequests, onError]
  );

  return {
    requests,
    setRequests, // exposed to preserve current "close table clears requests" behavior
    loadingRequests,
    loadRequests,
    updateRequestStatus,
  };
}
