import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
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
import { toast } from "sonner";

import UserCard from "@/components/admin/UserCard";
import CreateUserModal from "@/components/admin/CreateUserModal";
import TempPasswordModal from "@/components/admin/TempPasswordModal";
import UserDetailModal from "@/components/admin/UserDetailModal";

export default function StaffUserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [tempOpen, setTempOpen] = useState(false);
  const [tempCreds, setTempCreds] = useState(null);

  if (user.role !== "admin") {
    return <Navigate to="/staff" replace />;
  }

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      console.log("✅ /admin/users response:", res);
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUser = (u) => {
    setSelectedUser(u);
    setDetailOpen(true);
  };
  const handleResetPassword = async (id) => {
    const res = await resetUserPassword(id);
    await fetchUsers();
    return res;
  };

  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      toast.success("User status updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };
  const handleCreate = async (payload, plainPassword) => {
    const res = await createUser(payload);
    await fetchUsers();

    setTempCreds({
      name: payload.name,
      email: payload.email,
      password: plainPassword,
    });
    setTempOpen(true);

    return res;
  };
  const handleSoftDelete = async (id) => {
    await softDeleteUser(id);
    await fetchUsers();
  };

  const handleRestore = async (id) => {
    await restoreUser(id);
    await fetchUsers();
  };

  const handleSaveUser = async (id, payload) => {
    await updateUser(id, payload);
    await fetchUsers();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>

          <Button onClick={() => setCreateOpen(true)}>Create User</Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div>Loading users...</div>
          ) : (users ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No users found.</div>
          ) : (
            <div className="space-y-3">
              {(users ?? []).map((u) => (
                <UserCard
                  key={u._id}
                  user={u}
                  onToggle={handleToggle}
                  onOpen={handleOpenUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
      <TempPasswordModal
        open={tempOpen}
        onOpenChange={setTempOpen}
        creds={tempCreds}
      />
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
