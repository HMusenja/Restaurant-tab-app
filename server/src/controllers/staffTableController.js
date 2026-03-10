import jwt from "jsonwebtoken";
import Table from "../models/Table.js";
import Tab from "../models/Tab.js";
import Reservation from "../models/Reservation.js"

import crypto from "crypto";

function signInvite(tableId) {
  const ttl = Number(process.env.TABLE_INVITE_TTL_SECONDS || 600);
  const invite = jwt.sign(
    { purpose: "TABLE_INVITE", tableId: tableId.toString() },
    process.env.TABLE_INVITE_SECRET,
    { expiresIn: ttl },
  );

  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const joinUrl = `${clientOrigin}/join?invite=${invite}`;
  return { invite, joinUrl, expiresInSeconds: ttl };
}

export async function listTables(req, res) {
  const status = req.query.status; // FREE | OCCUPIED | undefined
  const filter = status ? { status } : {};

  const tables = await Table.find(filter)
    .sort({ number: 1 })
    .populate({ path: "activeTab", select: "status totalCents amountDueCents" })
    .lean();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // TODAY reservations only (BOOKED/SEATED needed for detail display, but only BOOKED affects "reserved")
  const reservations = await Reservation.find({
    reservedFor: { $gte: start, $lte: end },
    status: { $in: ["BOOKED", "SEATED"] },
  })
    .sort({ reservedFor: 1 })
    .lean();

  const now = new Date();

  // For each table pick:
  // - if any SEATED -> status SEATED (occupied wins in UI)
  // - else pick earliest upcoming BOOKED (reservedFor >= now) else earliest BOOKED
  const pickedResMap = new Map(); // tableId -> reservation doc
  for (const r of reservations) {
    const key = String(r.table);
    const existing = pickedResMap.get(key);

    if (!existing) {
      pickedResMap.set(key, r);
      continue;
    }

    // SEATED always wins
    if (existing.status === "SEATED") continue;
    if (r.status === "SEATED") {
      pickedResMap.set(key, r);
      continue;
    }

    // both BOOKED: choose earliest upcoming relative to now
    const exTime = new Date(existing.reservedFor).getTime();
    const rTime = new Date(r.reservedFor).getTime();

    const exUpcoming = exTime >= now.getTime();
    const rUpcoming = rTime >= now.getTime();

    if (exUpcoming && rUpcoming) {
      if (rTime < exTime) pickedResMap.set(key, r);
    } else if (!exUpcoming && rUpcoming) {
      pickedResMap.set(key, r); // upcoming beats past
    } else if (!exUpcoming && !rUpcoming) {
      if (rTime < exTime) pickedResMap.set(key, r); // both past: keep earliest (or keep earliest anyway)
    }
  }

  res.json({
    tables: tables.map((t) => {
      const r = pickedResMap.get(String(t._id)) || null;

      return {
        id: String(t._id),
        number: t.number,
        status: t.status,
        assignedAt: t.assignedAt ?? null,
        guestCount: typeof t.guestCount === "number" ? t.guestCount : 0,

        // ✅ for StaffTablesPage status badge logic (today only)
        reservationStatus: r ? r.status : null,

        // ✅ for reserved card preview (today only, earliest upcoming)
        reservation: r
          ? {
              id: String(r._id),
              name: r.name,
              phone: r.phone,
              partySize: r.partySize,
              reservedFor: r.reservedFor,
              status: r.status,
              notes: r.notes ?? "",
            }
          : null,

        activeTab: t.activeTab
          ? {
              id: String(t.activeTab._id),
              status: t.activeTab.status ?? null,
              totalCents: t.activeTab.totalCents ?? 0,
              amountDueCents: t.activeTab.amountDueCents ?? 0,
            }
          : null,
      };
    }),
  });
}


function generateJoinCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export async function regenerateJoinCode(req, res) {
  const { tableId } = req.params;

  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  if (table.status !== "OCCUPIED") {
    return res
      .status(400)
      .json({ message: "Table must be occupied to generate a code" });
  }

  const ttlSeconds = Number(process.env.TABLE_CODE_TTL_SECONDS || 600);
  table.joinCode = generateJoinCode();
  table.joinCodeExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await table.save();

  const io = req.app.get("io");
  io.to("staff").emit("tables:updated", { tableId: String(table._id) });
  // optional: if your detail page refreshes joinCode from getTableById
  io.to("staff").emit("tab:updated", {
    tableId: String(table._id),
    tabId: table.activeTab ? String(table.activeTab) : null,
  });

  return res.json({
    code: table.joinCode,
    codeExpiresInSeconds: ttlSeconds,
    joinCodeExpiresAt: table.joinCodeExpiresAt,
  });
}

