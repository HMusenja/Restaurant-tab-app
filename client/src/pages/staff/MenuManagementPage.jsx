import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Search, UtensilsCrossed } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/contexts/MenuContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import MenuItemSheet from "@/components/admin/menu-admin/MenuItemSheet";
import MenuTable from "@/components/admin/menu-admin/MenuTable";
import { cn } from "@/lib/utils";

function glassCardClass(extra = "") {
  return cn(
    "rounded-3xl border border-[hsl(40,20%,95%)/10%]",
    "bg-[hsl(220,20%,8%)/70%] backdrop-blur-xl",
    "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)]",
    extra,
  );
}

function glassInputClass(extra = "") {
  return cn(
    "h-10 rounded-2xl border px-3 text-sm",
    "bg-[hsl(220,20%,10%)]/80 border-[hsl(40,20%,95%)/12%]",
    "text-[hsl(40,20%,92%)] placeholder:text-[hsl(40,10%,58%)] placeholder:opacity-100",
    "focus-visible:ring-2 focus-visible:ring-primary/35",
    extra,
  );
}

export default function MenuManagementPage() {
  const { user } = useAuth();
  const { items, loading, loadMenu } = useMenu();

  if (user?.role !== "admin") {
    return <Navigate to="/staff" replace />;
  }

  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSheet, setOpenSheet] = useState(false);

  useEffect(() => {
    loadMenu({ admin: true });
  }, [loadMenu]);

  const filtered = useMemo(() => {
    let result = items;

    if (onlyAvailable) result = result.filter((i) => i.available);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [items, query, onlyAvailable]);

  const totalCount = items?.length || 0;
  const shownCount = filtered?.length || 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <Card className={cn(glassCardClass(), "p-3 sm:p-4 md:p-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] tracking-[0.24em] uppercase text-primary/70">
                  AfroAsiatique
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[hsl(40,20%,95%)] truncate">
                  Menu Management
                </h2>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <Badge
                variant="secondary"
                className="bg-[hsl(40,20%,95%)/8%] text-[hsl(40,10%,70%)]"
              >
                {shownCount} shown
              </Badge>
              <Badge
                variant="secondary"
                className="bg-[hsl(40,20%,95%)/6%] text-[hsl(40,10%,60%)]"
              >
                {totalCount} total
              </Badge>
              {onlyAvailable ? (
                <Badge className="bg-success/15 text-success border border-success/20">
                  Available only
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Right */}
          <Button
            className="rounded-2xl w-full sm:w-auto shrink-0"
            onClick={() => {
              setSelectedItem(null);
              setOpenSheet(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </Card>

      {/* Filters (better sticky on mobile) */}
      <Card
        className={cn(
          glassCardClass(),
          "sticky z-10 p-3",
          // top-2 is often too tight with mobile browser UI; top-3 feels safer
          "top-3",
        )}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-[hsl(40,10%,60%)] absolute left-3 top-3" />
            <Input
              placeholder="Search menu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={glassInputClass("pl-9 w-full")}
            />
          </div>

          {/* Toggle (full-width on mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-3 rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(40,20%,95%)/4%] px-3 py-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Switch
                  checked={onlyAvailable}
                  onCheckedChange={setOnlyAvailable}
                />
                <span className="text-sm text-[hsl(40,10%,70%)]">
                  Available only
                </span>
              </div>

              <span className="text-[11px] text-[hsl(40,10%,55%)] sm:hidden">
                {shownCount}/{totalCount}
              </span>
            </div>

            <div className="text-xs text-[hsl(40,10%,55%)] hidden md:block">
              Tip: Use search + toggle to speed up service ops.
            </div>
          </div>
        </div>
      </Card>

      {/* Table container: allow horizontal scroll on mobile */}
      <div
        className={cn(
          "rounded-3xl border border-[hsl(40,20%,95%)/10%]",
          "bg-[hsl(220,20%,8%)/55%] backdrop-blur-xl",
          "p-2 sm:p-3",
        )}
      >
        <div className="-mx-2 sm:mx-0 overflow-x-auto overscroll-x-contain">
          <div className="min-w-[720px] sm:min-w-0 px-2 sm:px-0">
            <MenuTable
              items={filtered}
              loading={loading}
              onEdit={(item) => {
                setSelectedItem(item);
                setOpenSheet(true);
              }}
              onRefresh={() => loadMenu({ admin: true })}
            />
          </div>
        </div>

        {/* small helper hint for mobile */}
        <div className="pt-2 text-[11px] text-[hsl(40,10%,55%)] sm:hidden">
          Swipe sideways to see all columns.
        </div>
      </div>

      <MenuItemSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        item={selectedItem}
        onSuccess={() => loadMenu({ admin: true })}
      />
    </div>
  );
}