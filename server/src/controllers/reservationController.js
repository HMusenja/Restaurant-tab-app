import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { assignTable } from "./staffTableController.js";

/**
 * Create a new reservation
 * POST /api/staff/reservations
 */
export async function createReservation(req, res, next) {
  try {
    const { tableId, name, phone, partySize, reservedFor, notes } = req.body;

    if (!tableId || !name || !phone || !partySize || !reservedFor) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    const reservation = await Reservation.create({
      table: table._id,
      name,
      phone,
      partySize,
      reservedFor: new Date(reservedFor),
      notes: notes || "",
    });

    const io = req.app.get("io");
    io.to("staff").emit("reservations:updated");

    return res.status(201).json({ reservation });
  } catch (err) {
    next(err);
  }
}

/**
 * List reservations
 * GET /api/staff/reservations?date=YYYY-MM-DD
 */
export async function listReservations(req, res, next) {
  try {
    const { date } = req.query;

    let filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.reservedFor = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(filter)
      .populate("table", "number")
      .sort({ reservedFor: 1 })
      .lean();

    return res.json({ reservations });
  } catch (err) {
    next(err);
  }
}

/**
 * Seat a reservation
 * POST /api/staff/reservations/:reservationId/seat
 */
export async function seatReservation(req, res, next) {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "BOOKED") {
      return res.status(400).json({ message: "Reservation not seatable" });
    }

    const table = await Table.findById(reservation.table);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.status === "OCCUPIED") {
      return res.status(400).json({ message: "Table already occupied" });
    }

    // Mark reservation as seated
    reservation.status = "SEATED";
    await reservation.save();

    // Reuse assignTable logic
    req.params.tableId = table._id.toString();
    req.body.guestCount = reservation.partySize;

    return assignTable(req, res, next);
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel reservation
 * POST /api/staff/reservations/:reservationId/cancel
 */
export async function cancelReservation(req, res, next) {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "BOOKED") {
      return res.status(400).json({ message: "Cannot cancel this reservation" });
    }

    reservation.status = "CANCELLED";
    await reservation.save();

    const io = req.app.get("io");
    io.to("staff").emit("reservations:updated");

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
/**
 * Update reservation fields
 * PATCH /api/staff/reservations/:reservationId
 */
export async function updateReservation(req, res, next) {
  try {
    const { reservationId } = req.params;
    const { tableId, name, phone, partySize, reservedFor, notes, status } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // Optional: only allow edits when BOOKED (recommended)
    if (reservation.status !== "BOOKED") {
      return res.status(400).json({ message: "Only BOOKED reservations can be edited" });
    }

    if (tableId) {
      const table = await Table.findById(tableId);
      if (!table) return res.status(404).json({ message: "Table not found" });
      reservation.table = table._id;
    }

    if (typeof name === "string") reservation.name = name.trim();
    if (typeof phone === "string") reservation.phone = phone.trim();
    if (Number.isFinite(Number(partySize))) reservation.partySize = Number(partySize);
    if (reservedFor) reservation.reservedFor = new Date(reservedFor);
    if (typeof notes === "string") reservation.notes = notes;

    // Optional: allow setting status to NO_SHOW from UI later
    if (status) {
      const allowed = ["BOOKED", "CANCELLED", "NO_SHOW"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      reservation.status = status;
    }

    await reservation.save();

    const io = req.app.get("io");
    io.to("staff").emit("reservations:updated");

    return res.json({ reservation });
  } catch (err) {
    next(err);
  }
}

