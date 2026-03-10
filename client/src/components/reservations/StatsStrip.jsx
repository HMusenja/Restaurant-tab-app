export default function StatsStrip({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-3 py-3">
        <div className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          Booked
        </div>
        <div className="text-xl font-semibold text-warning tabular-nums">
          {stats.BOOKED}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-3">
        <div className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          Seated
        </div>
        <div className="text-xl font-semibold text-primary tabular-nums">
          {stats.SEATED}
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-3">
        <div className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          Cancelled
        </div>
        <div className="text-xl font-semibold text-destructive tabular-nums">
          {stats.CANCELLED}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 px-3 py-3 dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(40,20%,95%)/4%]">
        <div className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          No-show
        </div>
        <div className="text-xl font-semibold tabular-nums text-foreground dark:text-[hsl(40,20%,92%)]">
          {stats.NO_SHOW}
        </div>
      </div>
    </div>
  );
}