import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, Clock, Table2, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchTables } from "@/api/staffTableApi";
import { fetchServiceRequests } from "@/api/servicesApi";
import { useRealtime } from "@/contexts/RealtimeContext.jsx";
import { cn } from "@/lib/utils";

function StatCard({ title, value, description, icon: Icon, trend }) {
  return (
    <Card
      className={cn(
        // glass card that matches your staff shell
        "relative overflow-hidden rounded-2xl",
        "border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,6%)]/45 backdrop-blur-xl",
        "shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      {/* soft glow accent */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <CardTitle className="text-xs font-semibold tracking-[0.18em] uppercase text-primary/70">
          {title}
        </CardTitle>

        <div className="h-9 w-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary/90" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-3xl font-bold leading-none tracking-tight text-[hsl(40,20%,95%)]">
              {value}
            </div>

            {description ? (
              <p className="mt-2 text-xs text-[hsl(40,10%,60%)] leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>

          {trend ? (
            <div
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                "border",
                trend.positive
                  ? "text-success border-success/25 bg-success/10"
                  : "text-destructive border-destructive/25 bg-destructive/10"
              )}
              title="Compared to the previous hour"
            >
              <TrendingUp
                className={cn("h-3.5 w-3.5", !trend.positive ? "rotate-180" : "")}
              />
              <span>
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          ) : null}
        </div>

        {/* subtle bottom divider */}
        <div className="mt-4 h-px w-full bg-[hsl(40,20%,95%)/8%]" />

        {/* tiny helper row for POS vibe */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-[hsl(40,10%,55%)]">
          <span className="tracking-[0.16em] uppercase">AfroAsiatique</span>
          <span className="text-primary/70">Live</span>
        </div>
      </CardContent>
    </Card>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function minutesBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function pctChange(prev, now) {
  if (!prev && !now) return 0;
  if (!prev && now) return 100;
  return Math.round(((now - prev) / prev) * 100);
}

export function OverviewStats() {
  const rt = useRealtime();

  const [tables, setTables] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [doneRequests, setDoneRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadOverview = useCallback(async () => {
    setErr("");

    try {
      const [tablesRes, openRes, doneRes] = await Promise.all([
        fetchTables(),
        fetchServiceRequests({ status: "OPEN" }),
        fetchServiceRequests({ status: "DONE" }),
      ]);

      setTables(tablesRes.tables || []);
      setOpenRequests(openRes.requests || []);
      setDoneRequests(doneRes.requests || []);
    } catch (e) {
      setErr(e?.message || "Failed to load overview stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: null,
      reloadServices: loadOverview,
      reloadTables: loadOverview,
    });

    return () => rt.unregisterStaff(id);
  }, [rt, loadOverview]);

  const computed = useMemo(() => {
    const totalTables = tables.length;
    const activeTables = tables.filter((t) => t.status === "OCCUPIED").length;
    const freeTables = tables.filter((t) => t.status === "FREE").length;

    const pendingRequests = openRequests.length;

    const today = startOfToday();

    const doneToday = doneRequests.filter((r) => {
      const u = r.updatedAt ? new Date(r.updatedAt) : null;
      return u && u >= today;
    });

    const completedToday = doneToday.length;

    const avgResponseMins =
      completedToday === 0
        ? null
        : Math.round(
            doneToday.reduce((sum, r) => {
              const c = new Date(r.createdAt);
              const u = new Date(r.updatedAt);
              return sum + minutesBetween(c, u);
            }, 0) / completedToday
          );

    const tablesSeatedToday = tables.filter((t) => {
      if (!t.assignedAt) return false;
      return new Date(t.assignedAt) >= today;
    }).length;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const completedLastHour = doneRequests.filter((r) => {
      const u = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      return u >= now - oneHour;
    }).length;

    const completedPrevHour = doneRequests.filter((r) => {
      const u = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      return u >= now - 2 * oneHour && u < now - oneHour;
    }).length;

    const completedTrend = pctChange(completedPrevHour, completedLastHour);

    const pendingLastHour = openRequests.filter((r) => {
      const c = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      return c >= now - oneHour;
    }).length;

    const pendingPrevHour = openRequests.filter((r) => {
      const c = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      return c >= now - 2 * oneHour && c < now - oneHour;
    }).length;

    const pendingTrend = pctChange(pendingPrevHour, pendingLastHour);

    return {
      totalTables,
      activeTables,
      freeTables,
      pendingRequests,
      completedToday,
      avgResponseMins,
      tablesSeatedToday,
      completedTrend,
      pendingTrend,
    };
  }, [tables, openRequests, doneRequests]);

  const stats = [
    {
      title: "Active Tables",
      value: loading ? "…" : computed.activeTables,
      description: loading
        ? ""
        : `Out of ${computed.totalTables} total • ${computed.freeTables} free`,
      icon: Table2,
    },
    {
      title: "Pending Requests",
      value: loading ? "…" : computed.pendingRequests,
      description: "Awaiting response",
      icon: Bell,
      trend: loading
        ? null
        : { value: Math.abs(computed.pendingTrend), positive: computed.pendingTrend >= 0 },
    },
    {
      title: "Completed Today",
      value: loading ? "…" : computed.completedToday,
      description: "Service requests done today",
      icon: CheckCircle,
      trend: loading
        ? null
        : { value: Math.abs(computed.completedTrend), positive: computed.completedTrend >= 0 },
    },
    {
      title: "Avg. Response Time",
      value: loading ? "…" : computed.avgResponseMins != null ? `${computed.avgResponseMins}m` : "—",
      description: "From request → done (today)",
      icon: Clock,
    },
    {
      title: "Tables Seated",
      value: loading ? "…" : computed.tablesSeatedToday,
      description: "Assigned today (proxy)",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-3">
      {err ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
