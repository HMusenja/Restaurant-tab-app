import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearReadNotifications,
  clearAllNotifications,
  fetchNotificationPreferences,
  patchNotificationPreferences,
} from "@/api/notificationsApi";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsContext = createContext(null);

function atKey(at) {
  try {
    if (!at) return "";
    return new Date(at).toISOString();
  } catch {
    return "";
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const rt = useRealtime();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);

  // 🔥 id -> isoKey of newest update line
  const [highlightMap, setHighlightMap] = useState({});

  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const nextCursorRef = useRef(null);

  // ------------------------
  // Load Inbox
  // ------------------------
  async function loadNotifications({ reset = false, limit = 30 } = {}) {
    if (!user) return;

    setLoadingInbox(true);
    setError("");

    try {
      const data = await fetchNotifications({
        unreadOnly: false,
        limit,
        cursor: reset ? null : nextCursorRef.current,
      });

      const items = data?.items || [];

      if (reset) setNotifications(items);
      else setNotifications((prev) => [...prev, ...items]);

      nextCursorRef.current = data?.nextCursor || null;
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (e) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoadingInbox(false);
    }
  }

  function loadMore() {
    if (!nextCursorRef.current) return;
    loadNotifications({ reset: false });
  }

  // ------------------------
  // Mark as Read
  // ------------------------
  async function markRead(id) {
    setBusy(true);
    setError("");

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
      )
    );

    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const data = await markNotificationRead(id);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (e) {
      setError(e?.message || "Failed to mark as read");
      loadNotifications({ reset: true });
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError("");

    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (!n.readAt ? { ...n, readAt: now } : n)));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (e) {
      setError(e?.message || "Failed to mark all as read");
      loadNotifications({ reset: true });
    } finally {
      setBusy(false);
    }
  }

  // ------------------------
  // Clear
  // ------------------------
  async function clearRead() {
    setBusy(true);
    setError("");

    setNotifications((prev) => prev.filter((n) => !n.readAt));

    try {
      const data = await clearReadNotifications();
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (e) {
      setError(e?.message || "Failed to clear read notifications");
      loadNotifications({ reset: true });
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    setBusy(true);
    setError("");

    setNotifications([]);
    setUnreadCount(0);

    try {
      await clearAllNotifications();
    } catch (e) {
      setError(e?.message || "Failed to clear notifications");
      loadNotifications({ reset: true });
    } finally {
      setBusy(false);
    }
  }

  // ------------------------
  // Preferences
  // ------------------------
  async function loadPreferences() {
    if (!user) return;
    setLoadingPreferences(true);
    try {
      const data = await fetchNotificationPreferences();
      setPreferences(data?.preferences || null);
    } catch {
      setPreferences(null);
    } finally {
      setLoadingPreferences(false);
    }
  }

  async function updatePreferences(patch) {
    if (!user) return;

    setBusy(true);
    setError("");

    const optimistic = { ...(preferences || {}), ...patch };
    setPreferences(optimistic);

    try {
      const data = await patchNotificationPreferences(patch);
      setPreferences(data?.preferences || optimistic);
    } catch (e) {
      setError(e?.message || "Failed to update preferences");
      loadPreferences();
    } finally {
      setBusy(false);
    }
  }

  // ------------------------
  // Realtime
  // ------------------------
  useEffect(() => {
    if (!user?._id) return;

    const id = rt.registerUserNotifications({
      userId: user._id,

      onNew: ({ notification }) => {
        if (!notification) return;

        setNotifications((prev) => {
          if (prev.some((n) => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });

        if (!notification.readAt) setUnreadCount((c) => c + 1);
      },

      onUpdate: (payload) => {
        if (!payload) return;

        if (payload.notification?._id) {
          const updated = payload.notification;

          setNotifications((prev) => {
            const idx = prev.findIndex((n) => n._id === updated._id);
            if (idx === -1) return [updated, ...prev];

            const copy = [...prev];
            copy.splice(idx, 1);
            return [updated, ...copy];
          });

          if (!updated.readAt) setUnreadCount((c) => c + 1);

          // 🔥 highlight newest update line reliably
          const updates = updated?.metadata?.updates || [];
          const last = updates.length ? updates[updates.length - 1] : null;

          const key = atKey(last?.at) || String(Date.now());
          setHighlightMap((prev) => ({ ...prev, [updated._id]: key }));

          setTimeout(() => {
            setHighlightMap((prev) => {
              if (prev[updated._id] !== key) return prev;
              const copy = { ...prev };
              delete copy[updated._id];
              return copy;
            });
          }, 16000);

          return;
        }

        // fallback minimal updates
        if (payload.id) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === payload.id ? { ...n, readAt: payload.readAt } : n))
          );
          if (typeof payload.unreadCount === "number") setUnreadCount(payload.unreadCount);
        }

        if (payload.markAll) {
          setNotifications((prev) => prev.map((n) => ({ ...n, readAt: payload.readAt })));
          setUnreadCount(0);
        }

        if (payload.clearedRead || payload.clearedAll) {
          loadNotifications({ reset: true });
        }
      },
    });

    return () => rt.unregisterUserNotifications(id);
  }, [user, rt]);

  useEffect(() => {
    if (!user) return;
    loadNotifications({ reset: true });
    loadPreferences();
  }, [user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      preferences,
      highlightMap,

      loadingInbox,
      loadingPreferences,
      busy,
      error,

      loadNotifications,
      loadMore,

      markRead,
      markAllRead,

      clearRead,
      clearAll,

      loadPreferences,
      updatePreferences,
    }),
    [
      notifications,
      unreadCount,
      preferences,
      highlightMap,
      loadingInbox,
      loadingPreferences,
      busy,
      error,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}