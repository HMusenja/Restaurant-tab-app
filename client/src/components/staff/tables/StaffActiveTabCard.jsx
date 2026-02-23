// src/components/staff/tables/StaffActiveTabCard.jsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useTab } from "@/contexts/TabContext/TabContext";
import { formatEUR } from "@/lib/tableDetailUtils";

export default function StaffActiveTabCard() {
  const { tab, orderedLines, ticketsCount, status } = useTab();

  const totalCents = tab?.totalCents ?? 0;
  const ordered = Array.isArray(orderedLines) ? orderedLines : [];

  if (status === "loading") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Open Tab</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading tab…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            Open Tab
            <Badge variant="secondary">{ordered.length} items</Badge>
          </span>
          <Badge variant="outline" className="text-xs">
            Tickets: {ticketsCount ?? 0}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {ordered.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No items yet</p>
        ) : (
          <div className="space-y-3">
            {ordered.map((item, index) => (
              <div key={`${item.menuItemId || item.nameSnap || "line"}-${index}`}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.qty ?? 0}x {item.nameSnap || "Item"}
                    </p>
                    {item.status ? (
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    ) : null}
                  </div>
                  <p className="font-semibold shrink-0">
                    {formatEUR((item.priceCentsSnap || 0) * (item.qty || 0))}
                  </p>
                </div>
              </div>
            ))}

            <Separator className="my-3" />
            <div className="flex justify-between items-center pt-2">
              <p className="font-semibold">Total</p>
              <p className="text-xl font-bold">{formatEUR(totalCents)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
