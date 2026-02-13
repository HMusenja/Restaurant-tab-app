import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminFinanceSummary } from "@/hooks/useAdminFinanceSummary";

/* Components */
import FinanceHeader from "@/components/admin/FinanceHeader";
import FinanceScopeControls from "@/components/admin/FinanceScopeControls";
import FinanceRangeCard from "@/components/admin/FinanceRangeCard";
import FinanceKpiRow from "@/components/admin/FinanceKpiRow";
import FinanceTrendCard from "@/components/admin/FinanceTrendCard";
import FinanceTabsSection from "@/components/admin/FinanceTabsSection";
import FinanceRestaurantCard from "@/components/admin/FinanceRestaurantCard";

/* Utils */
import { formatRangeLabel } from "@/utils/financeFormatters";

export default function AdminFinancePage() {
  const { user } = useAuth();

  /* ---------------- UI STATE ---------------- */

  const [activeTab, setActiveTab] = useState("paid");
  const [metric, setMetric] = useState("gross");

  const PAGE_SIZE = 5;
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
    return recentPaid.slice(start, start + PAGE_SIZE);
  }, [recentPaid, paidPage]);

  const paginatedClosed = useMemo(() => {
    const start = (closedPage - 1) * PAGE_SIZE;
    return recentClosed.slice(start, start + PAGE_SIZE);
  }, [recentClosed, closedPage]);

  const paidTotalPages =
    Math.ceil(recentPaid.length / PAGE_SIZE) || 1;

  const closedTotalPages =
    Math.ceil(recentClosed.length / PAGE_SIZE) || 1;

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
    <div className="space-y-6">
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
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPI ROW */}
      <FinanceKpiRow
        kpis={kpis}
        rangeLabel={rangeLabel}
      />

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
        paginatedPaid={paginatedPaid}
        paginatedClosed={paginatedClosed}
        paidPage={paidPage}
        closedPage={closedPage}
        setPaidPage={setPaidPage}
        setClosedPage={setClosedPage}
        paidTotalPages={paidTotalPages}
        closedTotalPages={closedTotalPages}
      />

      {/* PER RESTAURANT SUMMARY */}
      <FinanceRestaurantCard
        loading={loading}
        perRestaurant={perRestaurant}
      />
    </div>
  );
}
