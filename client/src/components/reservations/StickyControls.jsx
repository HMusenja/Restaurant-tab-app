import { CalendarDays, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import StatsStrip from "./StatsStrip";
import { glassCardClass, glassInputClass } from "./reservation-ui";
import {
  SCOPE_OPTIONS,
  ymdLocal,
  addDaysYMD,
} from "@/hooks/useReservationsManager";

function Pill({ active, children, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap border",
        active
          ? "bg-primary/10 text-foreground border-primary/25 shadow-sm dark:bg-primary/20 dark:text-[hsl(40,20%,95%)] dark:border-primary/25"
          : "bg-card/80 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground dark:bg-[hsl(40,20%,95%)/4%] dark:text-[hsl(40,10%,70%)] dark:border-[hsl(40,20%,95%)/10%] dark:hover:bg-[hsl(40,20%,95%)/6%]",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function StickyControls({
  selectedDate,
  setSelectedDate,
  scope,
  setScope,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  statusChips = [],
  stats,
}) {
  return (
    <Card className={cn(glassCardClass(), "sticky top-2 z-10")}>
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="grid gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground dark:text-[hsl(40,10%,60%)]">
              <CalendarDays className="w-4 h-4 text-primary/80" />
              <span className="tracking-[0.18em] uppercase">Scope</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[160px_150px_minmax(0,1fr)] gap-3">
              <input
                type="date"
                className={cn(
                  glassInputClass("w-full"),
                  "appearance-none opacity-100"
                )}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={scope !== "day"}
                title={
                  scope !== "day"
                    ? "Scope is a range — switch to Day to pick a date"
                    : undefined
                }
              />

              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger
                  className={cn(glassInputClass("w-full py-0"), "h-11")}
                >
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 overflow-x-auto pb-1 sm:col-span-2 lg:col-span-1">
                <Pill
                  active={selectedDate === ymdLocal() && scope === "day"}
                  onClick={() => {
                    setScope("day");
                    setSelectedDate(ymdLocal());
                  }}
                >
                  Today
                </Pill>

                <Pill
                  active={
                    selectedDate === addDaysYMD(ymdLocal(), 1) &&
                    scope === "day"
                  }
                  onClick={() => {
                    setScope("day");
                    setSelectedDate(addDaysYMD(ymdLocal(), 1));
                  }}
                >
                  Tomorrow
                </Pill>

                <Pill active={scope === "next7"} onClick={() => setScope("next7")}>
                  Next 7
                </Pill>

                <Pill active={scope === "next30"} onClick={() => setScope("next30")}>
                  Next 30
                </Pill>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px] gap-3">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground dark:text-[hsl(40,10%,60%)]" />
              <input
                className={glassInputClass("w-full pl-9")}
                placeholder="Search by name, phone, table…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(glassInputClass("w-full py-0"), "h-11")}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusChips.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <StatsStrip stats={stats} />
      </CardContent>
    </Card>
  );
}