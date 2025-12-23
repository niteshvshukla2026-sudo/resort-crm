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
  let UserModel = null;

  const controllers = createControllers({ useMongo, mongoose });

  // ------------------------
  // Helpers
  // ------------------------
const generateReqNo = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `REQ-${y}${m}${day}-${rand}`;
};

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

// ================================
// 🏬 STORE STOCK MODEL  ✅ REQUIRED
// ================================
const storeStockSchema = new Schema(
  {
    store: { type: String, required: true },
    item: { type: String, required: true },
    qty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mongoose.models.StoreStock ||
  mongoose.model("StoreStock", storeStockSchema);


// ek store + ek item = ek row
storeStockSchema.index({ store: 1, item: 1 }, { unique: true });

const StoreStock =
  mongoose.models.StoreStock ||
  mongoose.model("StoreStock", storeStockSchema);

console.log("StoreStock model initialised (Mongo)");



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

        resort: {
  type: Schema.Types.ObjectId,
  ref: "Resort",
  required: true,
},

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

  const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: { type: String, required: true }, // ADMIN, R_M, S_M

    // 🔥 FIXED: ObjectId refs
    resorts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resort",
      },
    ],

    stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],

    defaultResort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
mongoose.models.User || mongoose.model("User", userSchema);
UserModel = mongoose.models.User;


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await require("bcryptjs").hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await require("bcryptjs").compare(entered, this.password);
};

    // =======================
// 🔐 ROLE MODEL
// =======================
const rolePermissionSchema = new Schema(
  {
    module: String,
    actions: [String],
  },
  { _id: false }
);

const roleSchema = new Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: String,
    type: { type: String, enum: ["SYSTEM", "CUSTOM"], default: "CUSTOM" },
    storeMode: { type: String, enum: ["SINGLE", "MULTI"], default: "MULTI" },
    permissions: [rolePermissionSchema],
  },
  { timestamps: true }
);

mongoose.models.Role || mongoose.model("Role", roleSchema);

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
        
        
    // ⭐⭐⭐ YAHI ADD KARNA HAI ⭐⭐⭐
    status: {
      type: String,
      enum: ["CREATED", "CLOSED"],
      default: "CREATED",
    },
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


  const consumptionLineSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const consumptionSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["LUMPSUM", "RECIPE_LUMPSUM", "RECIPE_PORTION"],
      required: true,
    },

    eventName: String,
    menuName: String,

    resort: { type: String, required: true },   // 🔥 VERY IMPORTANT
    storeFrom: { type: String, required: true },
    storeTo: { type: String },

    lines: [consumptionLineSchema],
    notes: String,
  },
  { timestamps: true }
);

mongoose.models.Consumption ||
  mongoose.model("Consumption", consumptionSchema);

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
    const { resort } = req.query;

    const filter = {};
    if (resort && resort !== "ALL") {
      filter.resort = resort;   // 🔥 MAIN FIX
    }

    if (StoreModel) {
      const docs = await StoreModel.find(filter).lean();
      return res.json(docs);
    }

    // in-memory fallback
    let data = memStores;
    if (filter.resort) {
      data = data.filter((s) => s.resort === filter.resort);
    }
    return res.json(data);
  } catch (err) {
    console.error("GET /api/stores error", err);
    res.status(500).json({ message: "Failed to list stores" });
  }
};


 const createStoreHandler = async (req, res) => {
  try {
    const { resort, name } = req.body || {};

    if (!resort || !name) {
      return res.status(400).json({ message: "resort & name are required" });
    }

    let code = "";

    if (StoreModel) {
      // 🔥 same resort ka last store nikal lo
      const lastStore = await StoreModel
        .findOne({ resort })
        .sort({ createdAt: -1 })
        .lean();

      let nextNo = 1;
      if (lastStore?.code) {
        const n = parseInt(lastStore.code.split("-")[1]);
        if (!isNaN(n)) nextNo = n + 1;
      }

      code = `STR-${String(nextNo).padStart(3, "0")}`;

      const doc = await StoreModel.create({
        resort,
        name,
        code,
      });

      return res.status(201).json(doc);
    }

    // in-memory
    const sameResort = memStores.filter((s) => s.resort === resort);
    code = `STR-${String(sameResort.length + 1).padStart(3, "0")}`;

    const created = {
      _id: `store_${Date.now()}`,
      resort,
      name,
      code,
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

    // ✅ ONLY NAME IS ALLOWED TO UPDATE
    const { name } = req.body || {};

    const update = {};
    if (name != null && name.trim() !== "") {
      update.name = name.trim();
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        message: "Nothing to update",
      });
    }

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

    // -------- in-memory fallback --------
    const idx = memStores.findIndex((s) => s._id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Store not found" });
    }

    memStores[idx] = {
      ...memStores[idx],
      ...update,
    };

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


  // ==================================================
// 🏨 GET ALL RESORTS
// ==================================================
router.get("/resorts", async (req, res) => {
  try {
    let resorts = [];

    if (useMongo && ResortModel) {
      resorts = await ResortModel.find({ isActive: true })
        .select("_id name code");
    } else {
      // fallback for memory mode (optional)
      resorts = [];
    }

    res.json(resorts);
  } catch (err) {
    console.error("RESORT LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load resorts" });
  }
});

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
  // router.get("/roles", safe("listRoles"));
  // router.get("/users", safe("listUsers"));

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
  // ===================================================
