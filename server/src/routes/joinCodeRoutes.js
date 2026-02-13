import express from "express";
import { joinWithCode } from "../controllers/joinCodeController.js";

const router = express.Router();
router.post("/join/code", joinWithCode);

export default router;