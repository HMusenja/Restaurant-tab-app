import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Search, SlidersHorizontal } from "lucide-react";
import CategoryTabs from "../guest/CategoryTabs.jsx";
import MenuItemCard from "./MenuItemCard.jsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useMenu } from "@/contexts/MenuContext";

function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export default function MenuPanel({ menu, onAdd }) {
  const { items, loadMenu } = useMenu();
  const sourceMenu = menu ?? items;

  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    if (menu === undefined) {
      loadMenu();
    }
  }, [menu, loadMenu]);

  // 1️⃣ Build category list
  const categories = useMemo(() => {
    const set = new Set();
    for (const m of Array.isArray(sourceMenu) ? sourceMenu : []) {
      if (m?.category) set.add(m.category);
    }
    return ["All", ...Array.from(set).sort()];
  }, [sourceMenu]);

  // 2️⃣ Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts = { All: sourceMenu.length };
    for (const item of Array.isArray(sourceMenu) ? sourceMenu : []) {
      if (!item.category) continue;
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [sourceMenu]);

  // 3️⃣ Filter items based on category, availability, and search
  const filteredItems = useMemo(() => {
    let list = Array.isArray(sourceMenu) ? sourceMenu : [];

    if (onlyAvailable) {
      list = list.filter((m) => m?.available !== false);
    }

    if (activeCategory !== "All") {
      list = list.filter((m) => m?.category === activeCategory);
    }

    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const name = (m?.name || "").toLowerCase();
        const desc = (m?.description || m?.desc || "").toLowerCase();
        const cat = (m?.category || "").toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // Optional: push unavailable items to the end
    return list.slice().sort((a, b) => {
      const aa = a?.available === false ? 1 : 0;
      const bb = b?.available === false ? 1 : 0;
      return aa - bb;
    });
  }, [sourceMenu, activeCategory, deferredQuery, onlyAvailable]);

  const hasActiveFilters = Boolean(query || onlyAvailable || activeCategory !== "All");

  return (
    <div className="flex h-full flex-col">
      {/* Header + Filters */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="px-4 pb-3 pt-4">
          {/* Title */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Menu
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap an item to view details and add it to the shared table tab.
              </p>
              <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
          </div>

          {/* Search + Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes, drinks, desserts…"
                className="rounded-2xl border-border bg-background pl-9 shadow-sm"
              />
            </div>

            <Button
              type="button"
              variant={onlyAvailable ? "default" : "secondary"}
              onClick={() => setOnlyAvailable((v) => !v)}
              className={cn(
                "rounded-2xl border border-border shadow-sm",
                onlyAvailable && "shadow"
              )}
              aria-pressed={onlyAvailable}
              title="Toggle available only"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Available</span>
            </Button>
          </div>
        </div>

        {/* 4️⃣ Category Tabs with icons and counts */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Menu Items */}
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
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-14 text-muted-foreground">
            <UtensilsCrossed className="mb-3 h-12 w-12 opacity-50" />
            <p className="text-center font-medium text-foreground">No matching items</p>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              Try a different category or search term.
            </p>

            {hasActiveFilters && (
              <Button
                variant="secondary"
                className="mt-5 rounded-2xl"
                onClick={() => {
                  setQuery("");
                  setOnlyAvailable(false);
                  setActiveCategory("All");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}