require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

async function start() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // DB
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  }

  // Router
  const { createRouter } = require("./server_router.cjs");
  app.use(createRouter({ mongoose }));

  const port = process.env.PORT || 5000;
  app.listen(port, () =>
    console.log(`🚀 Server running on port ${port}`)
  );
}

start();
