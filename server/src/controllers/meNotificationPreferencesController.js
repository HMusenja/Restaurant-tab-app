import User from "../models/User.js";

const DEFAULT_PREFS = {
  soundEnabled: true,
  vibrationEnabled: true,
  urgentEnabled: true,
};

function emitPrefs(req, userId, preferences) {
  const io = req.app.get("io");
  if (!io) return;
  io.to(`user:${String(userId)}`).emit("notification:preferences", { preferences });
}

export const getMyNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(userId).select("notificationPreferences");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ preferences: user.notificationPreferences || DEFAULT_PREFS });
  } catch (err) {
    next(err);
  }
};

export const patchMyNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { soundEnabled, vibrationEnabled, urgentEnabled } = req.body || {};

    const update = {};
    if (typeof soundEnabled === "boolean") update["notificationPreferences.soundEnabled"] = soundEnabled;
    if (typeof vibrationEnabled === "boolean") update["notificationPreferences.vibrationEnabled"] = vibrationEnabled;
    if (typeof urgentEnabled === "boolean") update["notificationPreferences.urgentEnabled"] = urgentEnabled;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, select: "notificationPreferences" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    emitPrefs(req, userId, user.notificationPreferences);

    res.json({ ok: true, preferences: user.notificationPreferences });
  } catch (err) {
    next(err);
  }
};