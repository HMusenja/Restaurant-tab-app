import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1}>
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
