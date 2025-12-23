import bcrypt from "bcryptjs";
import User from "../models/User.js";

/* =========================================
   CREATE USER
========================================= */
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      resorts = [],
      defaultResort,
      stores = [],
      status = "ACTIVE",
    } = req.body;

    // ---------- BASIC VALIDATION ----------
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, Email, Password & Role are required",
      });
    }

    if (!Array.isArray(resorts) || resorts.length === 0) {
      return res.status(400).json({
        message: "At least one resort must be selected",
      });
    }

    if (!Array.isArray(stores)) {
      return res.status(400).json({
        message: "Stores must be an array",
      });
    }

    // ---------- DUPLICATE USER CHECK ----------
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // ---------- HASH PASSWORD ----------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------- CREATE USER ----------
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,                     // role KEY like ADMIN, R_M
      resorts,                  // array of resort IDs
      defaultResort: defaultResort || resorts[0],
      stores,                   // array of store IDs
      status,
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error("❌ CREATE USER ERROR:", err);
    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};

/* =========================================
   LIST USERS
========================================= */
export const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("resorts", "name code")
      .populate("stores", "name code")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("❌ LIST USERS ERROR:", err);
    res.status(500).json({
      message: "Failed to load users",
    });
  }
};