// LIST REQUISITIONS (RESORT FILTER FIXED)
// ===================================================
// ===============================
// LIST REQUISITIONS (FINAL)
// ===============================
router.get("/api/requisitions", async (req, res) => {
  try {
    const { resort } = req.query;

    const filter = {};
    if (resort && resort !== "ALL") {
      filter.resort = resort;   // 🔥 ONLY ID MATCH
    }

    const docs = await RequisitionModel.find(filter).lean();
    res.json(docs);
  } catch (err) {
    console.error("GET /api/requisitions", err);
    res.status(500).json({ message: "Failed to fetch requisitions" });
  }
});

// ===================================================
// GET SINGLE REQUISITION (FOR VIEW PAGE)  ✅ FIX 1
// ===================================================
router.get("/api/requisitions/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Mongo enabled
    if (RequisitionModel) {
      const doc = await RequisitionModel.findById(id).lean();
      if (!doc) {
        return res.status(404).json({ message: "Requisition not found" });
      }
      return res.json(doc);
    }

    // In-memory fallback
    const r = memRequisitions.find((x) => x._id === id);
    if (!r) {
      return res.status(404).json({ message: "Requisition not found" });
    }
    return res.json(r);
  } catch (err) {
    console.error("GET /api/requisitions/:id error", err);
    res.status(500).json({ message: "Failed to fetch requisition" });
  }
});

  // ===================================================
