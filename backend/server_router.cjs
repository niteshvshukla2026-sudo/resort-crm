// backend/server_router.cjs
// Consolidated router with Requisition, PO, GRN, Vendors(csv), Items, Stores, ItemCategories, Recipes, etc.
// CommonJS style — to be used with your existing server.cjs that calls createRouter({ useMongo, mongoose })

const express = require("express");
const { createControllers } = require("./controllers.cjs");

// --- added imports for vendors CSV upload
const multer = require("multer");
const csvToJson = require("csvtojson");
const upload = multer({ dest: "tmp/" });

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

  // Vendor / Requisition / PO / GRN models placeholders (will be initialised below if useMongo)
  let VendorModel = null;
  let memVendors = [];

  let RequisitionModel = null;
  let memRequisitions = [];

  let POModel = null;
  let memPOs = [];

  let GRNModel = null;
  let memGRNs = [];

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
        // optional stock map: { storeId: qty }
        stockByStore: { type: Map, of: Number, default: {} },
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

    // ------------------------
    // Vendors
    // ------------------------
    const vendorSchema = new Schema({
      code: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      vendorType: { type: String, default: '' },
      categories: { type: [String], default: [] },
      resorts: { type: [String], default: [] },
      contactPerson: String,
      phone: String,
      whatsapp: String,
      alternatePhone: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      gstNumber: String,
      panNumber: String,
      fssaiNumber: String,
      paymentTerms: String,
      creditLimit: { type: Number, default: 0 },
      paymentMode: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branch: String,
      deliveryTime: String,
      minOrderQty: { type: Number, default: 0 },
      status: { type: String, default: 'Active' },
      notes: String
    }, { timestamps: true });

    VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
    console.log('Vendor model initialised (Mongo)');

    // ------------------------
    // Requisition model
    // ------------------------
    const reqLineSchema = new Schema(
      {
        item: { type: String, required: true }, // item _id or code
        qty: { type: Number, required: true },
        remark: { type: String, default: "" },
      },
      { _id: false }
    );

    const requisitionSchema = new Schema(
      {
        requisitionNo: { type: String, required: true, unique: true },
        type: { type: String, enum: ["INTERNAL", "VENDOR"], required: true },

        resort: { type: String }, // Resort _id
        department: { type: String }, // Dept _id
        fromStore: { type: String }, // Store _id
        toStore: { type: String }, // Store _id
        vendor: { type: String }, // Vendor _id
        store: { type: String }, // For vendor requisition

        requiredBy: { type: Date },

        status: {
          type: String,
          enum: [
            "PENDING",
            "APPROVED",
            "ON_HOLD",
            "REJECTED",
            "PO_CREATED",
            "GRN_CREATED",
          ],
          default: "PENDING",
        },

        lines: [reqLineSchema],

        // --- Audit Fields ---
        createdBy: { type: String },
        approvedBy: { type: String },
        approvedAt: { type: Date },
        rejectedBy: { type: String },
        rejectionReason: { type: String },
      },
      { timestamps: true }
    );

    RequisitionModel =
      mongoose.models.Requisition ||
      mongoose.model("Requisition", requisitionSchema);

    console.log("Requisition model initialised (Mongo)");

    // ------------------------
    // PO model
    // ------------------------
    const poLineSchema = new Schema(
      {
        item: { type: String, required: true }, // item ID
        qty: { type: Number, required: true },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        remark: { type: String, default: "" },
      },
      { _id: false }
    );

    const poSchema = new Schema(
      {
        poNo: { type: String, required: true, unique: true },
        requisitionId: { type: String }, // link to requisition
        vendor: { type: String }, // vendor _id
        resort: { type: String }, // resort _id
        deliverTo: { type: String }, // store _id
        poDate: { type: Date, default: Date.now },

        items: [poLineSchema],

        subTotal: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, default: 0 },

        status: {
          type: String,
          enum: ["OPEN", "PARTIAL", "CLOSED"],
          default: "OPEN",
        },
      },
      { timestamps: true }
    );

    POModel = mongoose.models.PO || mongoose.model("PO", poSchema);
    console.log("PO model initialised (Mongo)");

    // ------------------------
    // GRN model
    // ------------------------
    const grnLineSchema = new Schema(
      {
        item: { type: String, required: true },
        receivedQty: { type: Number, required: true },
        pendingQty: { type: Number, default: 0 },
        remark: { type: String, default: "" },
      },
      { _id: false }
    );

    const grnSchema = new Schema(
      {
        grnNo: { type: String, required: true, unique: true },
       poId: { type: String, default: null },

        requisitionId: { type: String },
        vendor: { type: String },
        resort: { type: String },
        store: { type: String },
        grnDate: { type: Date, default: Date.now },

        items: [grnLineSchema],
      },
      { timestamps: true }
    );

    GRNModel = mongoose.models.GRN || mongoose.model("GRN", grnSchema);
    console.log("GRN model initialised (Mongo)");
  } else {
    console.warn(
      "Mongo DB not enabled; ItemCategory/Item/Store/Recipe/Vendor/Requisition/PO/GRN will use in-memory arrays (data lost on restart)."
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
  router.get("/dashboard/resort/:resortId/kpi", safe("getResortKpi"));

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
        return res.status(400).json({ message: "resort & name are required" });
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
        const updated = await StoreModel.findByIdAndUpdate(id, { $set: update }, { new: true });
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
        return res.status(400).json({ message: "name & code are required" });
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
          return res.status(404).json({ message: "Item category not found" });
        }
        return res.json(updated);
      }

      const idx = memItemCategories.findIndex((c) => c._id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Item category not found" });
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
          return res.status(404).json({ message: "Item category not found" });
        }
        return res.json({ ok: true });
      }

      const before = memItemCategories.length;
      memItemCategories = memItemCategories.filter((c) => c._id !== id);
      if (memItemCategories.length === before) {
        return res.status(404).json({ message: "Item category not found" });
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
        return res.status(400).json({ message: "name & code are required" });
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
        const updated = await ItemModel.findByIdAndUpdate(id, { $set: update }, { new: true });
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
        return res.status(400).json({ message: "code & name are required" });
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
      if (recipeCategoryId != null) update.recipeCategoryId = recipeCategoryId;
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

  // ------------------------
  // Vendors (full CRUD + CSV upload)
  // ------------------------

  // --- handlers ---
  const listVendorsHandler = async (req, res) => {
    try {
      if (VendorModel) {
        const docs = await VendorModel.find().lean();
        return res.json(docs);
      }
      return res.json(memVendors);
    } catch (err) {
      console.error("GET /api/vendors error", err);
      res.status(500).json({ message: "Failed to list vendors" });
    }
  };

  const createVendorHandler = async (req, res) => {
    try {
      const payload = req.body || {};
      // normalize categories/resorts (accept comma separated strings)
      if (payload.categories && typeof payload.categories === "string") {
        payload.categories = payload.categories.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (payload.resorts && typeof payload.resorts === "string") {
        payload.resorts = payload.resorts.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (!payload.code || !payload.name) {
        return res.status(400).json({ message: "code & name are required" });
      }
      if (VendorModel) {
        const doc = await VendorModel.create(payload);
        return res.status(201).json(doc);
      }
      const created = { _id: `ven_${Date.now()}`, ...payload };
      memVendors.push(created);
      return res.status(1).json(created);
    } catch (err) {
      console.error("POST /api/vendors error", err);
      res.status(500).json({ message: "Failed to create vendor", error: err.message });
    }
  };

  const updateVendorHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body || {};
      if (payload.categories && typeof payload.categories === "string") {
        payload.categories = payload.categories.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (payload.resorts && typeof payload.resorts === "string") {
        payload.resorts = payload.resorts.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (VendorModel) {
        const updated = await VendorModel.findByIdAndUpdate(id, { $set: payload }, { new: true });
        if (!updated) return res.status(404).json({ message: "Vendor not found" });
        return res.json(updated);
      }
      const idx = memVendors.findIndex((v) => v._id === id);
      if (idx === -1) return res.status(404).json({ message: "Vendor not found" });
      memVendors[idx] = { ...memVendors[idx], ...payload };
      return res.json(memVendors[idx]);
    } catch (err) {
      console.error("PUT /api/vendors/:id error", err);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  };

  const deleteVendorHandler = async (req, res) => {
    try {
      const { id } = req.params;
      if (VendorModel) {
        const deleted = await VendorModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Vendor not found" });
        return res.json({ ok: true });
      }
      const before = memVendors.length;
      memVendors = memVendors.filter((v) => v._id !== id);
      if (memVendors.length === before) return res.status(404).json({ message: "Vendor not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/vendors/:id error", err);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  };

  // CSV upload (multipart/form-data field name: file)
  const uploadVendorsCsvHandler = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const json = await csvToJson().fromFile(req.file.path);
      if (!Array.isArray(json) || json.length === 0) return res.status(400).json({ message: "CSV empty or invalid" });

      // Normalize rows to Vendor doc shape
      const docs = json.map((row) => {
        const categories = (row.categories || row.category || "").toString();
        const resorts = (row.resorts || "").toString();
        return {
          code: (row.code || row.Code || "").toString().trim(),
          name: (row.name || row.Name || "").toString().trim(),
          vendorType: row.vendorType || row.vendorType || "",
          categories: categories ? categories.split(",").map((s) => s.trim()).filter(Boolean) : [],
          resorts: resorts ? resorts.split(",").map((s) => s.trim()).filter(Boolean) : ["ALL"],
          contactPerson: row.contactPerson || "",
          phone: row.phone || "",
          whatsapp: row.whatsapp || "",
          alternatePhone: row.alternatePhone || "",
          email: row.email || "",
          addressLine1: row.addressLine1 || "",
          addressLine2: row.addressLine2 || "",
          city: row.city || "",
          state: row.state || "",
          pincode: row.pincode || "",
          country: row.country || "India",
          gstNumber: row.gstNumber || "",
          panNumber: row.panNumber || "",
          fssaiNumber: row.fssaiNumber || "",
          paymentTerms: row.paymentTerms || "",
          creditLimit: row.creditLimit ? Number(row.creditLimit) : 0,
          paymentMode: row.paymentMode || "",
          bankName: row.bankName || "",
          accountNumber: row.accountNumber || "",
          ifsc: row.ifsc || "",
          branch: row.branch || "",
          deliveryTime: row.deliveryTime || "",
          minOrderQty: row.minOrderQty ? Number(row.minOrderQty) : 0,
          status: row.status || "Active",
          notes: row.notes || ""
        };
      });

      if (VendorModel) {
        // Upsert by code to avoid duplicates
        const bulkOps = docs.map((d) => ({
          updateOne: {
            filter: { code: d.code },
            update: { $set: d },
            upsert: true,
          },
        }));
        const result = await VendorModel.bulkWrite(bulkOps);
        return res.json({ message: "Uploaded", result });
      }

      // in-memory insert
      docs.forEach((d) => {
        const created = { _id: `ven_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...d };
        memVendors.push(created);
      });
      return res.json({ message: "Uploaded in-memory", inserted: docs.length });
    } catch (err) {
      console.error("CSV upload vendors error", err);
      res.status(500).json({ message: "Failed to upload vendors", error: err.message });
    }
  };

  // --- register vendor routes (plain + /api paths)
  router.get("/vendors", listVendorsHandler);
  router.get("/api/vendors", listVendorsHandler);
  router.post("/api/vendors", createVendorHandler);
  router.put("/api/vendors/:id", updateVendorHandler);
  router.delete("/api/vendors/:id", deleteVendorHandler);

  // CSV upload endpoint
  router.post("/api/vendors/upload", upload.single("file"), uploadVendorsCsvHandler);

  // =======================================================
  // 🧾 REQUISITIONS (FULL CRUD + Approve + Reject + Hold)
  // =======================================================

  // Helper: Generate Requisition Number
  function makeReqNo() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    return `REQ-${y}${m}${day}-${rand}`;
  }

  // LIST
  router.get("/api/requisitions", async (req, res) => {
    try {
      if (RequisitionModel) {
        const docs = await RequisitionModel.find().lean();
        return res.json(docs);
      }
      return res.json(memRequisitions);
    } catch (err) {
      console.error("GET /api/requisitions", err);
      res.status(500).json({ message: "Failed to fetch requisitions" });
    }
  });

  // CREATE
  router.post("/api/requisitions", async (req, res) => {
    try {
      const data = req.body || {};
      const reqNo = makeReqNo();

      const payload = {
        requisitionNo: reqNo,
        type: data.type,
        resort: data.resort,
        department: data.department,
        fromStore: data.fromStore,
        toStore: data.toStore,
        vendor: data.vendor,
        store: data.store,
        requiredBy: data.requiredBy || null,
        status: "PENDING",
        lines: Array.isArray(data.lines) ? data.lines : [],
        createdBy: req.user?.id || "SYSTEM",
      };

      if (RequisitionModel) {
        const doc = await RequisitionModel.create(payload);
        return res.status(201).json(doc);
      }

      const created = { _id: `req_${Date.now()}`, ...payload };
      memRequisitions.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/requisitions", err);
      res.status(500).json({ message: "Failed to create requisition" });
    }
  });

  // UPDATE
  router.put("/api/requisitions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body || {};

      const update = {
        type: data.type,
        resort: data.resort,
        department: data.department,
        fromStore: data.fromStore,
        toStore: data.toStore,
        vendor: data.vendor,
        store: data.store,
        requiredBy: data.requiredBy || null,
        lines: data.lines || [],
        updatedAt: new Date(),
      };

      if (RequisitionModel) {
        const updated = await RequisitionModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Requisition not found" });
        return res.json(updated);
      }

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ message: "Requisition not found" });

      memRequisitions[idx] = { ...memRequisitions[idx], ...update };
      return res.json(memRequisitions[idx]);
    } catch (err) {
      console.error("PUT /api/requisitions/:id", err);
      res.status(500).json({ message: "Failed to update requisition" });
    }
  });

  // DELETE
  router.delete("/api/requisitions/:id", async (req, res) => {
    try {
      const id = req.params.id;

      if (RequisitionModel) {
        const deleted = await RequisitionModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Requisition not found" });
        return res.json({ ok: true });
      }

      const before = memRequisitions.length;
      memRequisitions = memRequisitions.filter((r) => r._id !== id);
      if (memRequisitions.length === before) return res.status(404).json({ message: "Requisition not found" });

      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/requisitions/:id", err);
      res.status(500).json({ message: "Failed to delete requisition" });
    }
  });

  // APPROVE
  router.post("/api/requisitions/:id/approve", async (req, res) => {
    try {
      const id = req.params.id;

      const update = {
        status: "APPROVED",
        approvedBy: req.user?.id || "SYSTEM",
        approvedAt: new Date(),
      };

      if (RequisitionModel) {
        const updated = await RequisitionModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Requisition not found" });
        return res.json(updated);
      }

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ message: "Requisition not found" });

      memRequisitions[idx] = { ...memRequisitions[idx], ...update };
      return res.json(memRequisitions[idx]);
    } catch (err) {
      console.error("APPROVE requisition error", err);
      res.status(500).json({ message: "Failed to approve requisition" });
    }
  });

  // HOLD
  router.post("/api/requisitions/:id/hold", async (req, res) => {
    try {
      const id = req.params.id;

      const update = { status: "ON_HOLD" };

      if (RequisitionModel) {
        const updated = await RequisitionModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Requisition not found" });
        return res.json(updated);
      }

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ message: "Requisition not found" });

      memRequisitions[idx] = { ...memRequisitions[idx], ...update };
      return res.json(memRequisitions[idx]);
    } catch (err) {
      console.error("HOLD requisition error", err);
      res.status(500).json({ message: "Failed to hold requisition" });
    }
  });

  // REJECT
  router.post("/api/requisitions/:id/reject", async (req, res) => {
    try {
      const id = req.params.id;
      const reason = req.body.reason || "";

      const update = {
        status: "REJECTED",
        rejectedBy: req.user?.id || "SYSTEM",
        rejectionReason: reason,
      };

      if (RequisitionModel) {
        const updated = await RequisitionModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Requisition not found" });
        return res.json(updated);
      }

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ message: "Requisition not found" });

      memRequisitions[idx] = { ...memRequisitions[idx], ...update };
      return res.json(memRequisitions[idx]);
    } catch (err) {
      console.error("REJECT requisition error", err);
      res.status(500).json({ message: "Failed to reject requisition" });
    }
  });

  // =======================================================
// 🛒 CREATE PO FROM REQUISITION
// =======================================================
router.post("/api/requisitions/:id/create-po", async (req, res) => {
  try {
    const id = req.params.id;

    // 1️⃣ Find requisition
    let reqDoc = null;
    if (RequisitionModel) {
      reqDoc = await RequisitionModel.findById(id).lean();
    } else {
      reqDoc = memRequisitions.find((r) => r._id === id);
    }

    if (!reqDoc) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (reqDoc.type !== "VENDOR") {
      return res.status(400).json({ message: "Only vendor requisition can create PO" });
    }

    if (reqDoc.status !== "APPROVED") {
      return res.status(400).json({ message: "Requisition not approved" });
    }

    // 2️⃣ Create PO
    const poNo = makePoNo();

    const poPayload = {
      poNo,
      requisitionId: id,
      vendor: reqDoc.vendor,
      resort: reqDoc.resort,
      deliverTo: reqDoc.store || reqDoc.toStore,
      poDate: new Date(),
      items: (reqDoc.lines || []).map((l) => ({
        item: l.item,
        qty: l.qty,
        rate: 0,
        amount: 0,
        remark: l.remark || "",
      })),
      subTotal: 0,
      taxPercent: 0,
      taxAmount: 0,
      total: 0,
      status: "OPEN",
    };

    let poDoc = null;

    if (POModel) {
      poDoc = await POModel.create(poPayload);

      // 3️⃣ Update requisition status
      await RequisitionModel.findByIdAndUpdate(id, {
        $set: { status: "PO_CREATED" },
      });
    } else {
      poDoc = { _id: `po_${Date.now()}`, ...poPayload };
      memPOs.push(poDoc);

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx !== -1) memRequisitions[idx].status = "PO_CREATED";
    }

    return res.status(201).json({
      message: "PO created successfully",
      po: poDoc,
    });
  } catch (err) {
    console.error("CREATE PO FROM REQUISITION error", err);
    res.status(500).json({ message: "Failed to create PO", error: err.message });
  }
});

// ==================================================
// 📦 CREATE GRN FROM REQUISITION (FINAL & CLEAN)
// ==================================================
router.post("/api/requisitions/:id/create-grn", async (req, res) => {
  try {
    const id = req.params.id;

    // 1️⃣ Find requisition
    let reqDoc;
    if (RequisitionModel) {
      reqDoc = await RequisitionModel.findById(id);
    } else {
      reqDoc = memRequisitions.find((r) => r._id === id);
    }

    if (!reqDoc) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    // 2️⃣ Validation
    if (reqDoc.po && !reqDoc.allowDirectGrn) {
      return res.status(400).json({
        message: "GRN must be created from PO, not requisition",
      });
    }

    // 3️⃣ Build GRN payload (🔥 frontend list depends on these fields)
    const grnPayload = {
      grnNo: req.body.grnNo || makeGrnNo(),

      requisitionId: id,          // 🔥 REQUIRED
      poId: reqDoc.po || null,    // 🔥 REQUIRED (null allowed)

      vendor: reqDoc.vendor || null,
      resort: reqDoc.resort || null,   // 🔥 REQUIRED FOR RESORT FILTER
      store: req.body.store || reqDoc.store || null,

      grnDate: req.body.grnDate || new Date(),

      items: Array.isArray(req.body.items)
        ? req.body.items.map((it) => ({
            item: it.item,
            receivedQty: Number(it.receivedQty || 0),
            pendingQty: 0,
            remark: it.remark || "",
          }))
        : [],
    };

    // 4️⃣ Save GRN
    let grnDoc;
    if (GRNModel) {
      grnDoc = await GRNModel.create(grnPayload);

      // 5️⃣ Update requisition status + reference
      await RequisitionModel.findByIdAndUpdate(id, {
        $set: {
          status: "GRN_CREATED",
          grn: grnDoc._id,
        },
      });
    } else {
      grnDoc = { _id: `grn_${Date.now()}`, ...grnPayload };
      memGRNs.push(grnDoc);

      const idx = memRequisitions.findIndex((r) => r._id === id);
      if (idx !== -1) {
        memRequisitions[idx].status = "GRN_CREATED";
        memRequisitions[idx].grn = grnDoc._id;
      }
    }

    // 6️⃣ Response
    return res.status(201).json(grnDoc);
  } catch (err) {
    console.error("CREATE GRN ERROR", err);
    return res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
});



  // =======================================================
  // 📑 PURCHASE ORDERS (PO) — Full CRUD + Link to Requisition
  // =======================================================

  // Helper for PO number
  function makePoNo() {
    const d = new Date();
    return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  }

  // LIST POs
  router.get("/api/po", async (req, res) => {
    try {
      if (POModel) {
        const docs = await POModel.find().lean();
        return res.json(docs);
      }
      return res.json(memPOs);
    } catch (err) {
      console.error("GET /api/po", err);
      res.status(500).json({ message: "Failed to fetch POs" });
    }
  });

  // CREATE PO (including from requisition)
  router.post("/api/po", async (req, res) => {
    try {
      const data = req.body || {};
      const poNo = data.poNo || makePoNo();

      const payload = {
        poNo,
        requisitionId: data.requisitionId || data.requisition || null,
        vendor: data.vendor,
        resort: data.resort,
        deliverTo: data.deliverTo,
        poDate: data.poDate || new Date(),
        items: Array.isArray(data.items) ? data.items : [],
        subTotal: Number(data.subTotal || 0),
        taxPercent: Number(data.taxPercent || 0),
        taxAmount: Number(data.taxAmount || 0),
        total: Number(data.total || 0),
      };

      // MONGO
      if (POModel) {
        const doc = await POModel.create(payload);

        // update requisition status → PO_CREATED
        if (payload.requisitionId && RequisitionModel) {
          await RequisitionModel.findByIdAndUpdate(payload.requisitionId, {
            $set: { status: "PO_CREATED" },
          });
        }

        return res.status(201).json(doc);
      }

      // IN-MEMORY
      const created = { _id: `po_${Date.now()}`, ...payload };
      memPOs.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/po", err);
      res.status(500).json({ message: "Failed to create PO" });
    }
  });

  // UPDATE PO
  router.put("/api/po/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const update = { ...req.body, updatedAt: new Date() };

      if (POModel) {
        const updated = await POModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "PO not found" });
        return res.json(updated);
      }

      const idx = memPOs.findIndex((p) => p._id === id);
      if (idx === -1) return res.status(404).json({ message: "PO not found" });

      memPOs[idx] = { ...memPOs[idx], ...update };
      return res.json(memPOs[idx]);
    } catch (err) {
      console.error("PUT /api/po/:id", err);
      res.status(500).json({ message: "Failed to update PO" });
    }
  });

  // DELETE PO
  router.delete("/api/po/:id", async (req, res) => {
    try {
      const id = req.params.id;

      if (POModel) {
        const deleted = await POModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "PO not found" });
        return res.json({ ok: true });
      }

      const before = memPOs.length;
      memPOs = memPOs.filter((p) => p._id !== id);
      if (memPOs.length === before) return res.status(404).json({ message: "PO not found" });

      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/po/:id", err);
      res.status(500).json({ message: "Failed to delete PO" });
    }
  });

  // =======================================================
  // 📦 GRN (Goods Received Note) — Full CRUD + Auto PO Update
  // =======================================================

  // ================================
// GRN ROUTES
// ================================

function makeGrnNo() {
  const d = new Date();
  return `GRN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
}

// --------------------------------
// LIST GRN
// --------------------------------
router.get("/api/grn", async (req, res) => {
  try {
    if (GRNModel) {
      const docs = await GRNModel.find().lean();
      return res.json(docs);
    }
    return res.json(memGRNs);
  } catch (err) {
    console.error("GET /api/grn", err);
    res.status(500).json({ message: "Failed to fetch GRNs" });
  }
});

// --------------------------------
// CREATE GRN
// Supports:
// - Requisition → GRN (poId OPTIONAL)
// - PO → GRN
// --------------------------------
// ❌ DISABLED ROUTE (safe to keep, but cleaned)
if (false) {
  router.post("/api/grn", async (req, res) => {
    try {
      const data = req.body || {};
      const grnNo = data.grnNo || makeGrnNo();

      if (!Array.isArray(data.items) || data.items.length === 0) {
        return res.status(400).json({ message: "items required" });
      }

      // ✅ CLEAN PAYLOAD (NO poId)
      const payload = {
        grnNo,
        requisitionId: data.requisitionId || null,
        vendor: data.vendor || null,
        resort: data.resort || null,
        store: data.store || null,
        grnDate: data.grnDate || new Date(),
        items: data.items.map((it) => ({
          item: it.item,
          qtyReceived: Number(it.qtyReceived || 0),
          pendingQty: 0,
          remark: it.remark || "",
        })),
      };

      // --------------------------
      // CREATE GRN
      // --------------------------
      let doc;
      if (GRNModel) {
        doc = await GRNModel.create(payload);
      } else {
        doc = { _id: `grn_${Date.now()}`, ...payload };
        memGRNs.push(doc);
      }

      // --------------------------
      // UPDATE REQUISITION STATUS
      // --------------------------
      if (data.requisitionId && RequisitionModel) {
        await RequisitionModel.findByIdAndUpdate(data.requisitionId, {
          $set: {
            status: "GRN_CREATED",
            grn: doc._id,
          },
        });
      }

      return res.status(201).json(doc);
    } catch (err) {
      console.error("POST /api/grn", err);
      return res.status(500).json({
        message: "Failed to create GRN",
        error: err.message,
      });
    }
  });
}

// --------------------------------
// DELETE GRN
// --------------------------------
router.delete("/api/grn/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (GRNModel) {
      const deleted = await GRNModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: "GRN not found" });
      return res.json({ ok: true });
    }

    const before = memGRNs.length;
    memGRNs = memGRNs.filter((g) => g._id !== id);
    if (memGRNs.length === before)
      return res.status(404).json({ message: "GRN not found" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/grn/:id", err);
    res.status(500).json({ message: "Failed to delete GRN" });
  }
});

  // ------------------------
  // other endpoints can go here...
  // ------------------------

  return router;
}

module.exports = { createRouter };
