import ServiceRequest from "../models/ServiceRequest.js";
import Table from "../models/Table.js";
import Tab from "../models/Tab.js";

export async function createServiceRequest(req, res, next) {
  try {
    const { tableId, tabId, type, note } = req.body;

    if (!tableId) return res.status(400).json({ message: "tableId is required" });
    if (!type) return res.status(400).json({ message: "type is required" });

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    let tab = null;
    if (tabId) {
      tab = await Tab.findById(tabId);
      if (!tab) return res.status(404).json({ message: "Tab not found" });
    }

    const request = await ServiceRequest.create({
      table: table._id,
      tab: tab?._id || null,
      type: String(type).toUpperCase(),
      note: note || "",
      status: "OPEN",
    });

    // 🔔 notify staff in real time
    const io = req.app.get("io");
    io.to("staff").emit("service:new", { requestId: request._id });

    // 🔔 optional: notify the specific table too
    io.to(`table:${table._id}`).emit("service:created", {
      type: request.type,
      status: request.status,
      createdAt: request.createdAt,
    });

    return res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

export async function listServiceRequests(req, res, next) {
  try {
    const { status, type, sinceMinutes } = req.query;

    const filter = {};

    // ✅ status filter
    if (status) {
      const s = String(status).toUpperCase();

      if (s === "ACTIVE") {
        filter.status = { $in: ["OPEN", "IN_PROGRESS"] };
      } else {
        filter.status = s; // OPEN | IN_PROGRESS | DONE
      }
    }

    if (type) filter.type = String(type).toUpperCase();

    // ✅ default: last 6 hours, but respect sinceMinutes when provided
    const mins = sinceMinutes != null ? Number(sinceMinutes) : 360;
    if (!Number.isNaN(mins) && mins > 0) {
      filter.createdAt = { $gte: new Date(Date.now() - mins * 60 * 1000) };
    }

    const requests = await ServiceRequest.find(filter)
      .populate("table", "number")
      .sort({ createdAt: -1 });

    return res.json({
      requests: requests.map((r) => ({
        id: r._id,
        type: r.type,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        table: r.table ? { id: r.table._id, number: r.table.number } : null,
        tab: r.tab,
      })),
    });
  } catch (err) {
    next(err);
  }
}


export async function updateServiceRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "status is required" });

    const request = await ServiceRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Service request not found" });

    request.status = String(status).toUpperCase();
    await request.save();

    const io = req.app.get("io");
    io.to("staff").emit("service:updated", { requestId: request._id, status: request.status });

    return res.json({
      request: {
        id: request._id,
        type: request.type,
        status: request.status,
        note: request.note,
        createdAt: request.createdAt,
        table: request.table,
        tab: request.tab,
      },
    });
  } catch (err) {
    next(err);
  }
}
