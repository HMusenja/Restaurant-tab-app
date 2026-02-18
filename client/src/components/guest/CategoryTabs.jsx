import {
  LayoutGrid,
  CupSoda,
  Sandwich,
  Salad,
  Pizza,
  Soup,
  IceCream,
  Beef,
} from "lucide-react";

function getCategoryMeta(category) {
  const key = String(category || "").toLowerCase();

  if (key === "all") return { Icon: LayoutGrid };

  if (key.includes("drink") || key.includes("beverage") || key.includes("bar"))
    return { Icon: CupSoda };

  if (key.includes("dessert") || key.includes("sweet"))
    return { Icon: IceCream };

  if (key.includes("starter") || key.includes("appetizer") || key.includes("snack"))
    return { Icon: Soup };

  if (key.includes("salad") || key.includes("vegan") || key.includes("healthy"))
    return { Icon: Salad };

  if (key.includes("pizza"))
    return { Icon: Pizza };

  if (key.includes("burger") || key.includes("sandwich"))
    return { Icon: Sandwich };

  if (key.includes("main") || key.includes("grill") || key.includes("meat"))
    return { Icon: Beef };

  return { Icon: LayoutGrid };
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((category) => {
          const active = activeCategory === category;
          const { Icon } = getCategoryMeta(category);

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={[
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                "flex items-center gap-2",
                "active:scale-95",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
