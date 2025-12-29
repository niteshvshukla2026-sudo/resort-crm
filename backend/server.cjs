// backend/server.cjs
try {
  require("dotenv").config();
} catch (e) {}

const express = require("express");
const cors = require("cors");

async function start() {
  const app = express();

  // ================= CORS =================
  const frontend = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  app.use(
    cors({
      origin: frontend || true,
      credentials: true,
    })
  );

  app.use(express.json());

  app.get("/_health", (req, res) => {
    res.json({ ok: true });
  });

  // ================= DB =================
  let mongoose = null;
  let useMongo = false;

  if (process.env.MONGO_URI) {
    mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    useMongo = true;
    console.log("✅ MongoDB connected");
  } else {
    console.warn("⚠️ Running without MongoDB (memory mode)");
  }

  // ================= ROUTER =================
  const { createRouter } = require("./server_route.cjs");
  app.use(createRouter({ mongoose, useMongo }));

  // ================= START =================
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

start().catch((err) => {
  console.error("❌ Server failed to start", err);
});
