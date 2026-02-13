import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Table from "../models/Table.js";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

function makeToken(tableNumber) {
  return `TABLE-${String(tableNumber).padStart(2, "0")}`;
}

// ✅ Deterministic, stable image URLs (no redirects like Unsplash source)
function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imgSeed(category, name) {
  const seed = slugify(`${category}-${name}`);
  return `https://picsum.photos/seed/${seed}/800/600`;
}

async function run() {
  await connectDB(process.env.MONGO_URI);

  await Table.deleteMany({});
  await MenuItem.deleteMany({});

  // Tables
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    tables.push({ number: i, token: makeToken(i), activeTab: null });
  }
  await Table.insertMany(tables);

  // African + Asian menu (10+ items per category) + images
  const menuItems = [
    // =========================
    // STARTERS (10)
    // =========================
    {
      name: "Samosas (Beef)",
      description: "Crispy pastry filled with spiced beef, served with chili dip",
      priceCents: 650,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Samosas (Beef)"),
      available: true,
    },
    {
      name: "Vegetable Samosas",
      description: "Crispy pastry with potato, peas, and warm spices",
      priceCents: 590,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Vegetable Samosas"),
      available: true,
    },
    {
      name: "Suya Skewers",
      description: "Nigerian-style grilled beef skewers with peanut spice rub",
      priceCents: 850,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Suya Skewers"),
      available: true,
    },
    {
      name: "Chicken Satay",
      description: "Grilled chicken skewers with peanut sauce and cucumber relish",
      priceCents: 790,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Chicken Satay"),
      available: true,
    },
    {
      name: "Spring Rolls",
      description: "Crispy rolls with cabbage, carrots, and sweet chili sauce",
      priceCents: 650,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Spring Rolls"),
      available: true,
    },
    {
      name: "Prawn Tempura",
      description: "Light battered prawns with tangy dipping sauce",
      priceCents: 990,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Prawn Tempura"),
      available: true,
    },
    {
      name: "Yam Fries",
      description: "Crispy yam fries with house peri-peri mayo",
      priceCents: 690,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Yam Fries"),
      available: true,
    },
    {
      name: "Plantain Chips",
      description: "Crunchy plantain chips with spicy tomato salsa",
      priceCents: 550,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Plantain Chips"),
      available: true,
    },
    {
      name: "Edamame (Sea Salt)",
      description: "Steamed edamame with flaky sea salt",
      priceCents: 520,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Edamame (Sea Salt)"),
      available: true,
    },
    {
      name: "Miso Soup",
      description: "Traditional miso broth with tofu and spring onion",
      priceCents: 450,
      category: "Starters",
      imageUrl: imgSeed("Starters", "Miso Soup"),
      available: true,
    },

    // =========================
    // MAINS (10)
    // =========================
    {
      name: "Jollof Rice (Chicken)",
      description: "Smoky tomato rice with grilled chicken and fried plantain",
      priceCents: 1590,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Jollof Rice (Chicken)"),
      available: true,
    },
    {
      name: "Jollof Rice (Veg)",
      description: "Smoky tomato rice with mixed vegetables and plantain",
      priceCents: 1390,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Jollof Rice (Veg)"),
      available: true,
    },
    {
      name: "Egusi Soup + Pounded Yam",
      description: "Melon seed stew with greens, served with pounded yam",
      priceCents: 1790,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Egusi Soup + Pounded Yam"),
      available: true,
    },
    {
      name: "Peanut Stew (Groundnut) + Rice",
      description: "Rich West African peanut stew with tender beef and rice",
      priceCents: 1690,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Peanut Stew (Groundnut) + Rice"),
      available: true,
    },
    {
      name: "Peri-Peri Chicken",
      description: "Spicy grilled chicken with herb rice and slaw",
      priceCents: 1690,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Peri-Peri Chicken"),
      available: true,
    },
    {
      name: "Beef Rendang",
      description: "Slow-cooked coconut beef curry, served with jasmine rice",
      priceCents: 1890,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Beef Rendang"),
      available: true,
    },
    {
      name: "Chicken Katsu Curry",
      description: "Crispy chicken cutlet with Japanese curry and rice",
      priceCents: 1690,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Chicken Katsu Curry"),
      available: true,
    },
    {
      name: "Pad Thai (Chicken)",
      description: "Rice noodles with tamarind sauce, peanuts, lime, and chicken",
      priceCents: 1590,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Pad Thai (Chicken)"),
      available: true,
    },
    {
      name: "Pad Thai (Tofu)",
      description: "Rice noodles with tamarind sauce, peanuts, lime, and tofu",
      priceCents: 1490,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Pad Thai (Tofu)"),
      available: true,
    },
    {
      name: "Korean Bibimbap",
      description: "Rice bowl with vegetables, egg, gochujang, choice of beef",
      priceCents: 1790,
      category: "Mains",
      imageUrl: imgSeed("Mains", "Korean Bibimbap"),
      available: true,
    },

    // =========================
    // SIDES (10)
    // =========================
    {
      name: "Fried Plantain",
      description: "Sweet fried plantain slices",
      priceCents: 590,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Fried Plantain"),
      available: true,
    },
    {
      name: "Jasmine Rice",
      description: "Steamed jasmine rice",
      priceCents: 350,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Jasmine Rice"),
      available: true,
    },
    {
      name: "Coconut Rice",
      description: "Fragrant coconut rice",
      priceCents: 490,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Coconut Rice"),
      available: true,
    },
    {
      name: "Okra Fries",
      description: "Crispy okra fries with spicy dip",
      priceCents: 650,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Okra Fries"),
      available: true,
    },
    {
      name: "Kimchi",
      description: "House kimchi (spicy fermented cabbage)",
      priceCents: 450,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Kimchi"),
      available: true,
    },
    {
      name: "Asian Slaw",
      description: "Cabbage slaw with sesame dressing",
      priceCents: 490,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Asian Slaw"),
      available: true,
    },
    {
      name: "Suya Spice Fries",
      description: "Crispy fries dusted with suya spice",
      priceCents: 590,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Suya Spice Fries"),
      available: true,
    },
    {
      name: "Steamed Vegetables",
      description: "Seasonal vegetables, lightly steamed",
      priceCents: 450,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Steamed Vegetables"),
      available: true,
    },
    {
      name: "Garlic Naan",
      description: "Soft garlic naan bread",
      priceCents: 390,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Garlic Naan"),
      available: true,
    },
    {
      name: "Pounded Yam (Side)",
      description: "Smooth pounded yam portion",
      priceCents: 690,
      category: "Sides",
      imageUrl: imgSeed("Sides", "Pounded Yam (Side)"),
      available: true,
    },

    // =========================
    // DESSERTS (10)
    // =========================
    {
      name: "Chin Chin",
      description: "Crunchy West African sweet bites",
      priceCents: 450,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Chin Chin"),
      available: true,
    },
    {
      name: "Puff Puff",
      description: "West African dough balls, lightly sweet and fluffy",
      priceCents: 550,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Puff Puff"),
      available: true,
    },
    {
      name: "Mochi Ice Cream",
      description: "Assorted mochi ice cream (3 pieces)",
      priceCents: 650,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Mochi Ice Cream"),
      available: true,
    },
    {
      name: "Matcha Cheesecake",
      description: "Creamy cheesecake with matcha twist",
      priceCents: 790,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Matcha Cheesecake"),
      available: true,
    },
    {
      name: "Mango Sticky Rice",
      description: "Sweet coconut sticky rice with ripe mango",
      priceCents: 850,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Mango Sticky Rice"),
      available: true,
    },
    {
      name: "Coconut Tapioca",
      description: "Creamy coconut tapioca pudding",
      priceCents: 690,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Coconut Tapioca"),
      available: true,
    },
    {
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with molten center",
      priceCents: 890,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Chocolate Lava Cake"),
      available: true,
    },
    {
      name: "Banana Fritters",
      description: "Crispy banana fritters with honey drizzle",
      priceCents: 650,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Banana Fritters"),
      available: true,
    },
    {
      name: "Sesame Balls",
      description: "Sweet sesame balls with red bean filling",
      priceCents: 590,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Sesame Balls"),
      available: true,
    },
    {
      name: "Ginger Ice Cream",
      description: "Creamy ice cream with warming ginger notes",
      priceCents: 650,
      category: "Desserts",
      imageUrl: imgSeed("Desserts", "Ginger Ice Cream"),
      available: true,
    },

    // =========================
    // DRINKS (10)
    // =========================
    {
      name: "Hibiscus (Bissap) Iced Tea",
      description: "Chilled hibiscus tea with citrus",
      priceCents: 450,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Hibiscus (Bissap) Iced Tea"),
      available: true,
    },
    {
      name: "Ginger Beer (House)",
      description: "Homemade ginger beer (non-alcoholic)",
      priceCents: 490,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Ginger Beer (House)"),
      available: true,
    },
    {
      name: "Mango Lassi",
      description: "Creamy mango yogurt drink",
      priceCents: 550,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Mango Lassi"),
      available: true,
    },
    {
      name: "Thai Iced Tea",
      description: "Sweet Thai tea with milk over ice",
      priceCents: 550,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Thai Iced Tea"),
      available: true,
    },
    {
      name: "Lemongrass Iced Tea",
      description: "Refreshing lemongrass tea served cold",
      priceCents: 450,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Lemongrass Iced Tea"),
      available: true,
    },
    {
      name: "Sparkling Water",
      description: "0.5l sparkling mineral water",
      priceCents: 300,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Sparkling Water"),
      available: true,
    },
    {
      name: "Still Water",
      description: "0.5l still water",
      priceCents: 250,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Still Water"),
      available: true,
    },
    {
      name: "Cola",
      description: "0.33l classic cola",
      priceCents: 290,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Cola"),
      available: true,
    },
    {
      name: "Passion Fruit Juice",
      description: "Tropical passion fruit juice",
      priceCents: 490,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Passion Fruit Juice"),
      available: true,
    },
    {
      name: "Iced Matcha Latte",
      description: "Iced matcha latte with oat milk option",
      priceCents: 590,
      category: "Drinks",
      imageUrl: imgSeed("Drinks", "Iced Matcha Latte"),
      available: true,
    },
  ];

  await MenuItem.insertMany(menuItems);

  console.log("✅ Seed complete");
  console.log("Tables seeded:", tables.length);
  console.log("Menu items seeded:", menuItems.length);
  console.log("Example table token:", makeToken(1));
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});

