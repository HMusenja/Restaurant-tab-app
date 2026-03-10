import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import MenuItem from "../models/MenuItem.js";


dotenv.config()

const drinks = [

{
name: "Fresh Mango Juice",
description: "Refreshing freshly blended mango juice served chilled.",
priceCents: 450,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:140,
protein:1,
carbs:34,
fat:0,
sugar:30,
salt:0.01
},

ingredients:[
"fresh mango",
"water",
"ice"
],

allergens:[],

availabilityTimes:["breakfast","lunch","dinner"]
},

{
name: "Hibiscus Bissap",
description: "Traditional West African hibiscus drink with mint and citrus.",
priceCents: 420,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:110,
protein:0,
carbs:27,
fat:0,
sugar:25,
salt:0.02
},

ingredients:[
"dried hibiscus flowers",
"sugar",
"mint",
"lime",
"water"
],

allergens:[],

availabilityTimes:["breakfast","lunch","dinner"]
},

{
name: "Thai Iced Tea",
description: "Sweet Thai black tea with milk and crushed ice.",
priceCents: 480,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:190,
protein:4,
carbs:32,
fat:5,
sugar:29,
salt:0.2
},

ingredients:[
"black tea",
"condensed milk",
"evaporated milk",
"sugar",
"ice"
],

allergens:["milk"],

availabilityTimes:["lunch","dinner"]
},

{
name: "Ginger Lemon Drink",
description: "Fresh ginger and lemon beverage with a spicy kick.",
priceCents: 400,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:95,
protein:0,
carbs:24,
fat:0,
sugar:22,
salt:0.01
},

ingredients:[
"fresh ginger",
"lemon juice",
"sugar",
"water"
],

allergens:[],

availabilityTimes:["breakfast","lunch","dinner"]
},

{
name: "Coconut Water",
description: "Natural coconut water served chilled.",
priceCents: 420,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:60,
protein:1,
carbs:15,
fat:0,
sugar:12,
salt:0.03
},

ingredients:[
"coconut water"
],

allergens:[],

availabilityTimes:["breakfast","lunch","dinner"]
},

{
name: "Matcha Latte",
description: "Creamy Japanese matcha green tea latte.",
priceCents: 520,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:170,
protein:6,
carbs:20,
fat:6,
sugar:18,
salt:0.15
},

ingredients:[
"matcha powder",
"milk",
"sugar"
],

allergens:["milk"],

availabilityTimes:["breakfast","lunch"]
},

{
name: "Iced Lemon Tea",
description: "Cold brewed black tea with fresh lemon and light sweetness.",
priceCents: 420,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:90,
protein:0,
carbs:23,
fat:0,
sugar:21,
salt:0.02
},

ingredients:[
"black tea",
"lemon",
"sugar",
"ice"
],

allergens:[],

availabilityTimes:["lunch","dinner"]
},

{
name: "African Spiced Coffee",
description: "Rich coffee brewed with cinnamon and cardamom.",
priceCents: 390,
category: "Drinks",
imageUrl: "",
available: true,

nutrition:{
calories:15,
protein:1,
carbs:2,
fat:0,
sugar:0,
salt:0.01
},

ingredients:[
"coffee",
"cinnamon",
"cardamom",
"water"
],

allergens:[],

availabilityTimes:["breakfast","lunch"]
}

];

async function seedDrinks() {
try {

await connectDB(process.env.MONGO_URI);

await MenuItem.insertMany(drinks);

console.log("Drinks seeded successfully");

process.exit();

} catch (error) {

console.error(error);
process.exit(1);

}
}

seedDrinks();