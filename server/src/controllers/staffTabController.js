import Tab from "../models/Tab.js";
import Table from "../models/Table.js";
import Ticket from "../models/Ticket.js";
import MenuItem from "../models/MenuItem.js";
import ServiceRequest from "../models/ServiceRequest.js";

async function hydrateTabItemsFromTickets(tab) {
  if (tab.items && tab.items.length > 0) return tab;

  const tickets = await Ticket.find({ tab: tab._id }).lean();
  if (!tickets.length) return tab;

  const map = new Map();

  for (const ticket of tickets) {
    for (const line of ticket.lines) {
      const key = String(line.menuItemId || line.nameSnap);

      if (!map.has(key)) {
        map.set(key, {
          menuItemId: line.menuItemId || null,
          nameSnap: line.nameSnap,
          qty: 0,
          priceCentsSnap: 0,
        });
      }

      map.get(key).qty += line.qty || 0;
    }
  }

  // 🔥 FETCH ALL MENU ITEMS AT ONCE
  const menuItemIds = [...map.values()]
    .map((i) => i.menuItemId)
    .filter(Boolean);

  if (menuItemIds.length) {
    const menuItems = await MenuItem.find(
      { _id: { $in: menuItemIds } },
      { priceCents: 1 },
    ).lean();

    const priceMap = new Map(
      menuItems.map((m) => [String(m._id), m.priceCents]),
    );

    for (const item of map.values()) {
      if (item.menuItemId) {
        item.priceCentsSnap = priceMap.get(String(item.menuItemId)) ?? 0;
      }
    }
  }

  tab.items = Array.from(map.values());
  await tab.save();

  return tab;
}

export async function payTab(req, res, next) {
  try {
    const { tabId } = req.params;
    const { method } = req.body; // "CASH" | "CARD"

    if (!method) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const tab = await Tab.findById(tabId);
    if (!tab) return res.status(404).json({ message: "Tab not found" });

    if (tab.status !== "OPEN") {
      return res.status(400).json({ message: "Tab is not open for payment" });
    }

    const totalCents = tab.totalCents ?? tab.subtotalCents ?? 0;

    tab.status = "PAID";
    tab.amountPaidCents = totalCents;
    tab.amountDueCents = 0;
    tab.payment = tab.payment || {};
    tab.payment.subtotalCents = tab.subtotalCents ?? 0;
    tab.payment.totalCents = totalCents;
    tab.payment.method = String(method)
    tab.payment.paidAt = new Date();
    tab.payment.paidBy = req.user?._id ?? null;

    await tab.save();

    // ✅ Ensure table is OCCUPIED while tab is OPEN/PAID (optional but recommended)
    // (Prevents the "table FREE but tab OPEN" inconsistency you saw)
    await Table.findByIdAndUpdate(tab.table, {
      status: "OCCUPIED",
      activeTab: tab._id,
    });

    // ✅ Auto-resolve BILL requests for this tab
    await ServiceRequest.updateMany(
      {
        tab: tab._id,
        type: "BILL",
        status: { $ne: "DONE" },
      },
      { $set: { status: "DONE" } },
    );

    // 🔔 Realtime invalidation events
    const io = req.app.get("io");

    // For staff dashboard: refresh services + tickets + tab state
    io.to("staff").emit("services:updated", {
      tableId: tab.table,
      tabId: tab._id,
    });
    io.to("staff").emit("tickets:updated", {
      tableId: tab.table,
      tabId: tab._id,
    });
    io.to("staff").emit("tab:updated", { tableId: tab.table, tabId: tab._id });

    // For guest page: refresh tab totals + status
    io.to(`table:${tab.table}`).emit("tab:updated", {
      tableId: tab.table,
      tabId: tab._id,
    });

    return res.json({ tab });
  } catch (err) {
    next(err);
  }
}

export async function closeTab(req, res, next) {
  try {
    const { tabId } = req.params;
    console.log("🧾 closeTab called:", { tabId });

    const tab = await Tab.findById(tabId);
    if (!tab) {
      console.log("❌ closeTab: Tab not found");
      return res.status(404).json({ message: "Tab not found" });
    }

    console.log("✅ closeTab: Found tab:", {
      tabId: String(tab._id),
      status: tab.status,
      table: tab.table,
    });

    // Only PAID tabs can be closed
    if (tab.status !== "PAID") {
      console.log("❌ closeTab: Tab not PAID:", tab.status);
      return res
        .status(400)
        .json({ message: "Tab must be paid before closing" });
    }

    // Block closing if there are still open service requests
    const openReq = await ServiceRequest.findOne({
      tab: tab._id,
      status: { $ne: "DONE" },
    }).select("_id type status");

    if (openReq) {
      return res.status(409).json({
        message: "Cannot close tab: there are still open service requests.",
        openRequest: {
          id: String(openReq._id),
          type: openReq.type,
          status: openReq.status,
        },
      });
    }

    // ✅ Close tab + timestamp
    tab.status = "CLOSED";
    tab.closedAt = new Date();
    await tab.save();

    console.log("✅ closeTab: Tab saved as CLOSED", {
      tabId: String(tab._id),
      closedAt: tab.closedAt,
    });

    // ✅ Free table
    const tableId = tab.table?._id ?? tab.table;
    console.log("🔎 closeTab: tableId resolved:", String(tableId));

    const table = await Table.findById(tableId);
    if (!table) {
      console.log("❌ closeTab: Table not found for id:", String(tableId));
    } else {
      console.log("✅ closeTab: Found table before free:", {
        tableId: String(table._id),
        number: table.number,
        status: table.status,
        activeTab: table.activeTab,
      });

      table.status = "FREE";
      table.activeTab = null;
      table.assignedAt = null;
      table.joinCode = null;
      table.joinCodeExpiresAt = null;

      await table.save();

      console.log("✅ closeTab: Table saved as FREE:", {
        tableId: String(table._id),
        status: table.status,
        activeTab: table.activeTab,
      });
    }

    // 🔔 Realtime invalidation events (staff + guest)
    const io = req.app.get("io");
    if (io) {
      console.log("📣 closeTab: emitting socket invalidations");
      io.to("staff").emit("services:updated", { tableId, tabId: tab._id });
      io.to("staff").emit("tickets:updated", { tableId, tabId: tab._id });
      io.to("staff").emit("tab:updated", { tableId, tabId: tab._id });

      io.to(`table:${tableId}`).emit("tab:updated", {
        tableId,
        tabId: tab._id,
      });

      // ✅ Optional: finance page can listen to this and auto-refresh
      io.to("staff").emit("finance:updated", {
        tabId: tab._id,
        tableId,
        closedAt: tab.closedAt,
      });
    } else {
      console.log("⚠️ closeTab: io missing on req.app");
    }

    return res.json({ ok: true, tabId: String(tab._id), closedAt: tab.closedAt });
  } catch (err) {
    console.error("❌ closeTab error:", err);
    next(err);
  }
}

export async function getTab(req, res, next) {
  try {
    const { tabId } = req.params;

    const tab = await Tab.findById(tabId).populate("table", "number status");

    if (!tab) return res.status(404).json({ message: "Tab not found" });

    if (!tab.items || tab.items.length === 0) {
      await hydrateTabItemsFromTickets(tab);
    }

    return res.json({ tab });
  } catch (err) {
    next(err);
  }
}
