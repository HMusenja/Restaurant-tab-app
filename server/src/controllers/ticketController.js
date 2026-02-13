import Tab from "../models/Tab.js";
import Ticket from "../models/Ticket.js";
import { calcTabTotals } from "../utils/money.js";

function stationForItem(it) {
  const c = String(it.categorySnap || "")
    .trim()
    .toLowerCase();
  return c.includes("drink") ? "BAR" : "KITCHEN";
}

function mergeLines(existingLines, newItems) {
  // key by menuItemId OR nameSnap
  const map = new Map();

  for (const l of existingLines) {
    const key = String(l.menuItemId || l.nameSnap);
    map.set(key, l);
  }

  for (const it of newItems) {
    const key = String(it.menuItemId || it.nameSnap);
    const found = map.get(key);

    if (found) {
      found.qty += it.qty;
      // keep status as-is (usually NEW)
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

export async function createTicket(req, res, next) {
  try {
    const { tabId } = req.params;

    const tab = await Tab.findById(tabId);
    if (!tab) return res.status(404).json({ message: "Tab not found" });
    if (tab.status !== "OPEN")
      return res.status(400).json({ message: "Tab is not open" });
    if (!tab.items?.length)
      return res.status(400).json({ message: "No items to send" });

    // Split cart items by station
    const kitchenItems = [];
    const barItems = [];

    for (const it of tab.items) {
      const station = stationForItem(it);
      (station === "BAR" ? barItems : kitchenItems).push(it);
    }

    const createdTickets = [];

    async function makeOrAppendTicket(items, station) {
      if (!items.length) return null;

      // ✅ find an existing NEW ticket for this tab+station
      const existing = await Ticket.findOne({
        tab: tab._id,
        station,
        status: "NEW",
      }).sort({ createdAt: -1 });

      if (existing) {
        existing.lines = mergeLines(existing.lines || [], items);
        // status stays NEW
        await existing.save();
        createdTickets.push(existing);
        return existing;
      }

      // else create fresh
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

    // ✅ move cart subtotal into bill (works with your billSubtotalCents approach)
    const cartSubtotalCents = tab.items.reduce(
      (sum, it) => sum + it.priceCentsSnap * it.qty,
      0,
    );

    tab.billSubtotalCents = (tab.billSubtotalCents || 0) + cartSubtotalCents;

    // clear cart
    tab.items = [];

    // recalc tab totals (billSubtotalCents + cart)
    const { subtotalCents, totalCents, amountDueCents } = calcTabTotals({
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

    const io = req.app.get("io");
    if (io) {
      for (const t of createdTickets) {
        // If it existed already, it might be an update instead of new
        // simplest: always emit tickets:updated + tab:updated (your RealtimeProvider handles it well)
        io.to("staff").emit("tickets:updated", {
          tabId: tab._id,
          tableId: tab.table,
        });
      }

      io.to("staff").emit("tab:updated", {
        tabId: tab._id,
        tableId: tab.table,
      });
      io.to(`table:${tab.table}`).emit("ticket:created", {});
      io.to(`table:${tab.table}`).emit("tab:updated", {});
    }

    return res.status(201).json({ tickets: createdTickets, tab });
  } catch (err) {
    next(err);
  }
}
