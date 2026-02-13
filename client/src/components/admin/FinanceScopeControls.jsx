import { Button } from "@/components/ui/button";

function monthNameShort(m1to12) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(Date.UTC(2026, m1to12 - 1, 1))
  );
}

export default function FinanceScopeControls({
  scope,
  year,
  month,
  setYear,
  setMonth,
  applyScope,
  yearOptions,
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button
        variant={scope === "today" ? "default" : "outline"}
        onClick={() => applyScope("today")}
      >
        Today
      </Button>

      <Button
        variant={scope === "month" ? "default" : "outline"}
        onClick={() => applyScope("month", { year, month })}
      >
        Month
      </Button>

      <Button
        variant={scope === "year" ? "default" : "outline"}
        onClick={() => applyScope("year", { year })}
      >
        Year
      </Button>

      {/* Year picker */}
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Month picker */}
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          disabled={scope !== "month"}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthNameShort(m)}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          if (scope === "today") applyScope("today");
          else if (scope === "month") applyScope("month", { year, month });
          else applyScope("year", { year });
        }}
      >
        Apply
      </Button>
    </div>
  );
}
