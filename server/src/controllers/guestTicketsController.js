import Table from "../models/Table.js";
import Ticket from "../models/Ticket.js";

export async function listTableTickets(req, res, next) {
  try {
    const { token } = req.params;

    const table = await Table.findOne({ token });
    if (!table) return res.status(404).json({ message: "Table not found" });

    const tabId = table.activeTab?._id ?? table.activeTab; // ✅ handles populated or ObjectId

    if (!tabId) return res.json({ tickets: [] });

    const tickets = await Ticket.find({ tab: tabId }).sort({ createdAt: 1 });

    res.json({
      tickets: tickets.map((t) => ({
        _id: t._id,
        status: t.status,
        etaMinutes: t.etaMinutes,
        station: t.station,
        createdAt: t.createdAt,
        items: t.lines.map((l) => ({
          name: l.nameSnap,
          qty: l.qty,
          status: l.status,
        })),
      })),
    });
  } catch (err) {
    console.error("listTableTickets error:", err); // ✅ shows CastError, etc.
    next(err);
  }
}

