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

      return true;
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15">
                  <Users className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.28em] text-primary/70">
                    Admin
                  </div>
                  <h2 className="truncate text-xl font-semibold text-foreground md:text-2xl">
                    User Management
                  </h2>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="border border-border bg-muted/40 text-muted-foreground"
                >
                  {stats.total} total
                </Badge>

                <Badge className="border border-success/20 bg-success/15 text-success">
                  {stats.active} active
                </Badge>

                <Badge className="border border-warning/20 bg-warning/15 text-warning">
                  {stats.disabled} disabled
                </Badge>

                <Badge
                  variant="secondary"
                  className="border border-border bg-muted/40 text-muted-foreground"
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
                <RefreshCw className={cn("h-5 w-5", (loading || busy) && "animate-spin")} />
              </Button>

              <Button className="rounded-2xl" onClick={() => setCreateOpen(true)} disabled={busy}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </div>
          </div>
        </Card>

        {/* Sticky filters */}
        <Card className={cn(adminCardClass(), "sticky top-2 z-10 p-3")}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            <div className="text-xs text-muted-foreground md:ml-auto">
              Showing <span className="font-medium text-foreground">{filtered.length}</span>
            </div>
          </div>
        </Card>

        {/* List */}
        <Card className={cn(adminCardClass(), "p-3 md:p-4")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Users</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">Loading users…</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-sm text-muted-foreground">
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