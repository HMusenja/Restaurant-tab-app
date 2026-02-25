// src/components/admin/finance/Pagination.jsx
import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page === 1}
          className="min-w-[84px]"
        >
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages}
          className="min-w-[84px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
}