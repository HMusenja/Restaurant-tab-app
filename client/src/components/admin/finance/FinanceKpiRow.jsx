// src/components/admin/finance/FinanceKpiRow.jsx
import KpiCard from "./KpiCard";

export default function FinanceKpiRow({ kpis, rangeLabel }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <KpiCard
        title="All (Paid + Closed)"
        kpi={kpis?.all}
        rangeLabel={rangeLabel}
      />
      <KpiCard title="Paid" kpi={kpis?.paid} rangeLabel={rangeLabel} />
      <KpiCard title="Closed" kpi={kpis?.closed} rangeLabel={rangeLabel} />
    </div>
  );
}