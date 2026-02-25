// src/pages/admin/AdminFinancePage.jsx
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFinanceSummary } from "@/hooks/useAdminFinanceSummary";

/* Components */
import FinanceHeader from "@/components/admin/finance/FinanceHeader";
import FinanceScopeControls from "@/components/admin/finance/FinanceScopeControls";
import FinanceRangeCard from "@/components/admin/finance/FinanceRangeCard";
import FinanceKpiRow from "@/components/admin/finance/FinanceKpiRow";
import FinanceTrendCard from "@/components/admin/finance/FinanceTrendCard";
import FinanceTabsSection from "@/components/admin/finance/FinanceTabsSection";
import FinanceRestaurantCard from "@/components/admin/finance/FinanceRestaurantCard";

/* Utils */
import { formatRangeLabel } from "@/utils/financeFormatters";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* UI helpers (keep local to avoid cross-file churn) */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 5;

function adminPageWrap(extra = "") {
  return cn(
    "mx-auto w-full max-w-6xl",
    "px-3 sm:px-4 md:px-6",
    "pb-6",
    extra,
  );
}

function adminErrorClass() {
  return cn(
    "rounded-2xl border border-destructive/25 bg-destructive/5",
    "p-3 text-sm text-destructive",
  );
}

export default function AdminFinancePage() {
  const { user } = useAuth();

  /* ---------------- UI STATE ---------------- */

  const [activeTab, setActiveTab] = useState("paid");
  const [metric, setMetric] = useState("gross");
  const [paidPage, setPaidPage] = useState(1);
  const [closedPage, setClosedPage] = useState(1);

  /* ---------------- DATA HOOK ---------------- */

  const {
    from,
    to,
    groupBy,
    setFrom,
    setTo,
    setGroupBy,

    scope,
    year,
    month,
    setYear,
    setMonth,
    applyScope,

    loading,
    error,
    kpis,
    trend,
    recentPaid,
    recentClosed,
    perRestaurant,

    reload,
  } = useAdminFinanceSummary({
    scope: "today",
    limit: 60,
  });

  /* ---------------- AUTH GUARD ---------------- */

  if (user?.role !== "admin") {
    return <Navigate to="/staff" replace />;
  }

  /* ---------------- YEAR OPTIONS ---------------- */

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => now - 5 + i);
  }, []);

  /* ---------------- PAGINATION ---------------- */

  const paginatedPaid = useMemo(() => {
    const start = (paidPage - 1) * PAGE_SIZE;
    return (recentPaid || []).slice(start, start + PAGE_SIZE);
  }, [recentPaid, paidPage]);

  const paginatedClosed = useMemo(() => {
    const start = (closedPage - 1) * PAGE_SIZE;
    return (recentClosed || []).slice(start, start + PAGE_SIZE);
  }, [recentClosed, closedPage]);

  const paidTotalPages = Math.ceil((recentPaid?.length || 0) / PAGE_SIZE) || 1;
  const closedTotalPages = Math.ceil((recentClosed?.length || 0) / PAGE_SIZE) || 1;

  /* ---------------- RANGE LABEL ---------------- */

  const rangeLabel = useMemo(() => {
    return formatRangeLabel({
      scope,
      from,
      to,
      year,
      month,
    });
  }, [scope, from, to, year, month]);

  /* ---------------- RENDER ---------------- */

  return (
    <div className={adminPageWrap("space-y-5")}>
      {/* HEADER + TOP RIGHT SCOPE */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <FinanceHeader />

        <FinanceScopeControls
          scope={scope}
          year={year}
          month={month}
          setYear={setYear}
          setMonth={setMonth}
          applyScope={applyScope}
          yearOptions={yearOptions}
        />
      </div>

      {/* MANUAL RANGE OVERRIDE CARD */}
      <FinanceRangeCard
        from={from}
        to={to}
        groupBy={groupBy}
        setFrom={setFrom}
        setTo={setTo}
        setGroupBy={setGroupBy}
        reload={reload}
      />

      {/* ERROR */}
      {error ? <div className={adminErrorClass()}>{error}</div> : null}

      {/* KPI ROW */}
      <FinanceKpiRow kpis={kpis} rangeLabel={rangeLabel} />

      {/* TREND CARD */}
      <FinanceTrendCard
        loading={loading}
        trend={trend}
        groupBy={groupBy}
        metric={metric}
        setMetric={setMetric}
      />

      {/* PAID / CLOSED TABS SECTION */}
      <FinanceTabsSection
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      paidRows={paginatedPaid}
  closedRows={paginatedClosed}
        paidPage={paidPage}
        closedPage={closedPage}
        setPaidPage={setPaidPage}
        setClosedPage={setClosedPage}
        paidTotalPages={paidTotalPages}
        closedTotalPages={closedTotalPages}
      />

      {/* PER RESTAURANT SUMMARY */}
      <FinanceRestaurantCard loading={loading} perRestaurant={perRestaurant} />
    </div>
  );
}