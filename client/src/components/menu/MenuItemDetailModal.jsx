import { useMemo, useState } from "react";
import { Minus, Plus, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function fallbackGradient(category) {
  if (category === "Desserts") return "from-pink-500/35 to-rose-500/15";
  if (category === "Drinks") return "from-sky-500/35 to-cyan-500/15";
  if (category === "Starters") return "from-emerald-500/35 to-lime-500/15";
  return "from-primary/35 to-accent/15";
}

function getImage(item) {
  return item?.image || item?.imageUrl || item?.photoUrl || item?.photo || null;
}

export default function MenuItemDetailModal({
  open,
  onOpenChange,
  item,
  onAdd, // expects (qty) => void
  formatPrice,
}) {
  const [qty, setQty] = useState(1);

  const category = item?.category || "";
  const image = useMemo(() => getImage(item), [item]);

  const description = item?.description || item?.desc || "";
  const isUnavailable = item?.available === false;

  // Optional nutrition fields (safe: schema can be extended later)
  const nutrition = item?.nutrition || item?.nutrients || null;
  const calories = nutrition?.calories ?? item?.calories ?? null;
  const protein = nutrition?.protein ?? null;
  const carbs = nutrition?.carbs ?? null;
  const fat = nutrition?.fat ?? null;

  const allergens = item?.allergens || null; // array or string
  const ingredients = item?.ingredients || null; // array or string

  const hasNutrition = [calories, protein, carbs, fat].some(
    (v) => v !== null && v !== undefined
  );

  const inc = () => setQty((q) => Math.min(99, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = () => {
    if (isUnavailable) return;
    onAdd?.(qty);
    onOpenChange?.(false);
    setQty(1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange?.(v);
        if (!v) setQty(1);
      }}
    >
      <DialogContent
        className={cn(
          "flex h-[92vh] flex-col overflow-hidden rounded-3xl border border-border bg-background p-0 shadow-xl",
          "sm:h-[85vh] sm:max-w-lg"
        )}
      >
        {/* Hero */}
        <div className="relative shrink-0 border-b border-border">
          <div className="h-56 w-full bg-muted/30">
            {image ? (
              <img
                src={image}
                alt={item?.name || "Menu item"}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className={cn(
                  "h-full w-full bg-gradient-to-br",
                  fallbackGradient(category)
                )}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold leading-tight text-foreground">
              {item?.name}
            </DialogTitle>

            {category ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>{category}</span>
              </div>
            ) : null}
          </DialogHeader>

          {description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              A guest favorite—freshly prepared and served with care.
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice?.()}
              </span>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Nutrition (optional) */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Nutrition</h4>

            {hasNutrition ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {calories != null && (
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Calories</div>
                    <div className="mt-1 font-semibold text-foreground">
                      {calories} kcal
                    </div>
                  </div>
                )}
                {protein != null && (
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Protein</div>
                    <div className="mt-1 font-semibold text-foreground">
                      {protein} g
                    </div>
                  </div>
                )}
                {carbs != null && (
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Carbs</div>
                    <div className="mt-1 font-semibold text-foreground">
                      {carbs} g
                    </div>
                  </div>
                )}
                {fat != null && (
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div className="text-xs text-muted-foreground">Fat</div>
                    <div className="mt-1 font-semibold text-foreground">
                      {fat} g
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nutrition details may vary by preparation.
              </p>
            )}
          </div>

          {(ingredients || allergens) && <Separator className="my-5" />}

          {ingredients && (
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Ingredients
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {Array.isArray(ingredients)
                  ? ingredients.join(", ")
                  : String(ingredients)}
              </p>
            </div>
          )}

          {allergens && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-foreground">
                Allergens
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {Array.isArray(allergens)
                  ? allergens.join(", ")
                  : String(allergens)}
              </p>
            </div>
          )}
        </div>

        {/* Sticky bottom CTA */}
        <div className="shrink-0 border-t border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Quantity stepper */}
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl"
                  onClick={dec}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="w-10 text-center text-sm font-semibold text-foreground">
                  {qty}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl"
                  onClick={inc}
                  disabled={qty >= 99}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleAdd}
                disabled={isUnavailable}
                className="flex-1 rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
              >
                {isUnavailable ? "Unavailable" : "Add to tab"}
              </Button>
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              You can adjust quantities later in the cart.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}