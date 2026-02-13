// src/hooks/useAdminFinanceSummary.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminFinanceSummary } from "@/api/adminFinanceApi";

/* ---------------- helpers ---------------- */

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toISODate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// month range with EXCLUSIVE end
function monthRangeISO(year, month1to12) {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1));
  const end = new Date(Date.UTC(year, month1to12, 1)); // exclusive
  return { from: toISODate(start), toExclusive: toISODate(end) };
}

// year range with EXCLUSIVE end
function yearRangeISO(year) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1)); // exclusive
  return { from: toISODate(start), toExclusive: toISODate(end) };
}

/* ---------------- hook ---------------- */

export function useAdminFinanceSummary(initial = {}) {
  const now = new Date();
  const initialYear = initial.year ?? now.getFullYear();
  const initialMonth = initial.month ?? now.getMonth() + 1;

  // scopes
  const [scope, setScope] = useState(initial.scope ?? "today"); // today | month | year
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // query inputs (we keep "to" as UI-friendly inclusive date)
  const [from, setFrom] = useState(initial.from ?? todayISO());
  const [to, setTo] = useState(initial.to ?? todayISO());
  const [groupBy, setGroupBy] = useState(initial.groupBy ?? "day"); // day | week | month
  const [limit, setLimit] = useState(initial.limit ?? 60);

  // internal: when true, we call API with toMode=exclusive and convert `to` -> +1 day
  const [toMode, setToMode] = useState(initial.toMode ?? "inclusive"); // inclusive | exclusive

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const didInit = useRef(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      // ✅ If toMode is exclusive, send `to` as the exclusive boundary.
      // We store UI "to" as inclusive date, so we add +1 day when calling API.
      const apiTo =
        toMode === "exclusive" ? addDaysISO(to, 1) : to;

      const res = await fetchAdminFinanceSummary({
        from,
        to: apiTo,
        groupBy,
        limit,
        toMode,
      });

      setData(res);
    } catch (e) {
      setError(e?.message || "Failed to load finance summary");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, groupBy, limit, toMode]);

  useEffect(() => {
    load();
  }, [load]);

  const trend = useMemo(() => {
    const trendRaw = data?.trend || [];
    return trendRaw.map((b) => {
      const grossCents = Number(b.grossCents || 0);
      const subtotalCents = Number(b.subtotalCents || 0);
      const tipsCents = Number(b.tipsCents || 0);

      return {
        bucket: b.bucket,
        grossCents,
        subtotalCents,
        tipsCents,
        count: Number(b.count || 0),

        // chart values (EUR)
        grossEUR: grossCents / 100,
        subtotalEUR: subtotalCents / 100,
        tipsEUR: tipsCents / 100,
      };
    });
  }, [data]);

  const applyScope = useCallback(
    (nextScope, opts = {}) => {
      const y = opts.year ?? year;
      const m = opts.month ?? month;

      if (nextScope === "today") {
        const t = todayISO();
        setFrom(t);
        setTo(t);        // inclusive UI date
        setGroupBy("day");
        setToMode("exclusive"); // ✅ today should behave like [today, tomorrow)
        setScope("today");
        return;
      }

      if (nextScope === "month") {
        // show whole month, with WEEKS (Monday)
        const r = monthRangeISO(y, m);
        const uiFrom = r.from;
        const uiToInclusive = addDaysISO(r.toExclusive, -1);

        setFrom(uiFrom);
        setTo(uiToInclusive);   // inclusive UI date
        setGroupBy("week");
        setToMode("exclusive"); // ✅ month should be [start, nextMonthStart)
        setScope("month");

        // keep pickers in sync
        setYear(y);
        setMonth(m);
        return;
      }

      // year
      const r = yearRangeISO(y);
      const uiFrom = r.from;
      const uiToInclusive = addDaysISO(r.toExclusive, -1);

      setFrom(uiFrom);
      setTo(uiToInclusive);   // inclusive UI date
      setGroupBy("month");
      setToMode("exclusive"); // ✅ year should be [Jan1, nextJan1)
      setScope("year");
      setYear(y);
    },
    [year, month],
  );

  // ✅ default render behavior (run once)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    applyScope(scope, { year, month });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // query state
    from,
    to,
    groupBy,
    limit,
    setFrom,
    setTo,
    setGroupBy,
    setLimit,

    // scope state
    scope,
    setScope,
    year,
    setYear,
    month,
    setMonth,
    applyScope,

    // data
    data,
    kpis: data?.kpis || {},
    recentPaid: data?.recent?.paid || [],
    recentClosed: data?.recent?.closed || [],
    perRestaurant: data?.perRestaurant || [],
    trend,

    // status
    loading,
    error,

    // actions
    reload: load,
  };
}
