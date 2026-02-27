import { Schema, model } from "mongoose";
import Notification from "./Notification.js";
import User from "./User.js";
import Tab from "./Tab.js";
import Table from "./Table.js";
import { getIO } from "../socket/ioStore.js";
import { severityForTicket } from "../utils/notificationSeverity.js";

/**
 * Ticket.js
 */
const ticketLineSchema = new Schema(
  {
    menuItemId: Schema.Types.ObjectId,
    nameSnap: String,
    qty: Number,
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "DONE", "READY"],
      default: "NEW",
    },
  },
  { _id: true },
);

const ticketSchema = new Schema(
  {
    tab: { type: Schema.Types.ObjectId, ref: "Tab", required: true },
    station: {
      type: String,
      enum: ["KITCHEN", "BAR"],
      default: "KITCHEN",
      index: true,
    },
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "DONE"],
      default: "NEW",
      index: true,
    },
    lines: { type: [ticketLineSchema], required: true },
    etaMinutes: { type: Number, default: null },
  },
  { timestamps: true },
);

function stationToAudienceRole(station) {
  const s = String(station || "").toUpperCase();
  if (s === "KITCHEN") return "Kitchen";
  if (s === "BAR") return "Bar";
  return null;
}

function summarizeLines(lines) {
  const arr = Array.isArray(lines) ? lines : [];
  const parts = arr
    .slice(0, 4)
    .map((l) => `${l.qty}× ${l.nameSnap}`)
    .filter(Boolean);

  const more = arr.length > 4 ? ` +${arr.length - 4} more` : "";
  return parts.length ? parts.join(", ") + more : "Order updated";
}
function keyForLine(l) {
  // stable key for comparing
  return String(l.menuItemId || l.nameSnap || "").trim();
}

function toQtyMap(lines) {
  const map = new Map();
  for (const l of Array.isArray(lines) ? lines : []) {
    const key = keyForLine(l);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + Number(l.qty || 0));
  }
  return map;
}

function computeAddedItems(prevLines, nextLines) {
  const prev = toQtyMap(prevLines);
  const next = toQtyMap(nextLines);

  const added = [];
  for (const [k, nextQty] of next.entries()) {
    const prevQty = prev.get(k) || 0;
    const diff = nextQty - prevQty;
    if (diff > 0) {
      // try to recover a nice display name
      const line = (Array.isArray(nextLines) ? nextLines : []).find(
        (x) => keyForLine(x) === k,
      );
      added.push({ name: line?.nameSnap || String(k), qty: diff });
    }
  }
  return added;
}

function formatAddedText(added, tableNumber) {
  if (!added.length) return null;
  const parts = added.slice(0, 4).map((x) => `+ ${x.qty}× ${x.name}`);
  const more = added.length > 4 ? ` +${added.length - 4} more` : "";
  const base = parts.join(", ") + more;
  return tableNumber ? `Table ${tableNumber}: ${base}` : base;
}

async function lookupTableInfo(tabId) {
  try {
    const tab = await Tab.findById(tabId).select("table").lean();
    if (!tab?.table) return { tableId: null, tableNumber: null };

    const tableId = String(tab.table);
    const table = await Table.findById(tab.table).select("number").lean();
    const tableNumber = table?.number != null ? String(table.number) : null;

    return { tableId, tableNumber };
  } catch {
    return { tableId: null, tableNumber: null };
  }
}

async function fanoutToAudiencePlusAdmin({ audienceRole, doc }) {
  if (!audienceRole) return;

  console.log("🎯 fanout roles:", {
    audienceRole,
    rolesToFind: [audienceRole, "admin"],
  });
  const users = await User.find({ role: { $in: [audienceRole, "admin"] } })
    .select("_id role")
    .lean();
  console.log(
    "👥 matched users:",
    users.map((u) => u.role),
  );

  if (!users.length) return;

  const inserted = await Notification.insertMany(
    users.map((u) => ({
      ...doc,
      userId: u._id,

      // ✅ meaning: this notification is ABOUT the station
      recipientRole: audienceRole,

      metadata: {
        ...(doc.metadata || {}),
        deliveredToRole: u.role || null,
      },
    })),
    { ordered: false },
  );
  console.log("✅ inserted notifications:", inserted.length);

  const io = getIO();
  if (io) {
    for (const n of inserted) {
      io.to(`user:${String(n.userId)}`).emit("notification:new", {
        notification: n,
      });
    }
  }
}

