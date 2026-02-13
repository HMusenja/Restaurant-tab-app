export default function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="sticky top-14 z-30 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={[
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-black text-white shadow-sm"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200",
              ].join(" ")}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
