import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PageHeader({
  title = "Reservations",
  subtitle = "Manage bookings across all tables • Seat, edit, and cancel",
  brand = "AfroAsiatique",
  onBack,
  onRefresh,
  refreshing,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 rounded-2xl hover:bg-muted/60 dark:hover:bg-[hsl(40,20%,95%)/8%]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs tracking-[0.28em] uppercase text-primary/70">
            {brand}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-[hsl(40,20%,95%)]">
            {title}
          </h1>

          <div className="max-w-[36rem] text-xs sm:text-sm text-muted-foreground dark:text-[hsl(40,10%,60%)]">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          title="Refresh"
          className="rounded-2xl hover:bg-muted/60 dark:hover:bg-[hsl(40,20%,95%)/8%]"
        >
          <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </Button>

        <Button onClick={onCreate} className="rounded-2xl px-4 sm:px-5">
          <Plus className="w-4 h-4" />
          <span className="ml-2">Create</span>
        </Button>
      </div>
    </div>
  );
}