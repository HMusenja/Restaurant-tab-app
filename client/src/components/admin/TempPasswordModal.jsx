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

export default function TempPasswordModal({ open, onOpenChange, creds }) {
  const password = creds?.password || "";

 const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(creds.password);
    toast.success("Password copied to clipboard");
  } catch {
    toast.error("Copy failed");
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Temporary Password</DialogTitle>
          <DialogDescription>
            Share this password with the new user. They may be forced to change
            it on first login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{creds?.name}</div>
            <div className="text-xs text-muted-foreground">{creds?.email}</div>
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input
                value={creds?.password || ""}
                readOnly
                className="font-mono"
              />

              <Button type="button" onClick={handleCopy} disabled={!password}>
                Copy
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: once you close this, you won’t be able to retrieve the password
            later unless you reset it.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
