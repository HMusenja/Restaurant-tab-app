// routes/adminUserRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  softDeleteUser,
  restoreUser,
} from "../controllers/adminUserController.js";
import { protect } from "../middleware/authMiddleware.js";
import { getFinanceSummary } from "../controllers/adminFinanceController.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();



router.get("/admin/users", protect, adminOnly, getAllUsers);
router.get("/admin/users/:id", protect, adminOnly, getUserById);
router.patch("/admin/users/:id", protect, adminOnly, updateUser);
router.patch("/admin/users/:id/status", protect, adminOnly, toggleUserStatus);
router.patch("/admin/users/:id/reset-password", protect, adminOnly, resetUserPassword);
router.patch("/admin/users/:id/delete", protect, adminOnly, softDeleteUser);
router.patch("/admin/users/:id/restore", protect, adminOnly, restoreUser);

router.get("/admin/finance/summary",protect, adminOnly, getFinanceSummary);

export default router;
