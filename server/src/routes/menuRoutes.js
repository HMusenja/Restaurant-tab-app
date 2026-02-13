import express from "express";
import { listMenu } from "../controllers/menuController.js";

const router = express.Router();

router.get("/menu", listMenu);

export default router;