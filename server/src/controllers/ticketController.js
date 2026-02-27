import Tab from "../models/Tab.js";
import Ticket from "../models/Ticket.js";
import { calcTabTotals } from "../utils/money.js";

/**
 * Determine station from category
 */
function stationForItem(it) {
  const c = String(it.categorySnap || "")
    .trim()
    .toLowerCase();
  return c.includes("drink") ? "BAR" : "KITCHEN";
}

/**
 * Merge new items into ticket lines.
 * Only merge into existing lines that are still NEW.
 * If a line is PREPARING or DONE, create a new NEW line instead.
 */
function mergeLines(existingLines, newItems) {
  for (const it of newItems) {
    const match = existingLines.find(
      (l) =>
        String(l.menuItemId || l.nameSnap) ===
          String(it.menuItemId || it.nameSnap) &&
        l.status === "NEW" // 🔥 only merge into NEW lines
    );

    if (match) {
      match.qty += it.qty;
    } else {
      existingLines.push({
        menuItemId: it.menuItemId,
        nameSnap: it.nameSnap,
        qty: it.qty,
        status: "NEW",
      });
    }
  }

  return existingLines;
}

/**
 * CREATE OR APPEND TICKET
 */
export async function createTicket(req, res, next) {
  try {
    const { tabId } = req.params;

    const tab = await Tab.findById(tabId);
    if (!tab) return res.status(404).json({ message: "Tab not found" });

    if (tab.status !== "OPEN") {
      return res.status(400).json({ message: "Tab is not open" });
    }

    if (!tab.items?.length) {
      return res.status(400).json({ message: "No items to send" });
    }

    // Split items by station
    const kitchenItems = [];
    const barItems = [];

    for (const it of tab.items) {
      const station = stationForItem(it);
      (station === "BAR" ? barItems : kitchenItems).push(it);
    }

    const createdTickets = [];

    async function makeOrAppendTicket(items, station) {
      if (!items.length) return null;

      // 🔥 Append to most recent ticket that is NOT DONE
      const existing = await Ticket.findOne({
        tab: tab._id,
        station,
        status: { $ne: "DONE" }, // 🔥 allow NEW or PREPARING
      }).sort({ createdAt: -1 });

      if (existing) {
        existing.lines = mergeLines(existing.lines || [], items);
          existing.markModified("lines");
        await existing.save();
        createdTickets.push(existing);
        return existing;
      }

      // Create new ticket if none found
      const lines = items.map((it) => ({
        menuItemId: it.menuItemId,
        nameSnap: it.nameSnap,
        qty: it.qty,
        status: "NEW",
      }));

      const ticket = await Ticket.create({
        tab: tab._id,
        station,
        lines,
        status: "NEW",
      });

      createdTickets.push(ticket);
      return ticket;
    }

    await makeOrAppendTicket(kitchenItems, "KITCHEN");
    await makeOrAppendTicket(barItems, "BAR");

    /**
     * Move cart subtotal into bill
     */
    const cartSubtotalCents = tab.items.reduce(
      (sum, it) => sum + it.priceCentsSnap * it.qty,
      0
    );

    tab.billSubtotalCents =
      (tab.billSubtotalCents || 0) + cartSubtotalCents;

    // Clear cart
    tab.items = [];

    // Recalculate totals
    const { subtotalCents, totalCents, amountDueCents } =
      calcTabTotals({
        items: tab.items,
        tip: tab.tip,
        amountPaidCents: tab.amountPaidCents,
        billSubtotalCents: tab.billSubtotalCents,
      });

    tab.subtotalCents = subtotalCents;
    tab.totalCents = totalCents;
    tab.amountDueCents = amountDueCents;
    tab.version += 1;

    await tab.save();

    /**
     * 🔔 Realtime
     */
    const io = req.app.get("io");

    if (io) {
      io.to("staff").emit("tickets:updated", {
        tabId: tab._id,
        tableId: tab.table,
      });

      io.to("staff").emit("tab:updated", {
        tabId: tab._id,
        tableId: tab.table,
      });

      io.to(`table:${tab.table}`).emit("ticket:created", {});
      io.to(`table:${tab.table}`).emit("tab:updated", {});
    }

    return res.status(201).json({
      tickets: createdTickets,
      tab,
    });
  } catch (err) {
    next(err);
  }
}