// CREATE REQUISITION (FINAL & WORKING)
// ===================================================
router.post("/api/requisitions", async (req, res) => {
  try {
   const requisition = new RequisitionModel({
  requisitionNo: generateReqNo(),
  type: req.body.type,
  resort: new mongoose.Types.ObjectId(req.body.resort), // ✅ FIX
  department: req.body.department,
  fromStore: req.body.fromStore,
  toStore: req.body.toStore,
  store: req.body.store,
  vendor: req.body.vendor,
  requiredBy: req.body.requiredBy,
  status: "PENDING",
  lines: req.body.lines,
  createdBy: "SYSTEM",
});


    await requisition.save();
    res.json(requisition);
  } catch (err) {
    console.error("CREATE REQUISITION ERROR:", err);
    res.status(500).json({ message: err.message });
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


// ==================================================
// 🔒 CLOSE GRN + ADD STOCK
// ==================================================
router.post("/api/grn/:id/close", async (req, res) => {
  try {
    const grnId = req.params.id;

    const GRNModel = mongoose.models.GRN;
    const StoreStock = mongoose.models.StoreStock;

    const grn = await GRNModel.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    if (grn.status === "CLOSED") {
      return res.status(400).json({ message: "GRN already closed" });
    }

    // 🔁 ADD STOCK
    for (const line of grn.items || []) {
      const itemId = line.item;
      const qty = Number(line.qtyReceived || 0);
      const storeId = grn.store;

      if (!itemId || !storeId || qty <= 0) continue;

      await StoreStock.findOneAndUpdate(
        { store: storeId, item: itemId },
        { $inc: { qty: qty } },
        { upsert: true, new: true }
      );
    }

    // 🔒 CLOSE GRN
    grn.status = "CLOSED";
    await grn.save();

    return res.json({
      message: "GRN closed & stock updated",
      grn,
    });
  } catch (err) {
    console.error("CLOSE GRN ERROR ❌", err);
    res.status(500).json({ message: "Failed to close GRN" });
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


  // ==================================================
// 📦 CREATE GRN FROM PO  ✅ REQUIRED
// ==================================================
// ==================================================
// 📦 CREATE GRN FROM PO (🔥 MISSING ROUTE FIX)
// ==================================================
router.post("/api/po/:id/create-grn", async (req, res) => {
  try {
    const poId = req.params.id;

    if (!POModel || !GRNModel) {
      return res.status(500).json({ message: "Models not initialized" });
    }

    // 1️⃣ Find PO
    const po = await POModel.findById(poId).lean();
    if (!po) {
      return res.status(404).json({ message: "PO not found" });
    }

    // 2️⃣ Create GRN payload from PO
    const grnPayload = {
      grnNo: req.body.grnNo || makeGrnNo(),
      poId: poId,
      requisitionId: po.requisitionId || null,
      vendor: po.vendor || null,
      resort: po.resort || null,
      store: po.deliverTo || null,
      grnDate: req.body.receivedDate || new Date(),

      items: (po.items || []).map((it) => ({
        item: it.item,
        receivedQty: Number(
  req.body.items?.find((x) => x.item === it.item)?.receivedQty || it.qty
),

        pendingQty: 0,
        remark:
          req.body.items?.find((x) => x.item === it.item)?.remark || "",
      })),
    };

    // 3️⃣ Save GRN
    const grn = await GRNModel.create(grnPayload);

    // 4️⃣ Update PO status
    await POModel.findByIdAndUpdate(poId, {
      $set: { status: "CLOSED" },
    });

    // 5️⃣ Update requisition (if linked)
    if (po.requisitionId) {
      await RequisitionModel.findByIdAndUpdate(po.requisitionId, {
        $set: { status: "GRN_CREATED" },
      });
    }

    return res.status(201).json(grn);
  } catch (err) {
    console.error("CREATE GRN FROM PO ❌", err);
    return res.status(500).json({
      message: "Failed to create GRN from PO",
      error: err.message,
    });
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
router.post("/api/grn", async (req, res) => {
  try {
    const data = req.body || {};
    const grnNo = data.grnNo || makeGrnNo();

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ message: "items required" });
    }

    const payload = {
      grnNo,
      poId: data.poId || null, // ✅ OPTIONAL
      requisitionId: data.requisitionId || null,
      vendor: data.vendor || null,
      resort: data.resort || null,
      store: data.store || null,
      grnDate: data.grnDate || new Date(),
      items: data.items.map((it) => ({
        item: it.item,
        qtyReceived: Number(it.qtyReceived || 0), // ✅ FIXED NAME
        pendingQty: 0,
        remark: it.remark || "",
      })),
    };

    // --------------------------
    // CREATE GRN
    // --------------------------
    let doc = null;
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

    // --------------------------
    // UPDATE PO STATUS (ONLY IF poId EXISTS)
    // --------------------------
    if (data.poId) {
      // ---- DB PO ----
      if (POModel && GRNModel) {
        const po = await POModel.findById(data.poId).lean();
        if (po) {
          const grns = await GRNModel.find({ poId: data.poId }).lean();
          const receivedMap = {};

          grns.forEach((g) => {
            (g.items || []).forEach((it) => {
              receivedMap[it.item] =
                (receivedMap[it.item] || 0) + Number(it.qtyReceived || 0);
            });
          });

          let allFulfilled = true;
          let partial = false;

          (po.items || []).forEach((pItem) => {
            const want = Number(pItem.qty || 0);
            const got = Number(receivedMap[pItem.item] || 0);
            if (got > 0 && got < want) partial = true;
            if (got < want) allFulfilled = false;
          });

          const newStatus = allFulfilled ? "CLOSED" : partial ? "PARTIAL" : "OPEN";
          await POModel.findByIdAndUpdate(data.poId, { $set: { status: newStatus } });
        }
      }

      // ---- IN-MEMORY PO ----
      if (!POModel) {
        const poIdx = memPOs.findIndex((p) => p._id === data.poId);
        if (poIdx !== -1) {
          const po = memPOs[poIdx];
          const receivedMap = {};

          memGRNs
            .filter((g) => g.poId === data.poId)
            .forEach((g) => {
              (g.items || []).forEach((it) => {
                receivedMap[it.item] =
                  (receivedMap[it.item] || 0) + Number(it.qtyReceived || 0);
              });
            });

          let allFulfilled = true;
          let partial = false;

          (po.items || []).forEach((pItem) => {
            const want = Number(pItem.qty || 0);
            const got = Number(receivedMap[pItem.item] || 0);
            if (got > 0 && got < want) partial = true;
            if (got < want) allFulfilled = false;
          });

          po.status = allFulfilled ? "CLOSED" : partial ? "PARTIAL" : "OPEN";
          memPOs[poIdx] = po;
        }
      }
    }

    return res.status(201).json(doc);
  } catch (err) {
    console.error("POST /api/grn", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
});

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

 // =======================
// 🔐 ROLES (FULL CRUD)
// =======================

// LIST ROLES
router.get("/api/roles", async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const roles = await Role.find().sort({ createdAt: 1 }).lean();
    res.json(roles);
  } catch (err) {
    console.error("GET ROLES ERROR", err);
    res.status(500).json({ message: "Failed to load roles" });
  }
});

// CREATE ROLE
router.post("/api/roles", async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const { name, key } = req.body;

    if (!name || !key) {
      return res.status(400).json({ message: "name & key required" });
    }

    const exists = await Role.findOne({ key });
    if (exists) {
      return res.status(400).json({ message: "Role key already exists" });
    }

    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (err) {
    console.error("CREATE ROLE ERROR", err);
    res.status(500).json({ message: "Failed to create role" });
  }
});

// UPDATE ROLE
router.put("/api/roles/:id", async (req, res) => {
  try {
    const Role = mongoose.models.Role;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.type === "SYSTEM") {
      return res.status(403).json({ message: "System role locked" });
    }

    Object.assign(role, req.body);
    await role.save();

    res.json(role);
  } catch (err) {
    console.error("UPDATE ROLE ERROR", err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// =======================
// 👤 USERS (FULL CRUD)
// =======================

// LIST USERS
router.get("/api/users", async (req, res) => {
  try {
    const users = await UserModel.find().lean();
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// CREATE USER
router.post("/api/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      resorts,
      stores,
      defaultResort,
      status,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "name, email, password & role are required",
      });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await UserModel.create({
      name,
      email,
      password, // later bcrypt
      role,
      resorts: resorts || [],
      stores: stores || [],
      defaultResort: defaultResort || resorts?.[0],
      status: status || "ACTIVE",
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("CREATE USER ERROR", err);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// UPDATE USER
router.put("/api/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.assign(user, req.body);
    await user.save();

    res.json(user);
  } catch (err) {
    console.error("UPDATE USER ERROR", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});



router.get("/api/consumption", async (req, res) => {
  try {
    const { resort } = req.query;

    const filter = {};
    if (resort && resort !== "ALL") {
      filter.resort = resort;
    }

    const docs = await mongoose.models.Consumption
      .find(filter)
      .sort({ date: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch consumption" });
  }
});

router.post("/api/consumption", async (req, res) => {
  try {
    const data = req.body;

    const Consumption = mongoose.models.Consumption;
    const StoreStock = mongoose.models.StoreStock;

    // 1️⃣ SAVE CONSUMPTION
    const doc = await Consumption.create(data);

    // 2️⃣ MINUS STOCK
    for (const line of data.lines || []) {
      const qty = Number(line.qty || 0);
      if (qty <= 0) continue;

      await StoreStock.findOneAndUpdate(
        { store: data.storeFrom, item: line.item },
        { $inc: { qty: -qty } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(doc);
  } catch (err) {
    console.error("CONSUMPTION ERROR ❌", err);
    res.status(500).json({ message: "Failed to create consumption" });
  }
});


  return router;
}
 




module.exports = { createRouter };
