import { memo, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MenuItemDetailModal from "@/components/menu/MenuItemDetailModal";

const categoryStyles = {
  Drinks:
    "border-transparent bg-secondary text-secondary-foreground dark:border-border/50 dark:bg-secondary",
  Desserts:
    "border-transparent bg-secondary text-secondary-foreground dark:border-border/50 dark:bg-secondary",
  Starters:
    "border-transparent bg-secondary text-secondary-foreground dark:border-border/50 dark:bg-secondary",
  Mains:
    "border-transparent bg-secondary text-secondary-foreground dark:border-border/50 dark:bg-secondary",
};

function getCategoryClass(category) {
  return (
    categoryStyles[category] ||
    "border-border bg-secondary text-secondary-foreground"
  );
}

function fallbackGradient(category) {
  if (category === "Desserts") return "from-pink-400/25 to-rose-400/15";
  if (category === "Drinks") return "from-sky-400/25 to-cyan-400/15";
  if (category === "Starters") return "from-emerald-400/25 to-lime-400/15";
  return "from-primary/25 to-accent/15";
}

function MenuItemCardImpl({ item, onAdd, formatPrice }) {
  const [open, setOpen] = useState(false);

  const image = useMemo(() => {
    return item?.image || item?.imageUrl || item?.photoUrl || item?.photo || null;
  }, [item]);

  const description = item?.description || item?.desc || "";
  const category = item?.category || "";
  const isUnavailable = item?.available === false;

  function handleOpen() {
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleQuickAdd(e) {
    e.stopPropagation();
    onAdd?.();
  }

  function handleModalAdd(qty) {
    if (!onAdd) return;

    if (typeof qty === "number" && qty > 1) {
      for (let i = 0; i < qty; i += 1) onAdd();
      return;
    }

    onAdd();
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex gap-4 rounded-3xl border p-4 transition-all duration-200",
          "border-border bg-card shadow-sm",
          "hover:border-primary/25 hover:shadow-md active:scale-[0.99]",
          "[content-visibility:auto] [contain-intrinsic-size:120px]",
          isUnavailable && "opacity-70"
        )}
        aria-label={`Open ${item?.name || "menu item"} details`}
      >
        {/* Image / Gradient */}
        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-muted/30">
          {image ? (
            <img
              src={image}
              alt={item?.name || "Menu item"}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className={cn(
                "h-full w-full bg-gradient-to-br",
                fallbackGradient(category)
              )}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          {isUnavailable && (
            <div className="absolute left-2 top-2 rounded-full border border-border bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
              Unavailable
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {item?.name || "Unnamed item"}
                </h3>

                {category ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      getCategoryClass(category)
                    )}
                  >
                    {category}
                  </span>
                ) : null}
              </div>

              {description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Popular choice
                </p>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice()}
            </span>

            <Button
              size="sm"
              disabled={isUnavailable}
              onClick={handleQuickAdd}
              className="rounded-full shadow-sm transition-transform active:scale-[0.96]"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <MenuItemDetailModal
        open={open}
        onOpenChange={setOpen}
        item={item}
        onAdd={handleModalAdd}
        formatPrice={formatPrice}
      />
    </>
  );
}

const MenuItemCard = memo(MenuItemCardImpl);
export default MenuItemCard;