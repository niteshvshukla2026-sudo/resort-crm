// backend/server.cjs

// ensure .env is loaded before anything else
try {
  require("dotenv").config();
} catch (e) {
  console.warn("dotenv load warning:", e && e.message);
}

const express = require("express");
const cors = require("cors");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION ❌", err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error(
    "UNHANDLED REJECTION ❌",
    reason && reason.stack ? reason.stack : reason
  );
  process.exit(1);
});

async function start() {
  const app = express();

  // --- IMPORTANT: read frontend origin from env, remove any trailing slash ---
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

  let mongoose = null;
  let useMongo = false;
  if (process.env.MONGO_URI) {
    try {
      mongoose = require("mongoose");
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      useMongo = true;
      console.log("Mongo connected");
    } catch (e) {
      console.error(
        "Mongo connect failed:",
        e && e.stack ? e.stack : e
      );
      mongoose = null;
      useMongo = false;
    }
  } else {
    console.warn("MONGO_URI not set, running without DB");
  }

  // === safe require + debug for router
  let router;
  try {
    const mod = require("./server_router.cjs");
    console.log(
      "DEBUG: server_router module keys ->",
      mod && Object.keys(mod || {})
    );
    if (mod && typeof mod.createRouter === "function") {
      router = mod.createRouter({ useMongo, mongoose });
    } else if (typeof mod === "function") {
      router = mod({ useMongo, mongoose });
    } else if (mod && mod.stack) {
      router = mod;
    } else {
      console.warn(
        "server_router.cjs loaded but no usable export detected. module type:",
        typeof mod
      );
    }
  } catch (err) {
    console.error(
      "Failed to require ./server_router.cjs — error:",
      err && err.stack ? err.stack : err
    );
  }

  if (router) {
    // NOTE: mount at root so /api/... works as defined in router
    app.use("/api", router);
        console.log("Router mounted at /");
  } else {
    console.warn("No router mounted — app running with minimal endpoints");
  }

  app.get("/", (req, res) => res.json({ ok: true, msg: "root" }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((e) => {
  console.error("Fatal start error:", e && e.stack ? e.stack : e);
  process.exit(1);
});
