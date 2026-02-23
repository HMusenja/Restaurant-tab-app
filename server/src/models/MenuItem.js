import { Schema, model } from "mongoose";

/**
 * Sub-schema for nutrition values
 * All optional to allow partial data
 */
const nutritionSchema = new Schema(
  {
    calories: { type: Number, min: 0, default: null }, // kcal
    protein: { type: Number, min: 0, default: null },  // grams
    carbs: { type: Number, min: 0, default: null },    // grams
    fat: { type: Number, min: 0, default: null },      // grams
    sugar: { type: Number, min: 0, default: null },    // grams
    salt: { type: Number, min: 0, default: null },     // grams
  },
  { _id: false } // prevents creating an _id for subdocument
);

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

    
    nutrition: {
      type: nutritionSchema,
      default: () => ({}) // prevents undefined errors
    },

    ingredients: {
      type: [String],
      default: []
    },

    allergens: {
      type: [String],
      default: []
    },
    availabilityTimes: {
  type: [String], // ["breakfast", "lunch", "dinner"]
  default: ["lunch", "dinner"]
}
  },
  { timestamps: true }
);

const MenuItem = model("MenuItem", menuItemSchema);
export default MenuItem;
