// src/components/admin/UserDetailModal.jsx
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
import { cn } from "@/lib/utils";
import { adminCardClass, adminInputClass, adminPanelClass } from "@/lib/adminUi";

const ROLES = ["Reception", "Kitchen", "Bar", "admin"];

export default function UserDetailModal({
  open,
  onOpenChange,
  user,
  onSave,
  onToggleActive,
  onResetPassword,
  onSoftDelete,
  onRestore,
  currentAdminId,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", role: "Reception" });

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
  const isDeleted = Boolean(user?.isDeleted || user?.deletedAt);
  const isActive =
    typeof user?.isActive === "boolean"
      ? user.isActive
      : typeof user?.active === "boolean"
        ? user.active
        : true;

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
      toast.error(err?.response?.data?.message || err?.message || "Update failed");
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
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status");
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

      if (res?.tempPassword) {
        try {
          await navigator.clipboard.writeText(res.tempPassword);
          toast.success("Temp password copied");
        } catch {
          toast.success(`Temp password: ${res.tempPassword}`);
        }
      } else {
        toast.message("Password reset complete", {
          description: "If the API returns tempPassword, we can show/copy it here.",
        });
      }

      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Password reset failed");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(adminCardClass("sm:max-w-lg p-5"))}>
        <DialogHeader>
          <DialogTitle className="text-[hsl(40,20%,95%)]">User Details</DialogTitle>
          <DialogDescription className="text-[hsl(40,10%,60%)]">
            View and manage this staff account.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="text-sm text-[hsl(40,10%,60%)]">No user selected.</div>
        ) : (
          <div className="space-y-5">
            {/* Quick meta */}
            <div className={cn(adminPanelClass(), "p-3")}>
              <div className="text-sm font-medium text-[hsl(40,20%,92%)]">{user.name || "—"}</div>
              <div className="text-xs text-[hsl(40,10%,60%)]">{user.email || "—"}</div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,70%)] border border-[hsl(40,20%,95%)/10%]">
                  Role: {user.role || "—"}
                </span>
                <span className="px-2 py-1 rounded-full bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,70%)] border border-[hsl(40,20%,95%)/10%]">
                  Status: {isActive ? "Active" : "Disabled"}
                </span>
                <span className="px-2 py-1 rounded-full bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,70%)] border border-[hsl(40,20%,95%)/10%]">
                  Must change PW: {user.mustChangePassword ? "Yes" : "No"}
                </span>
                {isDeleted ? (
                  <span className="px-2 py-1 rounded-full bg-[hsl(0,0%,100%)/6%] text-[hsl(40,10%,60%)] border border-[hsl(40,20%,95%)/10%]">
                    Deleted
                  </span>
                ) : null}
              </div>
            </div>

            {/* Editable */}
            <div className="space-y-2">
              <Label htmlFor="ud-name" className="text-[hsl(40,20%,85%)]">
                Name
              </Label>
              <Input
                id="ud-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={adminInputClass()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ud-email" className="text-[hsl(40,20%,85%)]">
                Email
              </Label>
              <Input
                id="ud-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={adminInputClass()}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[hsl(40,20%,85%)]">Role</Label>
              <select
                className={cn(adminInputClass(), "pr-8 appearance-none")}
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="rounded-2xl"
                >
                  {isResetting ? "Resetting..." : "Reset PW"}
                </Button>

                <Button
                  type="button"
                  variant={isActive ? "destructive" : "default"}
                  onClick={handleToggle}
                  disabled={isToggling}
                  className="rounded-2xl"
                  title={isSelf ? "You can't disable yourself" : undefined}
                >
                  {isActive ? (isToggling ? "Disabling..." : "Disable") : isToggling ? "Enabling..." : "Enable"}
                </Button>

                <Button type="button" onClick={handleSave} disabled={!canSave || isSaving} className="rounded-2xl">
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-3">
                <div className="text-sm font-medium text-[hsl(40,20%,92%)]">Danger zone</div>
                <div className="text-xs text-[hsl(40,10%,60%)] mt-1">
                  Soft-delete hides the user and disables login. You can restore later.
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  {isDeleted ? (
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          await onRestore(user._id);
                          toast.success("User restored");
                          onOpenChange(false);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Restore failed");
                        }
                      }}
                      className="rounded-2xl"
                    >
                      Restore user
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSelf || user.role === "admin"}
                      className="rounded-2xl"
                      onClick={async () => {
                        if (!confirm(`Soft-delete ${user.name}?`)) return;
                        try {
                          await onSoftDelete(user._id);
                          toast.success("User deleted");
                          onOpenChange(false);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Delete failed");
                        }
                      }}
                    >
                      Soft delete
                    </Button>
                  )}

                  {(isSelf || user.role === "admin") && !isDeleted && (
                    <div className="text-xs text-[hsl(40,10%,60%)] self-center sm:ml-2">
                      {isSelf ? "You can’t delete your own account." : "Admin accounts can’t be deleted."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="rounded-2xl w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}