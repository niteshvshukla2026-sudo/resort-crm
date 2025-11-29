// backend/src/config/db.js
import dotenv from "dotenv";
dotenv.config();                // <-- yahan .env load ho raha hai

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    console.log("MONGO_URI from env:", uri);   // ek baar value confirm karne ke liye

    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || "purchase_db",
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed", err.message);
    process.exit(1);
  }
};

export default connectDB;
