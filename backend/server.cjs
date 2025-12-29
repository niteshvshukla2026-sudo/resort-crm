require("dotenv").config();
const express = require("express");
const cors = require("cors");

async function start() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // DB
  let mongoose = null;
  let useMongo = false;
  if (process.env.MONGO_URI) {
    mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGO_URI);
    useMongo = true;
    console.log("✅ MongoDB connected");
  }

  // ROUTER  🔥 FIX HERE
  const { createRouter } = require("./server_router.cjs");
  app.use(createRouter({ useMongo, mongoose }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
}

start().catch((e) => {
  console.error("❌ Server failed to start", e);
});
