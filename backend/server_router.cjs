// backend/server_router.cjs
// Consolidated router with Requisition, PO, GRN, Vendors(csv), Items, Stores, ItemCategories, Recipes, etc.
// CommonJS style — to be used with your existing server.cjs that calls createRouter({ useMongo, mongoose })

const express = require("express");
const { createControllers } = require("./controllers.cjs");
const multer = require("multer");
const csvToJson = require("csvtojson");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: "tmp/" });

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers ? createControllers({ useMongo, mongoose }) : {};

  // ------------------------
  // Helpers
  // ------------------------

  const safe = (name) => {
    const fn = controllers[name];
    if (typeof fn === "function") return fn;
    console.warn(`controllers.${name} not implemented; route will return 501`);
    return (req, res) => {
      res.status(501).json({ message: `Not implemented on this server: ${name}` });
    };
  };

  // In-memory containers and model placeholders
  let ItemCategoryModel = null;
  let ItemModel = null;
  let StoreModel = null;
  let RecipeModel = null;
  let VendorModel = null;
  let RequisitionModel = null;
  let POModel = null;
  let GRNModel = null;

  let memItemCategories = [];
  let memItems = [];
  let memStores = [];
  let memRecipes = [];
  let memVendors = [];
  let memRequisitions = [];
  let memPOs = [];
  let memGRNs = [];

  if (useMongo && mongoose) {
    const { Schema } = mongoose;

    // ItemCategory
    const itemCategorySchema = new Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        departmentCategory: { type: String, default: "" },
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
        stockByStore: { type: Map, of: Number, default: {} },
      },
      { timestamps: true }
    );

    // Store
    const storeSchema = new Schema(
      {
        resort: { type: String, required: true },
        name: { type: String, required: true },
        code: { type: String, default: "" },
      },
      { timestamps: true }
    );

    // Recipe
    const recipeLineSchema = new Schema(
      {
        itemId: { type: String, required: true },
        qty: { type: Number, required: true },
        itemCategory: { type: String, default: "" },
      },
      { _id: false }
    );
    const recipeSchema = new Schema(
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        recipeCategoryId: { type: String, default: "" },
        type: { type: String, default: "" },
        yieldQty: { type: Number },
        yieldUom: { type: String, default: "" },
        lines: { type: [recipeLineSchema], default: [] },
      },
      { timestamps: true }
    );

    ItemCategoryModel = mongoose.models.ItemCategory || mongoose.model("ItemCategory", itemCategorySchema);
    ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);
    StoreModel = mongoose.models.Store || mongoose.model("Store", storeSchema);
    RecipeModel = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);

    // Vendor
    const vendorSchema = new Schema(
      {
        code: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        vendorType: { type: String, default: "" },
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
        status: { type: String, default: "Active" },
        notes: String,
      },
      { timestamps: true }
    );
    VendorModel = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

    // Requisition
    const reqLineSchema = new Schema(
      {
        item: { type: String, required: true },
        qty: { type: Number, required: true },
        remark: { type: String, default: "" },
      },
      { _id: false }
    );
    const requisitionSchema = new Schema(
      {
        requisitionNo: { type: String, required: true, unique: true },
        type: { type: String, enum: ["INTERNAL", "VENDOR"], required: true },
        resort: { type: String },
        department: { type: String },
        fromStore: { type: String },
        toStore: { type: String },
        vendor: { type: String },
        store: { type: String },
        requiredBy: { type: Date },
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "ON_HOLD", "REJECTED", "PO_CREATED", "GRN_CREATED"],
          default: "PENDING",
        },
        lines: [reqLineSchema],
        createdBy: { type: String },
        approvedBy: { type: String },
        approvedAt: { type: Date },
        rejectedBy: { type: String },
        rejectionReason: { type: String },
      },
      { timestamps: true }
    );
    RequisitionModel = mongoose.models.Requisition || mongoose.model("Requisition", requisitionSchema);

    // PO
    const poLineSchema = new Schema(
      {
        item: { type: String, required: true },
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
        requisitionId: { type: String },
        vendor: { type: String },
        resort: { type: String },
        deliverTo: { type: String },
        poDate: { type: Date, default: Date.now },
        items: [poLineSchema],
        subTotal: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        status: { type: String, enum: ["OPEN", "PARTIAL", "CLOSED"], default: "OPEN" },
      },
      { timestamps: true }
    );
    POModel = mongoose.models.PO || mongoose.model("PO", poSchema);

    // GRN
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
        poId: { type: String, required: true },
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
  } else {
    console.warn("Mongo DB not enabled; using in-memory stores for many resources (data lost on restart).");
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
        req.user = { id: demo, name: "Demo User", role: "RESORT_USER", resorts: [] };
      }
    }
    next();
  });

  // ------------------------
  // Auth & dashboard placeholders
  // ------------------------
  router.post("/api/auth/login", safe("login"));
  router.get("/dashboard/resort/:resortId/kpi", safe("getResortKpi"));

  // Resorts / Departments via controllers (kept safe wrapper)
  router.get("/resorts", safe("listResorts"));
  router.get("/api/resorts", safe("listResorts"));
  router.post("/api/resorts", safe("createResort"));
  router.put("/api/resorts/:id", safe("updateResort"));
  router.delete("/api/resorts/:id", safe("deleteResort"));

  router.get("/departments", safe("listDepartments"));
  router.get("/api/departments", safe("listDepartments"));
  router.post("/api/departments", safe("createDepartment"));
  router.put("/api/departments/:id", safe("updateDepartment"));
  router.delete("/api/departments/:id", safe("deleteDepartment"));

  // =======================================================
  // STORES (FULL CRUD)
  // =======================================================
  const listStoresHandler = async (req, res) => {
    try {
      // support optional filtering by resort query ?resort=<id>
      const qResort = req.query.resort || req.query.resortId;
      if (StoreModel) {
        const q = qResort ? { resort: qResort } : {};
        const docs = await StoreModel.find(q).sort({ resort: 1, name: 1 }).lean();
        return res.json(docs);
      }
      const list = qResort ? memStores.filter((s) => s.resort === qResort) : memStores;
      return res.json(list);
    } catch (err) {
      console.error("GET /api/stores error:", err);
      res.status(500).json({ message: "Failed to list stores" });
    }
  };

  const getStoreHandler = async (req, res) => {
    try {
      const id = req.params.id;
      if (StoreModel) {
        const doc = await StoreModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "Store not found" });
        return res.json(doc);
      }
      const found = memStores.find((s) => s._id === id);
      if (!found) return res.status(404).json({ message: "Store not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/stores/:id error:", err);
      res.status(500).json({ message: "Failed to fetch store" });
    }
  };

  const createStoreHandler = async (req, res) => {
    try {
      const { resort, name, code } = req.body || {};
      if (!resort || !name) return res.status(400).json({ message: "resort & name are required" });
      if (StoreModel) {
        const doc = await StoreModel.create({ resort, name, code: code || "" });
        return res.status(201).json(doc);
      }
      const created = { _id: `store_${Date.now()}`, resort, name, code: code || "" };
      memStores.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/stores error:", err);
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
        if (!updated) return res.status(404).json({ message: "Store not found" });
        return res.json(updated);
      }
      const idx = memStores.findIndex((s) => s._id === id);
      if (idx === -1) return res.status(404).json({ message: "Store not found" });
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
        if (!deleted) return res.status(404).json({ message: "Store not found" });
        return res.json({ ok: true });
      }
      const before = memStores.length;
      memStores = memStores.filter((s) => s._id !== id);
      if (memStores.length === before) return res.status(404).json({ message: "Store not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/stores/:id error", err);
      res.status(500).json({ message: "Failed to delete store" });
    }
  };

  router.get("/stores", listStoresHandler);
  router.get("/api/stores", listStoresHandler);
  router.get("/api/stores/:id", getStoreHandler);
  router.post("/api/stores", createStoreHandler);
  router.put("/api/stores/:id", updateStoreHandler);
  router.delete("/api/stores/:id", deleteStoreHandler);

  // =======================================================
  // ITEM CATEGORIES
  // =======================================================
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

  router.post("/api/item-categories", async (req, res) => {
    try {
      const { name, code, departmentCategory } = req.body || {};
      if (!name || !code) return res.status(400).json({ message: "name & code are required" });
      if (ItemCategoryModel) {
        const doc = await ItemCategoryModel.create({ name, code, departmentCategory: departmentCategory || "" });
        return res.status(201).json(doc);
      }
      const created = { _id: `ic_${Date.now()}`, name, code, departmentCategory: departmentCategory || "" };
      memItemCategories.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/item-categories error", err);
      res.status(500).json({ message: "Failed to create item category" });
    }
  });

  router.put("/api/item-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, departmentCategory } = req.body || {};
      if (ItemCategoryModel) {
        const updated = await ItemCategoryModel.findByIdAndUpdate(id, { $set: { ...(name != null ? { name } : {}), ...(code != null ? { code } : {}), ...(departmentCategory != null ? { departmentCategory } : {}) } }, { new: true });
        if (!updated) return res.status(404).json({ message: "Item category not found" });
        return res.json(updated);
      }
      const idx = memItemCategories.findIndex((c) => c._id === id);
      if (idx === -1) return res.status(404).json({ message: "Item category not found" });
      memItemCategories[idx] = { ...memItemCategories[idx], ...(name != null ? { name } : {}), ...(code != null ? { code } : {}), ...(departmentCategory != null ? { departmentCategory } : {}) };
      return res.json(memItemCategories[idx]);
    } catch (err) {
      console.error("PUT /api/item-categories/:id error", err);
      res.status(500).json({ message: "Failed to update item category" });
    }
  });

  router.delete("/api/item-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (ItemCategoryModel) {
        const deleted = await ItemCategoryModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Item category not found" });
        return res.json({ ok: true });
      }
      const before = memItemCategories.length;
      memItemCategories = memItemCategories.filter((c) => c._id !== id);
      if (memItemCategories.length === before) return res.status(404).json({ message: "Item category not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/item-categories/:id error", err);
      res.status(500).json({ message: "Failed to delete item category" });
    }
  });

  // =======================================================
  // ITEMS
  // =======================================================
  const listItemsHandler = async (req, res) => {
    try {
      const qResort = req.query.resort;
      if (ItemModel) {
        const q = {};
        // optional filtering by category or resort could be added here
        const docs = await ItemModel.find(q).lean();
        return res.json(docs);
      }
      return res.json(memItems);
    } catch (err) {
      console.error("GET /api/items error", err);
      res.status(500).json({ message: "Failed to list items" });
    }
  };

  const getItemHandler = async (req, res) => {
    try {
      const { id } = req.params;
      if (ItemModel) {
        const doc = await ItemModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "Item not found" });
        return res.json(doc);
      }
      const found = memItems.find((i) => i._id === id);
      if (!found) return res.status(404).json({ message: "Item not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/items/:id error", err);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  };

  const createItemHandler = async (req, res) => {
    try {
      const { name, code, itemCategory, uom, brand, indicativePrice } = req.body || {};
      if (!name || !code) return res.status(400).json({ message: "name & code are required" });
      const common = { name, code, itemCategory: itemCategory || "", uom: uom || "", brand: brand || "", indicativePrice: indicativePrice === "" || indicativePrice == null ? undefined : Number(indicativePrice) };
      if (ItemModel) {
        const doc = await ItemModel.create(common);
        return res.status(201).json(doc);
      }
      const created = { _id: `it_${Date.now()}`, ...common };
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
      const { name, code, itemCategory, uom, brand, indicativePrice } = req.body || {};
      const update = {};
      if (name != null) update.name = name;
      if (code != null) update.code = code;
      if (itemCategory != null) update.itemCategory = itemCategory;
      if (uom != null) update.uom = uom;
      if (brand != null) update.brand = brand;
      if (indicativePrice != null && indicativePrice !== "") update.indicativePrice = Number(indicativePrice);
      if (ItemModel) {
        const updated = await ItemModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Item not found" });
        return res.json(updated);
      }
      const idx = memItems.findIndex((i) => i._id === id);
      if (idx === -1) return res.status(404).json({ message: "Item not found" });
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
        if (!deleted) return res.status(404).json({ message: "Item not found" });
        return res.json({ ok: true });
      }
      const before = memItems.length;
      memItems = memItems.filter((i) => i._id !== id);
      if (memItems.length === before) return res.status(404).json({ message: "Item not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/items/:id error", err);
      res.status(500).json({ message: "Failed to delete item" });
    }
  };

  router.get("/items", listItemsHandler);
  router.get("/api/items", listItemsHandler);
  router.get("/api/items/:id", getItemHandler);
  router.post("/api/items", createItemHandler);
  router.put("/api/items/:id", updateItemHandler);
  router.delete("/api/items/:id", deleteItemHandler);

  // =======================================================
  // RECIPES
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

  const getRecipeHandler = async (req, res) => {
    try {
      const { id } = req.params;
      if (RecipeModel) {
        const doc = await RecipeModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "Recipe not found" });
        return res.json(doc);
      }
      const found = memRecipes.find((r) => r._id === id);
      if (!found) return res.status(404).json({ message: "Recipe not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/recipes/:id error", err);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  };

  const createRecipeHandler = async (req, res) => {
    try {
      const { code, name, recipeCategoryId, type, yieldQty, yieldUom, lines } = req.body || {};
      if (!code || !name) return res.status(400).json({ message: "code & name are required" });
      const normLines = Array.isArray(lines) ? lines.filter((ln) => ln && ln.itemId && ln.qty != null).map((ln) => ({ itemId: String(ln.itemId), qty: Number(ln.qty), itemCategory: ln.itemCategory != null ? String(ln.itemCategory) : "" })) : [];
      const common = { code, name, recipeCategoryId: recipeCategoryId || "", type: type || "", yieldQty: yieldQty === "" || yieldQty == null ? undefined : Number(yieldQty), yieldUom: yieldUom || "", lines: normLines };
      if (RecipeModel) {
        const doc = await RecipeModel.create(common);
        return res.status(201).json(doc);
      }
      const created = { _id: `rcp_${Date.now()}`, ...common };
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
      const { code, name, recipeCategoryId, type, yieldQty, yieldUom, lines } = req.body || {};
      const update = {};
      if (code != null) update.code = code;
      if (name != null) update.name = name;
      if (recipeCategoryId != null) update.recipeCategoryId = recipeCategoryId;
      if (type != null) update.type = type;
      if (yieldQty !== undefined) update.yieldQty = yieldQty === "" || yieldQty == null ? undefined : Number(yieldQty);
      if (yieldUom != null) update.yieldUom = yieldUom;
      if (lines !== undefined) {
        update.lines = Array.isArray(lines) ? lines.filter((ln) => ln && ln.itemId && ln.qty != null).map((ln) => ({ itemId: String(ln.itemId), qty: Number(ln.qty), itemCategory: ln.itemCategory != null ? String(ln.itemCategory) : "" })) : [];
      }
      if (RecipeModel) {
        const updated = await RecipeModel.findByIdAndUpdate(id, { $set: update }, { new: true });
        if (!updated) return res.status(404).json({ message: "Recipe not found" });
        return res.json(updated);
      }
      const idx = memRecipes.findIndex((r) => r._id === id);
      if (idx === -1) return res.status(404).json({ message: "Recipe not found" });
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
        if (!deleted) return res.status(404).json({ message: "Recipe not found" });
        return res.json({ ok: true });
      }
      const before = memRecipes.length;
      memRecipes = memRecipes.filter((r) => r._id !== id);
      if (memRecipes.length === before) return res.status(404).json({ message: "Recipe not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/recipes/:id error", err);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  };

  router.get("/recipes", listRecipesHandler);
  router.get("/api/recipes", listRecipesHandler);
  router.get("/api/recipes/:id", getRecipeHandler);
  router.post("/api/recipes", createRecipeHandler);
  router.put("/api/recipes/:id", updateRecipeHandler);
  router.delete("/api/recipes/:id", deleteRecipeHandler);

  // Roles/Users (demo)
  router.get("/roles", safe("listRoles"));
  router.get("/users", safe("listUsers"));

  // =======================================================
  // VENDORS (full CRUD + CSV upload)
  // =======================================================
  const listVendorsHandler = async (req, res) => {
    try {
      const qResort = req.query.resort;
      if (VendorModel) {
        const q = {};
        if (qResort) q.resorts = qResort;
        const docs = await VendorModel.find(q).lean();
        return res.json(docs);
      }
      const list = qResort ? memVendors.filter((v) => (v.resorts || []).includes(qResort)) : memVendors;
      return res.json(list);
    } catch (err) {
      console.error("GET /api/vendors error", err);
      res.status(500).json({ message: "Failed to list vendors" });
    }
  };

  const getVendorHandler = async (req, res) => {
    try {
      const { id } = req.params;
      if (VendorModel) {
        // allow lookup by id or code (if not ObjectId)
        let doc = null;
        if (mongoose && mongoose.Types.ObjectId.isValid(id)) {
          doc = await VendorModel.findById(id).lean();
        }
        if (!doc) {
          doc = await VendorModel.findOne({ code: id.toUpperCase() }).lean();
        }
        if (!doc) return res.status(404).json({ message: "Vendor not found" });
        return res.json(doc);
      }
      const found = memVendors.find((v) => v._id === id || String(v.code).toUpperCase() === String(id).toUpperCase());
      if (!found) return res.status(404).json({ message: "Vendor not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/vendors/:id error", err);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  };

  const createVendorHandler = async (req, res) => {
    try {
      const payload = req.body || {};
      // normalize
      if (payload.code) payload.code = String(payload.code).toUpperCase().trim();
      if (payload.categories && typeof payload.categories === "string") payload.categories = payload.categories.split(",").map((s) => s.trim()).filter(Boolean);
      if (payload.resorts && typeof payload.resorts === "string") payload.resorts = payload.resorts.split(",").map((s) => s.trim()).filter(Boolean);
      if (!payload.code || !payload.name) return res.status(400).json({ message: "code & name are required" });
      if (VendorModel) {
        const doc = await VendorModel.create(payload);
        return res.status(201).json(doc);
      }
      const created = { _id: `ven_${Date.now()}`, ...payload };
      memVendors.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/vendors error", err);
      if (err.code === 11000) return res.status(400).json({ message: "Vendor code already exists" });
      res.status(500).json({ message: "Failed to create vendor", error: err.message });
    }
  };

  const updateVendorHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body || {};
      if (payload.code) payload.code = String(payload.code).toUpperCase().trim();
      if (payload.categories && typeof payload.categories === "string") payload.categories = payload.categories.split(",").map((s) => s.trim()).filter(Boolean);
      if (payload.resorts && typeof payload.resorts === "string") payload.resorts = payload.resorts.split(",").map((s) => s.trim()).filter(Boolean);
      if (VendorModel) {
        const updated = await VendorModel.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: "Vendor not found" });
        return res.json(updated);
      }
      const idx = memVendors.findIndex((v) => v._id === id);
      if (idx === -1) return res.status(404).json({ message: "Vendor not found" });
      memVendors[idx] = { ...memVendors[idx], ...payload };
      return res.json(memVendors[idx]);
    } catch (err) {
      console.error("PUT /api/vendors/:id error", err);
      if (err.code === 11000) return res.status(400).json({ message: "Vendor code already exists" });
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

  const uploadVendorsCsvHandler = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const filePath = req.file.path;
      let json = [];
      try {
        json = await csvToJson().fromFile(filePath);
      } finally {
        // cleanup temp file always
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore
        }
      }
      if (!Array.isArray(json) || json.length === 0) return res.status(400).json({ message: "CSV empty or invalid" });

      const docs = json.map((row) => {
        const categories = (row.categories || row.category || "").toString();
        const resorts = (row.resorts || "").toString();
        const codeVal = (row.code || row.Code || "").toString().trim();
        return {
          code: codeVal ? String(codeVal).toUpperCase() : "",
          name: (row.name || row.Name || "").toString().trim(),
          vendorType: row.vendorType || row.vendortype || "",
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
          notes: row.notes || "",
        };
      });

      if (VendorModel) {
        // Upsert by code
        const bulkOps = docs
          .filter((d) => d.code)
          .map((d) => ({
            updateOne: { filter: { code: d.code }, update: { $set: d }, upsert: true },
          }));
        if (bulkOps.length === 0) return res.status(400).json({ message: "No valid rows with code found" });
        const result = await VendorModel.bulkWrite(bulkOps);
        return res.json({ message: "Uploaded", result });
      }

      // in-memory
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

  router.get("/vendors", listVendorsHandler);
  router.get("/api/vendors", listVendorsHandler);
  router.get("/api/vendors/:id", getVendorHandler);
  router.post("/api/vendors", createVendorHandler);
  router.put("/api/vendors/:id", updateVendorHandler);
  router.delete("/api/vendors/:id", deleteVendorHandler);
  router.post("/api/vendors/upload", upload.single("file"), uploadVendorsCsvHandler);

  // =======================================================
  // REQUISITIONS (full CRUD + approve/hold/reject)
  // =======================================================
  function makeReqNo() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    return `REQ-${y}${m}${day}-${rand}`;
  }

  router.get("/api/requisitions", async (req, res) => {
    try {
      if (RequisitionModel) {
        const docs = await RequisitionModel.find().sort({ createdAt: -1 }).lean();
        return res.json(docs);
      }
      return res.json(memRequisitions);
    } catch (err) {
      console.error("GET /api/requisitions", err);
      res.status(500).json({ message: "Failed to fetch requisitions" });
    }
  });

  router.get("/api/requisitions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (RequisitionModel) {
        const doc = await RequisitionModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "Requisition not found" });
        return res.json(doc);
      }
      const found = memRequisitions.find((r) => r._id === id);
      if (!found) return res.status(404).json({ message: "Requisition not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/requisitions/:id", err);
      res.status(500).json({ message: "Failed to fetch requisition" });
    }
  });

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

  router.post("/api/requisitions/:id/approve", async (req, res) => {
    try {
      const id = req.params.id;
      const update = { status: "APPROVED", approvedBy: req.user?.id || "SYSTEM", approvedAt: new Date() };
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

  router.post("/api/requisitions/:id/reject", async (req, res) => {
    try {
      const id = req.params.id;
      const reason = req.body.reason || "";
      const update = { status: "REJECTED", rejectedBy: req.user?.id || "SYSTEM", rejectionReason: reason };
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
  // PURCHASE ORDERS (PO)
  // =======================================================
  function makePoNo() {
    const d = new Date();
    return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
  }

  router.get("/api/po", async (req, res) => {
    try {
      const qResort = req.query.resort;
      if (POModel) {
        const q = {};
        if (qResort) q.resort = qResort;
        const docs = await POModel.find(q).sort({ createdAt: -1 }).lean();
        return res.json(docs);
      }
      return res.json(memPOs);
    } catch (err) {
      console.error("GET /api/po", err);
      res.status(500).json({ message: "Failed to fetch POs" });
    }
  });

  router.get("/api/po/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (POModel) {
        const doc = await POModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "PO not found" });
        return res.json(doc);
      }
      const found = memPOs.find((p) => p._id === id);
      if (!found) return res.status(404).json({ message: "PO not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/po/:id", err);
      res.status(500).json({ message: "Failed to fetch PO" });
    }
  });

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
      if (POModel) {
        const doc = await POModel.create(payload);
        if (payload.requisitionId && RequisitionModel) {
          await RequisitionModel.findByIdAndUpdate(payload.requisitionId, { $set: { status: "PO_CREATED" } });
        }
        return res.status(201).json(doc);
      }
      const created = { _id: `po_${Date.now()}`, ...payload };
      memPOs.push(created);
      return res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/po", err);
      res.status(500).json({ message: "Failed to create PO" });
    }
  });

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
  // GRN (Full CRUD + PO status auto update)
  // =======================================================
  function makeGrnNo() {
    const d = new Date();
    return `GRN-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
  }

  router.get("/api/grn", async (req, res) => {
    try {
      if (GRNModel) {
        const docs = await GRNModel.find().sort({ createdAt: -1 }).lean();
        return res.json(docs);
      }
      return res.json(memGRNs);
    } catch (err) {
      console.error("GET /api/grn", err);
      res.status(500).json({ message: "Failed to fetch GRNs" });
    }
  });

  router.get("/api/grn/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (GRNModel) {
        const doc = await GRNModel.findById(id).lean();
        if (!doc) return res.status(404).json({ message: "GRN not found" });
        return res.json(doc);
      }
      const found = memGRNs.find((g) => g._id === id);
      if (!found) return res.status(404).json({ message: "GRN not found" });
      return res.json(found);
    } catch (err) {
      console.error("GET /api/grn/:id", err);
      res.status(500).json({ message: "Failed to fetch GRN" });
    }
  });

  router.post("/api/grn", async (req, res) => {
    try {
      const data = req.body || {};
      const grnNo = data.grnNo || makeGrnNo();
      if (!data.poId) return res.status(400).json({ message: "poId is required" });
      if (!Array.isArray(data.items) || data.items.length === 0) return res.status(400).json({ message: "items required" });

      const payload = {
        grnNo,
        poId: data.poId,
        requisitionId: data.requisitionId || null,
        vendor: data.vendor || null,
        resort: data.resort || null,
        store: data.store || null,
        grnDate: data.grnDate || new Date(),
        items: data.items.map((it) => ({ item: it.item, receivedQty: Number(it.receivedQty || 0), pendingQty: 0, remark: it.remark || "" })),
      };

      let doc = null;
      if (GRNModel) {
        doc = await GRNModel.create(payload);
      } else {
        doc = { _id: `grn_${Date.now()}`, ...payload };
        memGRNs.push(doc);
      }

      // Auto update PO status (consider previous GRNs)
      if (POModel) {
        const po = await POModel.findById(data.poId).lean();
        if (po) {
          const grns = GRNModel ? await GRNModel.find({ poId: data.poId }).lean() : memGRNs.filter((g) => g.poId === data.poId);
          const receivedMap = {};
          (grns || []).forEach((g) => (g.items || []).forEach((it) => { const id = String(it.item); receivedMap[id] = (receivedMap[id] || 0) + Number(it.receivedQty || 0); }));
          (payload.items || []).forEach((it) => { const id = String(it.item); receivedMap[id] = (receivedMap[id] || 0) + Number(it.receivedQty || 0); });

          let allFulfilled = true;
          let partial = false;
          (po.items || []).forEach((pItem) => {
            const want = Number(pItem.qty || 0);
            const got = Number(receivedMap[String(pItem.item)] || 0);
            if (got > 0 && got < want) partial = true;
            if (got === 0) allFulfilled = false;
            if (got < want) allFulfilled = false;
          });
          const newStatus = allFulfilled ? "CLOSED" : partial ? "PARTIAL" : "OPEN";
          await POModel.findByIdAndUpdate(data.poId, { $set: { status: newStatus } });
        }
      } else {
        const poIdx = memPOs.findIndex((p) => p._id === data.poId);
        if (poIdx !== -1) {
          const po = memPOs[poIdx];
          const allReceivedMap = {};
          memGRNs.filter((g) => g.poId === data.poId).forEach((g) => (g.items || []).forEach((it) => { allReceivedMap[it.item] = (allReceivedMap[it.item] || 0) + Number(it.receivedQty || 0); }));
          payload.items.forEach((it) => { allReceivedMap[it.item] = (allReceivedMap[it.item] || 0) + Number(it.receivedQty || 0); });

          let allFulfilled = true;
          let partial = false;
          (po.items || []).forEach((pItem) => {
            const want = Number(pItem.qty || 0);
            const got = Number(allReceivedMap[pItem.item] || 0);
            if (got > 0 && got < want) partial = true;
            if (got === 0) allFulfilled = false;
            if (got < want) allFulfilled = false;
          });
          po.status = allFulfilled ? "CLOSED" : partial ? "PARTIAL" : "OPEN";
          memPOs[poIdx] = po;
        }
      }

      return res.status(201).json(doc);
    } catch (err) {
      console.error("POST /api/grn", err);
      res.status(500).json({ message: "Failed to create GRN", error: err.message });
    }
  });

  router.delete("/api/grn/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (GRNModel) {
        const deleted = await GRNModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "GRN not found" });
        return res.json({ ok: true });
      }
      const before = memGRNs.length;
      memGRNs = memGRNs.filter((g) => g._id !== id);
      if (memGRNs.length === before) return res.status(404).json({ message: "GRN not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /api/grn/:id", err);
      res.status(500).json({ message: "Failed to delete GRN" });
    }
  });

  // Return configured router
  return router;
}

module.exports = { createRouter };
