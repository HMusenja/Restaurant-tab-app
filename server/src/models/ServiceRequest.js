import { Schema, model } from "mongoose";

/**
 * ServiceRequest.js
 */
const ServicRequestSchema = new Schema(
{
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    tab: { type: Schema.Types.ObjectId, ref: "Tab", default: null },

    type: {
      type: String,
      enum: ["BILL", "HELP", "WATER", "OTHER"],
      required: true,
    },

    note: { type: String, default: "" },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "DONE"],
      default: "OPEN",
    },

    urgent: { type: Boolean, default: false, index: true },

    createdAt: { type: Date, expires: "10d" }
  },
  { timestamps: true }
);

const ServicRequest = model("ServicRequest", ServicRequestSchema);
export default ServicRequest;