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
      filter.status = { $in: ["BOOKED", "SEATED"] };
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
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.status !== "BOOKED") {
      return res.status(400).json({ message: "Reservation not seatable" });
    }

    const table = await Table.findById(reservation.table);
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (table.status === "OCCUPIED") {
      return res.status(400).json({ message: "Table already occupied" });
    }

    // Reuse assignTable logic FIRST
    req.params.tableId = table._id.toString();
    req.body.guestCount = reservation.partySize;

    // monkey-patch: capture original res.json so we can update reservation after assign success
    const originalJson = res.json.bind(res);

    res.json = async (payload) => {
      // ✅ only after assign success
      reservation.status = "SEATED";
      await reservation.save();

      const io = req.app.get("io");
      io?.to("staff").emit("reservations:updated");

      return originalJson(payload);
    };

    return assignTable(req, res, next);
  } catch (err) {
    next(err);
  }
}


/**
 * Cancel a reservation
 * POST /api/staff/reservations/:reservationId/cancel
 */
export async function cancelReservation(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "BOOKED") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cannot cancel this reservation" });
    }

    // Mark reservation as cancelled
    reservation.status = "CANCELLED";
    await reservation.save({ session });

    // If table is RESERVED for this reservation, free it
    const table = await Table.findById(reservation.table).session(session);
    if (table && table.status === "RESERVED") {
      table.status = "FREE";
      table.reservation = null;
      table.assignedAt = null;
      await table.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");
    io.to("staff").emit("reservations:updated");

    return res.json({ ok: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

/**
 * Update reservation fields
 * PATCH /api/staff/reservations/:reservationId
 */
export async function updateReservation(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId } = req.params;
    const { tableId, name, phone, partySize, reservedFor, notes, status } = req.body;

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Only allow edits if BOOKED or NO_SHOW (optional)
    if (!["BOOKED", "NO_SHOW"].includes(reservation.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cannot edit this reservation" });
    }

    // Update table if changed
    if (tableId && tableId !== String(reservation.table)) {
      const oldTable = await Table.findById(reservation.table).session(session);
      const newTable = await Table.findById(tableId).session(session);

      if (!newTable) {
        await session.abortTransaction();
        return res.status(404).json({ message: "New table not found" });
      }

      // Free old table if it was RESERVED
      if (oldTable && oldTable.status === "RESERVED") {
        oldTable.status = "FREE";
        oldTable.reservation = null;
        oldTable.assignedAt = null;
        await oldTable.save({ session });
      }

      // Reserve new table
      if (newTable.status === "FREE") {
        newTable.status = "RESERVED";
        newTable.reservation = {
          name: name || reservation.name,
          phone: phone || reservation.phone,
          partySize: partySize || reservation.partySize,
          reservedFor: reservedFor ? new Date(reservedFor) : reservation.reservedFor,
        };
        newTable.assignedAt = null;
        await newTable.save({ session });
        reservation.table = newTable._id;
      } else {
        await session.abortTransaction();
        return res.status(400).json({ message: "New table is not available" });
      }
    }

    if (typeof name === "string") reservation.name = name.trim();
    if (typeof phone === "string") reservation.phone = phone.trim();
    if (Number.isFinite(Number(partySize))) reservation.partySize = Number(partySize);
    if (reservedFor) reservation.reservedFor = new Date(reservedFor);
    if (typeof notes === "string") reservation.notes = notes;

    if (status) {
      const allowed = ["BOOKED", "CANCELLED", "NO_SHOW", "SEATED"];
      if (!allowed.includes(status)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid status" });
      }
      reservation.status = status;

      // If status is CANCELLED, free table
      if (status === "CANCELLED") {
        const table = await Table.findById(reservation.table).session(session);
        if (table && table.status === "RESERVED") {
          table.status = "FREE";
          table.reservation = null;
          table.assignedAt = null;
          await table.save({ session });
        }
      }
    }

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");
    io.to("staff").emit("reservations:updated");

    return res.json({ reservation });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}