// backend/server.cjs

try {
  require("dotenv").config();
} catch (e) {
  console.warn("dotenv load warning:", e && e.message);
}

const express = require("express");
const cors = require("cors");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION ❌", err?.stack || err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION ❌", reason?.stack || reason);
  process.exit(1);
});

async function start() {
  const app = express();

  // ================== CORS ==================
  let frontend =
    process.env.FRONTEND_URL || "https://resort-crm.vercel.app";
  frontend = String(frontend).replace(/\/+$/, "");

  const allowAllOrigins =
    frontend === "*" || frontend.toLowerCase() === "all";

  const corsOptions = {
    origin: allowAllOrigins ? true : frontend,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    credentials: !allowAllOrigins,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());

  app.get("/_health", (req, res) => res.json({ ok: true }));

  console.log(
    "CORS configured. FRONTEND_URL ->",
    frontend,
    "| allowAllOrigins:",
    allowAllOrigins
  );

  // ================== MONGO ==================
  if (process.env.MONGO_URI) {
    try {
      const mongoose = require("mongoose");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("Mongo connected");
    } catch (e) {
      console.error("Mongo connect failed:", e?.stack || e);
      process.exit(1);
    }
  } else {
    console.warn("⚠️ MONGO_URI not set");
  }

  // ================== ROUTES ==================
  // 🔥 DIRECT ROUTE MOUNT (NO server_router.cjs)

  const requisitionRoutes = require("./routes/requisitions.routes");

  app.use("/api/requisitions", requisitionRoutes);

  console.log("✅ requisitions.routes mounted at /api/requisitions");

  // ================== ROOT ==================
  app.get("/", (req, res) =>
    res.json({ ok: true, msg: "Resort CRM Backend Running" })
  );

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server listening on port ${PORT}`)
  );
}

start().catch((e) => {
  console.error("Fatal start error:", e?.stack || e);
  process.exit(1);
});
