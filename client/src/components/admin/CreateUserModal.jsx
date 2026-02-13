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

// If you have Select component in shadcn:
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = ["Reception", "Kitchen", "Bar", "admin"];

export default function CreateUserModal({ open, onOpenChange, onCreate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Reception",
    password: "", // optional
  });

 const isValid = Boolean(form.name.trim() && form.email.trim() && form.role);


  const reset = () =>
    setForm({ name: "", email: "", role: "Reception", password: "" });

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleSubmit = async (e) => {
     console.log("✅ SUBMIT FIRED", form);
    e.preventDefault();
    if (!isValid) {
      toast.error("Name, email, and role are required.");
      return;
    }

    try {
  setIsSubmitting(true);

      console.log("⏳ awaiting onCreate...");
 const typedPassword = form.password.trim();
const passwordToSend =
  typedPassword || Math.random().toString(36).slice(-10); // simple temp password

await onCreate(
  {
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
    password: passwordToSend,
  },
  passwordToSend // pass to 2nd modal
);

  console.log("✅ onCreate resolved:", passwordToSend);

  toast.success("User created");
  onOpenChange(false);
} catch (err) {
  console.log("❌ CREATE USER ERROR status:", err?.response?.status);
  console.log("❌ CREATE USER ERROR data:", err?.response?.data);
  console.log("❌ CREATE USER ERROR raw:", err);
  toast.error(err?.response?.data?.message || err?.message || "Create user failed");
} finally {
  setIsSubmitting(false);
}

    console.log("Create modal state:", { form, isValid, isSubmitting });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create a staff account. Non-admin users will be forced to change password on first login.
          </DialogDescription>
        </DialogHeader>

        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Bar Staff"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="e.g. bar@mail.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            {/* Simple select without shadcn Select dependency */}
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
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
            <Label htmlFor="password">Temporary Password (optional)</Label>
            <Input
              id="password"
              type="text"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
            <p className="text-xs text-muted-foreground">
              If blank, the server will generate one and you can display/copy it.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
         <Button
    type="submit"
    form="create-user-form"
    disabled={!isValid || isSubmitting}
  >
              {isSubmitting ? "Creating..." : "Create User"}
             

  </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