export async function assignTable(req, res, next) {
  try {
    const { tableId } = req.params;
    const { guestCount } = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.status === "OCCUPIED") {
      return res.status(400).json({ message: "Table already occupied" });
    }

    // If RESERVED → clear reservation reference on table
    if (table.status === "RESERVED") {
      table.reservation = null;
    }

    // IMPORTANT:
    // Starting a session must NOT auto-create a tab.
    // Tabs should be created lazily only when there is a real cart/payable flow.
    table.activeTab = null;

    const ttlSeconds = Number(process.env.TABLE_CODE_TTL_SECONDS || 600);

    table.joinCode = generateJoinCode();
    table.joinCodeExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

    table.status = "OCCUPIED";
    table.assignedAt = new Date();
    table.guestCount =
      Number.isFinite(Number(guestCount)) && Number(guestCount) > 0
        ? Number(guestCount)
        : 0;

    await table.save();

    const io = req.app.get("io");

    io.to("staff").emit("tables:updated", {
      tableId: String(table._id),
    });

    io.to("staff").emit("tab:updated", {
      tableId: String(table._id),
      tabId: null,
    });

    io.to(`table:${table._id}`).emit("tab:updated", {
      tableId: String(table._id),
      tabId: null,
    });

    const { joinUrl, expiresInSeconds } = signInvite(table._id);

    return res.status(201).json({
      table: {
        id: table._id,
        number: table.number,
        status: table.status,
      },
      tab: null,
      joinUrl,
      expiresInSeconds,
      code: table.joinCode,
      codeExpiresInSeconds: ttlSeconds,
      guestCount: table.guestCount,
    });
  } catch (err) {
    next(err);
  }
}


export async function freeTable(req, res) {
  const { tableId } = req.params;

  const force =
    req.query.force === "true" ||
    req.body?.force === true ||
    req.body?.force === "true";

  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  let activeTab = null;

  if (table.activeTab) {
    activeTab = await Tab.findById(table.activeTab);
  }

  if (activeTab && activeTab.status === "OPEN" && !force) {
    return res.status(400).json({
      message: "This table has an open tab. Please complete payment before closing the table.",
      code: "TAB_PAYMENT_REQUIRED",
      tabId: String(activeTab._id),
    });
  }

  if (activeTab && activeTab.status !== "CLOSED") {
    activeTab.status = "CLOSED";
      activeTab.closedAt = new Date();
    await activeTab.save();
  }

  table.status = "FREE";
  table.assignedAt = null;
  table.activeTab = null;
  table.joinCode = null;
  table.guestCount = 0;
  table.joinCodeExpiresAt = null;

  await table.save();

  const io = req.app.get("io");

  io.to("staff").emit("tables:updated", { tableId: String(table._id) });
  io.to("staff").emit("tab:updated", {
    tableId: String(table._id),
    tabId: null,
  });

  io.to(`table:${table._id}`).emit("tab:updated", {
    tableId: String(table._id),
    tabId: null,
  });

  res.json({
    ok: true,
    table: {
      id: table._id,
      number: table.number,
      status: table.status,
    },
  });
}

export async function getTableById(req, res) {
  const { tableId } = req.params;

  const table = await Table.findById(tableId)
    .populate({
      path: "activeTab",
      select: "status totalCents amountDueCents updatedAt",
    })
    .lean();

  if (!table) return res.status(404).json({ message: "Table not found" });

  res.json({
    table: {
      id: String(table._id),
      number: table.number,
      status: table.status,
      assignedAt: table.assignedAt ?? null,
      guestCount: typeof table.guestCount === "number" ? table.guestCount : 0,
      joinCode: table.joinCode ?? null,
      joinCodeExpiresAt: table.joinCodeExpiresAt ?? null,
      activeTab: table.activeTab
        ? {
            id: String(table.activeTab._id),
            status: table.activeTab.status ?? null,
            totalCents: table.activeTab.totalCents ?? 0,
            amountDueCents: table.activeTab.amountDueCents ?? 0,
            updatedAt: table.activeTab.updatedAt ?? null,
          }
        : null,
    },
  });
}

export async function createTable(req, res) {
  const { number } = req.body;

  if (!Number.isInteger(number) || number <= 0) {
    return res.status(400).json({ message: "Invalid table number" });
  }

  const exists = await Table.findOne({ number });
  if (exists) {
    return res.status(400).json({ message: "Table number already exists" });
  }

  const token = crypto.randomUUID(); // or nanoid

  const table = await Table.create({
    number,
    token,
  });

  res.status(201).json({
    table: {
      id: table._id,
      number: table.number,
      status: table.status,
    },
  });
}

export async function reserveTable(req, res) {
  const { tableId } = req.params;
  const { name, phone, partySize, reservedFor } = req.body;

  const table = await Table.findById(tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  if (table.status !== "FREE") {
    return res.status(400).json({ message: "Table not available" });
  }

  table.status = "RESERVED";
  table.reservation = {
    name,
    phone,
    partySize,
    reservedFor: new Date(reservedFor),
  };

  await table.save();

  const io = req.app.get("io");
  io.to("staff").emit("tables:updated", { tableId });

  res.json({ ok: true });
}
