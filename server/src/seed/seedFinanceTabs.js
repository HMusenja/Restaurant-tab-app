
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Tab from "../models/Tab.js";
import Table from "../models/Table.js";

dotenv.config();

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedFinanceTabs() {
  await connectDB(process.env.MONGO_URI);

  console.log("🌱 Seeding finance tabs…");

  const tables = await Table.find().limit(10);
  if (!tables.length) {
    throw new Error("No tables found. Seed tables first.");
  }

  const tabs = [];

  for (let day = 0; day < 30; day++) {
    const tabsPerDay = randomBetween(3, 8);

    for (let i = 0; i < tabsPerDay; i++) {
      const subtotal = randomBetween(1500, 12000); // €15–€120
      const tipPercent = randomBetween(0, 15);

      const tipCents = Math.round((subtotal * tipPercent) / 100);
      const total = subtotal + tipCents;

      const paidAt = daysAgo(day);
      paidAt.setHours(randomBetween(12, 22), randomBetween(0, 59));

      const isClosed = Math.random() > 0.5;

      tabs.push({
        table: tables[randomBetween(0, tables.length - 1)]._id,
        status: isClosed ? "CLOSED" : "PAID",
        subtotalCents: subtotal,
        billSubtotalCents: subtotal,
        totalCents: total,
        amountPaidCents: total,
        amountDueCents: 0,
        paymentMethod: Math.random() > 0.4 ? "CARD" : "CASH",
        tip: {
          type: "PERCENT",
          value: tipPercent,
        },
        paidAt,
        restaurantId: "default",
        createdAt: paidAt,
        updatedAt: paidAt,
      });
    }
  }

  await Tab.insertMany(tabs);

  console.log(`✅ Seeded ${tabs.length} finance tabs`);
  process.exit(0);
}

seedFinanceTabs().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
