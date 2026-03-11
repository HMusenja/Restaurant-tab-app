import { cn } from "@/lib/utils";

export function staffFieldClass(extra = "") {
  return cn(
    "w-full h-11 rounded-2xl px-4 text-sm transition-all duration-200",
    "bg-background text-foreground",
    "border border-border",
    "placeholder:text-muted-foreground",
    "shadow-sm",
    "focus:outline-none",
    "focus:border-primary/60",
    "focus:ring-2 focus:ring-primary/20",
    "hover:border-border/80",
    "disabled:cursor-not-allowed disabled:opacity-60",
    extra
  );
}

export function staffTextareaClass(extra = "") {
  return staffFieldClass(
    cn("h-auto min-h-[110px] resize-none py-3", extra)
  );
}

export function staffDialogContentClass(extra = "") {
  return cn(
    "rounded-3xl border border-border/70 bg-card/95 text-foreground",
    "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]",
    "backdrop-blur-xl",
    "dark:bg-card/90",
    extra
  );
}