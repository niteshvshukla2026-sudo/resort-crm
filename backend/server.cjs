// backend/server.cjs
try {
  require("dotenv").config();
} catch (e) {}

const express = require("express");
const cors = require("cors");

async function start() {
  const app = express();

  // ---------------- CORS ----------------
  const frontend = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
  app.use(
    cors({
      origin: frontend || true,
      credentials: true,
    })
  );

  app.use(express.json());

  app.get("/_health", (req, res) => res.json({ ok: true }));

  // ---------------- DB ----------------
  let mongoose = null;
  let useMongo = false;

  if (process.env.MONGO_URI) {
    mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);

    // 🔥🔥🔥 THIS WAS MISSING (ROOT FIX)
    global.mongoose = mongoose;

    useMongo = true;
    console.log("✅ Mongo connected & global.mongoose set");
  } else {
    console.log("⚠️ MONGO_URI not found, running without DB");
  }

  // ---------------- ROUTER ----------------
  const { createRouter } = require("./server_router.cjs");
  app.use(createRouter({ useMongo, mongoose }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

start().catch((err) => {
  console.error("SERVER START ERROR ❌", err);
  process.exit(1);
});
