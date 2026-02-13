import Table from "../models/Table.js";
import Tab from "../models/Tab.js";
import MenuItem from "../models/MenuItem.js";
import { calcTabTotals, clampInt } from "../utils/money.js";

async function recalcAndSave(tab) {
  const { subtotalCents, totalCents, amountDueCents } = calcTabTotals({
    items: tab.items,
    tip: tab.tip,
    amountPaidCents: tab.amountPaidCents,
    billSubtotalCents: tab.billSubtotalCents || 0,
  });

  tab.subtotalCents = subtotalCents;
  tab.totalCents = totalCents;
  tab.amountDueCents = amountDueCents;
  tab.version += 1;

  await tab.save();
  return tab;
}

// GET /api/tables/:token/active-tab
// GET /api/tables/:token/active-tab
export async function getActiveTab(req, res) {
  const { token } = req.params;

  const table = await Table.findOne({ token });
  if (!table) {
    return res.status(404).json({ message: "Table not found" });
  }

  // 1️⃣ If active tab exists → return it
  if (table.activeTab) {
    const tab = await Tab.findById(table.activeTab);
    if (tab) {
      return res.json({
        table: { id: table._id, number: table.number },
        tab,
      });
    }

    // stale reference cleanup
    table.activeTab = null;
    await table.save();
  }

  // 2️⃣ No active tab → return LAST tab if CLOSED
  const lastTab = await Tab.findOne({ table: table._id })
    .sort({ updatedAt: -1 })
    .limit(1);

  if (lastTab && lastTab.status === "CLOSED") {
    return res.json({
      table: { id: table._id, number: table.number },
      tab: lastTab,
    });
  }

  // 3️⃣ Otherwise, session truly ended
  return res.json({
    table: { id: table._id, number: table.number },
    tab: null,
  });
}


// POST /api/tabs/open  { tableToken }
export async function openTab(req, res) {
  const { tableToken } = req.body;

  const table = await Table.findOne({ token: tableToken });
  if (!table) return res.status(404).json({ message: "Table not found" });

  if (table.activeTab) {
    const existing = await Tab.findById(table.activeTab);
    if (existing && existing.status === "OPEN") {
      return res.json({ table: { id: table._id, number: table.number }, tab: existing });
    }
    // if tab missing or not open, clear and create new
    table.activeTab = null;
    await table.save();
  }

  const tab = await Tab.create({
    table: table._id,
    status: "OPEN",
    items: [],
    tip: { type: "PERCENT", value: 0 },
    subtotalCents: 0,
    billSubtotalCents: 0,
    totalCents: 0,
    amountPaidCents: 0,
    amountDueCents: 0,
  });

  table.activeTab = tab._id;
  await table.save();

  return res.status(201).json({ table: { id: table._id, number: table.number }, tab });
}

// PATCH /api/tabs/:tabId/items
// { action: "ADD"|"UPDATE"|"REMOVE", menuItemId, qty }
export async function updateTabItems(req, res) {
  const { tabId } = req.params;
  const { action, menuItemId, qty } = req.body;

  const tab = await Tab.findById(tabId);
  if (!tab) return res.status(404).json({ message: "Tab not found" });
  if (tab.status !== "OPEN") return res.status(400).json({ message: "Tab is not open" });

  const foundIndex = tab.items.findIndex((it) => String(it.menuItemId) === String(menuItemId));

  if (action === "ADD") {
    const q = clampInt(Number(qty ?? 1), 1, 99);

    if (foundIndex >= 0) {
      tab.items[foundIndex].qty = clampInt(tab.items[foundIndex].qty + q, 1, 99);
    } else {
      const mi = await MenuItem.findById(menuItemId);
      if (!mi || !mi.available) return res.status(400).json({ message: "Menu item unavailable" });

      tab.items.push({
        menuItemId: mi._id,
        nameSnap: mi.name,
        categorySnap: mi.category || "",
        priceCentsSnap: mi.priceCents,
        qty: q,
        addedAt: new Date(),
      });
    }
  } else if (action === "UPDATE") {
    if (foundIndex < 0) return res.status(404).json({ message: "Item not in tab" });
    const q = clampInt(Number(qty), 1, 99);
    tab.items[foundIndex].qty = q;
  } else if (action === "REMOVE") {
    if (foundIndex < 0) return res.status(404).json({ message: "Item not in tab" });
    tab.items.splice(foundIndex, 1);
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await recalcAndSave(tab);
  return res.json({ tab });
}

// PATCH /api/tabs/:tabId/tip
// { type: "PERCENT"|"AMOUNT", value }
export async function updateTip(req, res) {
  const { tabId } = req.params;
  const { type, value } = req.body;

  const tab = await Tab.findById(tabId);
  if (!tab) return res.status(404).json({ message: "Tab not found" });
  if (tab.status !== "OPEN") return res.status(400).json({ message: "Tab is not open" });

  if (!["PERCENT", "AMOUNT"].includes(type)) {
    return res.status(400).json({ message: "Invalid tip type" });
  }

  // Tip percent: 0-50; Tip amount: 0-100€ (in cents)
  if (type === "PERCENT") {
    const pct = Math.min(Math.max(Number(value || 0), 0), 50);
    tab.tip = { type, value: pct };
  } else {
    const cents = clampInt(Number(value || 0), 0, 10000);
    tab.tip = { type, value: cents };
  }

  await recalcAndSave(tab);
  return res.json({ tab });
}
