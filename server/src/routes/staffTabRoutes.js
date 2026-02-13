import express from "express";
import { closeTab,payTab,getTab } from "../controllers/staffTabController.js";

const router = express.Router();

console.log("✅ staffTabRoutes loaded");

router.get("/staff/tabs/:tabId", getTab);
router.post("/staff/tabs/:tabId/pay", payTab);
router.post("/staff/tabs/:tabId/close", closeTab);

export default router;
