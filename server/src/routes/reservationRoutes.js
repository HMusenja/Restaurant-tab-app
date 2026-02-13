import express from "express";
import {
  createReservation,
  listReservations,
  seatReservation,
  cancelReservation,
  updateReservation
} from "../controllers/reservationController.js";

const router = express.Router();

// Create reservation
router.post("/", createReservation);

// List reservations (optionally by date)
router.get("/", listReservations);

// Seat reservation
router.post("/:reservationId/seat", seatReservation);

// Cancel reservation
router.post("/:reservationId/cancel", cancelReservation);

// Update
router.patch("/:reservationId", updateReservation);

export default router;
