// backend/server_router.cjs

const express = require("express");
const { createControllers } = require("./controllers.cjs");

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // ------------------------
  // Helpers
  // ------------------------

  // Safe wrapper for old controllers-based routes
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

  // --- ItemCategory & Item models (Mongo or in-memory) ---
  let ItemCategoryModel = null;
  let ItemModel = null;
  let memItemCategories = [];
  let memItems = [];

  if (useMongo && mongoose) {
    const { Schema } = mongoose;

    const itemCategorySchema = new Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        // yahi field tum frontend se bhej rahe ho
        departmentCategory: { type: String, default: "" },
      },
      { timestamps: true }
    );

    const itemSchema = new Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        itemCategory: { type: String, default: "" }, // sirf string store kar rahe
        uom: { type: String, default: "" },
        brand: { type: String, default: "" },
        indicativePrice: { type: Number },
      },
      { timestamps: true }
    );

    ItemCategoryModel =
      mongoose.models.ItemCategory ||
      mongoose.model("ItemCategory", itemCategorySchema);

    ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

    console.log("ItemCategory & Item models initialised (Mongo)");
  } else {
    console.warn(
      "Mongo DB not enabled for ItemCategory/Item; using in-memory arrays (data lost on restart)."
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
  // 📁 ITEM CATEGORIES  (FULL CRUD, DIRECTLY HERE)
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
  // 📦 ITEMS  (FULL CRUD, DIRECTLY HERE)
  // =======================================================

  const listItemsHandler = async (req, res) => {
    try {
      if (ItemModel) {
        const docs = await ItemModel.find().lean();
        return res.json(docs);
      }
      return res.json(memItems);
    } catch (err) {
      console.error("GET /items error", err);
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

  // Purana plain path bhi same handler use kare
  router.get("/items", listItemsHandler);

  // /api style endpoints (jo tumhare React me use ho rahe)
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
