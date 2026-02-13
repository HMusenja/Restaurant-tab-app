// src/api/staffReservationApi.js
import { get, post,patch } from "./client";

/**
 * Fetch reservations (optionally by date: YYYY-MM-DD)
 * GET /api/staff/reservations?date=YYYY-MM-DD
 */
export const fetchReservations = (date) =>
  get(
    date
      ? `/staff/reservations?date=${encodeURIComponent(date)}`
      : "/staff/reservations",
  );

/**
 * Create a reservation
 * POST /api/staff/reservations
 * body: { tableId, name, phone, partySize, reservedFor, notes? }
 */
export const createReservation = (body) => post("/staff/reservations", body);

/**
 * Seat a reservation
 * POST /api/staff/reservations/:reservationId/seat
 */
export const seatReservation = (reservationId) =>
  post(`/staff/reservations/${reservationId}/seat`, {});

/**
 * Cancel a reservation
 * POST /api/staff/reservations/:reservationId/cancel
 */
export const cancelReservation = (reservationId) =>
  post(`/staff/reservations/${reservationId}/cancel`, {});

export const updateReservation = (reservationId, body) =>
  patch(`/staff/reservations/${reservationId}`, body);
