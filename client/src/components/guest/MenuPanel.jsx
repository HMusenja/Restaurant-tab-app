import { useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import CategoryTabs from "./CategoryTabs.jsx";
import MenuItemCard from "./MenuItemCard.jsx";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export default function MenuPanel({ menu = [], onAdd }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set();
    for (const m of menu) {
      if (m?.category) set.add(m.category);
    }
    return ["All", ...Array.from(set).sort()];
  }, [menu]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return menu;
    return menu.filter((m) => m.category === activeCategory);
  }, [menu, activeCategory]);

  return (
    <div className="flex flex-col">
      {/* Header (like Code A) */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <UtensilsCrossed className="h-5 w-5 text-black" />
          Menu
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tap an item to add it to the shared table tab.
        </p>
      </div>

      {/* Sticky Category Tabs (like Code A) */}
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Scroll area + bottom padding like Code A (pb-40) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((m) => (
              <MenuItemCard
                key={m._id}
                item={m}
                onAdd={() => onAdd(m._id, 1)}
                formatPrice={() => formatEUR(m.priceCents)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <UtensilsCrossed className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-center">No items available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
