// src/components/staff/tables/StaffActiveTabCard.jsx
import { useNavigate } from "react-router-dom";
import { Receipt, Ticket, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

import { useTab } from "@/contexts/TabContext/TabContext";
import { formatEUR } from "@/lib/tableDetailUtils";
import { cn } from "@/lib/utils";

function statusPill(status) {
  const s = String(status || "").toUpperCase();
  if (!s) return "bg-[hsl(40,20%,95%)/6%] border-border dark:border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]";
  if (s === "DONE") return "bg-success/10 border-success/20 text-success";
  if (s === "PREPARING" || s === "IN_PROGRESS")
    return "bg-warning/10 border-warning/20 text-warning";
  return "bg-primary/10 border-primary/20 text-primary/80";
}


export default function StaffActiveTabCard() {
  const navigate = useNavigate();
  const { tab, orderedLines, ticketsCount, status } = useTab();

  const totalCents = tab?.totalCents ?? 0;
  const ordered = Array.isArray(orderedLines) ? orderedLines : [];

  const tabId = tab?._id;

  if (status === "loading") {
    return (
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "border border-border bg-card/85 backdrop-blur-xl dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/45",
          "shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
        )}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[hsl(40,20%,95%)] flex items-center gap-2">
            <span className="h-8 w-8 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </span>
            Open Tab
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm 
text-muted-foreground dark:text-[hsl(40,10%,60%)]">
          Loading tab…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border border-border bg-card/85 backdrop-blur-xl dark:border-[hsl(40,20%,95%)/10%] dark:bg-[hsl(220,20%,6%)]/45",
        "shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0 text-[hsl(40,20%,95%)]">
            <span className="h-8 w-8 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </span>
            <span className="truncate">Open Tab</span>

            <Badge className="hidden sm:inline-flex rounded-full bg-[hsl(40,20%,95%)/6%] border 
border-border dark:border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]">
              <ShoppingBag className="h-3 w-3 mr-1 opacity-80" />
              {ordered.length}
            </Badge>
          </span>

          <Badge className="rounded-full bg-[hsl(40,20%,95%)/6%] border 
border-border dark:border-[hsl(40,20%,95%)/10%] text-[hsl(40,10%,70%)]">
            <Ticket className="h-3 w-3 mr-1 opacity-80" />
            {ticketsCount ?? 0}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {ordered.length === 0 ? (
          <div className="rounded-2xl border 
border-border dark:border-[hsl(40,20%,95%)/10%] 


bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] py-6 text-center">
            <p className="text-sm font-medium text-[hsl(40,20%,92%)]">
              No items yet
            </p>
            <p className="text-xs 
text-muted-foreground dark:text-[hsl(40,10%,60%)] mt-1">
              Orders will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border 
border-border dark:border-[hsl(40,20%,95%)/10%] 


bg-muted/40 dark:bg-[hsl(40,20%,95%)/4%] overflow-hidden">
            {/* Receipt rows */}
            {ordered.map((item, index) => {
              const lineTotal = (item.priceCentsSnap || 0) * (item.qty || 0);
              return (
                <div key={`${item.menuItemId || item.nameSnap || "line"}-${index}`}>
                  {index > 0 ? (
                    <div className="h-px w-full bg-[hsl(40,20%,95%)/8%]" />
                  ) : null}

                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="w-10 shrink-0 text-right font-mono text-xs text-[hsl(40,10%,65%)]">
                        {String(item.qty ?? 0).padStart(2, "0")}x
                      </span>

                      <span className="min-w-0 truncate text-sm font-medium text-[hsl(40,20%,95%)]">
                        {item.nameSnap || "Item"}
                      </span>

                      {item.status ? (
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            statusPill(item.status)
                          )}
                        >
                          {String(item.status)}
                        </span>
                      ) : null}
                    </div>

                    <span className="shrink-0 font-semibold text-sm text-[hsl(40,20%,95%)]">
                      {formatEUR(lineTotal)}
                    </span>
                  </div>

                  {item.notes ? (
                    <div className="px-3 pb-2 -mt-1 text-[11px] 
text-muted-foreground dark:text-[hsl(40,10%,60%)] truncate">
                      {item.notes}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* Total footer */}
            <div className="h-px w-full bg-[hsl(40,20%,95%)/10%]" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-[hsl(40,20%,92%)]">
                Total
              </span>
              <span className="text-lg font-bold text-[hsl(40,20%,95%)]">
                {formatEUR(totalCents)}
              </span>
            </div>
          </div>
        )}
          {/* Payment logic (unchanged) */}
       {tabId &&
  String(tab?.status).toUpperCase() === "OPEN" && (
    <Button
      className="mt-4 w-full rounded-2xl"
      onClick={() => navigate(`/staff/pay/${tabId}`)}
    >
      Take Payment
    </Button>
)}

        <div className="mt-3 text-[11px] text-[hsl(40,10%,55%)] tracking-[0.18em] uppercase">
          AfroAsiatique • Live tab
        </div>
      </CardContent>
    </Card>
  );
}
