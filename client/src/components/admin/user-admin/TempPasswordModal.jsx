// src/components/admin/TempPasswordModal.jsx
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
import { adminInputClass, adminCardClass } from "@/lib/adminUi";
import { cn } from "@/lib/utils";

export default function TempPasswordModal({ open, onOpenChange, creds }) {
  const password = creds?.password || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(adminCardClass("sm:max-w-md p-5"))}>
        <DialogHeader>
          <DialogTitle className="text-[hsl(40,20%,95%)]">Temporary Password</DialogTitle>
          <DialogDescription className="
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            Share this password with the new user. They may be forced to change it on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border 
border-border dark:border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,10%)]/50 p-3">
            <div className="text-sm font-medium text-[hsl(40,20%,92%)]">{creds?.name || "—"}</div>
            <div className="text-xs 
text-muted-foreground dark:text-[hsl(40,10%,60%)]">{creds?.email || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-[hsl(40,20%,85%)]">Password</Label>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={password}
                readOnly
                className={cn(adminInputClass("font-mono"), "sm:flex-1")}
              />

              <Button
                type="button"
                onClick={handleCopy}
                disabled={!password}
                className="rounded-2xl sm:w-auto w-full"
              >
                Copy
              </Button>
            </div>
          </div>

          <p className="text-xs text-[hsl(40,10%,55%)]">
            Tip: once you close this, you won’t be able to retrieve the password later unless you reset it.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" onClick={() => onOpenChange(false)} className="rounded-2xl w-full sm:w-auto">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}