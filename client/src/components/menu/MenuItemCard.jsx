import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MenuDetailModal from "@/components/menu/MenuDetailModal";

const categoryStyles = {
  Drinks: "bg-sky-100 text-sky-700 border-sky-200",
  Desserts: "bg-pink-100 text-pink-700 border-pink-200",
  Starters: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Mains: "bg-amber-100 text-amber-800 border-amber-200",
};

function getCategoryClass(cat) {
  return (
    categoryStyles[cat] ||
    "bg-secondary text-secondary-foreground border-border"
  );
}

function fallbackGradient(category) {
  if (category === "Desserts")
    return "from-pink-400/25 to-rose-400/15";
  if (category === "Drinks")
    return "from-sky-400/25 to-cyan-400/15";
  if (category === "Starters")
    return "from-emerald-400/25 to-lime-400/15";
  return "from-primary/25 to-accent/15";
}

export default function MenuItemCard({ item, onAdd, formatPrice }) {
  const [open, setOpen] = useState(false);

  const image =
    item.image || item.imageUrl || item.photoUrl || item.photo || null;

  const description = item.description || item.desc || "";
  const category = item.category || "";

  const handleCardClick = () => setOpen(true);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-medium hover:border-primary/25 active:scale-[0.99]"
      >
        {/* Image / Gradient */}
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-secondary">
          {image ? (
            <img
              src={image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className={[
                "h-full w-full bg-gradient-to-br",
                fallbackGradient(category),
              ].join(" ")}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-foreground">
                  {item.name}
                </h3>

                {category && (
                  <span
                    className={[
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      getCategoryClass(category),
                    ].join(" ")}
                  >
                    {category}
                  </span>
                )}
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
            <span className="text-xl font-bold text-primary">
              {formatPrice()}
            </span>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
              }}
             className="rounded-full shadow-soft active:scale-[0.96] transition-transform"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <MenuDetailModal
        open={open}
        onOpenChange={setOpen}
        item={item}
        onAdd={onAdd}
        formatPrice={formatPrice}
      />
    </>
  );
}
