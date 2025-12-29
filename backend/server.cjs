require("dotenv").config();
const express = require("express");
const cors = require("cors");

async function start() {
  const app = express();

  // =========================
  // 🔥 CORS (FIXED FOR VERCEL)
  // =========================
  const allowedOrigins = [
    "https://resort-crm.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        // allow server-to-server / Postman / curl
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // 🔥 VERY IMPORTANT (preflight)
  app.options("*", cors());

  app.use(express.json());

  // =========================
  // 🗄️ DB
  // =========================
  let mongoose = null;
  let useMongo = false;

  if (process.env.MONGO_URI) {
    mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    useMongo = true;
    console.log("✅ MongoDB connected");
  }

  // =========================
  // 🚦 ROUTER
  // =========================
  const { createRouter } = require("./server_router.cjs");
  app.use(createRouter({ useMongo, mongoose }));

  // =========================
  // 🚀 START SERVER
  // =========================
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

start().catch((e) => {
  console.error("❌ Server failed to start", e);
});
