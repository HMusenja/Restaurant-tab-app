import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { closeTab,payTab,getTab,getTabForStaff } from "../controllers/staffTabController.js";

const router = express.Router();



router.get("/staff/tabs/:tabId",getTabForStaff);
router.post("/staff/tabs/:tabId/pay", payTab);
router.post("/staff/tabs/:tabId/close", closeTab);

export default router;
