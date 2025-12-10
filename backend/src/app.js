// backend/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import resortRoutes from "./routes/resorts.routes.js";
import departmentRoutes from "./routes/departments.routes.js";
import storeRoutes from "./routes/stores.routes.js";
import vendorRoutes from "./routes/vendors.routes.js";
import itemRoutes from "./routes/items.routes.js";
import requisitionRoutes from "./routes/requisitions.routes.js";
import poRoutes from "./routes/po.routes.js";
import grnRoutes from "./routes/grn.routes.js";
import roleRoutes from "./routes/role.routes.js";
import consumptionRoutes from "./routes/consumption.routes.js";
import storeTransferRuleRoutes from "./routes/storeTransferRule.routes.js";
import resortUserRoutes from "./routes/resortUser.routes.js";

// 🔹 NEW: Item Category routes import
import itemCategoryRoutes from "./routes/itemCategories.routes.js";

// If running in demo mode, seed an in-memory DB
if (process.env.USE_INMEMORY === "true") {
  try {
    // eslint-disable-next-line no-undef
    const inmem = require("./inmemoryDb");
    if (inmem && typeof inmem.seed === "function") {
      console.log("Seeding in-memory DB (USE_INMEMORY=true)...");
      inmem.seed();
    }
  } catch (e) {
    console.warn("Failed to seed in-memory DB:", e.message || e);
  }
}

// connect DB
connectDB();

const app = express();

/**
 * CORS configuration
 */
const defaultFrontend = "https://resort-crm.vercel.app";
const allowedOriginsEnv =
  process.env.FRONTEND_ORIGINS || defaultFrontend;
const ALLOWED_ORIGINS = allowedOriginsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow tools like curl/postman

    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 204,
};

// Apply CORS middleware before routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parsers & cookie parser (before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan("dev"));

// Basic health route
app.get("/", (req, res) => {
  res.send("Resort Purchase Management API");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resorts", resortRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/requisitions", requisitionRoutes);
app.use("/api/po", poRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/consumption", consumptionRoutes);
app.use("/api/resort-user", resortUserRoutes);
app.use("/api/store-transfer-rules", storeTransferRuleRoutes);

// 🔹 NEW: Item Categories API base path
app.use("/api/item-categories", itemCategoryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err?.message && err.message.startsWith("CORS policy")) {
    return res.status(403).json({ message: err.message });
  }
  res.status(err.statusCode || 500).json({
    message: err.message || "Server Error",
  });
});

export default app;
