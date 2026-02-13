import { Schema, model } from "mongoose";

/**
 * Table.js
 */
const TableSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["FREE", "OCCUPIED"],
      default: "FREE",
      index: true,
    },
    assignedAt: { type: Date, default: null },
    activeTab: { type: Schema.Types.ObjectId, ref: "Tab", default: null },
    guestCount: { type: Number, default: 0, min: 0 },
    joinCode: { type: String, default: null, index: true },
    joinCodeExpiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

const Table = model("Table", TableSchema);
export default Table;
