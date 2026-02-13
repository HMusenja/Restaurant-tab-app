// src/components/menu/MenuDetailModal.jsx
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MenuDetailModal({
  open,
  onOpenChange,
  item,
  onAdd,
  formatPrice,
}) {
  if (!item) return null;

  const image =
    item.image || item.imageUrl || item.photoUrl || item.photo || null;

  const name = item.name || "Menu item";
  const price = typeof item.price === "number" ? item.price : Number(item.price || 0);
  const shortDescription =
    item.shortDescription ||
    item.shortDesc ||
    item.subtitle ||
    item.description ||
    item.desc ||
    "";

  const category = item.category || "";
  const isAvailable =
    item.isAvailable ?? item.available ?? item.inStock ?? true;

  const handleAdd = () => {
    if (!isAvailable) return;
    onAdd?.(item);
    // Optional: close modal after add
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3">
            <span className="min-w-0 truncate">{name}</span>
            {category ? <Badge variant="secondary">{category}</Badge> : null}
          </DialogTitle>
           <DialogDescription>
            What's in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {image ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={image}
                alt={name}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {shortDescription ? shortDescription : "No description available."}
            </div>

            <div className="shrink-0 text-base font-semibold">
              {formatPrice ? formatPrice(price) : `€${price.toFixed(2)}`}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            <Button onClick={handleAdd} disabled={!isAvailable}>
              {isAvailable ? "Add to cart" : "Unavailable"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
