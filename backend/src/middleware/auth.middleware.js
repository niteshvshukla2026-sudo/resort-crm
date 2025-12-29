import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * 🔐 AUTH MIDDLEWARE
 * - Verifies JWT
 * - Attaches req.user
 */
export const protect = async (req, res, next) => {
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

    // ✅ Fetch user
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User not active or not found",
      });
    }

    // 🔥 Attach user to request
    req.user = {
      id: user._id,
      role: user.role,
      resorts: user.resorts || [],
      isActive: user.isActive,
    };

    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR ❌", err);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
