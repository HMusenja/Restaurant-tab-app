import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import MenuItem from "../models/MenuItem.js";

dotenv.config()

const menuItems = [

/* ---------------- STARTERS ---------------- */

{
name: "Chicken Suya Skewers",
description: "Grilled Nigerian-style chicken skewers coated with spicy peanut suya seasoning.",
priceCents: 850,
category: "Starters",
imageUrl: "",
available: true,

nutrition:{calories:320,protein:28,carbs:6,fat:20,sugar:2,salt:1.1},

ingredients:[
"chicken breast",
"suya spice",
"peanut powder",
"paprika",
"ginger",
"garlic",
"vegetable oil"
],

allergens:["peanuts"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Vegetable Spring Rolls",
description: "Crispy Asian spring rolls filled with cabbage, carrots, and glass noodles.",
priceCents: 650,
category: "Starters",
imageUrl: "",
available: true,

nutrition:{calories:210,protein:4,carbs:28,fat:9,sugar:3,salt:0.8},

ingredients:[
"spring roll wrapper",
"cabbage",
"carrot",
"glass noodles",
"soy sauce",
"garlic",
"sesame oil"
],

allergens:["gluten","soy"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Prawn Tempura",
description: "Lightly battered prawns fried until crispy and served with dipping sauce.",
priceCents: 990,
category: "Starters",
imageUrl: "",
available: true,

nutrition:{calories:340,protein:18,carbs:24,fat:18,sugar:1,salt:1.3},

ingredients:[
"prawns",
"tempura batter",
"wheat flour",
"egg",
"vegetable oil",
"soy dipping sauce"
],

allergens:["gluten","shellfish","eggs","soy"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Plantain Chips",
description: "Thinly sliced fried plantains served with spicy chili dip.",
priceCents: 520,
category: "Starters",
imageUrl: "",
available: true,

nutrition:{calories:250,protein:2,carbs:38,fat:11,sugar:14,salt:0.4},

ingredients:[
"plantains",
"vegetable oil",
"sea salt",
"chili sauce"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

/* ---------------- MAIN COURSE ---------------- */

{
name: "Jollof Rice with Grilled Chicken",
description: "Classic West African tomato jollof rice served with smoky grilled chicken.",
priceCents: 1450,
category: "Main Course",
imageUrl: "",
available: true,

nutrition:{calories:680,protein:38,carbs:72,fat:26,sugar:6,salt:1.5},

ingredients:[
"rice",
"tomatoes",
"tomato paste",
"onions",
"spices",
"chicken",
"vegetable oil"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

{
name: "Thai Green Curry Chicken",
description: "Aromatic Thai green curry with chicken, coconut milk, and fresh herbs.",
priceCents: 1390,
category: "Main Course",
imageUrl: "",
available: true,

nutrition:{calories:590,protein:35,carbs:28,fat:38,sugar:6,salt:1.4},

ingredients:[
"chicken",
"green curry paste",
"coconut milk",
"eggplant",
"bamboo shoots",
"thai basil"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

{
name: "Beef Stir Fry",
description: "Tender beef strips stir-fried with vegetables in a savory soy garlic sauce.",
priceCents: 1490,
category: "Main Course",
imageUrl: "",
available: true,

nutrition:{calories:610,protein:40,carbs:26,fat:34,sugar:5,salt:1.6},

ingredients:[
"beef",
"soy sauce",
"garlic",
"broccoli",
"bell peppers",
"ginger",
"sesame oil"
],

allergens:["soy"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Egusi Soup with Pounded Yam",
description: "Rich Nigerian melon seed soup cooked with spinach and served with pounded yam.",
priceCents: 1550,
category: "Main Course",
imageUrl: "",
available: true,

nutrition:{calories:720,protein:32,carbs:64,fat:38,sugar:4,salt:1.3},

ingredients:[
"egusi seeds",
"spinach",
"beef",
"palm oil",
"onions",
"seasoning",
"yam"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

/* ---------------- RICE & NOODLES ---------------- */

{
name: "Chicken Fried Rice",
description: "Wok-fried rice with chicken, eggs, vegetables, and soy sauce.",
priceCents: 1250,
category: "Rice & Noodles",
imageUrl: "",
available: true,

nutrition:{calories:560,protein:28,carbs:72,fat:18,sugar:4,salt:1.3},

ingredients:[
"rice",
"chicken",
"egg",
"peas",
"carrots",
"soy sauce",
"green onions"
],

allergens:["soy","eggs"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Beef Chow Mein",
description: "Stir-fried noodles with tender beef and vegetables in savory sauce.",
priceCents: 1320,
category: "Rice & Noodles",
imageUrl: "",
available: true,

nutrition:{calories:620,protein:30,carbs:74,fat:22,sugar:6,salt:1.5},

ingredients:[
"egg noodles",
"beef",
"soy sauce",
"cabbage",
"carrots",
"garlic",
"ginger"
],

allergens:["gluten","soy","eggs"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Vegetable Pad Thai",
description: "Thai stir-fried rice noodles with tofu, vegetables, and tamarind sauce.",
priceCents: 1180,
category: "Rice & Noodles",
imageUrl: "",
available: true,

nutrition:{calories:540,protein:18,carbs:70,fat:18,sugar:12,salt:1.1},

ingredients:[
"rice noodles",
"tofu",
"bean sprouts",
"tamarind sauce",
"egg",
"peanuts",
"green onions"
],

allergens:["peanuts","eggs"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Coconut Rice with Shrimp",
description: "Fragrant coconut rice topped with sautéed shrimp and herbs.",
priceCents: 1400,
category: "Rice & Noodles",
imageUrl: "",
available: true,

nutrition:{calories:640,protein:26,carbs:76,fat:26,sugar:5,salt:1.2},

ingredients:[
"rice",
"coconut milk",
"shrimp",
"garlic",
"lime",
"cilantro"
],

allergens:["shellfish"],

availabilityTimes:["lunch","dinner"]
},

/* ---------------- DESSERTS ---------------- */

{
name: "Chocolate Lava Cake",
description: "Warm chocolate cake with a molten center served fresh.",
priceCents: 650,
category: "Desserts",
imageUrl: "",
available: true,

nutrition:{calories:430,protein:6,carbs:52,fat:23,sugar:36,salt:0.4},

ingredients:[
"dark chocolate",
"butter",
"eggs",
"flour",
"sugar",
"cocoa powder"
],

allergens:["gluten","eggs","milk"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Mango Sticky Rice",
description: "Sweet Thai sticky rice served with fresh mango and coconut cream.",
priceCents: 720,
category: "Desserts",
imageUrl: "",
available: true,

nutrition:{calories:380,protein:6,carbs:66,fat:10,sugar:28,salt:0.2},

ingredients:[
"sticky rice",
"mango",
"coconut milk",
"sugar",
"salt"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

{
name: "Fried Banana with Honey",
description: "Crispy fried bananas drizzled with warm honey.",
priceCents: 590,
category: "Desserts",
imageUrl: "",
available: true,

nutrition:{calories:320,protein:3,carbs:48,fat:12,sugar:24,salt:0.2},

ingredients:[
"banana",
"flour",
"honey",
"vegetable oil"
],

allergens:["gluten"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Coconut Milk Pudding",
description: "Creamy coconut dessert topped with toasted sesame seeds.",
priceCents: 610,
category: "Desserts",
imageUrl: "",
available: true,

nutrition:{calories:300,protein:4,carbs:34,fat:16,sugar:20,salt:0.3},

ingredients:[
"coconut milk",
"sugar",
"cornstarch",
"sesame seeds"
],

allergens:["sesame"],

availabilityTimes:["lunch","dinner"]
}

];

async function seedMenu() {
try {

await connectDB(process.env.MONGO_URI);

await MenuItem.deleteMany();

await MenuItem.insertMany(menuItems);

console.log("Menu seeded successfully");

process.exit();

} catch (error) {

console.error(error);
process.exit(1);

}
}

seedMenu();