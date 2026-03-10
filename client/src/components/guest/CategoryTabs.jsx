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

  if (key.includes("drink") || key.includes("beverage") || key.includes("bar")) {
    return { Icon: CupSoda };
  }

  if (key.includes("dessert") || key.includes("sweet")) {
    return { Icon: IceCream };
  }

  if (key.includes("starter") || key.includes("appetizer") || key.includes("snack")) {
    return { Icon: Soup };
  }

  if (key.includes("salad") || key.includes("vegan") || key.includes("healthy")) {
    return { Icon: Salad };
  }

  if (key.includes("pizza")) {
    return { Icon: Pizza };
  }

  if (key.includes("burger") || key.includes("sandwich")) {
    return { Icon: Sandwich };
  }

  if (key.includes("main") || key.includes("grill") || key.includes("meat")) {
    return { Icon: Beef };
  }

  return { Icon: LayoutGrid };
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  categoryCounts = {}
}) {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((category) => {
          const active = activeCategory === category;
          const { Icon } = getCategoryMeta(category);
          const count = categoryCounts[category] || 0;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              type="button"
              className={[
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                "active:scale-95",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
              ].join(" ")}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" />
              <span>{category}</span>
               <span className="ml-1 text-xs font-normal text-muted-foreground dark:text-[hsl(40,10%,60%)]">
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}