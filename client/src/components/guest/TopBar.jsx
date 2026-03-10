import { useEffect, useState } from "react";
import {
  ShoppingBag,
  UtensilsCrossed,
  Wifi,
  Moon,
  Sun,
} from "lucide-react";

export default function TopBar({
  tableNumber,
  itemCount,
  onOpenCart,
  restaurantName = "AfroAsiatique",
  platformName = "AtUrService",
}) {
  const [pop, setPop] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (itemCount > 0) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 180);
      return () => clearTimeout(t);
    }
  }, [itemCount]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {tableNumber && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground">Table</span>
              <span className="text-sm font-semibold text-foreground">
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* Middle */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 backdrop-blur">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight text-foreground">
              {restaurantName}
            </div>
            <div className="truncate text-[11px] uppercase tracking-[0.28em] text-primary/70">
              {platformName}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 text-success sm:flex">
            <Wifi className="h-4 w-4" />
            <span className="text-xs font-medium">Connected</span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-transform hover:bg-muted active:scale-[0.98]"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-transform hover:bg-muted active:scale-[0.98]"
            aria-label="Open cart"
            type="button"
          >
            <ShoppingBag className="h-5 w-5" />

            {itemCount > 0 && (
              <span
                className={[
                  "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm",
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