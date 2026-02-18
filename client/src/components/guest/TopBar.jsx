import { useEffect, useState } from "react";
import { ShoppingBag, UtensilsCrossed, Wifi } from "lucide-react";

export default function TopBar({ tableNumber, itemCount, onOpenCart }) {

    const [pop, setPop] = useState(false);

  useEffect(() => {
    if (itemCount > 0) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 180);
      return () => clearTimeout(t);
    }
  }, [itemCount]);
  
    return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <UtensilsCrossed className="h-5 w-5" />
          </div>

          {tableNumber && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-gray-500">Table</span>
              <span className="text-sm font-semibold">{tableNumber}</span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-emerald-600">
            <Wifi className="h-4 w-4" />
            <span className="text-xs font-medium">Connected</span>
          </div>

          <button
            onClick={onOpenCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 active:scale-[0.98] transition-transform"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />

            {itemCount > 0 && (
              <span
                className={[
                  "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground",
                  pop ? "animate-bounce-subtle" : "",
                ].join(" ")}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}