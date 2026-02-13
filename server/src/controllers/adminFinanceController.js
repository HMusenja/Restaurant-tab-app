// controllers/adminFinanceController.js
import Tab from "../models/Tab.js";

/**
 * Finance Summary (clean + consistent)
 *
 * Definitions:
 * - Revenue/Paid: tabs with payment.paidAt in range (regardless of final status)
 * - Closed: tabs with closedAt in range (operationally closed)  ✅ requires Tab.closedAt
 *
 * Query params:
 * - from: ISO date or YYYY-MM-DD
 * - to: ISO date or YYYY-MM-DD
 * - toMode: "inclusive" (default) or "exclusive"
 * - groupBy: "day" | "week" | "month"  (default "day")
 * - limit: 1..100 recent lists (default 20)
 */
export async function getFinanceSummary(req, res, next) {
  try {
    const { from, to, groupBy = "day", toMode = "inclusive" } = req.query;
    const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));

    // ---------- helpers ----------
    const parseDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    // We interpret `to` as:
    // - inclusive: include entire day => < (to + 1 day)
    // - exclusive: < to
    const buildRange = (field) => {
      const range = { [field]: { $type: "date" } };

      const f = parseDate(from);
      const t = parseDate(to);

      if (f || t) range[field] = { ...range[field] };

      if (f) range[field].$gte = f;

      if (t) {
        if (String(toMode).toLowerCase() === "exclusive") {
          range[field].$lt = t;
        } else {
          const end = new Date(t);
          end.setDate(end.getDate() + 1);
          range[field].$lt = end;
        }
      }

      return range;
    };

    const paidAtRangeMatch = buildRange("payment.paidAt");
    const closedAtRangeMatch = buildRange("closedAt");

    // Trend buckets use paidAt (revenue trend)
    const paidAtField = "$payment.paidAt";
    const bucketDate =
      groupBy === "month"
        ? { $dateTrunc: { date: paidAtField, unit: "month" } }
        : groupBy === "week"
          ? { $dateTrunc: { date: paidAtField, unit: "week", startOfWeek: "Mon" } }
          : { $dateTrunc: { date: paidAtField, unit: "day" } };

    const bucketLabel = {
      $dateToString: {
        date: "$_id",
        format: groupBy === "month" ? "%Y-%m" : "%Y-%m-%d",
      },
    };

    // Paid money fields (source of truth)
    // If you ever store payment totals differently, adjust here.
    const addFields = {
      subtotalCentsPaid: { $ifNull: ["$payment.subtotalCents", 0] },
      grossCentsPaid: { $ifNull: ["$payment.totalCents", 0] },
    };

    const addFields2 = {
      tipCents: {
        $max: [0, { $subtract: ["$grossCentsPaid", "$subtotalCentsPaid"] }],
      },
    };

    // ---------- pipeline ----------
    const [result] = await Tab.aggregate([
      // We do NOT filter by status here; revenue is driven by paidAt,
      // and closed stats are driven by closedAt.
      { $addFields: addFields },
      { $addFields: addFields2 },

      {
        $facet: {
          // ✅ REVENUE KPIs (Paid in range)
          paidKpis: [
            { $match: paidAtRangeMatch },
            {
              $group: {
                _id: null,
                grossCents: { $sum: "$grossCentsPaid" },
                subtotalCents: { $sum: "$subtotalCentsPaid" },
                tipsCents: { $sum: "$tipCents" },
                count: { $sum: 1 },
              },
            },
          ],

          // ✅ CLOSED KPIs (Closed in range) – requires closedAt
          closedKpis: [
            { $match: closedAtRangeMatch },
            {
              $group: {
                _id: null,
                grossCents: { $sum: "$grossCentsPaid" },
                subtotalCents: { $sum: "$subtotalCentsPaid" },
                tipsCents: { $sum: "$tipCents" },
                count: { $sum: 1 },
              },
            },
          ],

          // ✅ Revenue trend (Paid in range)
          trend: [
            { $match: paidAtRangeMatch },
            {
              $group: {
                _id: bucketDate, // Date bucket
                grossCents: { $sum: "$grossCentsPaid" },
                subtotalCents: { $sum: "$subtotalCentsPaid" },
                tipsCents: { $sum: "$tipCents" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                bucket: bucketLabel,
                grossCents: 1,
                subtotalCents: 1,
                tipsCents: 1,
                count: 1,
              },
            },
          ],

          // ✅ Recent Paid (Paid in range, ordered by paidAt)
          recentPaid: [
            { $match: paidAtRangeMatch },
            { $sort: { "payment.paidAt": -1 } },
            { $limit: limit },
            {
              $lookup: {
                from: "tables",
                localField: "table",
                foreignField: "_id",
                as: "tableDoc",
              },
            },
            { $unwind: { path: "$tableDoc", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                tabId: { $toString: "$_id" },
                paidAt: "$payment.paidAt",
                status: 1,
                paymentMethod: "$payment.method",
                grossCents: "$grossCentsPaid",
                subtotalCents: "$subtotalCentsPaid",
                tipsCents: "$tipCents",
                tableNumber: "$tableDoc.number",
              },
            },
          ],

          // ✅ Recent Closed (Closed in range, ordered by closedAt)
          recentClosed: [
            { $match: closedAtRangeMatch },
            { $sort: { closedAt: -1 } },
            { $limit: limit },
            {
              $lookup: {
                from: "tables",
                localField: "table",
                foreignField: "_id",
                as: "tableDoc",
              },
            },
            { $unwind: { path: "$tableDoc", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                tabId: { $toString: "$_id" },
                closedAt: "$closedAt",
                paidAt: "$payment.paidAt",
                status: 1,
                paymentMethod: "$payment.method",
                grossCents: "$grossCentsPaid",
                subtotalCents: "$subtotalCentsPaid",
                tipsCents: "$tipCents",
                tableNumber: "$tableDoc.number",
              },
            },
          ],

          // Optional breakdown if you later add restaurant id
          perRestaurant: [
            { $match: paidAtRangeMatch },
            {
              $group: {
                _id: { $ifNull: ["$restaurant", "default"] },
                grossCents: { $sum: "$grossCentsPaid" },
                subtotalCents: { $sum: "$subtotalCentsPaid" },
                tipsCents: { $sum: "$tipCents" },
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                restaurantId: "$_id",
                grossCents: 1,
                subtotalCents: 1,
                tipsCents: 1,
                count: 1,
                avgCents: {
                  $cond: [
                    { $gt: ["$count", 0] },
                    { $round: [{ $divide: ["$grossCents", "$count"] }, 0] },
                    0,
                  ],
                },
              },
            },
            { $sort: { grossCents: -1 } },
          ],
        },
      },
    ]);

    // ---------- response packing ----------
    const packRow = (row) => {
      const gross = row?.grossCents ?? 0;
      const subtotal = row?.subtotalCents ?? 0;
      const tips = row?.tipsCents ?? 0;
      const count = row?.count ?? 0;
      const avg = count > 0 ? Math.round(gross / count) : 0;
      return { grossCents: gross, subtotalCents: subtotal, tipsCents: tips, count, avgCents: avg };
    };

    const paid = packRow(result?.paidKpis?.[0]);
    const closed = packRow(result?.closedKpis?.[0]);

    // ✅ "all" is true revenue (paid), not paid+closed (which can double count)
    const all = { ...paid };

    return res.json({
      kpis: {
        all,
        paid,
        closed,
      },
      trend: result?.trend || [],
      recent: {
        paid: result?.recentPaid || [],
        closed: result?.recentClosed || [],
      },
      perRestaurant: result?.perRestaurant || [],
    });
  } catch (err) {
    next(err);
  }
}
