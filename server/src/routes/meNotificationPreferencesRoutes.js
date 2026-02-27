import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyNotificationPreferences,
  patchMyNotificationPreferences,
} from "../controllers/meNotificationPreferencesController.js";

const router = express.Router();

// GET /api/me/notification-preferences
router.get("/me/notification-preferences", protect, getMyNotificationPreferences);

// PATCH /api/me/notification-preferences
router.patch("/me/notification-preferences", protect, patchMyNotificationPreferences);

export default router;