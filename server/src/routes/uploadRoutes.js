import express from "express";
import { getCloudinarySignature } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/uploads/signature", protect, adminOnly, getCloudinarySignature);

export default router;
