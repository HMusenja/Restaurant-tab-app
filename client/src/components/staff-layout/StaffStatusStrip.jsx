import { Wifi, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function Pill({ icon: Icon, children, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] tracking-[0.18em] uppercase",
        "bg-primary/10 border border-primary/20 text-primary/80",
        className
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="leading-none">{children}</span>
    </div>
  );
}

/**
 * UI-only strip for POS-style status indicators.
 * - No business logic here.
 * - Later you can pass items (counts, sync state) from existing contexts/hooks.
 */
export default function StaffStatusStrip({ className, items }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className={cn("hidden md:flex items-center gap-2", className)}>
      {/* Default “POS vibe” indicators (static, UI-only) */}
      <Pill icon={Wifi}>Live</Pill>

      {/* Ops pill: theme-aware for light-mode visibility */}
      <Pill
        icon={Sparkles}
        className={cn(
          // ✅ light mode
          "bg-card/90 border-border text-foreground/80 shadow-sm ring-1 ring-black/5",
          // ✅ dark mode (keep your original look)
          "dark:text-[hsl(40,20%,92%)] dark:bg-[hsl(40,20%,95%)/6%]  dark:border-[hsl(40,20%,95%)/10%] dark:shadow-none dark:ring-0"
        )}
      >
        Ops
      </Pill>

      {/* Optional dynamic pills (future-ready, but not required) */}
      {hasItems
        ? items.map((it) => (
            <Pill key={it.key} icon={it.icon} className={it.className}>
              {it.label}
            </Pill>
          ))
        : null}
    </div>
  );
}