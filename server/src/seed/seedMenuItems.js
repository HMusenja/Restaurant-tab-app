// server/src/seeds/seedMenu.js
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { faker } from "@faker-js/faker";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

/**
 * Helpers
 */
const price = (min, max) =>
  faker.number.int({ min: min * 100, max: max * 100 });

/**
 * Unsplash seed URLs:
 * - Avoid source.unsplash.com (flaky redirects / rate-limits / occasional non-image responses)
 * - Encode query to handle spaces safely
 * Note: This still returns a dynamic image, but is more reliable for seeding.
 */
const image = (query) => {
  const q = encodeURIComponent(`${query} food`);
  return `https://unsplash.com/featured/600x400?${q}`;
};

const nutrition = () => ({
  calories: faker.number.int({ min: 80, max: 850 }),
  protein: faker.number.int({ min: 0, max: 45 }),
  carbs: faker.number.int({ min: 5, max: 100 }),
  fat: faker.number.int({ min: 0, max: 50 }),
  sugar: faker.number.int({ min: 0, max: 40 }),
  salt: faker.number.float({ min: 0, max: 3, precision: 0.1 }),
});

const availability = (category) => {
  switch (category) {
    case "Kids":
      return ["lunch", "dinner"];
    case "Desserts":
      return ["lunch", "dinner"];
    case "Drinks":
      return ["lunch", "dinner"];
    default:
      return ["lunch", "dinner"];
  }
};

/**
 * Category Definitions
 */
const categories = {
  Mains: [
    "Jollof Rice",
    "Chicken Suya",
    "Beef Rendang",
    "Lamb Tagine",
    "Thai Green Curry",
    "Grilled Tilapia",
  ],
  Sides: [
    "Plantain Chips",
    "Garlic Naan",
    "Steamed Rice",
    "Sambal Fries",
    "Coleslaw",
    "Peanut Dip",
  ],
  Drinks: [
    "Ginger Juice",
    "Hibiscus Tea",
    "Mango Lassi",
    "Coconut Water",
    "Iced Lemon Tea",
    "Sparkling Water",
  ],
  Desserts: [
    "Chocolate Lava Cake",
    "Coconut Panna Cotta",
    "Mango Sorbet",
    "Banana Fritters",
    "Vanilla Ice Cream",
    "Peanut Caramel Tart",
  ],
  Vegan: [
    "Vegan Jollof Rice",
    "Chickpea Coconut Curry",
    "Grilled Tofu Bowl",
    "Vegetable Stir Fry",
    "Lentil Stew",
    "Vegan Spring Rolls",
  ],
  Kids: [
    "Kids Chicken Nuggets",
    "Mini Burger",
    "Kids Mac & Cheese",
    "Chicken & Rice",
    "Mini Pancakes",
    "Kids Fries",
  ],
};

/**
 * Generate Menu Items
 */
const generateMenuItems = () => {
  const items = [];

  Object.entries(categories).forEach(([category, names]) => {
    names.forEach((name) => {
      items.push({
        name,
        description: faker.food.description(),
        priceCents: price(category === "Kids" ? 4 : 8, category === "Desserts" ? 8 : 22),
        category,
        imageUrl: image(name),
        available: true,

        // Optional fields you’ve added
        availabilityTimes: availability(category),
        nutrition: nutrition(),
        ingredients: faker.helpers.arrayElements(
          [
            "Rice",
            "Chicken",
            "Beef",
            "Vegetables",
            "Coconut Milk",
            "Spices",
            "Peanuts",
            "Cheese",
            "Flour",
          ],
          faker.number.int({ min: 2, max: 5 })
        ),
        allergens: faker.helpers.arrayElements(
          ["Gluten", "Peanuts", "Dairy", "Soy", "Egg"],
          faker.number.int({ min: 0, max: 2 })
        ),
      });
    });
  });

  return items;
};

/**
 * Seed Runner
 */
async function seedMenu() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    await MenuItem.deleteMany();
    console.log("🧹 Existing menu cleared");

    const items = generateMenuItems();
    await MenuItem.insertMany(items);

    console.log(`🍽️ ${items.length} menu items seeded successfully`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedMenu();
