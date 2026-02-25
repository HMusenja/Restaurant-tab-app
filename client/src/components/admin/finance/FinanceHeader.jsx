// src/components/admin/finance/FinanceHeader.jsx
import { Button } from "@/components/ui/button";

export default function FinanceHeader({ onRefresh }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold">Finance Statistics</h1>
        <div className="text-sm text-muted-foreground">Admin only</div>
      </div>

      <Button variant="secondary" onClick={onRefresh} className="shrink-0">
        Refresh
      </Button>
    </div>
  );
}