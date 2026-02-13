import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changeMyPassword
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Auth
router.post("/users/login", loginUser);
router.post("/users/logout", logoutUser);

// Self
router.get("/users/me", protect, getMe);
router.patch("/users/change-password", protect, changeMyPassword);

// Admin registration
router.post("/users/register", async (req, res, next) => {
  try {
    // Count existing admins
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount > 0) {
      // Only allow if authenticated admin exists
      return protect(req, res, () =>
        adminOnly(req, res, () => registerUser(req, res, next))
      );
    }

    // No admin exists yet → allow registration without auth
    return registerUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
