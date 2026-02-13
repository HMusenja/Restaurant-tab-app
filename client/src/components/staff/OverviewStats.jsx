import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, Clock, Table2, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchTables } from "@/api/staffTableApi";
import { fetchServiceRequests } from "@/api/servicesApi";
import { useRealtime } from "@/contexts/RealtimeContext.jsx";

function StatCard({ title, value, description, icon: Icon, trend }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {description ? (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        ) : null}

        {trend ? (
          <div
            className={`flex items-center gap-1 text-xs mt-2 ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${!trend.positive ? "rotate-180" : ""}`}
            />
            <span>
              {trend.positive ? "+" : ""}
              {trend.value}% from last hour
            </span>
          </div>
        ) : null}
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
      // We fetch only what we need to compute stats
      const [tablesRes, openRes, doneRes] = await Promise.all([
        fetchTables(), // all tables
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

  // initial load
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // realtime: refresh this overview when staff events happen
  useEffect(() => {
    const id = rt.registerStaff({
      reloadTickets: null, // overview doesn’t need tickets
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

    // Completed today = DONE requests whose updatedAt is today
    const doneToday = doneRequests.filter((r) => {
      const u = r.updatedAt ? new Date(r.updatedAt) : null;
      return u && u >= today;
    });

    const completedToday = doneToday.length;

    // Avg completion time today = avg(createdAt -> updatedAt) for DONE today
    const avgResponseMins =
      completedToday === 0
        ? null
        : Math.round(
            doneToday.reduce((sum, r) => {
              const c = new Date(r.createdAt);
              const u = new Date(r.updatedAt);
              return sum + minutesBetween(c, u);
            }, 0) / completedToday,
          );

    // "Guests served" isn’t stored. We’ll use a real proxy:
    // Tables seated today = assignedAt today
    const tablesSeatedToday = tables.filter((t) => {
      if (!t.assignedAt) return false;
      return new Date(t.assignedAt) >= today;
    }).length;

    // Optional trends (simple, client-side):
    // compare requests completed in last hour vs hour before
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
      {err ? <div className="text-sm text-destructive">{err}</div> : null}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
