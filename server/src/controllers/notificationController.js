import Notification from "../models/Notification.js";

function parseBool(v) {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return undefined;
}

/**
 * cursor = base64(JSON.stringify({ createdAt: "<ISO>", id: "<_id>" }))
 */
function decodeCursor(cursor) {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj?.createdAt || !obj?.id) return null;
    return { createdAt: new Date(obj.createdAt), id: obj.id };
  } catch {
    return null;
  }
}

function encodeCursor(doc) {
  const payload = {
    createdAt: doc.createdAt.toISOString(),
    id: String(doc._id),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function emitToUser(req, userId, event, payload) {
  const io = req.app.get("io");
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

/**
 * GET /api/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const unreadOnly = parseBool(req.query.unreadOnly);
    const includeCleared = parseBool(req.query.includeCleared);
    const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    const filter = { userId };

    // Hide cleared by default
    if (!includeCleared) {
      filter.clearedAt = null;
    }

    if (unreadOnly === true) {
      filter.readAt = null;
    }

    if (cursor) {
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    const docs = await Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor =
      hasMore && items.length
        ? encodeCursor(items[items.length - 1])
        : null;

    // unread count must exclude cleared
    const unreadCount = await Notification.countDocuments({
      userId,
      readAt: null,
      clearedAt: null,
    });

    res.json({ items, unreadCount, nextCursor });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const doc = await Notification.findOne({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: "Notification not found" });

    if (!doc.readAt) {
      doc.readAt = new Date();
      await doc.save();
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      readAt: null,
      clearedAt: null,
    });

    emitToUser(req, userId, "notification:update", {
      id: String(doc._id),
      readAt: doc.readAt,
      unreadCount,
    });

    res.json({ ok: true, notification: doc, unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const now = new Date();

    await Notification.updateMany(
      { userId, readAt: null, clearedAt: null },
      { $set: { readAt: now } }
    );

    emitToUser(req, userId, "notification:update", {
      markAll: true,
      readAt: now,
      unreadCount: 0,
    });

    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/clear-read
 */
export const clearRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const now = new Date();

    await Notification.updateMany(
      { userId, readAt: { $ne: null }, clearedAt: null },
      { $set: { clearedAt: now } }
    );

    const unreadCount = await Notification.countDocuments({
      userId,
      readAt: null,
      clearedAt: null,
    });

    emitToUser(req, userId, "notification:update", {
      clearedRead: true,
      unreadCount,
    });

    res.json({ ok: true, unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/clear-all
 */
export const clearAll = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const now = new Date();

    await Notification.updateMany(
      { userId, clearedAt: null },
      { $set: { clearedAt: now } }
    );

    emitToUser(req, userId, "notification:update", {
      clearedAll: true,
      unreadCount: 0,
    });

    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
};