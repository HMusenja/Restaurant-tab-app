import ServiceRequest from "../models/ServiceRequest.js";
import Table from "../models/Table.js";
import Tab from "../models/Tab.js";
import Notification from "../models/Notification.js";
import { severityForServiceRequest } from "../utils/notificationSeverity.js";
import User from "../models/User.js";

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

/**
 * Map "system roles" (RECEPTION/KITCHEN/BAR/ADMIN) to your User.role enum
 */
// function toUserRoleEnum(role) {
//   const r = String(role || "").toUpperCase();
//   if (r === "RECEPTION") return "Reception";
//   if (r === "KITCHEN") return "Kitchen";
//   if (r === "BAR") return "Bar";
//   if (r === "ADMIN") return "admin";
//   return null;
// }

function getPrimarySystemRoleForServiceType(type) {
  const t = String(type || "").toUpperCase();
  if (t === "BILL") return "RECEPTION";
  if (t === "WATER") return "BAR";
  if (t === "HELP") return "RECEPTION";
  return "RECEPTION";
}

function toUserRoleEnum(systemRole) {
  const r = String(systemRole || "").toUpperCase();
  if (r === "RECEPTION") return "Reception";
  if (r === "KITCHEN") return "Kitchen";
  if (r === "BAR") return "Bar";
  if (r === "ADMIN") return "admin";
  return null;
}

async function fanoutToRolesCreateNotifications({
  primarySystemRole, // e.g. "RECEPTION"
  baseNotification,
  io,
  alsoNotifyAdmin = true,
}) {
  const primaryUserRole = toUserRoleEnum(primarySystemRole);
  const adminUserRole = toUserRoleEnum("ADMIN");

  const userRoles = [primaryUserRole].filter(Boolean);
  if (alsoNotifyAdmin && adminUserRole) userRoles.push(adminUserRole);

  const users = await User.find({ role: { $in: userRoles } })
    .select("_id role")
    .lean();

  if (!users.length) return [];

  const docs = users.map((u) => ({
    ...baseNotification,

    // actual recipient
    userId: u._id,

    // ✅ intended audience category (same for admin copies too)
    recipientRole: primaryUserRole || null,

    // keep receiver role for debugging/analytics
    metadata: {
      ...(baseNotification.metadata || {}),
      deliveredToRole: u.role || null,
    },
  }));

  const inserted = await Notification.insertMany(docs, { ordered: false });

  if (io) {
    for (const n of inserted) {
      io.to(`user:${String(n.userId)}`).emit("notification:new", {
        notification: n,
      });
    }
  }

  return inserted;
}

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
      urgent: false,
    });

    // existing realtime events
    const io = req.app.get("io");
    if (io) {
      io.to("staff").emit("service:new", { requestId: request._id });

      io.to(`table:${table._id}`).emit("service:created", {
        type: request.type,
        status: request.status,
        urgent: request.urgent,
        createdAt: request.createdAt,
      });
    }

    // notifications
    const tableNumber = table?.number != null ? String(table.number) : "";
    const primarySystemRole = getPrimarySystemRoleForServiceType(request.type);

    const userRoleLabel = toUserRoleEnum(primarySystemRole) || "Staff";

    const severity = severityForServiceRequest({
  type: request.type,
  urgent: request.urgent,
});

const baseNotification = {
  type: "REQUEST_NEW",

  // ✅ Include role in title
  title: `${userRoleLabel} • New service request`,

  message: tableNumber
    ? `Table ${tableNumber}: ${request.type}${request.note ? ` — ${request.note}` : ""}`
    : `${request.type}${request.note ? ` — ${request.note}` : ""}`,

  severity,
  readAt: null,

  metadata: {
    requestId: String(request._id),
    tableId: String(table._id),
    tableNumber: tableNumber || null,
    type: request.type,
    status: request.status,

    // optional: store system role for clarity
    intendedSystemRole: primarySystemRole,
  },
};

    await fanoutToRolesCreateNotifications({
  primarySystemRole,
  baseNotification,
  io,
  alsoNotifyAdmin: true,
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

    if (status) {
      const s = String(status).toUpperCase();
      if (s === "ACTIVE") filter.status = { $in: ["OPEN", "IN_PROGRESS"] };
      else filter.status = s;
    }

    if (type) filter.type = String(type).toUpperCase();

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
        urgent: !!r.urgent,
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
    const { status, urgent } = req.body;

    if (status == null && urgent == null) {
      return res.status(400).json({ message: "status or urgent is required" });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Service request not found" });

    const prevStatus = request.status;
    const prevUrgent = !!request.urgent;

    if (status != null) request.status = String(status).toUpperCase();
    if (urgent != null) request.urgent = !!urgent;

    await request.save();

    const io = req.app.get("io");
    if (io) {
      io.to("staff").emit("service:updated", {
        requestId: request._id,
        status: request.status,
        urgent: request.urgent,
      });
    }

    const urgentTurnedOn = !prevUrgent && !!request.urgent;
    if (urgentTurnedOn) {
      const table = await Table.findById(request.table).select("number").lean();
      const tableNumber = table?.number != null ? String(table.number) : "";

      const primarySystemRole = getPrimarySystemRoleForServiceType(request.type);

      const baseNotification = {
        type: "REQUEST_URGENT",
        title: `${userRoleLabel} • Urgent service request`,
        message: tableNumber
          ? `Table ${tableNumber}: ${request.type}${request.note ? ` — ${request.note}` : ""}`
          : `${request.type}${request.note ? ` — ${request.note}` : ""}`,
        severity: "urgent",
        readAt: null,
        metadata: {
          requestId: String(request._id),
          tableId: String(request.table),
          tableNumber: tableNumber || null,
          type: request.type,
          status: request.status,
          urgent: true,
          prevStatus,
        },
      };

      await fanoutToRolesCreateNotifications({
  primarySystemRole,
  baseNotification,
  io,
  alsoNotifyAdmin: true,
});
    }

    return res.json({
      request: {
        id: request._id,
        type: request.type,
        status: request.status,
        urgent: !!request.urgent,
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