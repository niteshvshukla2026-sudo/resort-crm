const express = require("express");
const mongoose = require("mongoose");
const { createRouter } = require("./server_router.cjs");

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const router = createRouter({ mongoose });
app.use(router);

app.listen(5000, () => console.log("🚀 Server running"));
