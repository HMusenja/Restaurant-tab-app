import { Schema, model } from "mongoose";

/**
 * Reservation.js
 */
const ReservationSchema = new Schema(
 {
    table: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    partySize: {
      type: Number,
      required: true,
      min: 1,
    },

    reservedFor: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["BOOKED", "SEATED", "CANCELLED", "NO_SHOW"],
      default: "BOOKED",
      index: true,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ field: 1 });

const Reservation = model("Reservation", ReservationSchema);
export default Reservation;