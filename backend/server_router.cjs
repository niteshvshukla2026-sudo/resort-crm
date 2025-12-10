// backend/server_router.cjs

const express = require("express");
const { createControllers } = require("./controllers.cjs");

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // ------------------------
  // Helpers
  // ------------------------

  // Safe wrapper for controllers-based routes
  const safe = (name) => {
    const fn = controllers[name];
    if (typeof fn === "function") return fn;

    console.warn(`controllers.${name} not implemented; route will return 501`);

    return (req, res) => {
      res
        .status(501)
        .json({ message: `Not implemented on this server: ${name}` });
    };
  };

  // --- Models / in-memory for ItemCategory, Item, Store, Recipe ---
  let ItemCategoryModel = null;
  let ItemModel = null;
  let StoreModel = null;
  let RecipeModel = null;

  let memItemCategories = [];
  let memItems = [];
  let memStores = [];
  let memRecipes = [];

  if (useMongo && mongoose) {
    const { Schema } = mongoose;

    // Item Category
    const itemCategorySchema = new Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        departmentCategory: { type: String, default: "" }, // frontend se aata hai
      },
      { timestamps: true }
    );

    // Item
    const itemSchema = new Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        itemCategory: { type: String, default: "" }, // yaha hum itemCategoryId ya name rakh sakte
        uom: { type: String, default: "" },
        brand: { type: String, default: "" },
        indicativePrice: { type: Number },
      },
      { timestamps: true }
    );

    // Store
    const storeSchema = new Schema(
      {
        resort: { type: String, required: true }, // resort _id as string
        name: { type: String, required: true },
        code: { type: String, default: "" },
      },
      { timestamps: true }
    );

    // ✅ Recipe (for RecipeMaster.jsx)
    const recipeLineSchema = new Schema(
      {
        itemId: { type: String, required: true }, // Item _id ya koi code
        qty: { type: Number, required: true },
        itemCategory: { type: String, default: "" }, // itemCategoryId ya name string
      },
      { _id: false }
    );

    const recipeSchema = new Schema(
      {
        code: { type: String, required: true },
        name: { type: String, required: true },

        // Recipe Category (frontend fixed: By Portion, By Recipe Lumpsum)
        recipeCategoryId: { type: String, default: "" }, // e.g. BY_PORTION
        type: { type: String, default: "" }, // e.g. RECIPE_PORTION / RECIPE_LUMPSUM

        yieldQty: { type: Number }, // optional
        yieldUom: { type: String, default: "" }, // "Kg", "Ltr", "Nos", "Pax"

        lines: { type: [recipeLineSchema], default: [] },
      },
      { timestamps: true }
    );

    ItemCategoryModel =
      mongoose.models.ItemCategory ||
      mongoose.model("ItemCategory", itemCategorySchema);

    ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

    StoreModel =
      mongoose.models.Store || mongoose.model("Store", storeSchema);

    RecipeModel =
      mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);

    console.log("ItemCategory, Item, Store & Recipe models initialised (Mongo)");
  } else {
    console.warn(
      "Mongo DB not enabled; ItemCategory/Item/Store/Recipe will use in-memory arrays (data lost on restart)."
    );
  }

  // ------------------------
  // Demo-auth header (optional)
  // ------------------------
  router.use((req, res, next) => {
    const demo = req.header("x-demo-user");
    if (demo) {
      try {
        req.user = JSON.parse(demo);
      } catch (e) {
        req.user = {
          id: demo,
          name: "Demo User",
          role: "RESORT_USER",
          resorts: [],
        };
      }
    }
    next();
  });

  // ------------------------
  // 🔐 AUTH
  // ------------------------
  router.post("/api/auth/login", safe("login"));

  // ------------------------
  // 📊 Dashboard
  // ------------------------
  router.get(
    "/dashboard/resort/:resortId/kpi",
    safe("getResortKpi")
  );

  // ------------------------
  // 🏨 RESORTS (full CRUD)
  // ------------------------
  router.get("/resorts", safe("listResorts"));

  router.get("/api/resorts", safe("listResorts"));
  router.post("/api/resorts", safe("createResort"));
  router.put("/api/resorts/:id", safe("updateResort"));
  router.delete("/api/resorts/:id", safe("deleteResort"));

  // ------------------------
  // 🏬 DEPARTMENTS (full CRUD)
  // ------------------------
  router.get("/departments", safe("listDepartments"));

  router.get("/api/departments", safe("listDepartments"));
  router.post("/api/departments", safe("createDepartment"));
  router.put("/api/departments/:id", safe("updateDepartment"));
  router.delete("/api/departments/:id", safe("deleteDepartment"));

  // =======================================================
  // 🏪 STORES (FULL CRUD)
  // =======================================================

  const listStoresHandler = async (req, res) => {
    try {
      if (StoreModel) {
        const docs = await StoreModel.find().lean();
        return res.json(docs);
      }
      return res.json(memStores);
    } catch (err) {
      console.error("GET /api/stores error", err);
      res.status(500).json({ message: "Failed to list stores" });
    }
  };

  const createStoreHandler = async (req, res) => {
    try {
      const { resort, name, code } = req.body || {};

      if (!resort || !name) {
        return res
          .status(400)
          .json({ message: "resort & name are required" });
      }

      if (StoreModel) {
        const doc = await StoreModel.create({
          resort,
          name,
          code: code || "",
        });
        return res.status(201).json(doc);
      }

      const created = {
        _id: `store_${Date.now()}`,
        resort,
        name,
        code: code || "",
      };
      memStores.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/stores error", err);
      res.status(500).json({ message: "Failed to create store" });
    }
  };

  const updateStoreHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { resort, name, code } = req.body || {};

      const update = {};
      if (resort != null) update.resort = resort;
      if (name != null) update.name = name;
      if (code != null) update.code = code;

      if (StoreModel) {
        const updated = await StoreModel.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true }
        );
        if (!updated) {
          return res.status(404).json({ message: "Store not found" });
        }
        return res.json(updated);
      }

      const idx = memStores.findIndex((s) => s._id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Store not found" });
      }
      memStores[idx] = { ...memStores[idx], ...update };
      return res.json(memStores[idx]);
    } catch (err) {
      console.error("PUT /api/stores/:id error", err);
      res.status(500).json({ message: "Failed to update store" });
    }
  };

  const deleteStoreHandler = async (req, res) => {
    try {
      const { id } = req.params;

      if (StoreModel) {
        const deleted = await StoreModel.findByIdAndDelete(id);
        if (!deleted) {
          return res.status(404).json({ message: "Store not found" });
        }
        return res.json({ ok: true });
      }

      const before = memStores.length;
      memStores = memStores.filter((s) => s._id !== id);
      if (memStores.length === before) {
        return res.status(404).json({ message: "Store not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/stores/:id error", err);
      res.status(500).json({ message: "Failed to delete store" });
    }
  };

  // plain path + /api path — dono ko support karte hai
  router.get("/stores", listStoresHandler);

  router.get("/api/stores", listStoresHandler);
  router.post("/api/stores", createStoreHandler);
  router.put("/api/stores/:id", updateStoreHandler);
  router.delete("/api/stores/:id", deleteStoreHandler);

  // =======================================================
  // 📁 ITEM CATEGORIES (FULL CRUD)
  // =======================================================

  // LIST
  router.get("/api/item-categories", async (req, res) => {
    try {
      if (ItemCategoryModel) {
        const docs = await ItemCategoryModel.find().lean();
        return res.json(docs);
      }
      return res.json(memItemCategories);
    } catch (err) {
      console.error("GET /api/item-categories error", err);
      res.status(500).json({ message: "Failed to list item categories" });
    }
  });

  // CREATE
  router.post("/api/item-categories", async (req, res) => {
    try {
      const { name, code, departmentCategory } = req.body || {};

      if (!name || !code) {
        return res
          .status(400)
          .json({ message: "name & code are required" });
      }

      if (ItemCategoryModel) {
        const doc = await ItemCategoryModel.create({
          name,
          code,
          departmentCategory: departmentCategory || "",
        });
        return res.status(201).json(doc);
      }

      const created = {
        _id: `ic_${Date.now()}`,
        name,
        code,
        departmentCategory: departmentCategory || "",
      };
      memItemCategories.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/item-categories error", err);
      res.status(500).json({ message: "Failed to create item category" });
    }
  });

  // UPDATE
  router.put("/api/item-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, departmentCategory } = req.body || {};

      if (ItemCategoryModel) {
        const updated = await ItemCategoryModel.findByIdAndUpdate(
          id,
          {
            $set: {
              ...(name != null ? { name } : {}),
              ...(code != null ? { code } : {}),
              ...(departmentCategory != null ? { departmentCategory } : {}),
            },
          },
          { new: true }
        );
        if (!updated) {
          return res
            .status(404)
            .json({ message: "Item category not found" });
        }
        return res.json(updated);
      }

      const idx = memItemCategories.findIndex((c) => c._id === id);
      if (idx === -1) {
        return res
          .status(404)
          .json({ message: "Item category not found" });
      }
      memItemCategories[idx] = {
        ...memItemCategories[idx],
        ...(name != null ? { name } : {}),
        ...(code != null ? { code } : {}),
        ...(departmentCategory != null ? { departmentCategory } : {}),
      };
      return res.json(memItemCategories[idx]);
    } catch (err) {
      console.error("PUT /api/item-categories/:id error", err);
      res.status(500).json({ message: "Failed to update item category" });
    }
  });

  // DELETE
  router.delete("/api/item-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (ItemCategoryModel) {
        const deleted = await ItemCategoryModel.findByIdAndDelete(id);
        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Item category not found" });
        }
        return res.json({ ok: true });
      }

      const before = memItemCategories.length;
      memItemCategories = memItemCategories.filter((c) => c._id !== id);
      if (memItemCategories.length === before) {
        return res
          .status(404)
          .json({ message: "Item category not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/item-categories/:id error", err);
      res.status(500).json({ message: "Failed to delete item category" });
    }
  });

  // =======================================================
  // 📦 ITEMS (FULL CRUD)
  // =======================================================

  const listItemsHandler = async (req, res) => {
    try {
      if (ItemModel) {
        const docs = await ItemModel.find().lean();
        return res.json(docs);
      }
      return res.json(memItems);
    } catch (err) {
      console.error("GET /api/items error", err);
      res.status(500).json({ message: "Failed to list items" });
    }
  };

  const createItemHandler = async (req, res) => {
    try {
      const { name, code, itemCategory, uom, brand, indicativePrice } =
        req.body || {};

      if (!name || !code) {
        return res
          .status(400)
          .json({ message: "name & code are required" });
      }

      const common = {
        name,
        code,
        itemCategory: itemCategory || "",
        uom: uom || "",
        brand: brand || "",
        indicativePrice:
          indicativePrice === "" || indicativePrice == null
            ? undefined
            : Number(indicativePrice),
      };

      if (ItemModel) {
        const doc = await ItemModel.create(common);
        return res.status(201).json(doc);
      }

      const created = {
        _id: `it_${Date.now()}`,
        ...common,
      };
      memItems.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/items error", err);
      res.status(500).json({ message: "Failed to create item" });
    }
  };

  const updateItemHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, itemCategory, uom, brand, indicativePrice } =
        req.body || {};

      const update = {};
      if (name != null) update.name = name;
      if (code != null) update.code = code;
      if (itemCategory != null) update.itemCategory = itemCategory;
      if (uom != null) update.uom = uom;
      if (brand != null) update.brand = brand;
      if (indicativePrice != null && indicativePrice !== "")
        update.indicativePrice = Number(indicativePrice);

      if (ItemModel) {
        const updated = await ItemModel.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true }
        );
        if (!updated) {
          return res.status(404).json({ message: "Item not found" });
        }
        return res.json(updated);
      }

      const idx = memItems.findIndex((i) => i._id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Item not found" });
      }
      memItems[idx] = { ...memItems[idx], ...update };
      return res.json(memItems[idx]);
    } catch (err) {
      console.error("PUT /api/items/:id error", err);
      res.status(500).json({ message: "Failed to update item" });
    }
  };

  const deleteItemHandler = async (req, res) => {
    try {
      const { id } = req.params;

      if (ItemModel) {
        const deleted = await ItemModel.findByIdAndDelete(id);
        if (!deleted) {
          return res.status(404).json({ message: "Item not found" });
        }
        return res.json({ ok: true });
      }

      const before = memItems.length;
      memItems = memItems.filter((i) => i._id !== id);
      if (memItems.length === before) {
        return res.status(404).json({ message: "Item not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/items/:id error", err);
      res.status(500).json({ message: "Failed to delete item" });
    }
  };

  router.get("/items", listItemsHandler);

  router.get("/api/items", listItemsHandler);
  router.post("/api/items", createItemHandler);
  router.put("/api/items/:id", updateItemHandler);
  router.delete("/api/items/:id", deleteItemHandler);

  // =======================================================
  // 🧾 RECIPES (FULL CRUD for RecipeMaster.jsx)
  // =======================================================

  const listRecipesHandler = async (req, res) => {
    try {
      if (RecipeModel) {
        const docs = await RecipeModel.find().lean();
        return res.json(docs);
      }
      return res.json(memRecipes);
    } catch (err) {
      console.error("GET /api/recipes error", err);
      res.status(500).json({ message: "Failed to list recipes" });
    }
  };

  const createRecipeHandler = async (req, res) => {
    try {
      const {
        code,
        name,
        recipeCategoryId,
        type,
        yieldQty,
        yieldUom,
        lines,
      } = req.body || {};

      if (!code || !name) {
        return res
          .status(400)
          .json({ message: "code & name are required" });
      }

      // ensure lines array
      const normLines = Array.isArray(lines)
        ? lines
            .filter((ln) => ln && ln.itemId && ln.qty != null)
            .map((ln) => ({
              itemId: String(ln.itemId),
              qty: Number(ln.qty),
              itemCategory:
                ln.itemCategory != null ? String(ln.itemCategory) : "",
            }))
        : [];

      const common = {
        code,
        name,
        recipeCategoryId: recipeCategoryId || "",
        type: type || "",
        yieldQty:
          yieldQty === "" || yieldQty == null ? undefined : Number(yieldQty),
        yieldUom: yieldUom || "",
        lines: normLines,
      };

      if (RecipeModel) {
        const doc = await RecipeModel.create(common);
        return res.status(201).json(doc);
      }

      const created = {
        _id: `rcp_${Date.now()}`,
        ...common,
      };
      memRecipes.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/recipes error", err);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  };

  const updateRecipeHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        code,
        name,
        recipeCategoryId,
        type,
        yieldQty,
        yieldUom,
        lines,
      } = req.body || {};

      const update = {};
      if (code != null) update.code = code;
      if (name != null) update.name = name;
      if (recipeCategoryId != null)
        update.recipeCategoryId = recipeCategoryId;
      if (type != null) update.type = type;
      if (yieldQty !== undefined) {
        if (yieldQty === "" || yieldQty == null) update.yieldQty = undefined;
        else update.yieldQty = Number(yieldQty);
      }
      if (yieldUom != null) update.yieldUom = yieldUom;

      if (lines !== undefined) {
        const normLines = Array.isArray(lines)
          ? lines
              .filter((ln) => ln && ln.itemId && ln.qty != null)
              .map((ln) => ({
                itemId: String(ln.itemId),
                qty: Number(ln.qty),
                itemCategory:
                  ln.itemCategory != null ? String(ln.itemCategory) : "",
              }))
          : [];
        update.lines = normLines;
      }

      if (RecipeModel) {
        const updated = await RecipeModel.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true }
        );
        if (!updated) {
          return res.status(404).json({ message: "Recipe not found" });
        }
        return res.json(updated);
      }

      const idx = memRecipes.findIndex((r) => r._id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      memRecipes[idx] = { ...memRecipes[idx], ...update };
      return res.json(memRecipes[idx]);
    } catch (err) {
      console.error("PUT /api/recipes/:id error", err);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  };

  const deleteRecipeHandler = async (req, res) => {
    try {
      const { id } = req.params;

      if (RecipeModel) {
        const deleted = await RecipeModel.findByIdAndDelete(id);
        if (!deleted) {
          return res.status(404).json({ message: "Recipe not found" });
        }
        return res.json({ ok: true });
      }

      const before = memRecipes.length;
      memRecipes = memRecipes.filter((r) => r._id !== id);
      if (memRecipes.length === before) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/recipes/:id error", err);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  };

  // plain path + /api path
  router.get("/recipes", listRecipesHandler);

  router.get("/api/recipes", listRecipesHandler);
  router.post("/api/recipes", createRecipeHandler);
  router.put("/api/recipes/:id", updateRecipeHandler);
  router.delete("/api/recipes/:id", deleteRecipeHandler);

  // ------------------------
  // 👥 ROLES / USERS (demo)
  // ------------------------
  router.get("/roles", safe("listRoles"));
  router.get("/users", safe("listUsers"));

  return router;
}

module.exports = { createRouter };
