// src/components/admin/finance/FinanceScopeControls.jsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function monthNameShort(m1to12) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(
    new Date(Date.UTC(2026, m1to12 - 1, 1)),
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
      <div className="flex flex-wrap gap-2">
  <Button
    onClick={() => applyScope("today")}
    className={
      scope === "today"
        ? "bg-orange-500 text-white hover:bg-orange-600"
        : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:text-white"
    }
  >
    Today
  </Button>

  <Button
    onClick={() => applyScope("month", { year, month })}
    className={
      scope === "month"
        ? "bg-orange-500 text-white hover:bg-orange-600"
        : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:text-white"
    }
  >
    Month
  </Button>

  <Button
    onClick={() => applyScope("year", { year })}
    className={
      scope === "year"
        ? "bg-orange-500 text-white hover:bg-orange-600"
        : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:text-white"
    }
  >
    Year
  </Button>
</div>


      {/* Year */}
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={cn(
            "h-10 rounded-xl border border-border/50 bg-background px-3 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          disabled={scope !== "month"}
          className={cn(
            "h-10 rounded-xl border border-border/50 bg-background px-3 text-sm",
            "disabled:opacity-60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
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
