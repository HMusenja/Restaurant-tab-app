import { Button } from "@/components/ui/button";

export default function FinanceHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Finance Statistics</h1>
        <div className="text-sm text-muted-foreground">
          Admin only
        </div>
      </div>

      <Button variant="secondary" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
}
