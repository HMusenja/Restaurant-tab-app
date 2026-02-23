import express from "express";
import {
  listMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

// If you already have auth middleware, wire it here:
// import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public + Admin (admin uses ?all=true)
router.get("/menu", listMenu);

// Admin CRUD (protect these in real app!)
router.get("/menu/:id", getMenuItemById);
router.post("/menu", protect,adminOnly,createMenuItem);
router.patch("/menu/:id", protect,adminOnly,updateMenuItem);  
router.delete("/menu/:id", protect,adminOnly,deleteMenuItem);

export default router;
