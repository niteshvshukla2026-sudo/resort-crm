// backend/server_router.cjs

const express = require("express");
const { createControllers } = require("./controllers.cjs");

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // ------------------------
  // 🧾 Item Category model / storage
  // ------------------------
  let ItemCategoryModel = null;
  let inmemItemCategories = [];

  if (useMongo && mongoose) {
    const { Schema } = mongoose;
    const itemCategorySchema = new Schema(
      {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true },
        // department _id (string / ObjectId)
        department: {
          type: Schema.Types.ObjectId,
          ref: "Department",
          required: true,
        },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    );

    ItemCategoryModel =
      mongoose.models.ItemCategory ||
      mongoose.model("ItemCategory", itemCategorySchema);
  }

  function genCode(name = "", code = "") {
    if (code && code.trim()) return code.trim();

    const base =
      (name || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => (w.length <= 4 ? w : w.slice(0, 4)))
        .join("_") || "IC";

    const suffix = Math.floor(Math.random() * 900 + 100);
    return `${base}_${suffix}`.slice(0, 20);
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
  router.post("/api/auth/login", controllers.login);

  // ------------------------
  // 📊 Dashboard
  // ------------------------
  router.get(
    "/dashboard/resort/:resortId/kpi",
    controllers.getResortKpi
  );

  // ------------------------
  // 🏨 RESORTS (full CRUD)
  // ------------------------
  router.get("/resorts", controllers.listResorts);

  router.get("/api/resorts", controllers.listResorts);
  router.post("/api/resorts", controllers.createResort);
  router.put("/api/resorts/:id", controllers.updateResort);
  router.delete("/api/resorts/:id", controllers.deleteResort);

  // ------------------------
  // 🏬 DEPARTMENTS (full CRUD)
  // ------------------------
  router.get("/departments", controllers.listDepartments);

  router.get("/api/departments", controllers.listDepartments);
  router.post("/api/departments", controllers.createDepartment);
  router.put("/api/departments/:id", controllers.updateDepartment);
  router.delete("/api/departments/:id", controllers.deleteDepartment);

  // ------------------------
  // 🧾 ITEM CATEGORIES (NEW – full CRUD)
  // ------------------------

  // GET all item categories (frontend expects plain array)
  router.get("/api/item-categories", async (req, res) => {
    try {
      if (ItemCategoryModel) {
        const list = await ItemCategoryModel.find().lean().exec();
        return res.json(list);
      }
      // in-memory fallback
      return res.json(inmemItemCategories);
    } catch (err) {
      console.error("GET /api/item-categories error:", err);
      res
        .status(500)
        .json({ message: "Failed to fetch item categories" });
    }
  });

  // CREATE
  router.post("/api/item-categories", async (req, res) => {
    try {
      const { name, code, department, departmentCategory } = req.body;

      if (!name || !name.trim()) {
        return res
          .status(400)
          .json({ message: "Item category name required" });
      }

      const deptId = department || departmentCategory;
      if (!deptId) {
        return res
          .status(400)
          .json({ message: "Department is required" });
      }

      const finalCode = genCode(name, code);

      if (ItemCategoryModel) {
        const created = await ItemCategoryModel.create({
          name: name.trim(),
          code: finalCode,
          department: deptId,
        });
        return res.status(201).json(created.toObject());
      }

      // in-memory fallback
      const item = {
        _id: `local_${Date.now()}`,
        name: name.trim(),
        code: finalCode,
        department: deptId,
        isActive: true,
      };
      inmemItemCategories.push(item);
      return res.status(201).json(item);
    } catch (err) {
      console.error("POST /api/item-categories error:", err);
      res
        .status(500)
        .json({ message: "Failed to create item category" });
    }
  });

  // UPDATE
  router.put("/api/item-categories/:id", async (req, res) => {
    try {
      const { name, code, department, departmentCategory, isActive } =
        req.body;
      const id = req.params.id;

      if (ItemCategoryModel) {
        const ic = await ItemCategoryModel.findById(id);
        if (!ic) {
          return res
            .status(404)
            .json({ message: "Item category not found" });
        }

        if (name && name.trim()) ic.name = name.trim();
        if (code || name) ic.code = genCode(name || ic.name, code);

        const deptId = department || departmentCategory;
        if (deptId) ic.department = deptId;

        if (typeof isActive === "boolean") ic.isActive = isActive;

        await ic.save();
        return res.json(ic.toObject());
      }

      // in-memory
      const idx = inmemItemCategories.findIndex(
        (x) => x._id === id
      );
      if (idx === -1) {
        return res
          .status(404)
          .json({ message: "Item category not found" });
      }

      const current = inmemItemCategories[idx];
      const updated = {
        ...current,
        name: name ? name.trim() : current.name,
        code: genCode(name || current.name, code || current.code),
        department:
          department || departmentCategory || current.department,
        isActive:
          typeof isActive === "boolean"
            ? isActive
            : current.isActive,
      };
      inmemItemCategories[idx] = updated;
      return res.json(updated);
    } catch (err) {
      console.error("PUT /api/item-categories/:id error:", err);
      res
        .status(500)
        .json({ message: "Failed to update item category" });
    }
  });

  // DELETE
  router.delete("/api/item-categories/:id", async (req, res) => {
    try {
      const id = req.params.id;

      if (ItemCategoryModel) {
        const ic = await ItemCategoryModel.findByIdAndDelete(id);
        if (!ic) {
          return res
            .status(404)
            .json({ message: "Item category not found" });
        }
        return res.json({ ok: true, message: "Item category deleted" });
      }

      // in-memory
      const before = inmemItemCategories.length;
      inmemItemCategories = inmemItemCategories.filter(
        (x) => x._id !== id
      );
      if (inmemItemCategories.length === before) {
        return res
          .status(404)
          .json({ message: "Item category not found" });
      }
      return res.json({ ok: true, message: "Item category deleted" });
    } catch (err) {
      console.error("DELETE /api/item-categories/:id error:", err);
      res
        .status(500)
        .json({ message: "Failed to delete item category" });
    }
  });

  // ------------------------
  // 📦 REQUISITIONS (demo)
  // ------------------------
  router.get("/requisitions", controllers.listRequisitions);
  router.post("/requisitions", controllers.createRequisition);

  // ------------------------
  // 📑 PURCHASE ORDERS (demo)
  // ------------------------
  router.get("/po", controllers.listPOs);

  // ------------------------
  // 📦 ITEMS (demo)
  // ------------------------
  router.get("/items", controllers.listItems);

  // ------------------------
  // 👥 ROLES / USERS (demo)
  // ------------------------
  router.get("/roles", controllers.listRoles);
  router.get("/users", controllers.listUsers);

  return router;
}

module.exports = { createRouter };
