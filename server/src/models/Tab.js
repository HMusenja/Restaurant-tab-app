import { Schema, model } from "mongoose";

/**
 * Tab.js
 */

const tabItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    nameSnap: { type: String, required: true },
    categorySnap: { type: String, default: "" },
    priceCentsSnap: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const tabSchema = new Schema(
  {
    table: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "REQUESTED_TO_PAY", "CLOSED", "CANCELLED","PAID"],
      default: "OPEN",
      index: true,
    },
    payment: {
  method: { type: String, enum: ["cash", "card"], default: null },
  subtotalCents: { type: Number, default: 0 },
  totalCents: { type: Number, default: 0 },
  paidAt: { type: Date, default: null },
  paidBy: { type:Schema.Types.ObjectId, ref: "User", default: null }, // optional
},
 
    items: { type: [tabItemSchema], default: [] },
    tip: {
      type: {
        type: String,
        enum: ["PERCENT", "AMOUNT"],
        default: "PERCENT",
      },
      value: { type: Number, default: 0, min: 0 },
    },
    subtotalCents: { type: Number, default: 0, min: 0 },
    billSubtotalCents: { type: Number, default: 0, min: 0 },
    totalCents: { type: Number, default: 0, min: 0 },
    amountPaidCents: { type: Number, default: 0, min: 0 },
    amountDueCents: { type: Number, default: 0, min: 0 },

    // optimistic concurrency helper (we'll use later if needed)
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);

tabSchema.index({ status: 1, "payment.paidAt": -1 });
tabSchema.index({ "payment.paidAt": -1 });



const Tab = model("Tab", tabSchema);
export default Tab;


