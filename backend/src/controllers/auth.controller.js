import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * 🔐 LOGIN CONTROLLER
 * Route: POST /api/auth/login
 */
export const login = async (req, res) => {
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
      isActive: true,
    }).lean(false); // lean false → methods available

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
 * 🔁 FORCE RESET PASSWORD (ADMIN / FIRST LOGIN)
 * Route: GET /api/auth/force-reset?email=&password=
 */
export const forceResetPassword = async (req, res) => {
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

    user.password = password; // 🔥 pre-save hook will hash
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
