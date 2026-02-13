// controllers/adminFinanceController.js  (SERVER) ✅ Monday weeks + exclusive to support
import Tab from "../models/Tab.js";

export async function getFinanceSummary(req, res, next) {
  try {
    const { from, to, groupBy = "day", toMode = "inclusive" } = req.query;
    const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));

    const match = {
      status: { $in: ["PAID", "CLOSED"] },
      "payment.paidAt": { $type: "date" },
    };

    if (from || to) {
      match["payment.paidAt"] = { ...match["payment.paidAt"] };

      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) match["payment.paidAt"].$gte = d;
      }

      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) {
          if (String(toMode).toLowerCase() === "exclusive") {
            // ✅ to is exclusive boundary
            match["payment.paidAt"].$lt = d;
          } else {
            // ✅ to is inclusive DAY (old behavior)
            const end = new Date(d);
            end.setDate(end.getDate() + 1);
            match["payment.paidAt"].$lt = end;
          }
        }
      }
    }

    const addFields = {
      subtotalCentsPaid: { $ifNull: ["$payment.subtotalCents", 0] },
      grossCentsPaid: { $ifNull: ["$payment.totalCents", 0] },
    };

    const addFields2 = {
      tipCents: { $max: [0, { $subtract: ["$grossCentsPaid", "$subtotalCentsPaid"] }] },
    };

    const paidAtField = "$payment.paidAt";

    // ✅ bucket Date using $dateTrunc (Monday weeks)
    const bucketDate =
      groupBy === "month"
        ? { $dateTrunc: { date: paidAtField, unit: "month" } }
        : groupBy === "week"
          ? { $dateTrunc: { date: paidAtField, unit: "week", startOfWeek: "Mon" } }
          : { $dateTrunc: { date: paidAtField, unit: "day" } };

    // ✅ bucket label string (what your frontend uses)
    const bucketLabel = {
      $dateToString: {
        date: "$_id",
        format: groupBy === "month" ? "%Y-%m" : "%Y-%m-%d",
      },
    };

    const [result] = await Tab.aggregate([
      { $match: match },
      { $addFields: addFields },
      { $addFields: addFields2 },

      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: "$status",
                grossCents: { $sum: "$grossCentsPaid" },
                subtotalCents: { $sum: "$subtotalCentsPaid" },
                tipsCents: { $sum: "$tipCents" },
                count: { $sum: 1 },
              },
            },
          ],

          trend: [
            {
              $group: {
                _id: bucketDate, // Date
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
                bucket: bucketLabel, // string label for X axis
                grossCents: 1,
                subtotalCents: 1,
                tipsCents: 1,
                count: 1,
              },
            },
          ],

          recentPaid: [
            { $match: { status: "PAID" } },
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

          recentClosed: [
            { $match: { status: "CLOSED" } },
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

          perRestaurant: [
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

    const byStatus = new Map((result?.kpis || []).map((x) => [String(x._id), x]));

    function pack(statusKey) {
      const row = byStatus.get(statusKey);
      const gross = row?.grossCents ?? 0;
      const subtotal = row?.subtotalCents ?? 0;
      const tips = row?.tipsCents ?? 0;
      const count = row?.count ?? 0;
      const avg = count > 0 ? Math.round(gross / count) : 0;
      return { grossCents: gross, subtotalCents: subtotal, tipsCents: tips, count, avgCents: avg };
    }

    const paid = pack("PAID");
    const closed = pack("CLOSED");

    const allCount = paid.count + closed.count;
    const allGross = paid.grossCents + closed.grossCents;
    const allSubtotal = paid.subtotalCents + closed.subtotalCents;
    const allTips = paid.tipsCents + closed.tipsCents;

    return res.json({
      kpis: {
        all: {
          grossCents: allGross,
          subtotalCents: allSubtotal,
          tipsCents: allTips,
          count: allCount,
          avgCents: allCount > 0 ? Math.round(allGross / allCount) : 0,
        },
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
