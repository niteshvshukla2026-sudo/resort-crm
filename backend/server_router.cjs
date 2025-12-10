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

  // --- Models / in-memory for ItemCategory, Item, Store ---
  let ItemCategoryModel = null;
  let ItemModel = null;
  let StoreModel = null;

  let memItemCategories = [];
  let memItems = [];
  let memStores = [];

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
        itemCategory: { type: String, default: "" },
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

    ItemCategoryModel =
      mongoose.models.ItemCategory ||
      mongoose.model("ItemCategory", itemCategorySchema);

    ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

    StoreModel =
      mongoose.models.Store || mongoose.model("Store", storeSchema);

    console.log("ItemCategory, Item & Store models initialised (Mongo)");
  } else {
    console.warn(
      "Mongo DB not enabled; ItemCategory/Item/Store will use in-memory arrays (data lost on restart)."
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

      if (ItemModel) {
        const doc = await ItemModel.create({
          name,
          code,
          itemCategory: itemCategory || "",
          uom: uom || "",
          brand: brand || "",
          indicativePrice:
            indicativePrice === "" || indicativePrice == null
              ? undefined
              : Number(indicativePrice),
        });
        return res.status(201).json(doc);
      }

      const created = {
        _id: `it_${Date.now()}`,
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

  // ------------------------
  // 👥 ROLES / USERS (demo)
  // ------------------------
  router.get("/roles", safe("listRoles"));
  router.get("/users", safe("listUsers"));

  return router;
}

module.exports = { createRouter };
