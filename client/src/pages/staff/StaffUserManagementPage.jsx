// src/pages/admin/StaffUserManagementPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Plus, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import {
  getAllUsers,
  toggleUserStatus,
  createUser,
  updateUser,
  resetUserPassword,
  softDeleteUser,
  restoreUser,
} from "@/api/adminApi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import UserCard from "@/components/admin/user-admin/UserCard";
import CreateUserModal from "@/components/admin/user-admin/CreateUserModal";
import TempPasswordModal from "@/components/admin/user-admin/TempPasswordModal";
import UserDetailModal from "@/components/admin/user-admin/UserDetailModal";

import { adminCardClass, adminInputClass, adminChipClass } from "@/lib/adminUi";

/* ----------------------------- helpers ----------------------------- */

function safeStr(v) {
  return String(v || "").toLowerCase();
}

export default function StaffUserManagementPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [tempOpen, setTempOpen] = useState(false);
  const [tempCreds, setTempCreds] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL | ACTIVE | DISABLED | DELETED

  if (user?.role !== "admin") {
    return <Navigate to="/staff" replace />;
  }

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const query = safeStr(q).trim();

    return (users ?? []).filter((u) => {
      const name = safeStr(u?.name);
      const email = safeStr(u?.email);
      const role = safeStr(u?.role);

      const matchesQuery =
        !query || name.includes(query) || email.includes(query) || role.includes(query);

      if (!matchesQuery) return false;

      const isDeleted = Boolean(u?.deletedAt) || Boolean(u?.isDeleted);

      const isActive =
        typeof u?.active === "boolean"
          ? u.active
          : typeof u?.isActive === "boolean"
            ? u.isActive
            : typeof u?.enabled === "boolean"
              ? u.enabled
              : typeof u?.disabled === "boolean"
                ? !u.disabled
                : true;

      if (status === "DELETED") return isDeleted;
      if (status === "ACTIVE") return !isDeleted && isActive;
      if (status === "DISABLED") return !isDeleted && !isActive;

      return true; // ALL
    });
  }, [users, q, status]);

  const stats = useMemo(() => {
    const base = { total: 0, active: 0, disabled: 0, deleted: 0 };
    for (const u of users ?? []) {
      base.total += 1;

      const isDeleted = Boolean(u?.deletedAt) || Boolean(u?.isDeleted);
      if (isDeleted) {
        base.deleted += 1;
        continue;
      }

      const isActive =
        typeof u?.active === "boolean"
          ? u.active
          : typeof u?.isActive === "boolean"
            ? u.isActive
            : typeof u?.enabled === "boolean"
              ? u.enabled
              : typeof u?.disabled === "boolean"
                ? !u.disabled
                : true;

      if (isActive) base.active += 1;
      else base.disabled += 1;
    }
    return base;
  }, [users]);

  /* ----------------------------- handlers ----------------------------- */

  const handleOpenUser = (u) => {
    setSelectedUser(u);
    setDetailOpen(true);
  };

  const handleResetPassword = async (id) => {
    try {
      setBusy(true);
      const res = await resetUserPassword(id);
      await fetchUsers();
      return res;
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      setBusy(true);
      await toggleUserStatus(id);
      toast.success("User status updated");
      await fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (payload, plainPassword) => {
    try {
      setBusy(true);
      const res = await createUser(payload);
      await fetchUsers();

      setTempCreds({
        name: payload.name,
        email: payload.email,
        password: plainPassword,
      });
      setTempOpen(true);

      return res;
    } finally {
      setBusy(false);
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      setBusy(true);
      await softDeleteUser(id);
      toast.success("User deleted");
      await fetchUsers();
    } catch (e) {
      toast.error(e?.message || "Failed to delete user");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      setBusy(true);
      await restoreUser(id);
      toast.success("User restored");
      await fetchUsers();
    } catch (e) {
      toast.error(e?.message || "Failed to restore user");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveUser = async (id, payload) => {
    try {
      setBusy(true);
      await updateUser(id, payload);
      toast.success("User updated");
      await fetchUsers();
    } catch (e) {
      toast.error(e?.message || "Failed to update user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <Card className={cn(adminCardClass(), "p-4 md:p-5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>

                <div className="min-w-0">
                  <div className="text-xs tracking-[0.28em] uppercase text-primary/70">
                    Admin
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold text-[hsl(40,20%,95%)] truncate">
                    User Management
                  </h2>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="bg-[hsl(40,20%,95%)/8%] text-[hsl(40,10%,70%)]"
                >
                  {stats.total} total
                </Badge>

                <Badge className="bg-success/15 text-success border border-success/20">
                  {stats.active} active
                </Badge>

                <Badge className="bg-warning/15 text-warning border border-warning/20">
                  {stats.disabled} disabled
                </Badge>

                <Badge
                  variant="secondary"
                  className="bg-[hsl(0,0%,100%)/6%] text-[hsl(40,10%,60%)]"
                >
                  {stats.deleted} deleted
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl"
                onClick={fetchUsers}
                disabled={loading || busy}
                aria-label="Refresh users"
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5", (loading || busy) && "animate-spin")} />
              </Button>

              <Button className="rounded-2xl" onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
        </Card>

        {/* Sticky filters */}
        <Card className={cn(adminCardClass(), "sticky top-2 z-10 p-3")}>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative w-full md:max-w-sm">
              <Search className="w-4 h-4 text-[hsl(40,10%,60%)] absolute left-3 top-3" />
              <Input
                placeholder="Search by name, email, role…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={adminInputClass("pl-9")}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {["ALL", "ACTIVE", "DISABLED", "DELETED"].map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={adminChipClass(status === s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="md:ml-auto text-xs text-[hsl(40,10%,55%)]">
              Showing{" "}
              <span className="text-[hsl(40,20%,90%)] font-medium">{filtered.length}</span>
            </div>
          </div>
        </Card>

        {/* List */}
        <Card className={cn(adminCardClass(), "p-3 md:p-4")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(40,20%,92%)]">Users</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-10 text-sm text-[hsl(40,10%,60%)]">Loading users…</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-sm text-[hsl(40,10%,60%)]">
                No users match your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((u) => (
                  <UserCard key={u._id} user={u} onToggle={handleToggle} onOpen={handleOpenUser} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      <TempPasswordModal open={tempOpen} onOpenChange={setTempOpen} creds={tempCreds} />
      <UserDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        onToggleActive={handleToggle}
        onResetPassword={handleResetPassword}
        onSoftDelete={handleSoftDelete}
        onRestore={handleRestore}
        currentAdminId={user?._id}
      />
    </>
  );
}