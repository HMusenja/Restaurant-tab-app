import express from "express";
import { createTicket } from "../controllers/ticketController.js";

const router = express.Router();

router.post("/tabs/:tabId/tickets", createTicket);

export default router;

