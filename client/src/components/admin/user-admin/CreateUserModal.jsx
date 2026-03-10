// src/components/admin/CreateUserModal.jsx
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { adminCardClass, adminInputClass } from "@/lib/adminUi";
import { cn } from "@/lib/utils";

const ROLES = ["Reception", "Kitchen", "Bar", "admin"];

function generateTempPassword() {
  // simple + readable
  return Math.random().toString(36).slice(-10);
}

export default function CreateUserModal({ open, onOpenChange, onCreate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Reception",
    password: "",
  });

  const isValid = useMemo(
    () => Boolean(form.name.trim() && form.email.trim() && form.role),
    [form.name, form.email, form.role],
  );

  const reset = () => setForm({ name: "", email: "", role: "Reception", password: "" });

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Name, email, and role are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const typedPassword = form.password.trim();
      const passwordToSend = typedPassword || generateTempPassword();

      await onCreate(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: passwordToSend,
        },
        passwordToSend,
      );

      toast.success("User created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Create user failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(adminCardClass("sm:max-w-lg p-5"))}>
        <DialogHeader>
          <DialogTitle className="text-[hsl(40,20%,95%)]">Create User</DialogTitle>
          <DialogDescription className="
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            Create a staff account. Non-admin users may be forced to change password on first login.
          </DialogDescription>
        </DialogHeader>

        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[hsl(40,20%,85%)]">
              Name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Bar Staff"
              className={adminInputClass()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[hsl(40,20%,85%)]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. bar@mail.com"
              className={adminInputClass()}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(40,20%,85%)]">Role</Label>
            <select
              className={cn(
                adminInputClass(),
                "pr-8 appearance-none",
              )}
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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[hsl(40,20%,85%)]">
              Temporary Password (optional)
            </Label>
            <Input
              id="password"
              type="text"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Leave blank to auto-generate"
              className={adminInputClass("font-mono")}
            />
            <p className="text-xs text-[hsl(40,10%,55%)]">
              Leave blank to auto-generate a temp password.
            </p>
          </div>

          <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
              className="rounded-2xl w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="create-user-form"
              disabled={!isValid || isSubmitting}
              className="rounded-2xl w-full sm:w-auto"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}