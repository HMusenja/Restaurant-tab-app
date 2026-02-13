import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatEUR } from "@/utils/financeFormatters";

export default function FinanceRestaurantCard({ perRestaurant, loading }) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Per Restaurant</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : perRestaurant?.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data.</div>
        ) : (
          <div className="space-y-2">
            {perRestaurant.map((r) => (
              <div
                key={r.restaurantId}
                className="flex justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    {r.restaurantId === "default"
                      ? "Default"
                      : r.restaurantId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.count} tabs · Avg {formatEUR(r.avgCents)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    {formatEUR(r.grossCents)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tips {formatEUR(r.tipsCents)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4" />
        <div className="text-xs text-muted-foreground">
          Until restaurants are modeled, everything shows as “Default”.
        </div>
      </CardContent>
    </Card>
  );
}
