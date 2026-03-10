// src/lib/adminUi.js
import { cn } from "@/lib/utils";

export function adminCardClass(extra = "") {
  return cn(
    "rounded-3xl border border-border dark:border-[hsl(40,20%,95%)/10%]",
    "bg-[hsl(220,20%,8%)/70%] backdrop-blur-xl",
    "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)]",
    extra,
  );
}

export function adminInputClass(extra = "") {
  return cn(
    // base
    "h-10 w-full rounded-2xl border px-3 text-sm",
    // dark glass
    "bg-[hsl(220,20%,10%)]/80 border-[hsl(40,20%,95%)/12%]",
    "text-[hsl(40,20%,92%)] placeholder:text-[hsl(40,10%,58%)] placeholder:opacity-100",
    "focus-visible:ring-2 focus-visible:ring-primary/35",
    // better touch targets on small screens
    "min-h-11 sm:min-h-10",
    extra,
  );
}

export function adminTextareaClass(extra = "") {
  return cn(
    "w-full rounded-2xl border px-3 py-2 text-sm",
    "bg-[hsl(220,20%,10%)]/80 border-[hsl(40,20%,95%)/12%]",
    "text-[hsl(40,20%,92%)] placeholder:text-[hsl(40,10%,58%)] placeholder:opacity-100",
    "focus-visible:ring-2 focus-visible:ring-primary/35",
    // mobile comfort
    "min-h-24 sm:min-h-28",
    extra,
  );
}

export function adminPanelClass(extra = "") {
  return cn(
    "rounded-2xl border border-border dark:border-[hsl(40,20%,95%)/10%]",
    "bg-[hsl(220,20%,8%)/55%] backdrop-blur-xl",
    extra,
  );
}

export function adminChipClass(active) {
  return cn(
    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
    active
      ? "bg-primary text-primary-foreground"
      : "bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,70%)] hover:bg-[hsl(40,20%,95%)/10%]",
  );
}