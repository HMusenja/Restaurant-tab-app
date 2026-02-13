import { Schema, model } from "mongoose";

/**
 * MenuItems.js
 */
const menuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    priceCents: { type: Number, required: true, min: 0 },
    category: { type: String, default: "General" },
    imageUrl: { type: String, default: "" },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);



const MenuItem = model("MenuItem", menuItemSchema);
export default MenuItem;