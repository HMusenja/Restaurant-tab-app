// src/components/reservations/reservation-ui.js
import { cn } from "@/lib/utils";

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function glassInputClass(extra = "") {
  return cn(
    "w-full h-11 rounded-2xl px-4 text-sm transition-all duration-200",
    "border bg-background text-foreground placeholder:text-muted-foreground",
    "border-border",
    "focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25",
    "hover:border-border/80",
    "dark:bg-[hsl(222,18%,14%)]",
    "dark:border-[hsl(40,30%,85%)/14%]",
    "dark:text-[hsl(40,30%,94%)]",
    "dark:placeholder:text-[hsl(40,15%,60%)]",
    "dark:focus:border-[hsl(38,90%,55%)/70%]",
    "dark:focus:ring-[hsl(38,90%,55%)/30%]",
    "dark:hover:border-[hsl(40,30%,85%)/22%]",
    extra
  );
}

export function glassCardClass(extra = "") {
  return cn(
    "relative overflow-hidden rounded-2xl border",
    "border-border bg-card/85 shadow-sm backdrop-blur-xl",
    "dark:bg-[hsl(222,18%,9%)]",
    "dark:border-[hsl(40,30%,85%)/12%]",
    "dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]",
    extra
  );
}

export function statusBadgeClass(status) {
  const s = String(status).toUpperCase();
  if (s === "SEATED") return "bg-primary/10 border-primary/20 text-primary";
  if (s === "BOOKED") return "bg-warning/10 border-warning/20 text-warning";
  if (s === "CANCELLED") {
    return "bg-destructive/10 border-destructive/20 text-destructive";
  }
  if (s === "NO_SHOW") {
    return "bg-muted/50 border-border text-muted-foreground dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]";
  }
  return "bg-muted/50 border-border text-muted-foreground dark:bg-[hsl(40,20%,95%)/6%] dark:border-[hsl(40,20%,95%)/10%] dark:text-[hsl(40,10%,70%)]";
}

export function timePillClass(kind) {
  if (kind === "upcoming") {
    return "bg-warning/10 border-warning/20 text-warning";
  }
  if (kind === "late" || kind === "overdue") {
    return "bg-destructive/10 border-destructive/20 text-destructive";
  }
  return "hidden";
}