import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
   clearRead,
  clearAll,
} from "../controllers/notificationController.js";

const router = express.Router();

// Inbox
router.get("/notifications", protect, getNotifications);

// Read Actions
router.patch("/notifications/read-all", protect, markAllNotificationsRead);
router.patch("/notifications/:id/read", protect, markNotificationRead);

// Clear actions (soft delete from inbox)
router.patch("/notifications/clear-read", protect, clearRead);
router.patch("/notifications/clear-all", protect, clearAll);

export default router;