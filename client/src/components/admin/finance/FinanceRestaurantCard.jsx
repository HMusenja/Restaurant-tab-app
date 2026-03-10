// src/components/admin/finance/FinanceRestaurantCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatEUR } from "@/utils/financeFormatters";

export default function FinanceRestaurantCard({
  perRestaurant,
  loading,
  brandPrefix = "Afro",
  brandSuffix = "Asiatique",
}) {
  const rows = Array.isArray(perRestaurant) ? perRestaurant : [];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Per Restaurant</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.restaurantId}
                className="flex items-start justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {/* {r.restaurantId === "default" ? "Default" : r.restaurantId} */}
                    <span className="text-primary">{brandPrefix}</span>
                    <span className="text-foreground">{brandSuffix}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.count} tabs · Avg {formatEUR(r.avgCents)}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold">{formatEUR(r.grossCents)}</div>
                  <div className="text-xs text-muted-foreground">
                    Tips {formatEUR(r.tipsCents)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4" />
        {/* <div className="text-xs text-muted-foreground">
          Until restaurants are modeled, everything shows as “Default”.
        </div> */}
      </CardContent>
    </Card>
  );
}
