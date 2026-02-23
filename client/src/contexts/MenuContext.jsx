// src/contexts/MenuContext.jsx
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  fetchMenu,
  fetchMenuAdmin,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/api/menuApi";
import { useAuth } from "@/contexts/AuthContext";

const MenuContext = createContext(null);

function upsertById(list, item) {
  const idx = list.findIndex((x) => x._id === item._id);
  if (idx === -1) return [item, ...list];
  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...item };
  return copy;
}

function removeById(list, id) {
  return list.filter((x) => x._id !== id);
}

export function MenuProvider({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  // Keep last known good state for rollback
  const lastSnapshotRef = useRef(null);

  const snapshot = () => {
    lastSnapshotRef.current = items;
  };

  const rollback = () => {
    if (lastSnapshotRef.current) setItems(lastSnapshotRef.current);
    lastSnapshotRef.current = null;
  };

  /**
   * Load menu items.
   * guest: /menu
   * admin: /menu?all=true
   */
  const loadMenu = useCallback(
    async ({ admin = false } = {}) => {
      setLoading(true);
      setError("");
      try {
        const data = admin && isAdmin ? await fetchMenuAdmin() : await fetchMenu();
        const list = data?.items || [];
        setItems(list);
        return list;
      } catch (e) {
        setError(e?.message || "Failed to load menu");
        setItems([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  /**
   * Refresh menu with best endpoint for current role.
   */
  const refresh = useCallback(async () => {
    return loadMenu({ admin: isAdmin });
  }, [loadMenu, isAdmin]);

  /**
   * CREATE (optimistic)
   */
  const create = useCallback(
    async (payload, { sync = true } = {}) => {
      setSaving(true);
      setError("");

      // optimistic temp item
      const tempId = `temp_${Date.now()}`;
      const tempItem = {
        _id: tempId,
        ...payload,
        // ensure booleans & defaults
        available: payload?.available !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __optimistic: true,
      };

      snapshot();
      setItems((prev) => [tempItem, ...prev]);

      try {
        const created = await createMenuItem(payload);

        // replace temp with created
        setItems((prev) =>
          prev.map((x) => (x._id === tempId ? created : x))
        );

        if (sync) await refresh();
        return created;
      } catch (e) {
        rollback();
        setError(e?.message || "Failed to create item");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [refresh, items]
  );

  /**
   * UPDATE (optimistic)
   * Great for toggles and edits
   */
  const update = useCallback(
    async (id, patch, { sync = false } = {}) => {
      setSaving(true);
      setError("");

      snapshot();
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, ...patch } : x)));

      try {
        const updated = await updateMenuItem(id, patch);

        // ensure we apply whatever server returns (canonical)
        setItems((prev) => upsertById(prev, updated));

        // optional: keep sorting consistent after edits
        if (sync) await refresh();

        return updated;
      } catch (e) {
        rollback();
        setError(e?.message || "Failed to update item");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [refresh, items]
  );

  /**
   * DELETE (optimistic)
   */
  const remove = useCallback(
    async (id, { sync = false } = {}) => {
      setDeleting(true);
      setError("");

      snapshot();
      setItems((prev) => removeById(prev, id));

      try {
        const result = await deleteMenuItem(id);
        if (sync) await refresh();
        return result;
      } catch (e) {
        rollback();
        setError(e?.message || "Failed to delete item");
        throw e;
      } finally {
        setDeleting(false);
      }
    },
    [refresh, items]
  );

  const value = useMemo(
    () => ({
      // state
      items,
      loading,
      saving,
      deleting,
      error,
      isAdmin,

      // actions
      setItems,
      loadMenu,
      refresh,
      create,
      update,
      remove,
    }),
    [items, loading, saving, deleting, error, isAdmin, loadMenu, refresh, create, update, remove]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within a MenuProvider");
  return ctx;
}
