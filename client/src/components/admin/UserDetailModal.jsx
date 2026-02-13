import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = ["Reception", "Kitchen", "Bar", "admin"];

export default function UserDetailModal({
  open,
  onOpenChange,
  user,
  onSave, // (id, payload) => Promise
  onToggleActive, // (id) => Promise
  onResetPassword, // (id) => Promise -> should return { tempPassword? }
  onSoftDelete,
  onRestore,
  currentAdminId, // optional: prevent disabling yourself
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Reception",
  });

  // keep local form synced when selecting a different user
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "Reception",
    });
  }, [user]);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      form.name !== (user.name || "") ||
      form.email !== (user.email || "") ||
      form.role !== (user.role || "Reception")
    );
  }, [form, user]);

  const canSave = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const emailOk = form.email.trim().length > 0;
    const roleOk = ROLES.includes(form.role);
    return nameOk && emailOk && roleOk && dirty;
  }, [form, dirty]);

  const isSelf = Boolean(currentAdminId && user?._id === currentAdminId);

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      setIsSaving(true);
      await onSave(user._id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      });
      toast.success("User updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Update failed",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!user?._id) return;
    if (isSelf) {
      toast.error("You can’t disable your own account.");
      return;
    }
    try {
      setIsToggling(true);
      await onToggleActive(user._id);
      toast.success("User status updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update status",
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?._id) return;
    try {
      setIsResetting(true);
      const res = await onResetPassword(user._id);
      toast.success("Password reset");

      // If your backend returns a temp password, surface it
      if (res?.tempPassword) {
        try {
          await navigator.clipboard.writeText(res.tempPassword);
          toast.success("Temp password copied");
        } catch {
          toast.success(`Temp password: ${res.tempPassword}`);
        }
      } else {
        toast.message("Password reset complete", {
          description:
            "If you return a tempPassword from the API, we can show/copy it here.",
        });
      }

      onOpenChange(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Password reset failed",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and manage this staff account.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="text-sm text-muted-foreground">No user selected.</div>
        ) : (
          <div className="space-y-5">
            {/* Quick meta */}
            <div className="rounded-xl border p-3">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-secondary">
                  Role: {user.role}
                </span>
                <span className="px-2 py-1 rounded-full bg-secondary">
                  Status: {user.isActive ? "Active" : "Disabled"}
                </span>
                <span className="px-2 py-1 rounded-full bg-secondary">
                  Must change password: {user.mustChangePassword ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-2">
              <Label htmlFor="ud-name">Name</Label>
              <Input
                id="ud-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ud-email">Email</Label>
              <Input
                id="ud-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            
            {/* Actions */}
            <div className="space-y-4 pt-2">
              {/* Primary actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                >
                  {isResetting ? "Resetting..." : "Reset PW"}
                </Button>

                <Button
                  type="button"
                  variant={user.isActive ? "destructive" : "default"}
                  onClick={handleToggle}
                  disabled={isToggling}
                  title={isSelf ? "You can't disable yourself" : undefined}
                >
                  {user.isActive
                    ? isToggling
                      ? "Disabling..."
                      : "Disable"
                    : isToggling
                      ? "Enabling..."
                      : "Enable"}
                </Button>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-sm font-medium">Danger zone</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Soft-delete hides the user and disables login. You can restore
                  later.
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  {/* Restore only when deleted */}
                  {user.isDeleted ? (
                    <Button
                      type="button"
                      variant="default"
                      onClick={async () => {
                        try {
                          await onRestore(user._id);
                          toast.success("User restored");
                          onOpenChange(false);
                        } catch (err) {
                          toast.error(
                            err?.response?.data?.message || "Restore failed",
                          );
                        }
                      }}
                    >
                      Restore user
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSelf || user.role === "admin"}
                      onClick={async () => {
                        if (!confirm(`Soft-delete ${user.name}?`)) return;
                        try {
                          await onSoftDelete(user._id);
                          toast.success("User deleted");
                          onOpenChange(false);
                        } catch (err) {
                          toast.error(
                            err?.response?.data?.message || "Delete failed",
                          );
                        }
                      }}
                    >
                      Soft delete
                    </Button>
                  )}

                  {/* Explain disabled states */}
                  {(isSelf || user.role === "admin") && !user.isDeleted && (
                    <div className="text-xs text-muted-foreground self-center sm:ml-2">
                      {isSelf
                        ? "You can’t delete your own account."
                        : "Admin accounts can’t be deleted."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
