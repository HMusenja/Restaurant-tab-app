import Ticket from "../models/Ticket.js";
import Tab from "../models/Tab.js";

export async function listTickets(req, res, next) {
  try {
    const includeDone = Number(req.query.includeDone || 0);
    const doneMinutes = Number(req.query.doneMinutes || 120);

    // ✅ Only tickets belonging to ACTIVE tabs
    const activeTabs = await Tab.find({
      status: { $in: ["OPEN", "REQUESTED_TO_PAY", "PAID"] },
    }).select("_id");

    const activeTabIds = activeTabs.map((t) => t._id);

    const filter = { tab: { $in: activeTabIds } };

    // ✅ keep your existing done logic
    if (!includeDone) {
      filter.status = { $ne: "DONE" };
    } else {
      const since = new Date(Date.now() - doneMinutes * 60 * 1000);
      filter.$or = [
        { status: { $ne: "DONE" } },
        { status: "DONE", updatedAt: { $gte: since } },
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate({
        path: "tab",
        select: "status table",
        populate: { path: "table", select: "number status" },
      })
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (err) {
    next(err);
  }
}

export async function updateTicketStatus(req, res, next) {
  try {
    const { ticketId } = req.params;
    const { status, etaMinutes } = req.body;

    const ticket = await Ticket.findById(ticketId).populate({
      path: "tab",
      populate: { path: "table", select: "number" },
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // ✅ Capture previous overall status for model hook notifications
    ticket.$locals.prevStatus = ticket.status;

    if (status) ticket.status = status;
    if (etaMinutes !== undefined) ticket.etaMinutes = etaMinutes;

    await ticket.save();

    const io = req.app.get("io");
    if (io) {
      // staff dashboards
      io.to("staff").emit("ticket:updated", { ticket });

      // guest/table devices
      const tableId = ticket.tab?.table?._id;
      if (tableId) {
        io.to(`table:${tableId}`).emit("ticket:updated", {
          ticketId: ticket._id,
          status: ticket.status,
          etaMinutes: ticket.etaMinutes,
          items: ticket.lines.map((l) => ({
            id: l._id,
            name: l.nameSnap,
            qty: l.qty,
            status: l.status,
          })),
        });
      }
    }

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
}

function computeTicketStatus(lines) {
  const statuses = lines.map((l) => l.status);

  if (statuses.every((s) => s === "DONE")) return "DONE";
  if (statuses.some((s) => s === "PREPARING" || s === "DONE")) return "PREPARING";
  return "NEW";
}

export async function updateTicketLineStatus(req, res, next) {
  try {
    const { ticketId, lineId } = req.params;
    const { status } = req.body;

    if (!["NEW", "PREPARING", "DONE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ticket = await Ticket.findById(ticketId).populate({
      path: "tab",
      populate: { path: "table", select: "number" },
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const line = ticket.lines.id(lineId);
    if (!line) return res.status(404).json({ message: "Line not found" });

    // ✅ Capture previous overall status before recompute
    ticket.$locals.prevStatus = ticket.status;

    line.status = status;

    // recompute ticket overall status
    ticket.status = computeTicketStatus(ticket.lines);

    await ticket.save();

    const io = req.app.get("io");
    if (io) {
      io.to("staff").emit("ticket:updated", { ticket });

      const tableId = ticket.tab?.table?._id;
      if (tableId) {
        io.to(`table:${tableId}`).emit("ticket:updated", {
          ticketId: ticket._id,
          status: ticket.status,
          etaMinutes: ticket.etaMinutes,
          items: ticket.lines.map((l) => ({
            id: l._id,
            name: l.nameSnap,
            qty: l.qty,
            status: l.status,
          })),
        });
      }
    }

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
}