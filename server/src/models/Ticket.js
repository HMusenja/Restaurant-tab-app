import { Schema, model } from "mongoose";

/**
 * Ticket.js
 */
const ticketLineSchema = new Schema(
  {
    menuItemId: Schema.Types.ObjectId,
    
   nameSnap: String,
    qty: Number,
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "DONE","READY"],
      default: "NEW",
    },
  },
  { _id: true } 
);


const ticketSchema = new Schema(
{
    tab: { type: Schema.Types.ObjectId, ref: "Tab", required: true },
  station: { type: String, enum: ["KITCHEN", "BAR"], default: "KITCHEN",index: true },
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "DONE"],
      default: "NEW",
      index: true,
    },
    lines: { type: [ticketLineSchema], required: true },
    etaMinutes: { type: Number, default: null },
  },
  { timestamps: true }
);



const Ticket = model("Ticket", ticketSchema);
export default Ticket;