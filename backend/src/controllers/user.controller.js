import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// 🔥 IMPORTANT: model already registered in server_router.cjs
const UserModel = mongoose.models.User;

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
      resorts,
      stores,
      defaultResort,
      status,
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

    if (stores && !Array.isArray(stores)) {
      return res.status(400).json({
        message: "Stores must be an array",
      });
    }

    // ---------- DUPLICATE EMAIL CHECK ----------
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // ---------- HASH PASSWORD ----------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------- CREATE USER ----------
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,                               // ROLE KEY (ADMIN, R_M etc)
      resorts,                            // array of resort IDs
      defaultResort: defaultResort || resorts[0],
      stores: Array.isArray(stores) ? stores : [],
      status: status || "ACTIVE",
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error("❌ CREATE USER ERROR:", err);
    return res.status(500).json({
      message: "Failed to create user",
      error: err.message, // 🔥 REAL ERROR FOR DEBUG
    });
  }
};

/* =========================================
   LIST USERS
========================================= */
export const listUsers = async (req, res) => {
  try {
    const users = await UserModel.find()
      .populate("resorts", "name code")
      .populate("stores", "name code")
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (err) {
    console.error("❌ LIST USERS ERROR:", err);
    return res.status(500).json({
      message: "Failed to load users",
      error: err.message,
    });
  }
};
