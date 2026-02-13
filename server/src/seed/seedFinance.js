import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Tab from "../models/Tab.js";

dotenv.config();

async function seedFinance() {
   await connectDB(process.env.MONGO_URI);

  const result = await Tab.updateMany(
    {
      status: { $in: ["PAID", "CLOSED"] },
      "payment.paidAt": null,
    },
    [
      {
        $set: {
          "payment.paidAt": "$updatedAt",
          "payment.subtotalCents": {
            $cond: [
              { $gt: ["$billSubtotalCents", 0] },
              "$billSubtotalCents",
              "$subtotalCents",
            ],
          },
          "payment.totalCents": "$totalCents",
          "payment.method": "cash",
        },
      },
      ],
    {
    updatePipeline: true,
  }
  );

  console.log("✅ Finance reseed complete");
  console.log("Matched:", result.matchedCount);
  console.log("Updated:", result.modifiedCount);

  await mongoose.disconnect();
}

seedFinance().catch((err) => {
  console.error(err);
  process.exit(1);
});
