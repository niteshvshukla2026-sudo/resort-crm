// backend/src/middlewares/auth.middleware.js
// ✅ PURE COMMONJS (CJS) — SERVER SAFE

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = mongoose.models.User;

/**
 * 🔐 AUTH MIDDLEWARE
 * - Verifies JWT
 * - Attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // ✅ Accept token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    );

    // ⚠️ IMPORTANT: decoded.id MUST match login token payload
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");

    // 🔥 FIX HERE (status check)
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        message: "User not active or not found",
      });
    }

    // 🔥 Attach user to request
    req.user = {
      id: user._id,
      role: user.role,
      resorts: user.resorts || [],
      stores: user.stores || [],
      status: user.status,
    };

    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR ❌", err);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

/**
 * 🔐 PERMISSION MIDDLEWARE
 * (abhi allow all, baad me tighten karenge)
 */
const requirePermission = (module, action) => {
  return (req, res, next) => {
    next();
  };
};

module.exports = {
  protect,
  requirePermission,
};
