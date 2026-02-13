// src/components/guest/RequestServiceModal.jsx
import { useState } from "react";
import { X, Droplets, HelpCircle, Receipt, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createServiceRequest } from "../../api/servicesApi";

const serviceTypes = [
  { type: "WATER", icon: Droplets, label: "Water", description: "Request water refill" },
  { type: "HELP", icon: HelpCircle, label: "Help", description: "Need assistance" },
  { type: "BILL", icon: Receipt, label: "Bill", description: "Request the bill" },
  { type: "OTHER", icon: MessageSquare, label: "Other", description: "Custom request" },
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
      <DialogContent className="max-w-md mx-4 rounded-2xl p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Request Service</DialogTitle>
            <Button variant="ghost" size="icon-sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
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
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{service.label}</p>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedType && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Add a note (optional)</label>
              <Textarea
                placeholder="Any specific requests..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Sending..." : "Submit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
