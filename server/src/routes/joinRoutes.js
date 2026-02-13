import express from "express";
import { joinWithInvite } from "../controllers/joinController.js";

const router = express.Router();
router.post("/join", joinWithInvite);

export default router;