// Track changes
ticketSchema.pre("save", async function () {
  try {
    this.$locals.wasNew = this.isNew;
    this.$locals.statusChanged = this.isModified("status");

    const modified = this.modifiedPaths ? this.modifiedPaths() : [];
    this.$locals.linesChanged =
      this.isModified("lines") ||
      modified.some((p) => p === "lines" || p.startsWith("lines."));

    // ✅ capture previous lines from DB for delta computation
    this.$locals.prevLines = null;
    if (!this.isNew && this.$locals.linesChanged) {
      const prev = await this.constructor
        .findById(this._id)
        .select("lines")
        .lean();
      this.$locals.prevLines = prev?.lines || [];
    }
  } catch (e) {
    // never block save
  }
});

ticketSchema.post("save", async function () {
  console.log("🎫 Ticket save detected:", {
    wasNew: this.$locals.wasNew,
    statusChanged: this.$locals.statusChanged,
    linesChanged: this.$locals.linesChanged,
    station: this.station,
    linesCount: this.lines?.length,
  });
  try {
    const audienceRole = stationToAudienceRole(this.station);
    if (!audienceRole) return;

    // Only notify when meaningful changes happen
    const wasNew = !!this.$locals.wasNew;
    const statusChanged = !!this.$locals.statusChanged;
    const linesChanged = !!this.$locals.linesChanged;

    if (!wasNew && !statusChanged && !linesChanged) return;

    const { tableId, tableNumber } = await lookupTableInfo(this.tab);
    const orderSummary = summarizeLines(this.lines);
    const severity = severityForTicket({ lines: this.lines });

    const baseMeta = {
      ticketId: String(this._id),
      tabId: String(this.tab),
      tableId,
      tableNumber,
      station: this.station,
      audienceRole,
      status: this.status,
      linesCount: Array.isArray(this.lines) ? this.lines.length : 0,
      orderSummary,
    };

    // 1) created
    if (wasNew) {
      const title = `${audienceRole} • New order`;
      const message = tableNumber
        ? `Table ${tableNumber}: ${orderSummary}`
        : orderSummary;

      await fanoutToAudiencePlusAdmin({
        audienceRole,
        doc: {
          type: "TICKET_NEW",
          title,
          message,
          severity,
          readAt: null,
          clearedAt: null,
          metadata: {
            ...baseMeta,
            updates: [
              {
                at: new Date(),
                text: message,
                kind: "created",
              },
            ],
          },
        },
      });

      return;
    }

    // 2) status change
    if (statusChanged) {
      const title = `${audienceRole} • Order status`;
      const message = tableNumber
        ? `Table ${tableNumber}: Status → ${this.status} • ${orderSummary}`
        : `Status → ${this.status} • ${orderSummary}`;

      await fanoutToAudiencePlusAdmin({
        audienceRole,
        doc: {
          type: "TICKET_STATUS",
          title,
          message,
          severity,
          readAt: null,
          clearedAt: null,
          metadata: baseMeta,
        },
      });

      return;
    }

    // 3) appended items / lines change (this is what you’re missing)
    if (linesChanged) {
  const title = `${audienceRole} • Items added`;

  // full current summary (for main message)
  const fullMessage = tableNumber ? `Table ${tableNumber}: ${orderSummary}` : orderSummary;

  // ✅ delta line (for updates list)
  const added = computeAddedItems(this.$locals.prevLines || [], this.lines || []);
  const deltaText = formatAddedText(added, tableNumber) || fullMessage;

  const users = await User.find({ role: { $in: [audienceRole, "admin"] } })
    .select("_id role")
    .lean();

  const io = getIO();

  for (const u of users) {
    const updated = await Notification.findOneAndUpdate(
      {
        userId: u._id,
        type: "TICKET_NEW", // thread container
        clearedAt: null,
        "metadata.ticketId": String(this._id),
      },
      {
        $set: {
          title,
          message: fullMessage,     // ✅ keep main message as current full summary
          severity,
          readAt: null,             // ✅ unread again
          recipientRole: audienceRole,
          "metadata.orderSummary": orderSummary,
          "metadata.linesCount": Array.isArray(this.lines) ? this.lines.length : 0,
          "metadata.status": this.status,
        },
        $push: {
          "metadata.updates": {
            $each: [
              {
                at: new Date(),
                kind: "items_added",
                text: deltaText,     // ✅ ONLY delta goes here
              },
            ],
            $slice: -10,
          },
        },
      },
      { new: true, upsert: true }
    ).lean();

    if (updated && io) {
      io.to(`user:${String(u._id)}`).emit("notification:update", { notification: updated });
    }
  }

  return;
}
  } catch {
    // Never block ticket saves
  }
});

const Ticket = model("Ticket", ticketSchema);
export default Ticket;
