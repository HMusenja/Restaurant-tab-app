import { Router } from "express";
import {
  getActiveTab,
  openTab,
  updateTabItems,
  updateTip,
} from "../controllers/guestController.js";

const router = Router();

router.get("/tables/:token/active-tab", getActiveTab);
router.post("/tabs/open", openTab);
router.patch("/tabs/:tabId/items", updateTabItems);
router.patch("/tabs/:tabId/tip", updateTip);

export default router;
