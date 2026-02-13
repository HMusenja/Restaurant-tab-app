import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MenuItemCard({ item, onAdd, formatPrice }) {
  const image =
    item.image || item.imageUrl || item.photoUrl || item.photo || null;
  const description = item.description || item.desc || "";
  const category = item.category || "";

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-medium active:scale-[0.99]">
      {image ? (
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">
              {item.name}
            </h3>

            {description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{category}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice()}
          </span>

          {/* ✅ shadcn Button */}
          <Button
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    if (typeof onAdd !== "function") {
      console.warn("MenuItemCard: onAdd is not a function", { itemId: item?._id, onAdd });
      return;
    }
    onAdd();
  }}
  className="rounded-full"
>
  <Plus className="mr-1 h-4 w-4" />
  Add
</Button>
        </div>
      </div>
    </div>
  );
}
