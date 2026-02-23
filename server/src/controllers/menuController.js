import MenuItem from "../models/MenuItem.js";

/* ------------------------------
   Helper: sanitize nutrition
--------------------------------*/
function sanitizeNutrition(input = {}) {
  return {
    calories: toNumberOrNull(input.calories),
    protein: toNumberOrNull(input.protein),
    carbs: toNumberOrNull(input.carbs),
    fat: toNumberOrNull(input.fat),
    sugar: toNumberOrNull(input.sugar),
    salt: toNumberOrNull(input.salt),
  };
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/* ------------------------------
   LIST MENU (public)
--------------------------------*/
export const listMenu = async (req, res) => {
  try {
    const wantsAll = req.query.all === "true";

    // If you have auth on req.user, enforce admin here:
    // if (wantsAll && req.user?.role !== "admin") {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    const filter = wantsAll ? {} : { available: true };

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ------------------------------
   GET SINGLE
--------------------------------*/
export const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ------------------------------
   CREATE
--------------------------------*/
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      priceCents,
      category,
      imageUrl,
      available,
      nutrition,
      ingredients,
      allergens,
    } = req.body;

    const item = await MenuItem.create({
      name,
      description,
      priceCents,
      category,
      imageUrl,
      available,

      nutrition: sanitizeNutrition(nutrition),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      allergens: Array.isArray(allergens) ? allergens : [],
    });

    res.status(201).json(item);
    const io = req.app.get("io");
    io?.emit("menu:created");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ------------------------------
   UPDATE
--------------------------------*/
export const updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      priceCents,
      category,
      imageUrl,
      available,
      nutrition,
      ingredients,
      allergens,
    } = req.body;

    const updatePayload = {
      name,
      description,
      priceCents,
      category,
      imageUrl,
      available,
    };

    // Only update nutrition if provided
    if (nutrition) {
      updatePayload.nutrition = sanitizeNutrition(nutrition);
    }

    if (ingredients) {
      updatePayload.ingredients = Array.isArray(ingredients) ? ingredients : [];
    }

    if (allergens) {
      updatePayload.allergens = Array.isArray(allergens) ? allergens : [];
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true },
    );

    if (!item) return res.status(404).json({ error: "Not found" });

    res.json(item);
    const io = req.app.get("io");
io?.emit("menu:updated");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/* ------------------------------
   DELETE
--------------------------------*/
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json({ message: "Deleted" });
    const io = req.app.get("io");
io?.emit("menu:deleted");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
