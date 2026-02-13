import { UtensilsCrossed } from "lucide-react";

export function AppHeader({ showBrand = true, rightContent }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border safe-top">
      <div className="flex h-14 items-center justify-between px-4">
        {showBrand && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">
              AtUrService
            </span>
          </div>
        )}

        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
