import { useState } from "react";
import { X, Droplets, HelpCircle, Receipt, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createServiceRequest } from "../../api/servicesApi";

const serviceTypes = [
  {
    type: "WATER",
    icon: Droplets,
    label: "Water",
    description: "Request water refill",
  },
  {
    type: "HELP",
    icon: HelpCircle,
    label: "Help",
    description: "Need assistance",
  },
  {
    type: "BILL",
    icon: Receipt,
    label: "Bill",
    description: "Request the bill",
  },
  {
    type: "OTHER",
    icon: MessageSquare,
    label: "Other",
    description: "Custom request",
  },
];

export default function RequestServiceModal({
  open,
  onClose,
  tableId,
  ensureTabOpen,
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!selectedType || !tableId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const t = await ensureTabOpen?.();
      const tabId = t?._id;

      await createServiceRequest({
        tableId,
        tabId,
        type: selectedType,
        note: note?.trim() ? note.trim() : undefined,
      });

      setSelectedType(null);
      setNote("");
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setSelectedType(null);
    setNote("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="mx-4 max-w-md gap-0 rounded-3xl border border-border bg-background p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-bold text-foreground">
              Request Service
            </DialogTitle>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="rounded-xl"
              type="button"
              aria-label="Close request service modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {serviceTypes.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedType === service.type;

              return (
                <button
                  key={service.type}
                  type="button"
                  onClick={() => setSelectedType(service.type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                  )}
                  aria-pressed={isSelected}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {service.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedType && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Add a note (optional)
              </label>
              <Textarea
                placeholder="Any specific requests..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl border-border bg-background"
              />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-4 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 rounded-2xl"
            type="button"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!selectedType || isSubmitting}
            className="flex-1 rounded-2xl"
            type="button"
          >
            {isSubmitting ? "Sending..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}