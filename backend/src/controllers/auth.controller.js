// backend/src/controllers/auth.controller.js
// ✅ PURE COMMONJS — ROUTER COMPATIBLE

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = mongoose.models.User;

/**
 * 🔐 LOGIN CONTROLLER
 * Route: POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 1️⃣ Find user
   const user = await User.findOne({
  email: String(email).toLowerCase(),
  status: "ACTIVE",
});


    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 2️⃣ Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "dev_secret_key",
      {
        expiresIn: "7d",
      }
    );

    // 4️⃣ Response
    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resorts: user.resorts || [],
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR ❌", err);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};

/**
 * 👤 ME CONTROLLER
 * Route: GET /api/auth/me
 */
const me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }
  res.json(req.user);
};

/**
 * 🔁 FORCE RESET PASSWORD
 * Route: GET /api/auth/force-reset
 */
const forceResetPassword = async (req, res) => {
  try {
    const { email, password } = req.query || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and new password are required",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.password = password; // pre-save hook will hash
    await user.save();

    return res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("FORCE RESET ERROR ❌", err);
    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};

/**
 * ✅ EXPORTS (MATCH ROUTER)
 */
module.exports = {
  login,
  me,
  forceResetPassword,
};
