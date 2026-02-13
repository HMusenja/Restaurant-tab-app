import express from "express";
import { listTableTickets } from "../controllers/guestTicketsController.js";

const router = express.Router();

router.get("/tables/:token/tickets", listTableTickets);

export default router;