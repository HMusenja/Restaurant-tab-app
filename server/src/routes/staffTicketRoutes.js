import { Router } from "express";
import {
  listTickets,
  updateTicketStatus,
  updateTicketLineStatus
} from "../controllers/staffTicketController.js";

const router = Router();

router.get("/staff/tickets", listTickets);
router.patch("/staff/tickets/:ticketId", updateTicketStatus);
router.patch("/staff/tickets/:ticketId/lines/:lineId", updateTicketLineStatus);


export default router;
